import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'edvaldo.lima@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Programa de sucessão e desenvolvimento de lideranças" reconhecido para a área REGIONAIS — desenvolvimento de lideranças foi incluído como item Complementar (15 pts) em todos os catálogos de área, por se tratar de competência transversal necessária em qualquer unidade que gerencia equipes. (2) "Sistema de indicadores OKR/BSC" foi vinculado à área REGIONAIS, porém o catálogo oficial reconhece este projeto para a UGE — Unidade de Gestão Estratégica, área à qual o candidato não concorre (áreas de interesse: REGIONAIS, URC, UTIC). Como o limite máximo de 20 pts por área já é atingido com os demais projetos da REGIONAIS, este não geraria pontuação adicional mesmo que reconhecido.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
