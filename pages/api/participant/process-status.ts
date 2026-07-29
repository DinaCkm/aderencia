import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import type { ProcessConfig } from '../admin/process-config';

/**
 * GET /api/participant/process-status?email=...
 * Retorna se o processo está encerrado para o candidato.
 * Se o e-mail estiver na lista de liberação individual (gerenciada em
 * /api/admin/participant-access), o processo é reportado como aberto
 * (overrideActive: true) independentemente do toggle geral — isso permite
 * reabrir o preenchimento só para candidatos específicos, sem afetar os
 * demais que já finalizaram.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const config = await readJsonAsync<ProcessConfig>('process_config', { processClosed: false });
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const overrides = email ? await readJsonAsync<string[]>('participant_access_overrides', []) : [];
  const overrideActive = !!email && overrides.includes(email);

  return res.status(200).json({
    processClosed: overrideActive ? false : (config.processClosed ?? false),
    overrideActive,
    message: config.message || null,
    closedAt: config.closedAt || null,
  });
}
