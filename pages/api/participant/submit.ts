import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson, writeJson } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body as ParticipantProfile;
  if (!data || !data.id || !data.email || !data.name) {
    return res.status(400).json({ error: 'Dados do participante incompletos.' });
  }

  const participants = readJson<ParticipantProfile[]>('participants', []);
  const existingIndex = participants.findIndex((item) => item.id === data.id);
  const profile: ParticipantProfile = {
    ...data,
    submittedAt: new Date().toISOString(),
    exceptionStatus: data.exceptionRequested ? 'pending' : 'approved'
  };

  if (existingIndex >= 0) {
    participants[existingIndex] = profile;
  } else {
    participants.push(profile);
  }

  writeJson('participants', participants);
  return res.status(200).json({ success: true });
}
