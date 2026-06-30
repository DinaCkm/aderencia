import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'hide.senna@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Gestão da agenda colegiada e fluxo deliberativo" foi vinculado à área URI, e o projeto "Gestão documental e memória dos colegiados" foi vinculado à área UMC. O catálogo oficial reconhece ambos os projetos para o CDE — Conselho Deliberativo Estadual, área à qual a candidata não concorre (áreas de interesse: UGP, URI e UAC). A URI tem escopo voltado à articulação institucional, parcerias e políticas públicas, e a UMC tem escopo voltado a marketing e comunicação — não havendo aderência temática com gestão de agenda colegiada ou gestão documental de órgãos deliberativos, atividades específicas do CDE. Por este motivo, os dois projetos não geram pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
