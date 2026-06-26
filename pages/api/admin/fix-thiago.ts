import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'thiago.soares@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });
  const label = 'Execução estratégica regional do portfólio';
  const area = 'REGIONAIS';
  // Garante selectedProjects
  const current = participants[idx].selectedProjects || [];
  if (!current.includes(label)) participants[idx].selectedProjects = [...current, label];
  // Registra proofMode
  if (!participants[idx].proofMode) participants[idx].proofMode = {};
  participants[idx].proofMode[`proj:${label}`] = 'ugp-knows';
  // Vincula à área no projectAreaMap
  if (!participants[idx].projectAreaMap) participants[idx].projectAreaMap = {};
  participants[idx].projectAreaMap[label] = area;
  await writeJsonAsync('participants', participants);
  return res.status(200).json({ success: true, projectAreaMap: participants[idx].projectAreaMap });
}
