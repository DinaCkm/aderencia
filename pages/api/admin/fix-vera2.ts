import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'vera.braga@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Correção administrativa atualizada pela UGP em 29/06/2026: o projeto "Programa de sucessão e desenvolvimento de lideranças", vinculado à área UAF, agora é reconhecido nesta área pelo catálogo oficial — "Programa de sucessão e desenvolvimento de lideranças" foi incluído como item Complementar (15 pts) em todos os catálogos de área, por se tratar de competência transversal necessária em qualquer unidade que gerencia equipes. A candidata passa a pontuar 15 pts na UAF com este projeto. Os demais projetos seguem pontuando normalmente: "Projeto de cultura organizacional e engajamento" na UGP (20 pts) e "Inteligência estratégica e BI corporativo" na UGE (15 pts).';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
