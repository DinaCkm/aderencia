#!/usr/bin/env python3
import json, os

users = json.load(open('data/users.json'))
users_json = json.dumps(users, ensure_ascii=False)

os.makedirs('scripts', exist_ok=True)

# Escrever o script JS linha por linha para evitar problemas com caracteres especiais
lines = [
    "#!/usr/bin/env node",
    "// scripts/seed-db.js",
    "// Inicializa o banco PostgreSQL com dados base antes do Next.js iniciar.",
    "",
    "const { Client } = require('pg');",
    "",
    "const DATABASE_URL = process.env.DATABASE_URL;",
    "",
    "if (!DATABASE_URL) {",
    "  console.log('[seed] DATABASE_URL nao configurada - pulando seed.');",
    "  process.exit(0);",
    "}",
    "",
    "const SEED_USERS = " + users_json + ";",
    "",
    "const CREATE_TABLE_SQL = [",
    "  'CREATE TABLE IF NOT EXISTS kv_store (',",
    "  '  key        TEXT PRIMARY KEY,',",
    "  '  value      JSONB NOT NULL,',",
    "  '  updated_at TIMESTAMPTZ DEFAULT NOW()',",
    "  ')'",
    "].join('\\n');",
    "",
    "const INSERT_SQL = [",
    "  'INSERT INTO kv_store (key, value, updated_at)',",
    "  'VALUES ($1, $2::jsonb, NOW())',",
    "  'ON CONFLICT (key) DO NOTHING',",
    "  'RETURNING key'",
    "].join('\\n');",
    "",
    "async function seed() {",
    "  const client = new Client({",
    "    connectionString: DATABASE_URL,",
    "    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },",
    "  });",
    "  try {",
    "    await client.connect();",
    "    console.log('[seed] Conectado ao PostgreSQL.');",
    "    await client.query(CREATE_TABLE_SQL);",
    "    console.log('[seed] Tabela kv_store verificada.');",
    "    const seedData = {",
    "      users: SEED_USERS,",
    "      participants: [],",
    "      performance: [],",
    "      discReports: [],",
    "      catalogs: [],",
    "      audits: [],",
    "    };",
    "    for (const [key, value] of Object.entries(seedData)) {",
    "      const result = await client.query(INSERT_SQL, [key, JSON.stringify(value)]);",
    "      const count = Array.isArray(value) ? value.length : 1;",
    "      if (result.rowCount > 0) {",
    "        console.log('[seed] Inserido: ' + key + ' (' + count + ' registros)');",
    "      } else {",
    "        console.log('[seed] Ja existe: ' + key + ' - preservado.');",
    "      }",
    "    }",
    "    console.log('[seed] Seed concluido com sucesso!');",
    "  } catch (err) {",
    "    console.error('[seed] Erro:', err.message);",
    "  } finally {",
    "    await client.end();",
    "  }",
    "}",
    "",
    "seed().catch(console.error);",
    "",
]

with open('scripts/seed-db.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'seed-db.js criado com {len(users)} usuarios')
print(f'Linhas: {len(lines)}')
