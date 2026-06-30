import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'jacirley.nascimento@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Marketing digital e presença multicanal" reconhecido por inclusão de novo item no catálogo oficial das REGIONAIS, considerando a divulgação digital local característica da atuação regional — classificado como Complementar — 15 pts (o limite máximo de 20 pts por área já é atingido em conjunto com o projeto "Campanhas de comunicação e marketing estratégico", também reconhecido para a área). (2) "Monitoramento de satisfação e NPS" foi vinculado à área REGIONAIS, porém o catálogo oficial reconhece este projeto para a URC — Unidade de Relacionamento com Clientes, área à qual a candidata não concorre (área única de interesse: REGIONAIS). Como o limite máximo de 20 pts por área já foi atingido com os demais projetos, este não geraria pontuação adicional mesmo que reconhecido.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
