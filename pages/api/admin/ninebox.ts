import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson, writeJson } from '../../../lib/db';
import { OFFICIAL_AREAS } from '../../../lib/constants';
import { buildAreaAssessment } from '../../../lib/business';
import type { AuditReport, ParticipantProfile, AreaAssessment, DiscReport, PerformanceRecord } from '../../../lib/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = readJson<ParticipantProfile[]>('participants', []);
  const performance = readJson<PerformanceRecord[]>('performance', []);
  const discs = readJson<DiscReport[]>('discReports', []);
  const audits = readJson<AuditReport[]>('audits', []);

  const report: Record<string, AreaAssessment[]> = {};

  for (const participant of participants) {
    const approvedExceptions = participant.exceptionStatus === 'approved' ? participant.postMBAs.concat(participant.selectedCourses, participant.selectedProjects) : [];
    const assessments = participant.selectedAreas.map((area) => buildAreaAssessment(participant, area, performance, discs, approvedExceptions));
    assessments.forEach((assessment) => {
      report[assessment.area] = report[assessment.area] || [];
      report[assessment.area].push(assessment);
    });

    // Collect detailed audit information
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
      filesUsed: ['performance.json', 'discReports.json', 'catalogs.json'],
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

  writeJson('audits', audits);
  return res.status(200).json({ report });
}
