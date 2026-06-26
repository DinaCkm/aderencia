import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';
import { CATALOG_ITEMS } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);

  if (req.method === 'GET') {
    const pending = participants.filter((item) => item.exceptionStatus === 'pending');
    const resolved = participants.filter((item) =>
      item.exceptionStatus === 'approved' || item.exceptionStatus === 'rejected'
    ).sort((a: any, b: any) => (b.exceptionResolvedAt || '').localeCompare(a.exceptionResolvedAt || ''));
    return res.status(200).json({ pending, resolved });
  }

  if (req.method === 'POST') {
    const { id, action, catalogLabel, catalogType, catalogArea } = req.body as {
      id?: string;
      action?: 'approve' | 'reject';
      catalogLabel?: string;
      catalogType?: 'pos-mba' | 'projeto';
      catalogArea?: string; // área para qual o projeto deve pontuar
    };
    if (!id || !action) return res.status(400).json({ error: 'ID e ação são obrigatórios.' });
    const index = participants.findIndex((item) => item.id === id);
    if (index < 0) return res.status(404).json({ error: 'Participante não encontrado.' });

    participants[index].exceptionStatus = action === 'approve' ? 'approved' : 'rejected';
    (participants[index] as any).exceptionResolvedAt = new Date().toISOString();
    if (catalogLabel) (participants[index] as any).exceptionCatalogLabel = catalogLabel;
    if (catalogType) (participants[index] as any).exceptionCatalogType = catalogType;

    // Se aprovado com vínculo ao catálogo, adiciona o label ao campo correto
    // e registra proofMode como 'ugp-knows' para que pontue automaticamente
    if (action === 'approve' && catalogLabel && catalogType) {
      if (catalogType === 'pos-mba') {
        const current = participants[index].postMBAs ?? [];
        if (!current.includes(catalogLabel)) {
          participants[index].postMBAs = [...current, catalogLabel];
        }
        // Registra comprovação como ugp-knows
        const mbaIdx = (participants[index].postMBAs ?? []).indexOf(catalogLabel);
        const mbaKey = `mba_${mbaIdx}:${catalogLabel}`;
        if (!participants[index].proofMode) participants[index].proofMode = {} as any;
        (participants[index].proofMode as any)[mbaKey] = 'ugp-knows';
      } else if (catalogType === 'projeto') {
        const current = participants[index].selectedProjects ?? [];
        if (!current.includes(catalogLabel)) {
          participants[index].selectedProjects = [...current, catalogLabel];
        }
        // Registra comprovação como ugp-knows
        if (!participants[index].proofMode) participants[index].proofMode = {} as any;
        (participants[index].proofMode as any)[`proj:${catalogLabel}`] = 'ugp-knows';
        // Vincula projeto à área selecionada pelo admin (ou área do catálogo como fallback)
        const catalogItem = CATALOG_ITEMS.find((i) => i.group === 'project' && i.label === catalogLabel);
        const areaToUse = catalogArea || catalogItem?.area;
        if (areaToUse) {
          if (!(participants[index] as any).projectAreaMap) (participants[index] as any).projectAreaMap = {};
          (participants[index] as any).projectAreaMap[catalogLabel] = areaToUse;
        }
        if (catalogArea) (participants[index] as any).exceptionCatalogArea = catalogArea;
      }
    }

    await writeJsonAsync('participants', participants);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
