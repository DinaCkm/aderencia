import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import { getEffectiveCatalogItems } from '../../../lib/catalog';
import type { ParticipantProfile, DiscReport, PerformanceRecord } from '../../../lib/types';

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}
interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
  experienceOverride?: { managerialMonths?: number; interimMonths?: number; note?: string };
  projectRelabels?: Record<string, string>;
  exceptionAssignments?: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }>;
}

// Retorna apenas nome, área e quadrante — sem notas, para exibição pública entre participantes
// Filtra pelas áreas de interesse do participante logado (passado via query ?email=)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email obrigatório' });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discs = await readJsonAsync<DiscReport[]>('discReports', []);
  // IMPORTANTE: antes desta correção, este endpoint não carregava a auditoria de NINGUÉM —
  // toda a classificação pública (quadrante/ordenação) era calculada com dados brutos
  // autodeclarados, ignorando rejeições, ajustes de experiência e reclassificações já feitos
  // pela auditoria. Isso é o mesmo problema já identificado no ranking de employee-profile.ts,
  // aplicado aqui também. Corrigido carregando profile_audits para cada participante.
  const profileAudits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);

  // Busca o participante logado para saber quais áreas ele selecionou
  const viewer = participants.find((p) => p.id === email || p.email === email);
  const allowedAreas: string[] = viewer?.selectedAreas ?? [];

  if (allowedAreas.length === 0) {
    return res.status(200).json({ report: {}, allowedAreas: [] });
  }

  // Monta o Nine Box apenas para as áreas de interesse do participante logado
  const report: Record<string, { name: string; quadrant: string; score: number }[]> = {};
  // Catálogo efetivo: itens fixos (código) + itens customizados criados pelo admin (banco de dados)
  const catalogItems = await getEffectiveCatalogItems();

  for (const participant of participants) {
    if (!participant.selectedAreas || participant.selectedAreas.length === 0) continue;

    const ppAudit = profileAudits.find((a) => a.participantId === participant.id);
    const ppRejected = (ppAudit?.itemValidations || [])
      .filter((v) => v.status === 'rejected')
      .map((v) => ({ itemKey: v.itemKey, note: v.note }));
    const ppExceptionAssignments = ppAudit?.exceptionAssignments || {};
    const ppExperienceOverride = ppAudit?.experienceOverride;
    const ppProjectRelabels = ppAudit?.projectRelabels || {};
    const ppItemValidations = ppAudit?.itemValidations || [];

    participant.selectedAreas.forEach((area) => {
      // Só inclui áreas que o participante logado também selecionou
      if (!allowedAreas.includes(area)) return;

      const assessment = buildAreaAssessment(participant, area, performance, discs, ppExceptionAssignments, ppRejected, {}, ppExperienceOverride, ppProjectRelabels, catalogItems, ppItemValidations);
      if (!assessment) return;

      report[area] = report[area] || [];
      report[area].push({
        name: participant.name || participant.id,
        quadrant: assessment.quadrant || 'Dados incompletos para definição do quadrante',
        score: (assessment.technicalAdherence || 0) + (assessment.behavioralAdherence || 0),
      });
    });
  }

  // Ordena por soma (Aderência Técnica + Comportamental) desc — mesmo critério do Nine Box do admin.
  // Desempate alfabético. O 'score' é usado só para ordenar e NÃO é enviado ao cliente (notas continuam ocultas).
  const publicReport: Record<string, { name: string; quadrant: string }[]> = {};
  for (const area of Object.keys(report)) {
    publicReport[area] = report[area]
      .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name, 'pt-BR'))
      .map(({ name, quadrant }) => ({ name, quadrant }));
  }

  return res.status(200).json({ report: publicReport, allowedAreas });
}
