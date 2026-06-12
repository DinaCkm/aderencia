import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync, saveProofFile } from '../../../lib/db';
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

  // Extrair arquivos base64 do proofFiles antes de salvar no JSON de participants.
  // Os arquivos ficam na tabela proof_files separada para não inflar o JSON.
  const proofFilesFromPayload = data.proofFiles || {};
  const cleanProofFiles: Record<string, string> = {};

  for (const [itemKey, fileData] of Object.entries(proofFilesFromPayload)) {
    if (!fileData) continue;
    const isBase64 = fileData.startsWith('data:') || fileData.length > 100;
    if (isBase64) {
      // Salvar na tabela proof_files separada
      try {
        await saveProofFile(data.email, itemKey, fileData);
      } catch (err) {
        console.error(`[submit] Erro ao salvar proof_file ${data.email}/${itemKey}:`, err);
      }
      // Não incluir no JSON de participants
    } else {
      // Arquivo legado (apenas nome) — manter no JSON para referência
      cleanProofFiles[itemKey] = fileData;
    }
  }

  const rawParticipants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  // Garantir que participants seja sempre um array
  const participants: ParticipantProfile[] = Array.isArray(rawParticipants) ? rawParticipants : [];
  const existingIndex = participants.findIndex((item) => item.id === data.id);

  // Se graduation é __outro__, marcar como exceção automaticamente
  const hasGraduationException = data.graduation === '__outro__';

  const profile: ParticipantProfile = {
    ...data,
    proofFiles: cleanProofFiles, // sem base64 — arquivos estão na tabela proof_files
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
