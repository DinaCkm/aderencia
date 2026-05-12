/**
 * lib/db.ts
 * Camada de acesso a dados com suporte a PostgreSQL (produção) e JSON local (desenvolvimento).
 * Mantém a mesma interface readJson/writeJson para compatibilidade com todas as APIs.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Detecção de ambiente ────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
const USE_POSTGRES = Boolean(DATABASE_URL);

// ─── Pool PostgreSQL (lazy init) ─────────────────────────────────────────────
let pgPool: any = null;

function getPool() {
  if (!pgPool) {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

async function ensureTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key        TEXT PRIMARY KEY,
      value      JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function pgRead<T>(name: string, defaultValue: T): Promise<T> {
  try {
    await ensureTable();
    const pool = getPool();
    const result = await pool.query('SELECT value FROM kv_store WHERE key = $1', [name]);
    if (result.rows.length === 0) {
      await pgWrite(name, defaultValue);
      return defaultValue;
    }
    return result.rows[0].value as T;
  } catch (err) {
    console.error(`[db] Erro ao ler "${name}" do PostgreSQL:`, err);
    return defaultValue;
  }
}

async function pgWrite<T>(name: string, data: T): Promise<void> {
  try {
    await ensureTable();
    const pool = getPool();
    await pool.query(
      `INSERT INTO kv_store (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
      [name, JSON.stringify(data)]
    );
  } catch (err) {
    console.error(`[db] Erro ao escrever "${name}" no PostgreSQL:`, err);
    throw err;
  }
}

// ─── Cache em memória ────────────────────────────────────────────────────────
const memCache: Record<string, any> = {};

async function warmCache(name: string, defaultValue: any): Promise<void> {
  if (name in memCache) return;
  const data = await pgRead(name, defaultValue);
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
 * - PostgreSQL: retorna cache em memória (ou default enquanto carrega)
 */
export function readJson<T>(name: string, defaultValue: T): T {
  if (!USE_POSTGRES) {
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
 * - PostgreSQL: atualiza cache imediatamente + persiste de forma assíncrona
 */
export function writeJson<T>(name: string, data: T): void {
  if (!USE_POSTGRES) {
    jsonWrite(name, data);
    return;
  }
  memCache[name] = data;
  pgWrite(name, data).catch((err) =>
    console.error(`[db] Erro ao persistir "${name}":`, err)
  );
}

/**
 * Versão assíncrona — lê diretamente do PostgreSQL (sem cache).
 * Use em APIs onde consistência é crítica.
 */
export async function readJsonAsync<T>(name: string, defaultValue: T): Promise<T> {
  if (!USE_POSTGRES) {
    return jsonRead(name, defaultValue);
  }
  const data = await pgRead(name, defaultValue);
  memCache[name] = data;
  return data;
}

/**
 * Versão assíncrona — aguarda a persistência no PostgreSQL.
 */
export async function writeJsonAsync<T>(name: string, data: T): Promise<void> {
  if (!USE_POSTGRES) {
    jsonWrite(name, data);
    return;
  }
  memCache[name] = data;
  await pgWrite(name, data);
}

/**
 * Inicializa o banco com dados base (seed).
 * Só insere se a chave ainda não existir — preserva dados existentes.
 */
export async function initializeDatabase(seedData: Record<string, any>): Promise<void> {
  if (!USE_POSTGRES) {
    console.log('[db] Modo JSON local — seed ignorado.');
    return;
  }
  try {
    await ensureTable();
    const pool = getPool();
    for (const [key, value] of Object.entries(seedData)) {
      await pool.query(
        `INSERT INTO kv_store (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(value)]
      );
      const result = await pool.query('SELECT value FROM kv_store WHERE key = $1', [key]);
      memCache[key] = result.rows[0]?.value ?? value;
    }
    console.log('[db] Seed concluído:', Object.keys(seedData).join(', '));
  } catch (err) {
    console.error('[db] Erro no seed:', err);
  }
}
