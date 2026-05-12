import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { email } = req.query;
  const participants: any[] = await readJsonAsync('participants', []);
  const profile = participants.find((p: any) => p.id === email || p.email === email);
  return res.status(200).json({ profile: profile || null });
}
