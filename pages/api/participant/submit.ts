import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body as ParticipantProfile;

  if (!data || !data.id || !data.email || !data.name) {
    return res.status(400).json({ error: 'Dados do participante incompletos.' });
  }

  // Validar campos obrigatorios da formacao academica
  if (!data.graduation) {
    return res.status(400).json({ message: 'Selecione a area da sua graduacao.' });
  }
  if (!data.graduationCourseName?.trim()) {
    return res.status(400).json({ message: 'Informe o nome completo do curso de graduacao.' });
  }
  if (data.graduation === '__outro__' && !data.graduationException?.trim()) {
    return res.status(400).json({ message: 'Preencha o campo de excecao com o nome e descricao do seu curso.' });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const existingIndex = participants.findIndex((item) => item.id === data.id);

  // Se graduation e __outro__, marcar como excecao automaticamente
  const hasGraduationException = data.graduation === '__outro__';

  const profile: ParticipantProfile = {
    ...data,
    submittedAt: new Date().toISOString(),
    exceptionStatus: (data.exceptionRequested || hasGraduationException) ? 'pending' : 'approved'
  };

  if (existingIndex >= 0) {
    participants[existingIndex] = profile;
  } else {
    participants.push(profile);
  }

  await writeJsonAsync('participants', participants);
  return res.status(200).json({ success: true });
}
