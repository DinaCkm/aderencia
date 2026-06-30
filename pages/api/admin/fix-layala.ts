import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'layala.cardoso@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionCatalogLabel = 'Mapeamento e melhoria de controles internos';
  (p as any).exceptionCatalogType = 'projeto';
  (p as any).exceptionCatalogArea = 'UGE';
  (p as any).exceptionApprovalJustification = 'Projeto reconhecido por equivalência ao item "Programa de gestão de riscos e integridade" do catálogo oficial da UGE. Mapeamento e melhoria de controles internos integra o escopo de gestão de riscos e integridade organizacional. Classificado como Estratégico Central — 20 pts.';
  (p as any).exceptionResolvedAt = new Date().toISOString();

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Mapeamento e melhoria de controles internos" reconhecido por equivalência ao item "Programa de gestão de riscos e integridade" da UGE — 20 pts Estratégico Central. (2) "Eficiência administrativa e redesenho de processos" foi vinculado à área URC, porém o catálogo oficial reconhece este projeto para a UAF — Unidade de Administração e Finanças, área à qual a candidata não concorre (áreas de interesse: UGE, UAC, URC). A URC tem escopo voltado a relacionamento e atendimento ao cliente, sem aderência direta com eficiência de processos administrativos internos. Por este motivo, o projeto não gera pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
