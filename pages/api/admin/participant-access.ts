import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

/**
 * Lista de e-mails com liberação INDIVIDUAL de preenchimento/edição, mesmo com o
 * processo geral encerrado (toggle em /api/admin/process-config) e/ou fora da
 * janela de datas padrão (OPEN_DATE/CLOSE_DATE em pages/participant.tsx).
 *
 * Uso típico: reabrir o formulário só para um grupo específico de novos
 * candidatos, sem afetar quem já finalizou a ficha (que continua bloqueado).
 *
 * GET  /api/admin/participant-access  → { emails: string[] }
 * POST /api/admin/participant-access  → body: { emails: string[] } (substitui a lista toda)
 *                                     ou { addEmail: string } (adiciona 1 e-mail)
 *                                     ou { removeEmail: string } (remove 1 e-mail)
 */

const KEY = 'participant_access_overrides';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const emails = await readJsonAsync<string[]>(KEY, []);
    return res.status(200).json({ emails });
  }

  if (req.method === 'POST') {
    const body = req.body as { emails?: string[]; addEmail?: string; removeEmail?: string };
    const current = await readJsonAsync<string[]>(KEY, []);
    let updated: string[];

    if (Array.isArray(body.emails)) {
      updated = Array.from(new Set(body.emails.map(normalizeEmail).filter(Boolean)));
    } else if (body.addEmail) {
      const email = normalizeEmail(body.addEmail);
      updated = email ? Array.from(new Set([...current, email])) : current;
    } else if (body.removeEmail) {
      const email = normalizeEmail(body.removeEmail);
      updated = current.filter((e) => e !== email);
    } else {
      return res.status(400).json({ error: 'Informe emails, addEmail ou removeEmail.' });
    }

    await writeJsonAsync(KEY, updated);
    return res.status(200).json({ success: true, emails: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
