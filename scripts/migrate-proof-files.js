/**
 * Migração: mover arquivos base64 de proofFiles para tabela proof_files separada.
 * Isso reduz o JSON de participants de ~64 MB para ~1 MB.
 * 
 * Executar uma única vez: node scripts/migrate-proof-files.js
 */

const mysql = require('mysql2/promise');

const MYSQL_URL = 'mysql://root:MCjEffOiTkxxVTJFBDSakveKivYwkQKE@tramway.proxy.rlwy.net:52332/railway';

async function main() {
  const pool = mysql.createPool({
    uri: MYSQL_URL,
    waitForConnections: true,
    connectionLimit: 3,
    connectTimeout: 30000,
  });

  console.log('Conectando ao MySQL...');

  // 1. Criar tabela proof_files se não existir
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
  console.log('Tabela proof_files criada/verificada.');

  // 2. Ler participants
  const [rows] = await pool.query('SELECT `value` FROM kv_store WHERE `key` = ?', ['participants']);
  if (!rows || rows.length === 0) {
    console.log('Nenhum participante encontrado.');
    await pool.end();
    return;
  }

  const participants = JSON.parse(rows[0].value);
  console.log(`Total participantes: ${participants.length}`);

  let migratedFiles = 0;
  let skippedFiles = 0;

  // 3. Para cada participante, migrar arquivos base64 para proof_files
  for (const p of participants) {
    const email = p.email || p.id;
    if (!email) continue;

    const proofFiles = p.proofFiles || {};
    for (const [itemKey, fileData] of Object.entries(proofFiles)) {
      if (!fileData || typeof fileData !== 'string') continue;
      // Só migrar se for base64 real (data: URL ou string longa)
      const isBase64 = fileData.startsWith('data:') || fileData.length > 100;
      if (!isBase64) {
        skippedFiles++;
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO proof_files (email, item_key, file_data, updated_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE file_data = VALUES(file_data), updated_at = NOW()`,
          [email, itemKey, fileData]
        );
        migratedFiles++;
      } catch (err) {
        console.error(`Erro ao migrar arquivo ${email}/${itemKey}:`, err.message);
      }
    }
  }

  console.log(`Arquivos migrados: ${migratedFiles}, ignorados (legados): ${skippedFiles}`);

  // 4. Limpar base64 do JSON participants (manter apenas metadados)
  const cleanedParticipants = participants.map(p => {
    const cleanProofFiles = {};
    for (const [key, val] of Object.entries(p.proofFiles || {})) {
      // Manter apenas arquivos legados (nome de arquivo, não base64)
      // Os base64 já foram migrados para proof_files
      const isBase64 = val && (val.startsWith('data:') || val.length > 100);
      if (!isBase64 && val) {
        cleanProofFiles[key] = val; // manter nome legado para referência
      }
      // base64 real: não incluir no JSON (já está na tabela proof_files)
    }
    return { ...p, proofFiles: cleanProofFiles };
  });

  const cleanJson = JSON.stringify(cleanedParticipants);
  console.log(`Tamanho após limpeza: ${Math.round(cleanJson.length / 1024)} KB (era ~64 MB)`);

  // 5. Salvar participants limpo de volta
  await pool.query(
    `UPDATE kv_store SET \`value\` = ?, updated_at = NOW() WHERE \`key\` = ?`,
    [cleanJson, 'participants']
  );
  console.log('participants atualizado no MySQL.');

  // 6. Verificar resultado
  const [newRows] = await pool.query('SELECT LENGTH(`value`) as bytes FROM kv_store WHERE `key` = ?', ['participants']);
  console.log(`Novo tamanho de participants: ${Math.round(newRows[0].bytes / 1024)} KB`);

  const [pfRows] = await pool.query('SELECT COUNT(*) as total FROM proof_files');
  console.log(`Total de arquivos na tabela proof_files: ${pfRows[0].total}`);

  await pool.end();
  console.log('Migração concluída com sucesso!');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
