import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = readJson<ParticipantProfile[]>('participants', []);
  return res.status(200).json({ participants });
}
