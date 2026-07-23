import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, loadProofFiles } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import { getEffectiveCatalogItems } from '../../../lib/catalog';
import type {
  AreaCode,
  ParticipantProfile,
  PerformanceRecord,
  DiscReport,
  DISCRecord,
  AreaAssessment,
} from '../../../lib/types';
import type { ProfileAudit } from './audit-profile';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email obrigatório' });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const profile = participants.find(
    (p) => p.email?.toLowerCase() === email.toLowerCase()
  );

  if (!profile) {
    return res.status(404).json({ error: 'Participante não encontrado' });
  }

  // Catálogo efetivo: itens fixos (código) + itens customizados criados pelo admin (banco de dados)
  const catalogItems = await getEffectiveCatalogItems();

  // Carregar arquivos de comprovante da tabela proof_files separada
  const proofFilesFromDB = await loadProofFiles(profile.email || profile.id);
  const mergedProofFiles = {
    ...(profile.proofFiles || {}),
    ...proofFilesFromDB,
  };
  const profileWithFiles = { ...profile, proofFiles: mergedProofFiles };

  // Calcular aderência por área
  const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discs = await readJsonAsync<DiscReport[]>('discReports', []);
  const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);

  // Carregar validações de auditoria por item — itens rejeitados pela UGP não pontuam
  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const audit = audits.find((a) => a.participantId === profile.id) || {
    participantId: profile.id,
    itemValidations: [],
    overallStatus: profile.validationStatus || 'provisional',
    overallNote: profile.validationNote,
  };
  const rejectedItems = (audit.itemValidations || [])
    .filter((v) => v.status === 'rejected')
    .map((v) => ({ itemKey: v.itemKey, note: v.note }));
  // Observações de itens não rejeitados (pendente/validado) — para exibir na ficha mesmo sem exclusão de pontos
  const allItemNotes: Record<string, string> = {};
  (audit.itemValidations || []).forEach((v) => { if (v.note) allItemNotes[v.itemKey] = v.note; });
  const experienceOverride = (audit as any).experienceOverride;
  const projectRelabels = (audit as any).projectRelabels || {};
  const exceptionAssignments = (audit as any).exceptionAssignments || {};

  // ── Classificação (ranking) por área — mesmo critério do Nine Box do admin:
  //    ordena por (Aderência Técnica + Comportamental) desc entre TODOS que selecionaram a área.
  // IMPORTANTE: antes desta correção, o ranking calculava a nota de CADA OUTRO candidato
  // usando apenas os itens rejeitados e as exceções dele, mas ignorava ajustes manuais de
  // experiência (experienceOverride) e reclassificação de projeto (projectRelabels) já feitos
  // pela auditoria — só a ficha individual (linha abaixo) usava esses ajustes. Isso podia
  // fazer um candidato ter nota correta na própria ficha, mas ser comparado no ranking com
  // uma versão desatualizada (não auditada) de outro candidato. Corrigido para usar
  // exatamente os mesmos ajustes auditados de cada participante, incluindo itemValidations
  // (necessário também para a nota confirmada não contar itens pendentes de ninguém no ranking).
  const rankInArea = (area: AreaCode): { rank: number | null; total: number } => {
    const scored = participants
      .filter((pp) => (pp.selectedAreas || []).includes(area))
      .map((pp) => {
        const ppAudit = audits.find((a) => a.participantId === pp.id);
        const ppRejected = (ppAudit?.itemValidations || [])
          .filter((v) => v.status === 'rejected')
          .map((v) => ({ itemKey: v.itemKey, note: v.note }));
        const ppAllItemNotes: Record<string, string> = {};
        (ppAudit?.itemValidations || []).forEach((v) => { if (v.note) ppAllItemNotes[v.itemKey] = v.note; });
        const ppExceptionAssignments = (ppAudit as any)?.exceptionAssignments || {};
        const ppExperienceOverride = (ppAudit as any)?.experienceOverride;
        const ppProjectRelabels = (ppAudit as any)?.projectRelabels || {};
        const a = buildAreaAssessment(pp, area, performance, discs, ppExceptionAssignments, ppRejected, ppAllItemNotes, ppExperienceOverride, ppProjectRelabels, catalogItems, ppAudit?.itemValidations || []);
        return { id: pp.id, score: (a.technicalAdherence || 0) + (a.behavioralAdherence || 0) };
      })
      .sort((x, y) => y.score - x.score);
    const idx = scored.findIndex((s) => s.id === profile.id);
    return { rank: idx >= 0 ? idx + 1 : null, total: scored.length };
  };

  const areaAssessments = (profile.selectedAreas || []).map((area) => {
    const assessment = buildAreaAssessment(profile, area, performance, discs, exceptionAssignments, rejectedItems, allItemNotes, experienceOverride, projectRelabels, catalogItems, audit.itemValidations || []);
    const discRecord = discRecords
      .filter((d) => d.participantId === profile.id && d.area === area)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt))[0];
    const { rank, total } = rankInArea(area);
    return {
      ...assessment,
      discRecord: discRecord || null,
      rank,
      totalInArea: total,
    };
  });

  return res.status(200).json({
    profile: profileWithFiles,
    areaAssessments,
    audit,
  });
}
