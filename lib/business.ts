import { CATALOG_ITEMS } from './constants';
import { readJson } from './db';
import type { AreaAssessment, ParticipantProfile, PerformanceRecord, DiscReport } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function pickLatest<T extends { date: string }>(items: T[]): T | undefined {
  return items.reduce((latest, item) => {
    if (!latest) return item;
    return item.date > latest.date ? item : latest;
  }, undefined as T | undefined);
}

export function convertPerformance(score100: number): number {
  const normalized = Math.max(0, Math.min(100, score100));
  return Math.round((normalized / 10) * 10) / 10;
}

export function getLatestDisc(reports: DiscReport[], participantId: string, area: string) {
  return pickLatest(reports.filter((r) => r.participantId === participantId && r.area === area));
}

export function getLatestPerformance(records: PerformanceRecord[], participantId: string, area: string) {
  return pickLatest(records.filter((r) => r.participantId === participantId && r.area === area));
}

// ─────────────────────────────────────────────────────────────────────────────
// Aderência Técnica — escala 0–80 → convertida para 0–10
//
// Componentes:
//   1. Pós/MBA  — melhor título para a área (máx. 40 pts)
//      Transversal prioritária = 40 | Específica da área = 20 | Não relacionada = 20
//   2. Experiência gerencial/interina — 5 pts/ano (máx. 20 pts)
//   3. Projetos estratégicos da área — soma dos pontos do catálogo (máx. 20 pts)
//
// Graduação e cursos extracurriculares: registrados mas NÃO entram na nota.
// ─────────────────────────────────────────────────────────────────────────────

function bestPostMBAScore(postMBALabels: string[], area: string): number {
  // Filtra itens do catálogo que correspondem aos títulos informados E são válidos para a área
  const candidates = CATALOG_ITEMS.filter(
    (i) =>
      i.group === 'postMBA' &&
      postMBALabels.includes(i.label) &&
      (!i.area || i.area === area)
  );

  if (candidates.length === 0) {
    // Nenhum título reconhecido → pontuação mínima (não relacionada = 20)
    return postMBALabels.length > 0 ? 20 : 0;
  }

  // Retorna a maior pontuação entre os títulos válidos para a área
  return Math.max(...candidates.map((i) => (i as any).points ?? 20));
}

function experienceScore(managerialMonths: number, interimMonths: number): number {
  const totalMonths = (managerialMonths ?? 0) + (interimMonths ?? 0);
  const years = totalMonths / 12;
  // 5 pts por ano completo, máximo 20 pts
  return Math.min(20, Math.floor(years * 5 * 10) / 10);
}

function projectScore(selectedProjects: string[], area: string): number {
  const items = CATALOG_ITEMS.filter(
    (i) =>
      i.group === 'project' &&
      selectedProjects.includes(i.label) &&
      i.area === area
  );
  const total = items.reduce((acc, i) => acc + ((i as any).points ?? 15), 0);
  return Math.min(20, total);
}

