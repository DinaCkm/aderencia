import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'alorran.barbosa@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Inteligência estratégica e BI corporativo" foi vinculado à área UTIC, porém o catálogo oficial reconhece este projeto para a UGE — Unidade de Gestão Estratégica, área à qual o candidato não concorre (áreas de interesse: UTIC, UAC, URC). Foi avaliada possível aderência às demais áreas: não há equivalência temática com competitividade e pequenos negócios (UAC), nem com os itens de relacionamento e atendimento ao cliente do catálogo da URC. Adicionalmente, o candidato já possui os projetos "Implantação e modernização de sistemas corporativos" e "Programa de sucessão e desenvolvimento de lideranças" pontuando na UTIC, atingindo a pontuação máxima de 20 pts por área. Por este motivo, o projeto não gera pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
