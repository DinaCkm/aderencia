import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'gilzane.pereira@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Move "Articulação estratégica Conselho-Diretoria" de URI para UGE
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Articulação estratégica Conselho-Diretoria': 'UGE',
  };

  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionCatalogLabel = 'Articulação estratégica Conselho-Diretoria';
  (p as any).exceptionCatalogType = 'projeto';
  (p as any).exceptionCatalogArea = 'UGE';
  (p as any).exceptionApprovalJustification = 'Projeto reconhecido por equivalência ao item "Desdobramento do planejamento estratégico" do catálogo oficial da UGE. A articulação entre Conselho e Diretoria envolve alinhamento estratégico entre instâncias de governança, atividade aderente ao processo de desdobramento e articulação da estratégia organizacional. Classificado como Estratégico Central — 20 pts.';
  (p as any).exceptionResolvedAt = new Date().toISOString();

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Articulação estratégica Conselho-Diretoria" estava vinculado à área URI, onde não pontuava (área já no limite máximo com outros dois projetos, e o catálogo reconhece este projeto para o CDE). Após análise de aderência, o projeto foi reconhecido por equivalência ao item "Desdobramento do planejamento estratégico" da UGE — 20 pts Estratégico Central, área que a candidata também concorre.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