function computeTechnicalAdherence(
  profile: ParticipantProfile,
  area: string
): {
  technicalAdherence: number;
  calculationSteps: { name: string; value: number | string; detail?: string }[];
} {
  const postMBAScore = bestPostMBAScore(profile.postMBAs ?? [], area);
  const expScore = experienceScore(profile.managerialMonths ?? 0, profile.interimMonths ?? 0);
  const projScore = projectScore(profile.selectedProjects ?? [], area);

  const total80 = postMBAScore + expScore + projScore;
  const score10 = Math.round((total80 / 80) * 100) / 10; // 1 casa decimal, escala 0–10

  const managerialMonths = profile.managerialMonths ?? 0;
  const interimMonths = profile.interimMonths ?? 0;

  return {
    technicalAdherence: score10,
    calculationSteps: [
      {
        name: 'Pós/MBA (melhor título para a área)',
        value: postMBAScore,
        detail: `${profile.postMBAs?.length ?? 0} título(s) informado(s) — máx. 40 pts`,
      },
      {
        name: 'Experiência gerencial/interina',
        value: Math.round(expScore * 10) / 10,
        detail: `Gerencial: ${managerialMonths}m + Interino: ${interimMonths}m = ${managerialMonths + interimMonths}m totais (5 pts/ano, máx. 20)`,
      },
      {
        name: 'Projetos estratégicos da área',
        value: projScore,
        detail: `${(profile.selectedProjects ?? []).length} projeto(s) selecionado(s) — máx. 20 pts`,
      },
      {
        name: 'Total bruto (0–80)',
        value: total80,
        detail: `Convertido para escala 0–10: ${score10}`,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Nine Box
// ─────────────────────────────────────────────────────────────────────────────

const NINE_BOX_QUADRANTS: { x: 'low' | 'mid' | 'high'; y: 'low' | 'mid' | 'high'; label: string }[] = [
  { x: 'high', y: 'high', label: 'Alta Prontidão' },
  { x: 'mid',  y: 'high', label: 'Pronto em Desenvolvimento' },
  { x: 'low',  y: 'high', label: 'Potencial de Curto Prazo (gap técnico)' },
  { x: 'high', y: 'mid',  label: 'Destaque Técnico, lapidar liderança' },
  { x: 'mid',  y: 'mid',  label: 'Potencial de Médio Prazo' },
  { x: 'low',  y: 'mid',  label: 'Desenvolvimento Direcionado' },
  { x: 'high', y: 'low',  label: 'Risco de Liderança' },
  { x: 'mid',  y: 'low',  label: 'Especialista Técnico sem Perfil de Liderança' },
  { x: 'low',  y: 'low',  label: 'Baixa Aderência' },
];

function getQuadrant(technical: number, behavioral: number): string {
  // Faixas: Baixa = 0–4,9 | Média = 5,0–7,4 | Alta = 7,5–10
  const x: 'low' | 'mid' | 'high' = technical < 5 ? 'low' : technical < 7.5 ? 'mid' : 'high';
  const y: 'low' | 'mid' | 'high' = behavioral < 5 ? 'low' : behavioral < 7.5 ? 'mid' : 'high';
  return NINE_BOX_QUADRANTS.find((q) => q.x === x && q.y === y)?.label ?? 'Quadrante não definido';
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal de avaliação por área
// ─────────────────────────────────────────────────────────────────────────────

export function buildAreaAssessment(
  profile: ParticipantProfile,
  area: string,
  performanceRecords: PerformanceRecord[],
  discReports: DiscReport[],
  _approvedExceptions: string[] = []
): AreaAssessment {
  const disc = getLatestDisc(discReports, profile.id, area);
  const perf = getLatestPerformance(performanceRecords, profile.id, area);
  const perfConverted = perf ? convertPerformance(perf.score100) : undefined;

  const behavioral =
    disc && perfConverted !== undefined
      ? Math.round(((disc.score10 + perfConverted) / 2) * 10) / 10
      : undefined;

  const technical = computeTechnicalAdherence(profile, area);

  const quadrant =
    behavioral !== undefined
      ? getQuadrant(technical.technicalAdherence, behavioral)
      : 'Dados incompletos para quadrante';

  // Detectar títulos fora do catálogo (para registro de exceções)
  const unknownPost = (profile.postMBAs ?? []).filter(
    (label) => !CATALOG_ITEMS.some((i) => i.group === 'postMBA' && i.label === label)
  );
  const unknownProj = (profile.selectedProjects ?? []).filter(
    (label) => !CATALOG_ITEMS.some((i) => i.group === 'project' && i.label === label)
  );
  const exceptions: string[] = [];
  if (unknownPost.length) exceptions.push(`Pós/MBA fora do catálogo: ${unknownPost.join(', ')}`);
  if (unknownProj.length) exceptions.push(`Projetos fora do catálogo: ${unknownProj.join(', ')}`);

  return {
    participantId: profile.id,
    area: area as AreaAssessment['area'],
    discScore: disc?.score10,
    performanceScore: perf?.score100,
    performanceConverted: perfConverted,
    behavioralAdherence: behavioral,
    technicalAdherence: technical.technicalAdherence,
    quadrant,
    calculationSteps: [
      ...technical.calculationSteps,
      {
        name: 'DISC mais recente',
        value: disc?.score10 ?? 'ausente',
        detail: disc?.date ?? 'sem relatório',
      },
      {
        name: 'Performance mais recente (0–100)',
        value: perf?.score100 ?? 'ausente',
        detail: perf?.date ?? 'sem importação',
      },
      {
        name: 'Aderência Comportamental',
        value: behavioral ?? 'incompleta',
        detail: disc && perfConverted !== undefined
          ? `(DISC ${disc.score10} + Performance ${perfConverted}) / 2`
          : 'DISC ou Performance ausente',
      },
    ],
    exceptions,
  };
}
