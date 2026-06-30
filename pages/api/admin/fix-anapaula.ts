import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'paula.alves@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: os projetos "Projeto de infraestrutura e facilities" e "Gestão patrimonial e inventário estratégico" foram analisados também quanto às áreas UAC e UMC (demais áreas de interesse da candidata), não havendo aderência temática nessas áreas — ambos permanecem corretamente vinculados à UAF, onde já pontuam 20 pts cada, atingindo o limite máximo por área. O projeto "Projeto de cultura organizacional e engajamento" foi vinculado à UAF, porém o catálogo oficial reconhece este projeto para a UGP — Unidade de Gestão de Pessoas, área à qual a candidata não concorre. Foi também avaliada possível aderência às áreas UAC e UMC: não há equivalência temática com competitividade/pequenos negócios (UAC) nem com os itens de comunicação externa e institucional do catálogo da UMC. Por este motivo, o projeto não gera pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
