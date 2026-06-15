// Script para migrar UAS -> UAF no banco de dados
const mysql = require('mysql2/promise');

const DB_URL = 'mysql://root:MCjEffOiTkxxVTJFBDSakveKivYwkQKE@tramway.proxy.rlwy.net:52332/railway';

async function main() {
  if (!DB_URL) { console.error('DATABASE_URL não encontrada'); process.exit(1); }
  const conn = await mysql.createConnection(DB_URL);
  console.log('Conectado ao banco.');

  // 1. Migrar tabela kv_store (participants JSON)
  const [rows] = await conn.execute("SELECT `key`, value FROM kv_store WHERE `key` = 'participants'");
  if (rows.length > 0) {
    const raw = rows[0].value;
    const updated = raw.replace(/"UAS"/g, '"UAF"');
    const count = (raw.match(/"UAS"/g) || []).length;
    if (count > 0) {
      await conn.execute("UPDATE kv_store SET value = ? WHERE `key` = 'participants'", [updated]);
      console.log(`✓ kv_store participants: ${count} ocorrências de "UAS" → "UAF"`);
    } else {
      console.log('kv_store participants: nenhuma ocorrência de "UAS" encontrada');
    }
  }

  // 2. Migrar tabela proof_files (item_key pode conter UAS)
  const [pfRows] = await conn.execute("SELECT id, item_key FROM proof_files WHERE item_key LIKE '%UAS%'");
  for (const row of pfRows) {
    const newKey = row.item_key.replace(/UAS/g, 'UAF');
    await conn.execute('UPDATE proof_files SET item_key = ? WHERE id = ?', [newKey, row.id]);
    console.log(`✓ proof_files id=${row.id}: "${row.item_key}" → "${newKey}"`);
  }
  if (pfRows.length === 0) console.log('proof_files: nenhuma ocorrência de UAS encontrada');

  // 3. Migrar tabela disc_data (area_code = 'UAS')
  const [discRows] = await conn.execute("SELECT id, email, area_code FROM disc_data WHERE area_code = 'UAS'");
  for (const row of discRows) {
    await conn.execute("UPDATE disc_data SET area_code = 'UAF' WHERE id = ?", [row.id]);
    console.log(`✓ disc_data id=${row.id} (${row.email}): UAS → UAF`);
  }
  if (discRows.length === 0) console.log('disc_data: nenhuma ocorrência de UAS encontrada');

  // 4. Verificar tabela validations se existir
  try {
    const [valRows] = await conn.execute("SELECT id, item_key FROM validations WHERE item_key LIKE '%UAS%'");
    for (const row of valRows) {
      const newKey = row.item_key.replace(/UAS/g, 'UAF');
      await conn.execute('UPDATE validations SET item_key = ? WHERE id = ?', [newKey, row.id]);
      console.log(`✓ validations id=${row.id}: "${row.item_key}" → "${newKey}"`);
    }
    if (valRows.length === 0) console.log('validations: nenhuma ocorrência de UAS encontrada');
  } catch (e) {
    console.log('validations: tabela não existe ou erro:', e.message);
  }

  await conn.end();
  console.log('\nMigração concluída!');
}

main().catch(e => { console.error(e); process.exit(1); });
