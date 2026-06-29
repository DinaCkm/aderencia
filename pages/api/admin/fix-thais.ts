import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'thaisvneres@gmail.com');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Corrige "Projeto ESG e sustentabilidade institucional" de UAF para UGE
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Projeto ESG e sustentabilidade institucional': 'UGE',
  };

  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: o projeto "Projeto ESG e sustentabilidade institucional" estava vinculado à área UAF, porém o catálogo oficial reconhece este projeto para a UGE — Unidade de Gestão Estratégica, área que a candidata também concorre. O vínculo foi corrigido para UGE. O projeto "Mapeamento e melhoria de controles internos" (vinculado à UGE) e "Programa de sucessão e desenvolvimento de lideranças" (vinculado à UGOC) permanecem em análise pela UGP.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
