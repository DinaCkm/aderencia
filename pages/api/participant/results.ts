import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import type { ParticipantProfile, PerformanceRecord, DiscReport } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'E-mail obrigatório.' });

  const participants: ParticipantProfile[] = await readJsonAsync('participants', []);
  const performances: PerformanceRecord[] = await readJsonAsync('performance', []);
  const discReports: DiscReport[] = await readJsonAsync('discReports', []);

  const participant = participants.find((p) => p.id === email || p.email === email);
  if (!participant) return res.status(200).json({ results: [] });

  const results = (participant.selectedAreas || []).map((area) => {
    const assessment = buildAreaAssessment(participant, area, performances, discReports);
    const steps = assessment.calculationSteps || [];
    const getStep = (name: string) => {
      const s = steps.find((st) => st.name.toLowerCase().includes(name.toLowerCase()));
      return s ? Number(s.value) : undefined;
    };
    return {
      area,
      technicalScore: assessment.technicalAdherence,
      behavioralScore: assessment.behavioralAdherence,
      totalScore: (assessment.technicalAdherence || 0) + (assessment.behavioralAdherence || 0),
      nineBoxClassification: assessment.quadrant,
      breakdown: {
        postMBA: getStep('pós') ?? getStep('mba') ?? getStep('post'),
        experience: getStep('experiência') ?? getStep('experience'),
        coursesProjects: getStep('curso') ?? getStep('course') ?? getStep('projeto') ?? getStep('project'),
        performance: assessment.performanceConverted,
        disc: assessment.discScore,
      },
      calculationSteps: steps,
    };
  });

  return res.status(200).json({ results });
}
