import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'juliana.prediger@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Campanhas de comunicação e marketing estratégico" reconhecido por inclusão de novo item no catálogo oficial das REGIONAIS, considerando que campanhas de comunicação executadas em nível regional têm propósito de divulgação local distinto das campanhas corporativas da UMC — classificado como Complementar — 15 pts. (2) "Programa de sucessão e desenvolvimento de lideranças" foi vinculado à área UAC, porém o catálogo oficial reconhece este projeto para a UGP — Unidade de Gestão de Pessoas, área à qual a candidata não concorre. Não há aderência temática com competitividade/pequenos negócios (UAC) nem com as demais áreas de interesse (REGIONAIS, URC). Por este motivo, o projeto não gera pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
