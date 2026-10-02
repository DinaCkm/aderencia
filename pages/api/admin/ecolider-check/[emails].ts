import type { NextApiRequest, NextApiResponse } from 'next';
import { CLIENT } from '../../../../lib/client-config';
import { ecoliderEnabled, diagnoseEmails } from '../../../../lib/ecolider';

// Diagnóstico (sem credenciais) da situação de e-mails no EcoLíder.
// Uso: /api/admin/ecolider-check/email1,email2
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!CLIENT.ecolider || !ecoliderEnabled()) return res.status(404).json({ error: 'EcoLíder não configurado.' });
  const raw = String(req.query.emails || '');
  try {
    return res.status(200).json({ diagnostico: await diagnoseEmails(decodeURIComponent(raw).split(',')) });
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'erro' });
  }
}
