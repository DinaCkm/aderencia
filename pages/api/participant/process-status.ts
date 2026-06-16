import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import type { ProcessConfig } from '../admin/process-config';

/**
 * GET /api/participant/process-status
 * Retorna se o processo está encerrado para o candidato.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const config = await readJsonAsync<ProcessConfig>('process_config', { processClosed: false });
  return res.status(200).json({
    processClosed: config.processClosed ?? false,
    message: config.message || null,
    closedAt: config.closedAt || null,
  });
}
