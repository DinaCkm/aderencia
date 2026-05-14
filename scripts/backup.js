/**
 * scripts/backup.js
 * Backup automatico dos 4 sistemas ativos do SEBRAE TO:
 *   - aderencia      (MySQL)
 *   - gestao-dashboards (MySQL)
 *   - pdi_system     (MySQL)
 *   - Financeiro     (PostgreSQL)
 *
 * Destinos do backup:
 *   1. Tabela `backups` no MySQL do aderencia (historico dos ultimos 30 dias)
 *   2. Commit no repositorio GitHub privado DinaCkm/aderencia-backups
 *
 * Execucao: node scripts/backup.js
 * Agendamento: a cada 3 horas via Railway Cron Job
 */

'use strict';

const mysql = require('mysql2/promise');
const { Client } = require('pg');
const https = require('https');

// ─── Configuracao ─────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const GITHUB_REPO = 'DinaCkm/aderencia-backups';
const BACKUP_RETENTION_DAYS = 30;

// URLs de conexao de cada sistema (variaveis de ambiente no Railway)
const SYSTEMS = [
  {
    name: 'aderencia',
    type: 'mysql',
    url: process.env.MYSQL_URL || process.env.ADERENCIA_MYSQL_URL,
  },
  {
    name: 'gestao-dashboards',
    type: 'mysql',
    url: process.env.GESTAO_MYSQL_URL,
  },
  {
    name: 'pdi_system',
    type: 'mysql',
    url: process.env.PDI_MYSQL_URL,
  },
  {
    name: 'financeiro',
    type: 'postgres',
    url: process.env.FINANCEIRO_PG_URL,
  },
];

// ─── Utilitarios ─────────────────────────────────────────────────────────────
function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function dateLabel() {
  return new Date().toISOString().slice(0, 10);
}

function log(msg) {
  console.log(`[backup] ${msg}`);
}

function warn(msg) {
  console.warn(`[backup] AVISO: ${msg}`);
}

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'aderencia-backup/1.0',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(responseBody) }); }
        catch { resolve({ status: res.statusCode, data: responseBody }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Backup MySQL ─────────────────────────────────────────────────────────────
async function backupMySQL(system) {
  if (!system.url) {
    warn(`${system.name}: URL nao configurada — ignorando`);
    return { system: system.name, status: 'skipped', reason: 'URL nao configurada', tables: {}, recordCount: 0 };
  }

  log(`${system.name}: conectando ao MySQL...`);
  const pool = mysql.createPool({
    uri: system.url,
    waitForConnections: true,
    connectionLimit: 2,
    connectTimeout: 15000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Listar todas as tabelas
    const [tableRows] = await pool.query('SHOW TABLES');
    const tableKey = Object.keys(tableRows[0] || {})[0];
    const tables = tableRows.map((r) => r[tableKey]);
    log(`${system.name}: ${tables.length} tabelas encontradas`);

    const tablesData = {};
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
        tablesData[table] = rows;
        totalRecords += rows.length;
        log(`${system.name}: tabela ${table} — ${rows.length} registros`);
      } catch (err) {
        warn(`${system.name}: erro ao ler tabela ${table}: ${err.message}`);
        tablesData[table] = { error: err.message };
      }
    }

    return {
      system: system.name,
      status: 'ok',
      tables: tablesData,
      recordCount: totalRecords,
    };
  } catch (err) {
    warn(`${system.name}: falha na conexao: ${err.message}`);
    return { system: system.name, status: 'error', error: err.message, tables: {}, recordCount: 0 };
  } finally {
    await pool.end().catch(() => {});
  }
}

// ─── Backup PostgreSQL ────────────────────────────────────────────────────────
async function backupPostgres(system) {
  if (!system.url) {
    warn(`${system.name}: URL nao configurada — ignorando`);
    return { system: system.name, status: 'skipped', reason: 'URL nao configurada', tables: {}, recordCount: 0 };
  }

  log(`${system.name}: conectando ao PostgreSQL...`);
  const client = new Client({
    connectionString: system.url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();

    // Listar todas as tabelas do schema public
    const { rows: tableRows } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const tables = tableRows.map((r) => r.tablename);
    log(`${system.name}: ${tables.length} tabelas encontradas`);

    const tablesData = {};
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const { rows } = await client.query(`SELECT * FROM "${table}"`);
        tablesData[table] = rows;
        totalRecords += rows.length;
        log(`${system.name}: tabela ${table} — ${rows.length} registros`);
      } catch (err) {
        warn(`${system.name}: erro ao ler tabela ${table}: ${err.message}`);
        tablesData[table] = { error: err.message };
      }
    }

    return {
      system: system.name,
      status: 'ok',
      tables: tablesData,
      recordCount: totalRecords,
    };
  } catch (err) {
    warn(`${system.name}: falha na conexao: ${err.message}`);
    return { system: system.name, status: 'error', error: err.message, tables: {}, recordCount: 0 };
  } finally {
    await client.end().catch(() => {});
  }
}

