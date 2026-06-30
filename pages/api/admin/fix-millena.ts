import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'millena.rodrigues@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Corrige "Programa de sucessão" de REGIONAIS para UGP
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Programa de sucessão e desenvolvimento de lideranças': 'UGP',
  };

  // Registra exceção aprovada para "Gestão de parcerias estratégicas" por equivalência
  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionCatalogLabel = 'Gestão de parcerias estratégicas';
  (p as any).exceptionCatalogType = 'projeto';
  (p as any).exceptionCatalogArea = 'REGIONAIS';
  (p as any).exceptionApprovalJustification = 'Projeto reconhecido por equivalência ao item "Articulação regional e parcerias territoriais" do catálogo oficial das REGIONAIS. A candidata atua em contexto regional, e a gestão de parcerias estratégicas no âmbito de sua atuação tem natureza territorial, com aderência direta ao escopo do item do catálogo — classificado como Estratégico Central — 20 pts.';
  (p as any).exceptionResolvedAt = new Date().toISOString();

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Gestão de parcerias estratégicas" reconhecido por equivalência ao item "Articulação regional e parcerias territoriais" da área REGIONAIS, considerando a atuação territorial da candidata — 20 pts. (2) "Programa de sucessão e desenvolvimento de lideranças" corrigido de REGIONAIS para UGP, onde é reconhecido no catálogo oficial e a candidata também concorre — 20 pts.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
