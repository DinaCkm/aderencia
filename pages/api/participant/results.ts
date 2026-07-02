import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import type { ParticipantProfile, PerformanceRecord, DiscReport, DISCRecord } from '../../../lib/types';

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}
interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'E-mail obrigatório.' });

  const participants: ParticipantProfile[] = await readJsonAsync('participants', []);
  const performances: PerformanceRecord[] = await readJsonAsync('performance', []);
  const discReports: DiscReport[] = await readJsonAsync('discReports', []);
  const discRecords: DISCRecord[] = await readJsonAsync('disc_records', []);
  const profileAudits: ProfileAudit[] = await readJsonAsync('profile_audits', []);

  const participant = participants.find((p) => p.id === email || p.email === email);
  if (!participant) return res.status(200).json({ results: [] });

  // Itens marcados como Rejeitado pela UGP na Auditoria de Fichas — pontos retirados do cálculo
  const profileAudit = profileAudits.find((a) => a.participantId === participant.id);
  const rejectedItems = (profileAudit?.itemValidations || [])
    .filter((v) => v.status === 'rejected')
    .map((v) => ({ itemKey: v.itemKey, note: v.note }));

  const results = (participant.selectedAreas || []).map((area) => {
    const assessment = buildAreaAssessment(participant, area, performances, discReports, [], rejectedItems);
    const steps = assessment.calculationSteps || [];
    const getStep = (name: string) => {
      const s = steps.find((st) => st.name.toLowerCase().includes(name.toLowerCase()));
      return s ? Number(s.value) : undefined;
    };
    // Buscar dados DISC detalhados para esta área
    const discRecord = discRecords.find(
      (d) => (d.participantId === participant.id || d.participantId === participant.email) && d.area === area
    ) || null;

    return {
      area,
      technicalScore: assessment.technicalAdherence,
      behavioralScore: assessment.behavioralAdherence,
      totalScore: (assessment.technicalAdherence || 0) + (assessment.behavioralAdherence || 0),
      nineBoxClassification: assessment.quadrant,
      postMBADetail: assessment.postMBADetail,
      projectsDetail: assessment.projectsDetail,
      excludedItems: assessment.excludedItems || [],
      breakdown: {
        postMBA: getStep('pós') ?? getStep('mba') ?? getStep('post'),
        experience: getStep('experiência') ?? getStep('experience'),
        coursesProjects: getStep('curso') ?? getStep('course') ?? getStep('projeto') ?? getStep('project'),
        performance: assessment.performanceConverted,
        disc: assessment.discScore,
      },
      calculationSteps: steps,
      // Dados DISC detalhados (correlação, D/I/S/C, forças, desenvolvimentos)
      discDetail: discRecord ? {
        correlationPct: discRecord.correlationPct,
        personD: discRecord.personD,
        personI: discRecord.personI,
        personS: discRecord.personS,
        personC: discRecord.personC,
        jobD: discRecord.jobD,
        jobI: discRecord.jobI,
        jobS: discRecord.jobS,
        jobC: discRecord.jobC,
        strengths: discRecord.strengths,
        developments: discRecord.developments,
        importedAt: discRecord.importedAt,
      } : null,
    };
  });

  return res.status(200).json({ results });
}
