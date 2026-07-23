import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { getPendingScorableItems } from '../../../lib/business';
import type { ParticipantProfile } from '../../../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ-REQUISITO DE SEGURANÇA — Fase 1 (nota confirmada vs. nota potencial)
// ─────────────────────────────────────────────────────────────────────────────
// Antes desta correção, o motor de cálculo contava qualquer item que NÃO estivesse
// explicitamente rejeitado — inclusive itens sem nenhum registro de decisão (que a UI já
// mostrava como "⏳ Pendente"). A nova regra (ativada só no SEGUNDO deploy da Fase 1) passa a
// exigir aprovação explícita para a nota CONFIRMADA (definitiva). Sem normalizar antes,
// qualquer ficha já concluída ("Validada" ou "Ajustada") que tenha item pontuável sem registro
// explícito de "approved" teria a nota reduzida no momento da ativação da nova regra — mesmo
// que a decisão tenha sido, na prática, "aceitar".
//
// Este endpoint identifica, para toda ficha JÁ CONCLUÍDA (overallStatus 'validated' ou
// 'adjusted'), os itens pontuáveis sem decisão explícita, e — só quando o corpo da requisição
// tiver {"apply": true} — grava um registro "approved" para cada um deles (equivalente ao
// comportamento antigo já em vigor para essas fichas). Fichas "provisional" NÃO são tocadas.
//
// Idempotente: rodar de novo depois de aplicado não encontra mais nada pendente nessas fichas.
//
// USO (só POST, nunca GET — evita segredo em histórico de navegador/logs de proxy):
//   curl -X POST https://aderencia.ecodobem.com/api/admin/normalize-legacy-approvals \
//     -H "Authorization: Bearer <NORMALIZE_SECRET>"
//   → modo prévia (não grava nada)
//
//   curl -X POST https://aderencia.ecodobem.com/api/admin/normalize-legacy-approvals \
//     -H "Authorization: Bearer <NORMALIZE_SECRET>" \
//     -H "Content-Type: application/json" \
//     -d '{"apply":true}'
//   → aplica de verdade
//
// LIMITAÇÃO CONHECIDA: este sistema não possui, hoje, nenhum mecanismo de sessão/login
// administrativa (nenhum endpoint admin tem autenticação — falha de segurança já registrada
// em sessões anteriores). Não é possível "validar a sessão administrativa já usada pelo
// sistema" porque ela não existe. O header Authorization com NORMALIZE_SECRET é a proteção
// disponível até que essa lacuna maior seja resolvida à parte. RECOMENDADO: depois de rodar a
// normalização com sucesso, excluir este arquivo do repositório (ou remover a variável
// NORMALIZE_SECRET do Railway) — ver roteiro de deploy.
// ─────────────────────────────────────────────────────────────────────────────

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  validatedAt?: string;
  validatedBy?: string;
}

interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
  overallStatus: 'provisional' | 'validated' | 'adjusted';
  overallNote?: string;
  auditedAt?: string;
  experienceOverride?: { managerialMonths?: number;
