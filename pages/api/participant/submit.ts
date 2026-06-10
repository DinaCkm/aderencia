import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body as ParticipantProfile;

  if (!data || !data.id || !data.email || !data.name) {
    return res.status(400).json({ error: 'Dados do participante incompletos.' });
  }

  // Nota: graduation e graduationCourseName sao dados complementares (nao entram na pontuacao).
  // Sao obrigatorios no formulario (validacao no frontend, Step 3), mas nao bloqueamos o submit
  // aqui para compatibilidade com registros importados via CSV (que podem nao ter esses campos)
  // e para evitar falsos 400 quando o rascunho for restaurado de uma sessao anterior.

  const rawParticipants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  // Garantir que participants seja sempre um array (proteção contra cache corrompido)
  const participants: ParticipantProfile[] = Array.isArray(rawParticipants) ? rawParticipants : [];
  const existingIndex = participants.findIndex((item) => item.id === data.id);

  // Se graduation e __outro__, marcar como excecao automaticamente
  const hasGraduationException = data.graduation === '__outro__';

  const profile: ParticipantProfile = {
    ...data,
    submittedAt: new Date().toISOString(),
    exceptionStatus: (data.exceptionRequested || hasGraduationException) ? 'pending' : 'approved',
  };

  if (existingIndex >= 0) {
    participants[existingIndex] = profile;
  } else {
    participants.push(profile);
  }

  await writeJsonAsync('participants', participants);
  return res.status(200).json({ success: true });
}
