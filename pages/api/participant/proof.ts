import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync, saveProofFile } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

// PATCH /api/participant/proof
// Salva um único comprovante para um participante.
// O arquivo base64 vai para a tabela proof_files (separada do JSON de participants).
// Body: { email, itemKey, fileData?, mode }
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

  // Salvar arquivo na tabela proof_files separada (não no JSON gigante de participants)
  if (fileData && mode === 'upload') {
    try {
      await saveProofFile(email, itemKey, fileData);
    } catch (err) {
      console.error('[proof] Erro ao salvar na tabela proof_files:', err);
      return res.status(500).json({ error: 'Erro ao salvar arquivo.' });
    }
  }

  // Atualizar apenas proofMode no JSON de participants (sem base64)
  try {
    const rawParticipants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const participants: ParticipantProfile[] = Array.isArray(rawParticipants) ? rawParticipants : [];
    const idx = participants.findIndex((p) => p.id === email || p.email === email);

    if (idx >= 0) {
      const p = participants[idx];
      if (mode) {
        participants[idx] = {
          ...p,
          proofMode: { ...(p.proofMode || {}), [itemKey]: mode },
          // Não armazenar base64 no JSON de participants — fica na tabela proof_files
        };
        await writeJsonAsync('participants', participants);
      }
    }
    // Se participante não encontrado ainda: tudo bem, será criado no submit
  } catch (err) {
    console.error('[proof] Erro ao atualizar proofMode em participants:', err);
    // Não falhar — o arquivo já foi salvo na tabela proof_files
  }

  return res.status(200).json({ success: true });
}
