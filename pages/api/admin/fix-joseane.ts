import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'joseane@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Sistema de indicadores OKR/BSC" foi vinculado à área UGP, porém o catálogo oficial reconhece este projeto para a UGE — Unidade de Gestão Estratégica, área à qual a candidata não concorre (área única de interesse: UGP). Adicionalmente, a candidata já possui os projetos "Programa de sucessão e desenvolvimento de lideranças" e "Sistema de avaliação de desempenho e PDI" pontuando na UGP, ambos atingindo a pontuação máxima de 20 pts por área. Por este motivo, o "Sistema de indicadores OKR/BSC" não gera pontuação adicional.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
