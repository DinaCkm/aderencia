/**
 * server.ts
 * Custom server para inicializar o banco de dados antes de iniciar o Next.js.
 * Usado em produção (Railway) para fazer o seed dos dados base.
 */

import { createServer } from 'http';
import { parse } from 'url';
import { spawn } from 'child_process';
import path from 'path';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const BACKUP_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 horas
const BACKUP_INITIAL_DELAY_MS = 5 * 60 * 1000; // espera 5 min após subir antes do 1º backup

// Roda scripts/backup.js como processo filho (mesma lógica usada pelo botão manual
// "Rodar backup agora" do painel admin). Roda como um subprocesso separado (em vez de
// importar direto) porque o script chama process.exit() ao final/erro, o que mataria
// o servidor inteiro se fosse importado no mesmo processo.
function runScheduledBackup() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'backup.js');
  console.log('[server] Disparando backup agendado (interno, a cada 3h)...');
  const child = spawn(process.execPath, [scriptPath], {
    stdio: ['ignore', 'pipe', 'pipe'], // captura logs no console do servidor (Railway logs)
    env: process.env,
  });
  child.stdout?.on('data', (d) => process.stdout.write(`[backup-agendado] ${d}`));
  child.stderr?.on('data', (d) => process.stderr.write(`[backup-agendado] ${d}`));
  child.on('exit', (code) => {
    console.log(`[server] Backup agendado finalizado — código de saída: ${code}`);
  });
  child.on('error', (err) => {
    console.error('[server] Erro ao disparar backup agendado:', err);
  });
}

async function main() {
  // Inicializa os dados base — funciona tanto com PostgreSQL quanto com JSON local
  console.log('[server] Inicializando dados base...');
  try {
    const { initializeDatabase } = await import('./lib/db');
    const { SEED_DATA } = await import('./lib/seed');
    await initializeDatabase(SEED_DATA);
    console.log('[server] Dados base inicializados com sucesso.');
  } catch (err) {
    console.error('[server] Erro ao inicializar dados base:', err);
    // Não interrompe o servidor
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

    // Agendamento interno de backup — não depende de nenhuma ferramenta externa.
    if (!dev) {
      setTimeout(() => {
        runScheduledBackup();
        setInterval(runScheduledBackup, BACKUP_INTERVAL_MS);
      }, BACKUP_INITIAL_DELAY_MS);
      console.log(`[server] Backup automático agendado a cada ${BACKUP_INTERVAL_MS / 3600000}h (1ª execução em ${BACKUP_INITIAL_DELAY_MS / 60000} min).`);
    }
  });
}

main().catch((err) => {
  console.error('[server] Erro fatal:', err);
  process.exit(1);
});
