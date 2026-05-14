#!/usr/bin/env node
// scripts/seed-db.js
// Inicializa o banco PostgreSQL com dados base antes do Next.js iniciar.

const SEED_USERS = [{"email": "admin@sebraeto.com.br", "name": "Administrador", "cpf": "00000000000", "role": "admin", "password": "admin@sebrae2026"}, {"email": "teste01@sebraeto.com.br", "name": "Usuário Teste 01", "cpf": "00000000001", "role": "participant"}, {"email": "teste02@sebraeto.com.br", "name": "Usuário Teste 02", "cpf": "00000000002", "role": "participant"}, {"email": "teste03@sebraeto.com.br", "name": "Usuário Teste 03", "cpf": "00000000003", "role": "participant"}, {"email": "teste04@sebraeto.com.br", "name": "Usuário Teste 04", "cpf": "00000000004", "role": "participant"}, {"email": "teste05@sebraeto.com.br", "name": "Usuário Teste 05", "cpf": "00000000005", "role": "participant"}, {"email": "admary.monteiro@to.sebrae.com.br", "name": "Admary Monteiro Barbosa", "cpf": "83845186100", "role": "participant"}, {"email": "aldeni.torres@to.sebrae.com.br", "name": "Aldeni Batista Torres", "cpf": "00658585142", "role": "participant"}, {"email": "alencar.borelli@to.sebrae.com.br", "name": "Alencar Hubner Borelli", "cpf": "01017472173", "role": "participant"}, {"email": "alorran.barbosa@to.sebrae.com.br", "name": "Alorran de Freitas Barbosa", "cpf": "86622536104", "role": "participant"}, {"email": "amaggeldo@to.sebrae.com.br", "name": "Amaggeldo Barbosa", "cpf": "76727025134", "role": "participant"}, {"email": "ana.costa@to.sebrae.com.br", "name": "Ana Cássia de Oliveira Costa", "cpf": "03313815162", "role": "participant"}, {"email": "paula.alves@to.sebrae.com.br", "name": "Ana Paula Alves Santos", "cpf": "01433867192", "role": "participant"}, {"email": "andre.gomes@to.sebrae.com.br", "name": "Andre Silva Gomes", "cpf": "00888269102", "role": "participant"}, {"email": "andreia.facundes@to.sebrae.com.br", "name": "Andreia Rodrigues Facundes", "cpf": "90944267149", "role": "participant"}, {"email": "antonio.curcino@to.sebrae.com.br", "name": "Antonio Louça Curcino", "cpf": "97641227104", "role": "participant"}, {"email": "antonio.filho@to.sebrae.com.br", "name": "Antonio Luis Ferreira dos Anjos Filho", "cpf": "01027817297", "role": "participant"}, {"email": "bruno.rodrigues@to.sebrae.com.br", "name": "Bruno de Jesus Rodrigues", "cpf": "06463327328", "role": "participant"}, {"email": "bruno.vilaverde@to.sebrae.com.br", "name": "Bruno Henrique Vila Verde", "cpf": "00912378158", "role": "participant"}, {"email": "bruno.vieira@to.sebrae.com.br", "name": "Bruno Martins Vieira", "cpf": "06668878610", "role": "participant"}, {"email": "cesar.moreira@to.sebrae.com.br", "name": "Cesar Augusto De Sa Moreira", "cpf": "01626149186", "role": "participant"}, {"email": "denise.nunes@to.sebrae.com.br", "name": "Denise da Silva Nunes", "cpf": "96606266068", "role": "participant"}, {"email": "edvaldo.lima@to.sebrae.com.br", "name": "Edvaldo Pereira Lima Junior", "cpf": "01547689102", "role": "participant"}, {"email": "eligeneth@to.sebrae.com.br", "name": "Eligeneth Resplandes Pimentel Gomes", "cpf": "56076797134", "role": "participant"}, {"email": "eliwania.santos@to.sebrae.com.br", "name": "Eliwania Dos Santos Silva", "cpf": "01206149361", "role": "participant"}, {"email": "emerson.lima@to.sebrae.com.br", "name": "Emerson Montenegro Lima", "cpf": "87238314487", "role": "participant"}, {"email": "francisco.ramos@to.sebrae.com.br", "name": "Francisco de Assis Dias Ramos", "cpf": "58693408453", "role": "participant"}, {"email": "gabriela@to.sebrae.com.br", "name": "Gabriela Tomasi", "cpf": "00792361113", "role": "participant"}, {"email": "gilzane.pereira@to.sebrae.com.br", "name": "Gilzane Pereira Amaral", "cpf": "81183500106", "role": "participant"}, {"email": "hide.senna@to.sebrae.com.br", "name": "Hide Senna De Sousa Soares", "cpf": "57389241187", "role": "participant"}, {"email": "jacirley.nascimento@to.sebrae.com.br", "name": "Jacirley Pereira Do Nascimento", "cpf": "00925591157", "role": "participant"}, {"email": "jackeline.lima@to.sebrae.com.br", "name": "Jackeline de Souza Lima", "cpf": "02224365144", "role": "participant"}, {"email": "joseane@to.sebrae.com.br", "name": "Joseane Rodrigues Leite", "cpf": "78954231187", "role": "participant"}, {"email": "juliana.prediger@to.sebrae.com.br", "name": "Juliana Masson Prediger", "cpf": "92391842287", "role": "participant"}, {"email": "layala.cardoso@to.sebrae.com.br", "name": "Layala Cardoso Da Silva Istofel", "cpf": "87809575104", "role": "participant"}, {"email": "leonardo.campelo@to.sebrae.com.br", "name": "Leonardo Campelo Leite Guedes", "cpf": "88020673253", "role": "participant"}, {"email": "luciana@to.sebrae.com.br", "name": "Luciana Carvalho de Aguiar", "cpf": "00151959102", "role": "participant"}, {"email": "marcus.queiroz@to.sebrae.com.br", "name": "Marcus Vinicius Vieira Queiroz", "cpf": "01479169170", "role": "participant"}, {"email": "millena.rodrigues@to.sebrae.com.br", "name": "Millena Pereira Lima Rodrigues", "cpf": "84781971172", "role": "participant"}, {"email": "mirelle.milhomens@to.sebrae.com.br", "name": "Mirelle Soares Milhomens", "cpf": "99743485104", "role": "participant"}, {"email": "nemias.gomes@to.sebrae.com.br", "name": "Nemias Gomes", "cpf": "38906210159", "role": "participant"}, {"email": "odilo.carvalho@to.sebrae.com.br", "name": "Odilo Junior Oliveira Carvalho", "cpf": "03634062126", "role": "participant"}, {"email": "paula.alencar@to.sebrae.com.br", "name": "Paula Dos Reis Coelho Alencar Sousa", "cpf": "02242849166", "role": "participant"}, {"email": "pedro.araujo@to.sebrae.com.br", "name": "Pedro Emilio Rodrigues Alves de Araujo", "cpf": "00973002174", "role": "participant"}, {"email": "pedro.junior@to.sebrae.com.br", "name": "Pedro Junior Da Rocha Silva", "cpf": "00706433181", "role": "participant"}, {"email": "renata.alves@to.sebrae.com.br", "name": "Renata Moura Alves Simas", "cpf": "01056384123", "role": "participant"}, {"email": "thaisvneres@gmail.com", "name": "Thais Neres Vieira", "cpf": "02728855170", "role": "participant"}, {"email": "thiago.silva@to.sebrae.com.br", "name": "Thiago Dias Da Silva", "cpf": "04436929124", "role": "participant"}, {"email": "thiago.soares@to.sebrae.com.br", "name": "Thiago Milhomem Soares", "cpf": "71877282120", "role": "participant"}, {"email": "valci.junior@to.sebrae.com.br", "name": "Valci Pereira Da Silva Junior", "cpf": "00870879103", "role": "participant"}, {"email": "vera.braga@to.sebrae.com.br", "name": "Vera Lucia Teodoro Braga", "cpf": "48483389134", "role": "participant"}, {"email": "vivian.reis@to.sebrae.com.br", "name": "Vivian Nascimento Reis", "cpf": "00888307136", "role": "participant"}, {"email": "walbenia.lemos@to.sebrae.com.br", "name": "Walbenia Lemos da Silva Torres", "cpf": "49954237372", "role": "participant"}, {"email": "wandemberg.rodrigues@to.sebrae.com.br", "name": "Wandemberg Pereira Rodrigues", "cpf": "03005691144", "role": "participant"}, {"email": "wanessa.martins@to.sebrae.com.br", "name": "Wanessa Sobreira dos Santos Martins", "cpf": "03651646157", "role": "participant"}, {"email": "wesley.cardoso@to.sebrae.com.br", "name": "Wesley Cardoso Batista", "cpf": "03319840592", "role": "participant"}];

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  // Sem PostgreSQL: inicializa os arquivos JSON locais para garantir login após deploy
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const seedData = {
    users: SEED_USERS,
    participants: [],
    performance: [],
    discReports: [],
    catalogs: [],
    audits: [],
  };
  for (const [key, value] of Object.entries(seedData)) {
    const filePath = path.join(dataDir, key + '.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
      console.log('[seed] Arquivo JSON criado: ' + key + '.json');
    } else {
      console.log('[seed] Ja existe: ' + key + '.json - preservado.');
    }
  }
  console.log('[seed] Seed local concluido.');
  process.exit(0);
}


