/**
 * server.ts
 * Custom server para inicializar o banco de dados antes de iniciar o Next.js.
 * Usado em produção (Railway) para fazer o seed dos dados base.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

async function main() {
  // Inicializa o banco de dados com os dados base
  if (process.env.DATABASE_URL) {
    console.log('[server] Inicializando banco de dados PostgreSQL...');
    try {
      const { initializeDatabase } = await import('./lib/db');
      const { SEED_DATA } = await import('./lib/seed');
      await initializeDatabase(SEED_DATA);
      console.log('[server] Banco de dados inicializado com sucesso.');
    } catch (err) {
      console.error('[server] Erro ao inicializar banco de dados:', err);
      // Não interrompe o servidor — continua com fallback JSON
    }
  } else {
    console.log('[server] DATABASE_URL não configurada — usando arquivos JSON locais.');
  }

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, () => {
    console.log(`[server] Pronto em http://${hostname}:${port}`);
  });
}

main().catch((err) => {
  console.error('[server] Erro fatal:', err);
  process.exit(1);
});
