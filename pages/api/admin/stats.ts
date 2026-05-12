import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const participants: any[] = readJson('participants', []);
  const performances: any[] = readJson('performance', []);
  const exceptions = participants.filter((p: any) => p.exceptionRequested && p.exceptionStatus === 'pending').length;
  const withResults = participants.filter((p: any) =>
    (p.selectedAreas || []).some((area: string) =>
      performances.some((perf: any) => perf.participantId === (p.id || p.email) && perf.area === area)
    )
  ).length;
  return res.status(200).json({ participants: participants.length, withResults, exceptions });
}
