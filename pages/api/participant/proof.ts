import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

// PATCH /api/participant/proof
// Salva um único comprovante (proofFile ou proofMode) para um participante já cadastrado
// Body: { email, itemKey, fileData?, fileName?, fileType?, mode? }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, itemKey, fileData, mode } = req.body as {
    email: string;
    itemKey: string;
    fileData?: string;
    mode?: 'ugp-knows' | 'upload';
  };

  if (!email || !itemKey) {
    return res.status(400).json({ error: 'email e itemKey são obrigatórios.' });
  }

  const rawParticipants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const participants: ParticipantProfile[] = Array.isArray(rawParticipants) ? rawParticipants : [];
  const idx = participants.findIndex((p) => p.id === email || p.email === email);

  if (idx < 0) {
    return res.status(404).json({ error: 'Participante não encontrado.' });
  }

  const participant = participants[idx];

  // Atualizar proofMode se fornecido
  if (mode) {
    participant.proofMode = { ...(participant.proofMode || {}), [itemKey]: mode };
  }

  // Atualizar proofFiles se fileData fornecido
  if (fileData) {
    participant.proofFiles = { ...(participant.proofFiles || {}), [itemKey]: fileData };
  }

  participants[idx] = participant;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true });
}
