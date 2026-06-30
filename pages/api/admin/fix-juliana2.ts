import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'juliana.prediger@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Correção administrativa atualizada pela UGP em 29/06/2026: (1) "Campanhas de comunicação e marketing estratégico" reconhecido por inclusão de novo item no catálogo oficial das REGIONAIS — 15 pts Complementar. (2) "Programa de sucessão e desenvolvimento de lideranças", vinculado à área UAC, agora é reconhecido nesta área pelo catálogo oficial — este projeto foi incluído como item Complementar (15 pts) em todos os catálogos de área, por se tratar de competência transversal necessária em qualquer unidade. A candidata passa a pontuar 15 pts na UAC com este projeto.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
