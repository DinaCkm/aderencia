import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'jackeline.lima@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Move ambos os projetos para UGE
  p.projectAreaMap = {
    'Articulação estratégica Conselho-Diretoria': 'UGE',
    'Programa de conformidade regimental e governança do CDE': 'UGE',
  };

  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionResolvedAt = new Date().toISOString();
  (p as any).exceptionApprovalJustification = 'Dois projetos reconhecidos por equivalência na UGE: (1) "Articulação estratégica Conselho-Diretoria" reconhecido por equivalência ao item "Desdobramento do planejamento estratégico" — articulação entre Conselho e Diretoria envolve alinhamento estratégico entre instâncias de governança, aderente ao desdobramento estratégico organizacional. (2) "Programa de conformidade regimental e governança do CDE" reconhecido por equivalência ao item "Programa de gestão de riscos e integridade" — conformidade regimental e governança integram o escopo de gestão de riscos e integridade institucional.';

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: ambos os projetos foram vinculados a áreas sem aderência no catálogo (CDE), mas reconhecidos por equivalência na UGE — área que a candidata concorre: (1) "Articulação estratégica Conselho-Diretoria" reconhecido por equivalência ao item "Desdobramento do planejamento estratégico" da UGE — 20 pts Estratégico Central. (2) "Programa de conformidade regimental e governança do CDE" reconhecido por equivalência ao item "Programa de gestão de riscos e integridade" da UGE — 20 pts Estratégico Central. Como o limite máximo por área é 20 pts, apenas um projeto contabiliza na UGE.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
