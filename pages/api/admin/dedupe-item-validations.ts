import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { dedupeItemValidations, type ItemValidationLite } from '../../../lib/business';
import type { ParticipantProfile } from '../../../lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// LIMPEZA DE DADOS — remove registros duplicados/fantasmas em profile_audits.itemValidations
// ─────────────────────────────────────────────────────────────────────────────
// Runs anteriores da normalização legada (Fase 1, antes da correção com findIndex/replace
// em normalize-legacy-approvals.ts) chegaram a EMPILHAR (push) um segundo registro
// "approved" para itemKeys que já tinham uma decisão real e explícita do auditor (ex.: um
// "rejected" registrado antes). O motor de cálculo e as telas já foram corrigidos para
// deduplicar na LEITURA (dedupeItemValidations, mantendo o registro mais recente por
// validatedAt) — mas o registro fantasma continua fisicamente salvo no banco, o que é
// arriscado (qualquer código novo que ler o array bruto no futuro repete o bug) e também
// polui qualquer inspeção manual dos dados.
//
// Este endpoint aplica a MESMA regra de deduplicação diretamente sobre os dados gravados em
// profile_audits, removendo de vez os registros antigos supérfluos por itemKey.
//
// Idempotente: rodar de novo depois de aplicado não encontra mais nada para limpar.
//
// USO (só POST, nunca GET):
//   curl -X POST https://aderencia.ecodobem.com/api/admin/dedupe-item-validations \
//     -H "Authorization: Bearer <NORMALIZE_SECRET>"
//   → modo prévia (não grava nada, só mostra o que seria removido)
//
//   curl -X POST https://aderencia.ecodobem.com/api/admin/dedupe-item-validations \
//     -H "Authorization: Bearer <NORMALIZE_SECRET>" \
//     -H "Content-Type: application/json" \
//     -d '{"apply":true}'
//   → aplica de verdade
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidationLite[];
  overallStatus: 'provisional' | 'validated' | 'adjusted';
  [key: string]: any;
}

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
    totalAntes: number;
    totalDepois: number;
    itensRemovidos: { itemKey: string; status: string; note?: string; validatedAt?: string }[];
  }[] = [];

  let touchedCount = 0;

  for (const audit of audits) {
    const original = audit.itemValidations || [];
    const deduped = dedupeItemValidations(original);
    if (deduped.length === original.length) continue; // nada duplicado

    const profile = participants.find((p) => p.id === audit.participantId);
    const keptKeys = new Set(deduped.map((v) => v.itemKey));
    // Para reportar exatamente o que será removido: qualquer registro do array original
    // que não seja o mesmo objeto (por referência) sobrevivente para aquele itemKey.
    const removed = original.filter((v) => {
      const survivor = deduped.find((d) => d.itemKey === v.itemKey);
      return survivor !== v;
    });

    summary.push({
      participantId: audit.participantId,
      participantName: profile?.name || profile?.email || audit.participantId,
      totalAntes: original.length,
      totalDepois: deduped.length,
      itensRemovidos: removed.map((v) => ({ itemKey: v.itemKey, status: v.status, note: v.note, validatedAt: (v as any).validatedAt })),
    });
    touchedCount++;

    if (apply) {
      audit.itemValidations = deduped;
    }
  }

  if (apply && touchedCount > 0) {
    await writeJsonAsync('profile_audits', audits);
  }

  return res.status(200).json({
    mode: apply ? 'applied' : 'dry-run (nada foi gravado — envie {"apply": true} no corpo para aplicar de verdade)',
    totalFichasVerificadas: audits.length,
    fichasComDuplicatasEncontradas: touchedCount,
    detalhe: summary,
  });
}
