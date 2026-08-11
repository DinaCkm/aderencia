import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile, AreaCode } from '../../../lib/types';

// Códigos de área válidos (mesma lista de lib/constants.ts::OFFICIAL_AREAS) — mantido em
// duplicata simples aqui para não puxar o array inteiro de labels; validação é só de segurança.
const VALID_AREA_CODES = [
  'DIREX', 'DITEC', 'DAF', 'CDE',
  'UAC', 'UAF', 'UAUD', 'UGE', 'UGOC', 'UGP', 'UMC', 'URC', 'URI', 'UTIC',
  'REGIONAIS',
];

// ─────────────────────────────────────────────────────────────────────────────
// CORREÇÃO ADMINISTRATIVA — Áreas de Interesse do candidato
// ─────────────────────────────────────────────────────────────────────────────
// O cadastro de "áreas de interesse" (`selectedAreas`) é preenchido pelo próprio candidato no
// formulário e não tinha, até aqui, nenhuma tela administrativa para correção — apesar de ser
// um campo crítico: todo o cálculo de pontuação de projetos depende dele (um projeto só pontua
// numa área se essa área estiver no `selectedAreas` do candidato — ver lib/business.ts).
// Quando há divergência entre o que o candidato realmente pretendia selecionar e o que ficou
// gravado (erro de clique, campos parecidos, etc.), os projetos dela ficam "órfãos" — vinculados
// pelo admin a uma área que não está no cadastro, e por isso não pontuam.
//
// Este endpoint permite ao admin corrigir diretamente o `selectedAreas` do candidato, e registra
// a correção como nota administrativa na ficha (mesmo padrão já usado manualmente em casos como
// o da Admary Monteiro Barbosa — texto "📋 NOTA ADMINISTRATIVA: ...").
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileAudit {
  participantId: string;
  overallNote?: string;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST.' });
  }

  const { participantId, selectedAreas, reason } = req.body as {
    participantId?: string;
    selectedAreas?: string[];
    reason?: string;
  };

  if (!participantId) {
    return res.status(400).json({ error: 'participantId é obrigatório.' });
  }
  if (!Array.isArray(selectedAreas) || selectedAreas.length === 0) {
    return res.status(400).json({ error: 'selectedAreas deve ser uma lista com pelo menos uma área.' });
  }
  const invalid = selectedAreas.filter((a) => !VALID_AREA_CODES.includes(a));
  if (invalid.length > 0) {
    return res.status(400).json({ error: `Código(s) de área inválido(s): ${invalid.join(', ')}` });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const list = Array.isArray(participants) ? participants : [];
  const idx = list.findIndex((p) => p.id === participantId);
  if (idx < 0) {
    return res.status(404).json({ error: 'Candidato não encontrado.' });
  }

  const before = list[idx].selectedAreas || [];
  const beforeLabel = before.join(', ') || '(nenhuma)';
  const afterLabel = selectedAreas.join(', ');

  list[idx] = { ...list[idx], selectedAreas: selectedAreas as AreaCode[] };
  await writeJsonAsync('participants', list);

  // Registra a correção como nota administrativa na ficha de auditoria, para transparência
  // e rastreabilidade (mesmo padrão já usado manualmente em correções anteriores).
  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const auditsList = Array.isArray(audits) ? audits : [];
  const auditIdx = auditsList.findIndex((a) => a.participantId === participantId);
  const today = new Date().toLocaleDateString('pt-BR');
  const correctionNote = `📋 NOTA ADMINISTRATIVA (${today}): Área(s) de interesse corrigida(s) de "${beforeLabel}" para "${afterLabel}"${reason ? ` — ${reason}` : ''}.`;

  if (auditIdx >= 0) {
    const existingNote = auditsList[auditIdx].overallNote || '';
    auditsList[auditIdx] = {
      ...auditsList[auditIdx],
      overallNote: existingNote ? `${existingNote}\n\n${correctionNote}` : correctionNote,
    };
  } else {
    auditsList.push({ participantId, itemValidations: [], overallStatus: 'provisional', overallNote: correctionNote } as ProfileAudit);
  }
  await writeJsonAsync('profile_audits', auditsList);

  return res.status(200).json({
    message: 'Áreas de interesse atualizadas com sucesso.',
    before,
    after: selectedAreas,
    correctionNote,
  });
}
