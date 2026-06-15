const mysql = require('mysql2/promise');
const MYSQL_URL = 'mysql://root:MCjEffOiTkxxVTJFBDSakveKivYwkQKE@tramway.proxy.rlwy.net:52332/railway';

async function main() {
  const pool = mysql.createPool({ uri: MYSQL_URL, waitForConnections: true, connectionLimit: 3, connectTimeout: 30000 });
  
  // Listar todas as keys no kv_store
  const [rows] = await pool.execute('SELECT `key`, LENGTH(value) as sz FROM kv_store');
  console.log('Keys no kv_store:');
  for (const r of rows) console.log(`  ${r.key} (${Math.round(r.sz/1024)} KB)`);

  // Migrar todas as keys que contenham UAS
  const [allRows] = await pool.execute('SELECT `key`, value FROM kv_store');
  for (const row of allRows) {
    const count = (row.value.match(/"UAS"/g) || []).length;
    if (count > 0) {
      const updated = row.value.replace(/"UAS"/g, '"UAF"');
      await pool.execute('UPDATE kv_store SET value = ? WHERE `key` = ?', [updated, row.key]);
      console.log(`✓ kv_store["${row.key}"]: ${count} ocorrências de "UAS" → "UAF"`);
    } else {
      console.log(`  kv_store["${row.key}"]: sem "UAS"`);
    }
  }

  await pool.end();
  console.log('\nMigração concluída!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
