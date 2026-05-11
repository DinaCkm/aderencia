import { NINE_BOX_QUADRANTS } from './constants';
import { readJson } from './db';
import type { AreaAssessment, CatalogItem, ParticipantProfile, PerformanceRecord, DiscReport } from './types';

function pickLatest<T extends { date: string }>(items: T[]): T | undefined {
  return items.reduce((latest, item) => {
    if (!latest) return item;
    return item.date > latest.date ? item : latest;
  }, undefined as T | undefined);
}

export function convertPerformance(score100: number) {
  const normalized = Math.max(0, Math.min(100, score100));
  return Math.round((normalized / 10) * 10) / 10;
}

export function getLatestDisc(reports: DiscReport[], participantId: string, area: string) {
  return pickLatest(reports.filter((report) => report.participantId === participantId && report.area === area));
}

export function getLatestPerformance(records: PerformanceRecord[], participantId: string, area: string) {
  return pickLatest(records.filter((record) => record.participantId === participantId && record.area === area));
}

function getCatalogs() {
  return readJson<CatalogItem[]>('catalogs', []);
}

function computeTechnicalAdherence(profile: ParticipantProfile, area: string, approvedExceptions: string[] = []) {
  const catalogs = getCatalogs();
  const selectedPost = profile.postMBAs.filter((id) => approvedExceptions.includes(id) || catalogs.some((item) => item.id === id && item.group === 'postMBA'));
  const selectedCourses = profile.selectedCourses.filter((id) => approvedExceptions.includes(id) || catalogs.some((item) => item.id === id && item.group === 'course'));
  const selectedProjects = profile.selectedProjects.filter((id) => approvedExceptions.includes(id) || catalogs.some((item) => item.id === id && item.group === 'project'));

  const postPoints = selectedPost.length > 0 ? 3 : 0;
  const experiencePoints = Math.min(4, profile.experienceMonths / 6);

  const strategicCourses = selectedCourses.filter((id) => {
    const item = catalogs.find((entry) => entry.id === id && entry.group === 'course');
    return item?.classification === 'transversal' || (item?.classification === 'area-specific' && item?.area === area);
  }).length;
  const strategicProjects = selectedProjects.filter((id) => {
    const item = catalogs.find((entry) => entry.id === id && entry.group === 'project');
    return item?.classification === 'transversal' || (item?.classification === 'area-specific' && item?.area === area);
  }).length;
  const strategicPoints = Math.min(3, (strategicCourses + strategicProjects) * 1.2);

  const total = Math.min(10, postPoints + experiencePoints + strategicPoints);

  return {
    technicalAdherence: Math.round(total * 10) / 10,
    calculationSteps: [
      { name: 'Pós/MBA selecionado', value: postPoints, detail: `${selectedPost.length} item(s) reconhecido(s)` },
      { name: 'Experiência gerencial/interina', value: Math.round(experiencePoints * 10) / 10, detail: `${profile.experienceMonths} meses` },
      { name: 'Cursos e projetos estratégicos', value: Math.round(strategicPoints * 10) / 10, detail: `${strategicCourses} cursos + ${strategicProjects} projetos` }
    ] as const
  };
}

function getQuadrant(technical: number, behavioral: number) {
  const x = technical < 4 ? 'low' : technical < 7 ? 'mid' : 'high';
  const y = behavioral < 4 ? 'low' : behavioral < 7 ? 'mid' : 'high';
  return NINE_BOX_QUADRANTS.find((quad) => quad.x === x && quad.y === y)?.label ?? 'Quadrante não definido';
}

export function buildAreaAssessment(
  profile: ParticipantProfile,
  area: string,
  performanceRecords: PerformanceRecord[],
  discReports: DiscReport[],
  approvedExceptions: string[] = []
): AreaAssessment {
  const disc = getLatestDisc(discReports, profile.id, area);
  const perf = getLatestPerformance(performanceRecords, profile.id, area);
  const perfConverted = perf ? convertPerformance(perf.score100) : undefined;
  const behavioral = disc && perfConverted !== undefined ? Math.round(((disc.score10 + perfConverted) / 2) * 10) / 10 : undefined;
  const technical = computeTechnicalAdherence(profile, area, approvedExceptions);
  const quadrant = behavioral !== undefined ? getQuadrant(technical.technicalAdherence, behavioral) : 'Dados incompletos para quadrant';
  const exceptions: string[] = [];

  const catalogs = getCatalogs();
  const unknownCourse = profile.selectedCourses.filter((id) => !catalogs.some((item) => item.id === id));
  const unknownProj = profile.selectedProjects.filter((id) => !catalogs.some((item) => item.id === id));
  const unknownPost = profile.postMBAs.filter((id) => !catalogs.some((item) => item.id === id));
  if (unknownCourse.length) exceptions.push(`Cursos fora do catálogo: ${unknownCourse.join(', ')}`);
  if (unknownProj.length) exceptions.push(`Projetos fora do catálogo: ${unknownProj.join(', ')}`);
  if (unknownPost.length) exceptions.push(`Pós/MBA fora do catálogo: ${unknownPost.join(', ')}`);

  return {
    participantId: profile.id,
    area: area as unknown as AreaAssessment['area'],
    discScore: disc?.score10,
    performanceScore: perf?.score100,
    performanceConverted: perfConverted,
    behavioralAdherence: behavioral,
    technicalAdherence: technical.technicalAdherence,
    quadrant,
    calculationSteps: [
      ...technical.calculationSteps,
      { name: 'DISC mais recente', value: disc?.score10 ?? 'ausente', detail: disc?.date ?? 'sem relatório' },
      { name: 'Performance mais recente (0-100)', value: perf?.score100 ?? 'ausente', detail: perf?.date ?? 'sem importação' }
    ],
    exceptions
  };
}
