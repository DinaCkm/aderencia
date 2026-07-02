import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';
import { CATALOG_ITEMS } from '../../../lib/constants';

// Endpoint temporário — registra a aprovação da exceção de Aldeni Batista Torres.
// Reconhecimento por equivalência: participação nos Comitês GCO e PEP pela Regional
// Médio Norte → "Gestão de equipes e operações regionais" (REGIONAIS) — 15 pts Complementar.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const idx = participants.findIndex(
    (p) => (p.email || '').toLowerCase() === 'aldeni.torres@to.sebrae.com.br'
  );
  if (idx < 0) return res.status(404).json({ error: 'Participante não encontrado' });

  const p = participants[idx] as any;

  const catalogLabel = 'Gestão de equipes e operações regionais';
  const catalogArea = 'REGIONAIS';
  const catalogItem = CATALOG_ITEMS.find(
    (i) => i.group === 'project' && i.label === catalogLabel && i.area === catalogArea
  );
  if (!catalogItem) return res.status(500).json({ error: 'Item de catálogo não encontrado' });

  const justification =
    'Exceção aprovada. A candidata atua nos Comitês GCO (Gestão e Controle Operacional) e PEP ' +
    '(Planejamento Estratégico Participativo) pela Regional Médio Norte, atuação reconhecida por ' +
    'equivalência ao item "Gestão de equipes e operações regionais" do catálogo oficial das REGIONAIS, ' +
    'considerando que a participação em comitês de gestão e planejamento regional integra diretamente ' +
    'o escopo de gestão de equipes e operações no âmbito regional. Classificado como Complementar — 15 pts.';

  p.exceptionStatus = 'approved';
  p.exceptionResolvedAt = new Date().toISOString();
  p.exceptionCatalogLabel = catalogLabel;
  p.exceptionCatalogType = 'projeto';
  p.exceptionCatalogArea = catalogArea;
  p.exceptionApprovalJustification = justification;

  const current: string[] = p.selectedProjects ?? [];
  if (!current.includes(catalogLabel)) {
    p.selectedProjects = [...current, catalogLabel];
  }
  if (!p.proofMode) p.proofMode = {};
  p.proofMode[`proj:${catalogLabel}`] = 'ugp-knows';
  if (!p.projectAreaMap) p.projectAreaMap = {};
  p.projectAreaMap[catalogLabel] = catalogArea;

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, exceptionApprovalJustification: justification });
}