// ─── Salvar no MySQL do aderencia ─────────────────────────────────────────────
async function saveToAderenciaMySQL(pool, ts, systemName, backupJson) {
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

  await pool.query(
    'INSERT INTO backups (system_name, label, size_bytes, data) VALUES (?, ?, ?, ?)',
    [systemName, ts, Buffer.byteLength(backupJson), backupJson]
  );

  log(`${systemName}: salvo no MySQL do aderencia`);
}

// ─── Commit no GitHub ─────────────────────────────────────────────────────────
async function commitToGitHub(ts, dateStr, systemName, content) {
  const filePath = `backups/${systemName}/${dateStr}/${ts}.json`;
  const contentB64 = Buffer.from(content).toString('base64');

  const existing = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${filePath}`);
  const sha = existing.status === 200 ? existing.data.sha : undefined;

  const result = await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${filePath}`, {
    message: `backup(${systemName}): ${ts}`,
    content: contentB64,
    ...(sha ? { sha } : {}),
  });

  if (result.status === 200 || result.status === 201) {
    log(`${systemName}: commit no GitHub — ${filePath}`);
  } else {
    warn(`${systemName}: erro no GitHub (${result.status}): ${JSON.stringify(result.data).slice(0, 200)}`);
  }

  // Atualizar latest.json por sistema
  const latestPath = `latest/${systemName}.json`;
  const latestExisting = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${latestPath}`);
  const latestSha = latestExisting.status === 200 ? latestExisting.data.sha : undefined;

  await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${latestPath}`, {
    message: `latest(${systemName}): ${ts}`,
    content: contentB64,
    ...(latestSha ? { sha: latestSha } : {}),
  });
  log(`${systemName}: latest/${systemName}.json atualizado no GitHub`);
}

// ─── Logica principal ─────────────────────────────────────────────────────────
async function run() {
  const ts = timestamp();
  const dateStr = dateLabel();
  log(`=== Backup iniciado — ${ts} ===`);

  const aderenciaUrl = process.env.MYSQL_URL || process.env.ADERENCIA_MYSQL_URL;
  if (!aderenciaUrl) {
    console.error('[backup] MYSQL_URL nao configurada. Abortando.');
    process.exit(1);
  }

  // Pool do aderencia para salvar backups
  const aderenciaPool = mysql.createPool({
    uri: aderenciaUrl,
    waitForConnections: true,
    connectionLimit: 3,
    connectTimeout: 15000,
    ssl: { rejectUnauthorized: false },
  });

  const results = [];

  for (const system of SYSTEMS) {
    try {
      let result;
      if (system.type === 'mysql') {
        result = await backupMySQL(system);
      } else if (system.type === 'postgres') {
        result = await backupPostgres(system);
      } else {
        warn(`${system.name}: tipo desconhecido (${system.type}) — ignorando`);
        continue;
      }

      const backupJson = JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '2.0',
        system: result.system,
        status: result.status,
        recordCount: result.recordCount,
        error: result.error || null,
        data: result.tables,
      }, null, 2);

      // Salvar no MySQL do aderencia
      if (result.status !== 'skipped') {
        try {
          await saveToAderenciaMySQL(aderenciaPool, ts, result.system, backupJson);
        } catch (err) {
          warn(`${result.system}: erro ao salvar no MySQL: ${err.message}`);
        }
      }

      // Commit no GitHub
      if (GITHUB_TOKEN && result.status !== 'skipped') {
        try {
          await commitToGitHub(ts, dateStr, result.system, backupJson);
        } catch (err) {
          warn(`${result.system}: erro no commit GitHub: ${err.message}`);
        }
      }

      results.push({ system: result.system, status: result.status, records: result.recordCount });
    } catch (err) {
      warn(`${system.name}: erro inesperado: ${err.message}`);
      results.push({ system: system.name, status: 'error', records: 0 });
    }
  }

  // Limpar backups antigos do MySQL (manter ultimos 30 dias)
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - BACKUP_RETENTION_DAYS);
    const [deleted] = await aderenciaPool.query(
      'DELETE FROM backups WHERE created_at < ?',
      [cutoff.toISOString().slice(0, 19).replace('T', ' ')]
    );
    if (deleted.affectedRows > 0) {
      log(`${deleted.affectedRows} backups antigos removidos do MySQL`);
    }
  } catch (err) {
    warn(`Erro ao limpar backups antigos: ${err.message}`);
  }

  await aderenciaPool.end().catch(() => {});

  log('=== Resumo do backup ===');
  for (const r of results) {
    log(`  ${r.system}: ${r.status} — ${r.records} registros`);
  }
  log(`=== Backup concluido — ${ts} ===`);
}

run().catch((err) => {
  console.error('[backup] Erro fatal:', err);
  process.exit(1);
});
