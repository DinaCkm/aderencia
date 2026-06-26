import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'thiago.soares@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });
  const current = participants[idx].selectedProjects || [];
  const label = 'Execução estratégica regional do portfólio';
  if (!current.includes(label)) {
    participants[idx].selectedProjects = [...current, label];
  }
  participants[idx].exceptionCatalogLabel = label;
  participants[idx].exceptionCatalogType = 'projeto';
  participants[idx].exceptionResolvedAt = participants[idx].exceptionResolvedAt || new Date().toISOString();
  await writeJsonAsync('participants', participants);
  return res.status(200).json({ success: true, selectedProjects: participants[idx].selectedProjects });
}
