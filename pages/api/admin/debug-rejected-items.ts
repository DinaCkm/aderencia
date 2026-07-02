import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  validatedAt?: string;
}
interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);

  const results: any[] = [];
  for (const audit of audits) {
    const rejected = (audit.itemValidations || []).filter((v) => v.status === 'rejected');
    if (rejected.length === 0) continue;
    const p = participants.find((pp) => pp.id === audit.participantId);
    results.push({
      name: p?.name || audit.participantId,
      email: p?.email || null,
      selectedAreas: p?.selectedAreas || [],
      postMBAs: p?.postMBAs || [],
      selectedProjects: p?.selectedProjects || [],
      managerialMonths: p?.managerialMonths || 0,
      interimMonths: p?.interimMonths || 0,
      rejectedItems: rejected,
    });
  }

  return res.status(200).json({ total: results.length, results });
}
