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
  experienceOverride?: { managerialMonths?: number; interimMonths?: number; note?: string; adjustedAt?: string };
  projectRelabels?: Record<string, string>;
  exceptionAssignments?: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }>;
}

const FINAL_STATUSES = ['validated', 'adjusted'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST com header Authorization: Bearer <NORMALIZE_SECRET>.' });
  }

  const secretConfigured = process.env.NORMALIZE_SECRET;
  if (!secretConfigured) {
    return res.status(403).json({ error: 'Endpoint desabilitado: variável de ambiente NORMALIZE_SECRET não configurada no Railway.' });
  }
  const authHeader = req.headers.authorization || '';
  const providedSecret = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (providedSecret !== secretConfigured) {
    return res.status(403).json({ error: 'Não autorizado. Envie o header "Authorization: Bearer <NORMALIZE_SECRET>".' });
  }

  const apply = req.body?.apply === true;

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);

  const summary: {
    participantId: string;
    participantName: string;
    overallStatus: string;
    backfilledItems: { itemKey: string; type: string; label: string }[];
  }[] = [];

  let touchedCount = 0;

  for (const audit of audits) {
    if (!(FINAL_STATUSES as readonly string[]).includes(audit.overallStatus)) continue;

    const profile = participants.find((p) => p.id === audit.participantId);
    if (!profile) continue; // participante removido/órfão — nada a normalizar

    const pending = getPendingScorableItems(profile, audit.itemValidations || [], audit.exceptionAssignments || {});
    if (pending.length === 0) continue;

    summary.push({
      participantId: audit.participantId,
      participantName: profile.name || profile.email || audit.participantId,
      overallStatus: audit.overallStatus,
      backfilledItems: pending.map((p) => ({ itemKey: p.itemKey, type: p.type, label: p.label })),
    });
    touchedCount++;

    if (apply) {
      const now = new Date().toISOString();
      for (const p of pending) {
        audit.itemValidations = audit.itemValidations || [];
        audit.itemValidations.push({
          itemKey: p.itemKey,
          status: 'approved',
          note: 'Normalizado automaticamente — ficha já concluída antes da separação entre nota confirmada e potencial (item nunca teve decisão explícita registrada, mas contava normalmente sob a regra antiga).',
          validatedAt: now,
        });
      }
    }
  }

  if (apply && touchedCount > 0) {
    await writeJsonAsync('profile_audits', audits);
  }

  return res.status(200).json({
    mode: apply ? 'applied' : 'dry-run (nada foi gravado — envie {"apply": true} no corpo para aplicar de verdade)',
    totalFichasConclusivasVerificadas: audits.filter((a) => (FINAL_STATUSES as readonly string[]).includes(a.overallStatus)).length,
    fichasComItensNormalizados: touchedCount,
    detalhe: summary,
  });
}
