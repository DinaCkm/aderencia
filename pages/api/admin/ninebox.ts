import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import type { AuditReport, ParticipantProfile, AreaAssessment, DiscReport, PerformanceRecord, DISCRecord } from '../../../lib/types';

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}
interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
}

// Estende AreaAssessment com campos de UI (nome, detalhes de cálculo e perfil completo para auditoria)
type AreaAssessmentWithMeta = AreaAssessment & {
  participantName: string;
  technicalScore: number;
  behavioralScore?: number;
  postMBADetail?: import('../../../lib/types').PostMBADetail;
  projectsDetail?: import('../../../lib/types').ProjectDetail[];
  calculationSteps: import('../../../lib/types').AssessmentCalculation[];
  profile: import('../../../lib/types').ParticipantProfile;
  discRecord?: DISCRecord;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discs = await readJsonAsync<DiscReport[]>('discReports', []);
  const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);
  const audits = await readJsonAsync<AuditReport[]>('audits', []);
  const profileAudits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);

  const report: Record<string, AreaAssessmentWithMeta[]> = {};

  for (const participant of participants) {
    const approvedExceptions =
      participant.exceptionStatus === 'approved'
        ? participant.postMBAs.concat(participant.selectedCourses, participant.selectedProjects)
        : [];
    // Itens marcados como Rejeitado pelo admin na Auditoria de Fichas — pontos retirados do cálculo
    const profileAudit = profileAudits.find((a) => a.participantId === participant.id);
    const rejectedItems = (profileAudit?.itemValidations || [])
      .filter((v) => v.status === 'rejected')
      .map((v) => ({ itemKey: v.itemKey, note: v.note }));
    // Observações de itens não rejeitados (pendente/validado) — para exibir na ficha mesmo sem exclusão de pontos
    const allItemNotes: Record<string, string> = {};
    (profileAudit?.itemValidations || []).forEach((v) => { if (v.note) allItemNotes[v.itemKey] = v.note; });
    const assessments = participant.selectedAreas.map((area) =>
      buildAreaAssessment(participant, area, performance, discs, approvedExceptions, rejectedItems, allItemNotes)
    );
    assessments.forEach((assessment) => {
      report[assessment.area] = report[assessment.area] || [];
      // Calcula scores para UI
      const techScore = assessment.technicalAdherence;
      const behavScore = assessment.behavioralAdherence;
      // Busca o DISCRecord mais recente do participante para esta área
      const discRecord = discRecords
        .filter((d) => d.participantId === participant.id && d.area === assessment.area)
        .sort((a, b) => b.importedAt.localeCompare(a.importedAt))[0];

      const enriched: AreaAssessmentWithMeta = {
        ...assessment,
        participantName: participant.name || participant.id,
        technicalScore: techScore,
        behavioralScore: behavScore,
        postMBADetail: assessment.postMBADetail,
        projectsDetail: assessment.projectsDetail,
        calculationSteps: assessment.calculationSteps,
        profile: participant,
        discRecord,
      };
      report[assessment.area].push(enriched);
    });

    const discDates = participant.selectedAreas.map((area) => {
      const discRecord = discs
        .filter((d) => d.participantId === participant.id && d.area === area)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return `${area}: ${discRecord?.date ?? 'sem relatório'}`;
    });
    const performanceDates = participant.selectedAreas.map((area) => {
      const perfRecord = performance
        .filter((p) => p.participantId === participant.id && p.area === area)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return `${area}: ${perfRecord?.date ?? 'sem importação'}`;
    });

    const audit: AuditReport = {
      id: participant.id,
      participantId: participant.id,
      createdAt: new Date().toISOString(),
      areaAssessments: assessments,
      inputSnapshot: participant,
      filesUsed: ['kv_store (PostgreSQL)'],
      rulesApplied: [
        'Entrada de performance em escala 0-100, convertida internamente para 0-10',
        'Relatório DISC em escala 0-10 (Nota DISC da área)',
        'Aderência Comportamental = média entre Nota DISC e Indicador de Performance convertido',
        'Aderência Técnica: Pós/MBA (3 pts) + Experiência gerencial/interina (até 4 pts) + Cursos/projetos estratégicos (até 3 pts), máximo 10',
        'Graduação registrada mas não entra na nota técnica',
        'Nine Box: Eixo X = Aderência Técnica, Eixo Y = Aderência Comportamental',
        'Exceções encaminhadas para validação do administrador',
        `Datas DISC mais recentes por área: ${discDates.join('; ')}`,
        `Performance importada por área: ${performanceDates.join('; ')}`
      ]
    };

    const existingAudit = audits.findIndex((item) => item.id === audit.id);
    if (existingAudit >= 0) {
      audits[existingAudit] = audit;
    } else {
      audits.push(audit);
    }
  }

  await writeJsonAsync('audits', audits);
  return res.status(200).json({ report });
}
