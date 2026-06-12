/**
 * lib/db.ts
 * Camada de acesso a dados com suporte a MySQL (produção) e JSON local (desenvolvimento).
 * Mantém a mesma interface readJson/writeJson para compatibilidade com todas as APIs.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Detecção de ambiente ────────────────────────────────────────────────────
const MYSQL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;
const USE_MYSQL = Boolean(MYSQL_URL);

// ─── Pool MySQL (lazy init) ──────────────────────────────────────────────────
let mysqlPool: any = null;

function getPool() {
  if (!mysqlPool) {
    const mysql = require('mysql2/promise');
    mysqlPool = mysql.createPool({
      uri: MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10000,
    });
  }
  return mysqlPool;
}

export async function queryUsers<T = any[]>(sql: string, params: any[] = []): Promise<T> {
  const pool = getPool();
  const [rows]: any[] = await pool.query(sql, params);
  return rows as T;
}

async function ensureTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      \`key\`      VARCHAR(255) PRIMARY KEY,
      \`value\`    LONGTEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function mysqlRead<T>(name: string, defaultValue: T): Promise<T> {
  try {
    await ensureTable();
    const pool = getPool();
    const [rows]: any[] = await pool.query('SELECT `value` FROM kv_store WHERE `key` = ?', [name]);
    if (!rows || rows.length === 0) {
      await mysqlWrite(name, defaultValue);
      return defaultValue;
    }
    const raw = rows[0].value;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    // Garantir que o tipo retornado seja compatível com o defaultValue
    // Se defaultValue é array mas parsed é objeto (cache corrompido), retornar defaultValue
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      console.warn(`[db] Tipo inválido para "${name}": esperado array, recebido ${typeof parsed}. Usando default.`);
      await mysqlWrite(name, defaultValue);
      return defaultValue;
    }
    return parsed as T;
  } catch (err) {
    console.error(`[db] Erro ao ler "${name}" do MySQL:`, err);
    return defaultValue;
  }
}

async function mysqlWrite<T>(name: string, data: T): Promise<void> {
  try {
    await ensureTable();
    const pool = getPool();
    const json = JSON.stringify(data);
    await pool.query(
      `INSERT INTO kv_store (\`key\`, \`value\`, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()`,
      [name, json]
    );
  } catch (err) {
    console.error(`[db] Erro ao escrever "${name}" no MySQL:`, err);
    throw err;
  }
}

// ─── Cache em memória ────────────────────────────────────────────────────────
const memCache: Record<string, any> = {};

async function warmCache(name: string, defaultValue: any): Promise<void> {
  if (name in memCache) return;
  const data = await mysqlRead(name, defaultValue);
  memCache[name] = data;
}

// ─── Implementação JSON local ────────────────────────────────────────────────
const dataDir = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function jsonRead<T>(name: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function jsonWrite<T>(name: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(dataDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Interface pública ───────────────────────────────────────────────────────

/**
 * Lê dados do armazenamento.
 * - JSON local: leitura síncrona do arquivo
 * - MySQL: retorna cache em memória (ou default enquanto carrega)
 */
export function readJson<T>(name: string, defaultValue: T): T {
  if (!USE_MYSQL) {
    return jsonRead(name, defaultValue);
  }
  if (name in memCache) {
    return memCache[name] as T;
  }
  warmCache(name, defaultValue).catch((err) =>
    console.error(`[db] warmCache error for "${name}":`, err)
  );
  return defaultValue;
}

/**
 * Escreve dados no armazenamento.
 * - JSON local: escrita síncrona no arquivo
 * - MySQL: atualiza cache imediatamente + persiste de forma assíncrona
 */
export function writeJson<T>(name: string, data: T): void {
  if (!USE_MYSQL) {
    jsonWrite(name, data);
    return;
  }
  memCache[name] = data;
  mysqlWrite(name, data).catch((err) =>
    console.error(`[db] Erro ao persistir "${name}":`, err)
  );
}

