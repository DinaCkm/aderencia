/**
 * pages/api/admin/backup.ts
 * Endpoint para gerenciamento de backups pelo painel administrativo.
 *
 * GET  /api/admin/backup                  — lista os ultimos backups por sistema
 * GET  /api/admin/backup?download=<id>    — baixa um backup especifico
 * POST /api/admin/backup                  — executa backup manual imediato
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const MYSQL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

function getPool() {
  if (!MYSQL_URL) return null;
  return mysql.createPool({
    uri: MYSQL_URL,
    waitForConnections: true,
    connectionLimit: 3,
    connectTimeout: 10000,
  });
}

function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const role = (req.headers['x-user-role'] as string) || (req.cookies?.role as string);
  if (role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito ao administrador' });
    return false;
  }
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: 'Banco de dados nao configurado' });
  }

  // ─── GET: listar backups ou baixar um especifico ─────────────────────────
  if (req.method === 'GET') {
    const { download, system } = req.query;

    if (download) {
      const id = parseInt(String(download), 10);
      if (isNaN(id)) {
        await pool.end();
        return res.status(400).json({ error: 'ID invalido' });
      }

      try {
        const [rows]: any[] = await pool.query(
          'SELECT id, system_name, label, size_bytes, created_at, data FROM backups WHERE id = ?',
          [id]
        );
        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: 'Backup nao encontrado' });
        }
        const backup = rows[0];
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="backup-${backup.system_name}-${backup.label}.json"`
        );
        return res.status(200).send(backup.data);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      } finally {
        await pool.end().catch(() => {});
      }
    }

    // Listar ultimos backups
    try {
      // Garantir que a tabela existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS backups (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
          system_name VARCHAR(100) NOT NULL,
          label       VARCHAR(50) NOT NULL,
          size_bytes  INT NOT NULL,
          data        LONGTEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      let query = `
        SELECT id, system_name, label, size_bytes, created_at
        FROM backups
      `;
      const params: any[] = [];

      if (system) {
        query += ' WHERE system_name = ?';
        params.push(system);
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const [rows]: any[] = await pool.query(query, params);

      // Agrupar por sistema
      const grouped: Record<string, any[]> = {};
      for (const row of rows || []) {
        if (!grouped[row.system_name]) grouped[row.system_name] = [];
        grouped[row.system_name].push({
          id: row.id,
          label: row.label,
          sizeKB: Math.round(row.size_bytes / 1024),
          createdAt: row.created_at,
        });
      }

      return res.status(200).json({
        systems: Object.keys(grouped),
        backups: grouped,
        total: (rows || []).length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      await pool.end().catch(() => {});
    }
  }

  // ─── POST: executar backup manual ────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const path = require('path');
      const { spawn } = require('child_process');
      const scriptPath = path.join(process.cwd(), 'scripts', 'backup.js');

      const child = spawn(process.execPath, [scriptPath], {
        detached: true,
        stdio: 'ignore',
        env: process.env,
      });
      child.unref();

      return res.status(202).json({
        message: 'Backup iniciado em background. Aguarde alguns minutos e recarregue a lista.',
        startedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      await pool.end().catch(() => {});
    }
  }

  await pool.end().catch(() => {});
  return res.status(405).json({ error: 'Metodo nao permitido' });
}
