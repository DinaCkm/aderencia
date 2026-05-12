import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);

  if (req.method === 'GET') {
    const pending = participants.filter((item) => item.exceptionStatus === 'pending');
    return res.status(200).json({ pending });
  }

  if (req.method === 'POST') {
    const { id, action } = req.body as { id?: string; action?: 'approve' | 'reject' };
    if (!id || !action) return res.status(400).json({ error: 'ID e ação são obrigatórios.' });
    const index = participants.findIndex((item) => item.id === id);
    if (index < 0) return res.status(404).json({ error: 'Participante não encontrado.' });
    participants[index].exceptionStatus = action === 'approve' ? 'approved' : 'rejected';
    await writeJsonAsync('participants', participants);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
