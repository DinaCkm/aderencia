import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProofFiles } from '../../../lib/db';

// GET /api/admin/proof-file?email=xxx&itemKey=yyy
// Retorna o base64 de um comprovante específico de um participante
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, itemKey } = req.query;
  if (!email || typeof email !== 'string' || !itemKey || typeof itemKey !== 'string') {
    return res.status(400).json({ error: 'email e itemKey são obrigatórios.' });
  }
  const proofFiles = await loadProofFiles(email);
  const cleanKey = itemKey.trim();
  const fileData = proofFiles[cleanKey];
  if (!fileData) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }
  return res.status(200).json({ fileData });
}
