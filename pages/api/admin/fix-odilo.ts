import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'odilo.carvalho@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Articulação regional e parcerias territoriais" foi vinculado pelo candidato à área UGE, porém o catálogo oficial reconhece este projeto para as Unidades Regionais (REGIONAIS). Como o candidato já possui o projeto "Desenvolvimento regional e interiorização" pontuando nas REGIONAIS com 20 pts — pontuação máxima por área — o projeto não gera pontuação adicional mesmo que fosse reconhecido para aquela área.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
