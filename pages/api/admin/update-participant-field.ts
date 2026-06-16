import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

/**
 * PATCH /api/admin/update-participant-field
 * Permite que o admin atualize campos específicos do perfil de um participante.
 * Body: { participantId: string, field: string, value: any }
 * Campos permitidos: projectAreaMap
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { participantId, field, value } = req.body as {
    participantId: string;
    field: string;
    value: any;
  };

  if (!participantId || !field) {
    return res.status(400).json({ error: 'participantId e field são obrigatórios' });
  }

  // Campos que o admin tem permissão de atualizar
  const ALLOWED_FIELDS = ['projectAreaMap'];
  if (!ALLOWED_FIELDS.includes(field)) {
    return res.status(403).json({ error: `Campo "${field}" não pode ser atualizado pelo admin` });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const idx = participants.findIndex((p) => p.id === participantId);

  if (idx < 0) {
    return res.status(404).json({ error: 'Participante não encontrado' });
  }

  (participants[idx] as any)[field] = value;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, [field]: value });
}
