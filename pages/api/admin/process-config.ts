import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export interface ProcessConfig {
  processClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  message?: string;
}

const DEFAULT_CONFIG: ProcessConfig = {
  processClosed: false,
};

/**
 * GET  /api/admin/process-config  → retorna configuração atual
 * POST /api/admin/process-config  → atualiza configuração (admin only)
 * Body POST: { processClosed: boolean, closedBy?: string, message?: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const config = await readJsonAsync<ProcessConfig>('process_config', DEFAULT_CONFIG);
    return res.status(200).json(config);
  }

  if (req.method === 'POST') {
    const { processClosed, closedBy, message } = req.body as {
      processClosed: boolean;
      closedBy?: string;
      message?: string;
    };

    const config: ProcessConfig = {
      processClosed,
      closedAt: processClosed ? new Date().toISOString() : undefined,
      closedBy: closedBy || 'admin',
      message: message || (processClosed
        ? 'O prazo de inscrição foi encerrado. Não é mais possível alterar os dados do formulário. Caso precise anexar comprovantes, entre em contato com a administração.'
        : undefined),
    };

    await writeJsonAsync('process_config', config);
    return res.status(200).json({ success: true, config });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
