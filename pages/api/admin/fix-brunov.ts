import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'bruno.vilaverde@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Move Monitoramento de UAF para URC
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Monitoramento de resultados e metas regionais': 'URC',
  };

  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionCatalogLabel = 'Monitoramento de resultados e metas regionais';
  (p as any).exceptionCatalogType = 'projeto';
  (p as any).exceptionCatalogArea = 'URC';
  (p as any).exceptionApprovalJustification = 'Projeto reconhecido por equivalência ao item "Monitoramento de satisfação e NPS" do catálogo oficial da URC. Monitoramento de resultados e metas envolve acompanhamento de métricas de performance, com aderência ao escopo de monitoramento da URC. Classificado como Complementar — 15 pts.';
  (p as any).exceptionResolvedAt = new Date().toISOString();

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Monitoramento de resultados e metas regionais" corrigido de UAF para URC, reconhecido por equivalência ao item "Monitoramento de satisfação e NPS" — 15 pts Complementar. (2) "Análise de cenários e inteligência institucional" foi vinculado à área URC, porém o catálogo oficial reconhece este projeto para a URI — área à qual o candidato não concorre. Não há aderência temática com os itens da URC nem da UAF. Por este motivo, o projeto não gera pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