const CREATE_TABLE_SQL = [
  'CREATE TABLE IF NOT EXISTS kv_store (',
  '  key        TEXT PRIMARY KEY,',
  '  value      JSONB NOT NULL,',
  '  updated_at TIMESTAMPTZ DEFAULT NOW()',
  ')'
].join('\n');

const INSERT_SQL = [
  'INSERT INTO kv_store (key, value, updated_at)',
  'VALUES ($1, $2::jsonb, NOW())',
  'ON CONFLICT (key) DO NOTHING',
  'RETURNING key'
].join('\n');

async function seed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log('[seed] Conectado ao PostgreSQL.');
    await client.query(CREATE_TABLE_SQL);
    console.log('[seed] Tabela kv_store verificada.');
    const seedData = {
      users: SEED_USERS,
      participants: [],
      performance: [],
      discReports: [],
      catalogs: [],
      audits: [],
    };
    for (const [key, value] of Object.entries(seedData)) {
      const result = await client.query(INSERT_SQL, [key, JSON.stringify(value)]);
      const count = Array.isArray(value) ? value.length : 1;
      if (result.rowCount > 0) {
        console.log('[seed] Inserido: ' + key + ' (' + count + ' registros)');
      } else {
        console.log('[seed] Ja existe: ' + key + ' - preservado.');
      }
    }
    console.log('[seed] Seed concluido com sucesso!');
  } catch (err) {
    console.error('[seed] Erro:', err.message);
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
