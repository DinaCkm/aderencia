import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync, saveProofFile } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';
import type { ProcessConfig } from '../admin/process-config';

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

  // Verificar se o processo está encerrado — bloquear alterações de conteúdo
  const processConfig = await readJsonAsync<ProcessConfig>('process_config', { processClosed: false });
  if (processConfig.processClosed) {
    return res.status(403).json({
      error: 'O prazo de inscrição foi encerrado. Não é mais possível alterar os dados do formulário.',
      processClosed: true,
    });
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
  const existing = existingIndex >= 0 ? (participants[existingIndex] as any) : undefined;

  // Se graduation é __outro__, marcar como exceção automaticamente
  const hasGraduationException = data.graduation === '__outro__';
  const exceptionBeingRequested = data.exceptionRequested || hasGraduationException;

  // Se a exceção já foi analisada pelo admin (aprovada ou rejeitada) anteriormente,
  // uma resubmissão do formulário (ex: o participante editando outro campo qualquer)
  // NÃO deve reverter essa decisão de volta para "pending". Sem isso, qualquer novo
  // salvamento do formulário apaga silenciosamente o trabalho de análise da UGP.
  const existingResolved = existing && (existing.exceptionStatus === 'approved' || existing.exceptionStatus === 'rejected');

  let exceptionStatus: ParticipantProfile['exceptionStatus'];
  if (!exceptionBeingRequested) {
    exceptionStatus = 'approved'; // nenhuma exceção pendente de revisão
  } else if (existingResolved) {
    exceptionStatus = existing.exceptionStatus; // preserva decisão já tomada
  } else {
    exceptionStatus = 'pending';
  }

  const profile: ParticipantProfile = {
    ...data,
    proofFiles: cleanProofFiles, // sem base64 — arquivos estão na tabela proof_files
    submittedAt: new Date().toISOString(),
    exceptionStatus,
    // Preserva os campos de decisão do admin mesmo que o payload do cliente não os inclua
    ...(existingResolved ? {
      exceptionResolvedAt: (data as any).exceptionResolvedAt ?? existing.exceptionResolvedAt,
      exceptionCatalogLabel: (data as any).exceptionCatalogLabel ?? existing.exceptionCatalogLabel,
      exceptionCatalogType: (data as any).exceptionCatalogType ?? existing.exceptionCatalogType,
      exceptionCatalogArea: (data as any).exceptionCatalogArea ?? existing.exceptionCatalogArea,
      exceptionApprovalJustification: (data as any).exceptionApprovalJustification ?? existing.exceptionApprovalJustification,
    } as any : {}),
  };

  if (existingIndex >= 0) {
    participants[existingIndex] = profile;
  } else {
    participants.push(profile);
  }

  await writeJsonAsync('participants', participants);
  return res.status(200).json({ success: true });
}
