import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'thaisvneres@gmail.com');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Projeto ESG e sustentabilidade institucional': 'UGE',
    'Mapeamento e melhoria de controles internos': 'UGOC',
  };

  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: (1) "Projeto ESG e sustentabilidade institucional" corrigido de UAF para UGE, onde é reconhecido no catálogo oficial e a candidata concorre. (2) "Mapeamento e melhoria de controles internos" corrigido de UGE para UGOC — novo item incluído no catálogo da UGOC por reconhecimento de aderência à área de conformidade e controladoria, classificado como Complementar — 15 pts. O projeto "Programa de sucessão e desenvolvimento de lideranças" não pontua pois não há área compatível entre as que a candidata concorre.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
