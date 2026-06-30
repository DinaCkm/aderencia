import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'valci.junior@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  p.exceptionRequested = true;
  p.exceptionStatus = 'approved';
  (p as any).exceptionCatalogLabel = 'Agenda de políticas públicas e representação institucional';
  (p as any).exceptionCatalogType = 'projeto';
  (p as any).exceptionCatalogArea = 'REGIONAIS';
  (p as any).exceptionApprovalJustification = 'Projeto reconhecido por equivalência ao item "Articulação regional e parcerias territoriais" do catálogo oficial das REGIONAIS. A atuação em unidades regionais do SEBRAE envolve forte componente de articulação política e representação institucional junto a prefeituras, associações comerciais e poder público local — atividade central da articulação regional. Classificado como Estratégico Central — 20 pts.';
  (p as any).exceptionResolvedAt = new Date().toISOString();

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Agenda de políticas públicas e representação institucional", vinculado pelo candidato à área REGIONAIS, foi reconhecido por equivalência ao item "Articulação regional e parcerias territoriais" do catálogo oficial — 20 pts Estratégico Central.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
