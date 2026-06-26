import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'francisco.ramos@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Manter apenas o vínculo correto — Competitividade → UAC
  p.projectAreaMap = {
    'Competitividade e inovação para pequenos negócios': 'UAC',
  };

  // Manter apenas os projetos com vínculo válido no selectedProjects
  // (os outros podem ficar, pois não pontuam sem projectAreaMap)
  
  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    selectedProjects: p.selectedProjects,
  });
}
