import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'thaisvneres@gmail.com');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Correção administrativa atualizada pela UGP em 29/06/2026: (1) "Projeto ESG e sustentabilidade institucional" corrigido para UGE — 20 pts. (2) "Mapeamento e melhoria de controles internos" reconhecido por equivalência na UGOC — 15 pts. (3) "Programa de sucessão e desenvolvimento de lideranças", vinculado à área UGOC, agora é reconhecido nesta área pelo catálogo oficial — este projeto foi incluído como item Complementar (15 pts) em todos os catálogos de área. Como a UGOC já atinge o limite de 20 pts com o "Mapeamento e melhoria de controles internos", o projeto de sucessão não gera pontuação adicional.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
