import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, loadProofFiles } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { email } = req.query;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email obrigatório' });

  const participants: any[] = await readJsonAsync('participants', []);
  const profile = participants.find((p: any) => p.id === email || p.email === email);

  if (!profile) {
    return res.status(200).json({ profile: null });
  }

  // Carregar arquivos de comprovante da tabela proof_files separada
  const proofFilesFromDB = await loadProofFiles(email);

  // Mesclar: proof_files da tabela tem prioridade sobre o que está no JSON
  const mergedProofFiles = {
    ...(profile.proofFiles || {}), // arquivos legados (apenas nome) do JSON
    ...proofFilesFromDB,           // arquivos base64 da tabela separada
  };

  return res.status(200).json({
    profile: {
      ...profile,
      proofFiles: mergedProofFiles,
    },
  });
}
