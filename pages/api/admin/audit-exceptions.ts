import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);

  const pending = participants
    .filter(p => p.exceptionRequested && p.exceptionStatus !== 'approved' && p.exceptionStatus !== 'rejected')
    .map(p => ({
      name: p.name,
      email: p.email,
      selectedAreas: p.selectedAreas,
      exceptionStatus: p.exceptionStatus,
      exceptionNote: (p as any).exceptionNote,
      exceptionRequestedAt: (p as any).exceptionRequestedAt,
    }));

  const approved = participants
    .filter(p => p.exceptionStatus === 'approved')
    .map(p => ({
      name: p.name,
      email: p.email,
      selectedAreas: p.selectedAreas,
      exceptionCatalogLabel: (p as any).exceptionCatalogLabel,
      exceptionCatalogArea: (p as any).exceptionCatalogArea,
      exceptionApprovalJustification: (p as any).exceptionApprovalJustification,
      exceptionResolvedAt: (p as any).exceptionResolvedAt,
    }));

  const rejected = participants
    .filter(p => p.exceptionStatus === 'rejected')
    .map(p => ({
      name: p.name,
      email: p.email,
      exceptionNote: (p as any).exceptionNote,
    }));

  return res.status(200).json({
    pending: { total: pending.length, candidates: pending },
    approved: { total: approved.length, candidates: approved },
    rejected: { total: rejected.length, candidates: rejected },
  });
}
