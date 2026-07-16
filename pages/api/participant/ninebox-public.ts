import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import type { ParticipantProfile, DiscReport, PerformanceRecord } from '../../../lib/types';

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

  // Busca o participante logado para saber quais áreas ele selecionou
  const viewer = participants.find((p) => p.id === email || p.email === email);
  const allowedAreas: string[] = viewer?.selectedAreas ?? [];

  if (allowedAreas.length === 0) {
    return res.status(200).json({ report: {}, allowedAreas: [] });
  }

  // Monta o Nine Box apenas para as áreas de interesse do participante logado
  const report: Record<string, { name: string; quadrant: string; score: number }[]> = {};

  for (const participant of participants) {
    if (!participant.selectedAreas || participant.selectedAreas.length === 0) continue;

    participant.selectedAreas.forEach((area) => {
      // Só inclui áreas que o participante logado também selecionou
      if (!allowedAreas.includes(area)) return;

      const assessment = buildAreaAssessment(participant, area, performance, discs);
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
