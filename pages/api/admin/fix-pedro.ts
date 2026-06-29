import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'pedro.junior@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Sistema de indicadores OKR/BSC': 'UGE',
    'Análise de cenários e inteligência institucional': 'UGE',
  };

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Sistema de indicadores OKR/BSC" corrigido de UGP para UGE, onde é reconhecido no catálogo oficial e o candidato concorre. (2) "Análise de cenários e inteligência institucional" reconhecido por equivalência ao item "Inteligência estratégica e BI corporativo" da UGE — o comprovante apresentado (Análise Preditiva) demonstra aderência à inteligência estratégica institucional, tema central da UGE — classificado como Complementar — 15 pts. (3) "Planejamento orçamentário anual e plurianual" vinculado à UAF não pontua — o catálogo reconhece este projeto para a UGOC, área à qual o candidato não concorre, e a UAF não possui aderência temática com planejamento orçamentário.';

  // Registra a exceção aprovada
  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionCatalogLabel = 'Análise de cenários e inteligência institucional';
  (p as any).exceptionCatalogType = 'projeto';
  (p as any).exceptionCatalogArea = 'UGE';
  (p as any).exceptionApprovalJustification = 'Projeto reconhecido por equivalência ao item "Inteligência estratégica e BI corporativo" da UGE. O comprovante apresentado demonstra atuação em análise preditiva e inteligência institucional, com aderência direta à gestão estratégica da organização.';
  (p as any).exceptionResolvedAt = new Date().toISOString();

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