/**
 * Versão assíncrona — lê diretamente do MySQL (sem cache).
 * Use em APIs onde consistência é crítica.
 */
export async function readJsonAsync<T>(name: string, defaultValue: T): Promise<T> {
  if (!USE_MYSQL) {
    return jsonRead(name, defaultValue);
  }
  // Sempre ler do MySQL (sem cache) para garantir consistência
  const data = await mysqlRead(name, defaultValue);
  // Validar tipo antes de guardar no cache
  if (Array.isArray(defaultValue) && !Array.isArray(data)) {
    memCache[name] = defaultValue;
    return defaultValue;
  }
  memCache[name] = data;
  return data;
}

/**
 * Versão assíncrona — aguarda a persistência no MySQL.
 */
export async function writeJsonAsync<T>(name: string, data: T): Promise<void> {
  if (!USE_MYSQL) {
    jsonWrite(name, data);
    return;
  }
  memCache[name] = data;
  await mysqlWrite(name, data);
}

// ─── Tabela proof_files (arquivos de comprovante separados) ─────────────────

async function ensureProofFilesTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS proof_files (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      email       VARCHAR(255) NOT NULL,
      item_key    VARCHAR(500) NOT NULL,
      file_data   LONGTEXT NOT NULL,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_email_item (email(200), item_key(300))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/**
 * Salva um arquivo de comprovante na tabela proof_files.
 */
export async function saveProofFile(email: string, itemKey: string, fileData: string): Promise<void> {
  if (!USE_MYSQL) return; // no modo local, os arquivos ficam no JSON
  try {
    await ensureProofFilesTable();
    const pool = getPool();
    await pool.query(
      `INSERT INTO proof_files (email, item_key, file_data, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE file_data = VALUES(file_data), updated_at = NOW()`,
      [email, itemKey, fileData]
    );
  } catch (err) {
    console.error(`[db] Erro ao salvar proof_file ${email}/${itemKey}:`, err);
    throw err;
  }
}

/**
 * Lê todos os arquivos de comprovante de um participante.
 */
export async function loadProofFiles(email: string): Promise<Record<string, string>> {
  if (!USE_MYSQL) return {};
  try {
    await ensureProofFilesTable();
    const pool = getPool();
    const [rows]: any[] = await pool.query(
      'SELECT item_key, file_data FROM proof_files WHERE email = ?',
      [email]
    );
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.item_key] = row.file_data;
    }
    return result;
  } catch (err) {
    console.error(`[db] Erro ao carregar proof_files de ${email}:`, err);
    return {};
  }
}

/**
 * Inicializa o banco com dados base (seed).
 * Só insere se a chave ainda não existir — preserva dados existentes.
 */
export async function initializeDatabase(seedData: Record<string, any>): Promise<void> {
  if (!USE_MYSQL) {
    // No modo JSON local, inicializa apenas as chaves que ainda não existem
    for (const [key, value] of Object.entries(seedData)) {
      const filePath = path.join(process.cwd(), 'data', `${key}.json`);
      if (!fs.existsSync(filePath)) {
        ensureDataDir();
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
        console.log(`[db] Seed local: "${key}" inicializado.`);
      }
    }
    return;
  }
  try {
    await ensureTable();
    const pool = getPool();
    for (const [key, value] of Object.entries(seedData)) {
      const json = JSON.stringify(value);
      await pool.query(
        `INSERT INTO kv_store (\`key\`, \`value\`, updated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE updated_at = updated_at`,
        [key, json]
      );
      const [rows]: any[] = await pool.query('SELECT `value` FROM kv_store WHERE `key` = ?', [key]);
      const raw = rows[0]?.value;
      memCache[key] = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? value);
    }
    console.log('[db] Seed MySQL concluído:', Object.keys(seedData).join(', '));
  } catch (err) {
    console.error('[db] Erro no seed MySQL:', err);
  }
}
