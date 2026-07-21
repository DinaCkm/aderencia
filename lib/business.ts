import { CATALOG_ITEMS } from './constants';
import { readJson } from './db';
import type { AreaAssessment, ParticipantProfile, PerformanceRecord, DiscReport, CatalogItem } from './types';

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
  // A nota de performance/engajamento é única por participante (não varia por área).
  // Busca primeiro pelo participantId + área específica; se não encontrar, usa qualquer registro do participante.
  const byArea = records.filter((r) => r.participantId === participantId && r.area === area);
  if (byArea.length > 0) return pickLatest(byArea);
  return pickLatest(records.filter((r) => r.participantId === participantId));
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

export function bestPostMBADetail(postMBALabels: string[], area: string, catalogItems: CatalogItem[] = CATALOG_ITEMS): {
  score: number;
  titleUsed: string | null;
  classification: string;
} {
  const candidates = catalogItems.filter(
    (i) =>
      i.group === 'postMBA' &&
      postMBALabels.includes(i.label) &&
      (!i.area || i.area === area)
  );

  if (candidates.length === 0) {
    if (postMBALabels.length === 0) return { score: 0, titleUsed: null, classification: 'Nenhum título de Pós/MBA informado — 0 de 40 pts possíveis' };
    // Tem título mas não é da área: pontuação mínima de 20 pts
    const bestLabel = postMBALabels[0];
    return {
      score: 20,
      titleUsed: bestLabel,
      classification: `Título não relacionado à área ${area} — recebe pontuação mínima de 20 pts por possuir pós-graduação, mesmo que não seja da área. Para obter 20 pts (título específico da área) ou 40 pts (título transversal) seria necessário um título reconhecido no catálogo oficial para a área ${area}.`,
    };
  }

  // Seleciona o candidato de maior pontuação. Em caso de EMPATE (ex.: dois títulos
  // transversais valendo 40 pts cada), a escolha precisa ser determinística e não pode
  // depender da ordem arbitrária em que os itens aparecem em CATALOG_ITEMS — senão o
  // "Título considerado" exibido nas áreas pode divergir do título que a auditoria
  // (pages/admin/employees.tsx e print-profile.tsx) trata como o que efetivamente pontua.
  // Critério de desempate: prioriza o título que aparece primeiro em postMBALabels,
  // já que essa ordem reflete a sequência em que os títulos foram declarados/aprovados.
  const labelOrder = (label: string) => {
    const idx = postMBALabels.indexOf(label);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  const best = candidates.reduce((a, b) => {
    const aPts = (a as any).points ?? 20;
    const bPts = (b as any).points ?? 20;
    if (bPts !== aPts) return bPts > aPts ? b : a;
    return labelOrder(b.label) < labelOrder(a.label) ? b : a;
  });
  const pts = (best as any).points ?? 20;
  const cls = (best as any).classification === 'transversal'
    ? `Título transversal — válido para qualquer área e representa a pontuação máxima: ${pts} de 40 pts possíveis.`
    : `Título específico para a área ${area} — vale ${pts} pts. Títulos específico de área valem 20 pts; para atingir 40 pts seria necessário um título transversal (ex.: MBA em Gestão, Liderança ou áreas amplas reconhecidas pelo catálogo oficial).`;

  return { score: pts, titleUsed: best.label, classification: cls };
}

function bestPostMBAScore(postMBALabels: string[], area: string): number {
  return bestPostMBADetail(postMBALabels, area).score;
}

export function experienceScore(managerialMonths: number, interimMonths: number): number {
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

export interface RejectedItemRef {
  itemKey: string;
  note?: string;
}

function computeTechnicalAdherence(
  profile: ParticipantProfile,
  area: string,
  rejectedItems: RejectedItemRef[] = [],
  allItemNotes: Record<string, string> = {},
  experienceOverride?: { managerialMonths?: number; interimMonths?: number; note?: string },
  projectRelabels: Record<string, string> = {},
  exceptionAssignments: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }> = {},
  catalogItems: CatalogItem[] = CATALOG_ITEMS
): {
  technicalAdherence: number;
  calculationSteps: { name: string; value: number | string; detail?: string }[];
  postMBADetail: { titleUsed: string | null; classification: string; score: number };
  projectsDetail: { label: string; points: number }[];
  excludedItems: { label: string; type: 'postMBA' | 'projeto' | 'experiencia'; pointsRemoved: number; note?: string }[];
} {
  const rejectedKeys = new Set(rejectedItems.map((r) => r.itemKey));
  const noteFor = (key: string) => rejectedItems.find((r) => r.itemKey === key)?.note;
  const excludedItems: { label: string; type: 'postMBA' | 'projeto' | 'experiencia'; pointsRemoved: number; note?: string }[] = [];

  // Pós/MBA — remove da lista os títulos rejeitados pela UGP antes de calcular o melhor
  const allPostMBAs = profile.postMBAs ?? [];
  const postMBAsConsidered = allPostMBAs.filter((_, i) => !rejectedKeys.has(`postmba-${i}`));
  allPostMBAs.forEach((label, i) => {
    if (rejectedKeys.has(`postmba-${i}`)) {
      // Aproxima os pontos que esse título específico teria (para exibir ao candidato quanto foi retirado)
      const wouldBeDetail = bestPostMBADetail([label], area, catalogItems);
      excludedItems.push({ label, type: 'postMBA', pointsRemoved: wouldBeDetail.score, note: noteFor(`postmba-${i}`) });
    }
  });
  // Exceções aprovadas: cada exceção (chaveada por itemKey, ex: "excecao-0") tem sua própria
  // área e item de catálogo atribuídos pelo admin — exatamente como um projeto. Só entra no
  // cálculo se: (1) está atribuída a ESTA área, e (2) não foi rejeitada (mesma regra dos projetos:
  // conta a menos que explicitamente rejeitada — pendente/validado contam).
  const exceptionEntriesForArea = Object.entries(exceptionAssignments).filter(
    ([itemKey, assignment]) => assignment.area === area && !rejectedKeys.has(itemKey)
  );
  const exceptionPostMBALabels = exceptionEntriesForArea
    .filter(([, a]) => a.type === 'pos-mba')
    .map(([, a]) => a.label);
  if (exceptionPostMBALabels.length > 0) {
    postMBAsConsidered.push(...exceptionPostMBALabels);
  }
  const postMBADet = bestPostMBADetail(postMBAsConsidered, area, catalogItems);

  // Experiência — usa o ajuste do administrador quando existir; senão, o valor autodeclarado.
  // Se o item "experiencia" foi rejeitado pela UGP, zera a pontuação.
  const hasOverride = experienceOverride && (experienceOverride.managerialMonths !== undefined || experienceOverride.interimMonths !== undefined);
  const managerialMonths = hasOverride && experienceOverride!.managerialMonths !== undefined ? experienceOverride!.managerialMonths! : (profile.managerialMonths ?? 0);
  const interimMonths = hasOverride && experienceOverride!.interimMonths !== undefined ? experienceOverride!.interimMonths! : (profile.interimMonths ?? 0);
  const experienceRejected = rejectedKeys.has('experiencia');
  const rawExpScore = experienceScore(managerialMonths, interimMonths);
  const expScore = experienceRejected ? 0 : rawExpScore;
  if (experienceRejected && rawExpScore > 0) {
    excludedItems.push({ label: 'Experiência gerencial/interina', type: 'experiencia', pointsRemoved: rawExpScore, note: noteFor('experiencia') });
  }


  // Projetos transversais — pontuam automaticamente em todas as áreas do candidato
  const TRANSVERSAL_PROJECTS = [
    'Programa de sucessão e desenvolvimento de lideranças',
  ];

  // Projetos rejeitados pela UGP (por índice no array original selectedProjects) — excluídos de todas as áreas
  const allSelectedProjects = profile.selectedProjects ?? [];
  const rejectedProjectLabels = new Set(
    allSelectedProjects.filter((_, i) => rejectedKeys.has(`projeto-${i}`))
  );

  // Projetos com detalhes
  // Usa projectAreaMap como fonte de verdade: se o admin vinculou um projeto a esta área,
  // ele pontua aqui — buscando os pontos no catálogo pelo label (independente da área original do catálogo)
  // Projetos transversais pontuam em todas as áreas do candidato automaticamente
  const projectAreaMap: Record<string, string> = (profile as any).projectAreaMap ?? {};
  // Reclassificação manual do admin: troca o título usado para buscar no catálogo (ex: candidato
  // selecionou "Programa de desenvolvimento territorial", mas o admin reclassificou para
  // "Desenvolvimento regional e interiorização", que é o item correto do catálogo para esta área).
  const effectiveLabelFor = (label: string, idx: number): string => projectRelabels[`projeto-${idx}`] || label;
  const projItems = allSelectedProjects
    .map((label, idx) => ({ label, idx }))
    .filter(({ label }) => (projectAreaMap[label] === area || TRANSVERSAL_PROJECTS.includes(label)) && !rejectedProjectLabels.has(label))
    .map(({ label, idx }) => {
      const effLabel = effectiveLabelFor(label, idx);
      // Projeto deve existir no catálogo para a área vinculada (ou para projetos transversais, para esta área)
      const catalogItem = catalogItems.find((i) => i.group === 'project' && i.label === effLabel && i.area === area);
      if (!catalogItem) return null;
      const pts = (catalogItem as any).points ?? 15;
      const weight = pts >= 20 ? 'projeto estratégico central' : 'projeto de suporte/complementar';
      return { label: effLabel, points: pts, weight };
    })
    .filter((item): item is { label: string; points: number; weight: string } => item !== null);
  // Exceções de projeto aprovadas pela UGP para esta área: somam como se fossem o item do
  // catálogo ao qual cada uma foi equiparada (mesma pontuação/classificação), sujeitas ao
  // mesmo teto de 20 pts da área.
  const exceptionProjectAssignments = exceptionEntriesForArea.filter(([, a]) => a.type === 'projeto');
  for (const [, assignment] of exceptionProjectAssignments) {
    const exceptionCatalogItem = catalogItems.find(
      (i) => i.group === 'project' && i.label === assignment.label && i.area === area
    );
    if (exceptionCatalogItem) {
      const pts = (exceptionCatalogItem as any).points ?? 15;
      const weight = pts >= 20 ? 'projeto estratégico central' : 'projeto de suporte/complementar';
      projItems.push({ label: `${exceptionCatalogItem.label} (reconhecido por exceção aprovada pela UGP)`, points: pts, weight });
    }
  }
  const projScore = Math.min(20, projItems.reduce((acc, i) => acc + i.points, 0));

  // Observações do auditor em projetos desta área que NÃO foram rejeitados (ex: pendente,
  // validado) — sem isso, a nota digitada na auditoria some da ficha e do Nine Box.
  const areaProjectNotes: string[] = allSelectedProjects
    .map((label, i) => {
      const key = `projeto-${i}`;
      if (rejectedKeys.has(key)) return null; // rejeitados já aparecem em excludedItems
      const note = allItemNotes[key];
      if (!note) return null;
      const belongsToArea = projectAreaMap[label] === area || TRANSVERSAL_PROJECTS.includes(label);
      if (!belongsToArea) return null;
      return `"${label}": "${note}"`;
    })
    .filter((x): x is string => !!x);

  // Registra projetos rejeitados que teriam pontuado nesta área, para exibir ao candidato
  allSelectedProjects.forEach((label, i) => {
    if (!rejectedKeys.has(`projeto-${i}`)) return;
    if (!(projectAreaMap[label] === area || TRANSVERSAL_PROJECTS.includes(label))) return;
    const catalogItem = catalogItems.find((it) => it.group === 'project' && it.label === label && it.area === area);
    const pts = catalogItem ? ((catalogItem as any).points ?? 15) : 0;
    excludedItems.push({ label, type: 'projeto', pointsRemoved: pts, note: noteFor(`projeto-${i}`) });
  });

  const total80 = postMBADet.score + expScore + projScore;
  const score10 = Math.round((total80 / 80) * 100) / 10;

  return {
    technicalAdherence: score10,
    postMBADetail: postMBADet,
    projectsDetail: projItems.map((i) => ({ label: i.label, points: i.points, weight: i.weight })),
    excludedItems,
    calculationSteps: [
      {
        name: 'Pós/MBA (melhor título para a área)',
        value: postMBADet.score,
        detail: postMBADet.titleUsed
          ? `Título considerado: "${postMBADet.titleUsed}" — ${postMBADet.classification}${exceptionPostMBALabels.includes(postMBADet.titleUsed || '') ? ' · Reconhecido por exceção aprovada pela UGP (equivalência ao catálogo)' : ''}`
          : 'Nenhum título de Pós/MBA informado — 0 de 40 pts possíveis.',
      },
      {
        name: 'Experiência gerencial/interina',
        value: Math.round(expScore * 10) / 10,
        detail: experienceRejected
          ? `Item rejeitado pela UGP na auditoria — pontuação zerada.${noteFor('experiencia') ? ` Motivo: ${noteFor('experiencia')}` : ''}`
          : (() => {
              const totalM = managerialMonths + interimMonths;
              const years = Math.floor((totalM / 12) * 10) / 10;
              const raw = years * 5;
              const capped = expScore === 20 && raw > 20;
              const adjustedSuffix = hasOverride
                ? ` · Ajustado pelo administrador (declarado pelo candidato: ${profile.managerialMonths ?? 0}m gerencial + ${profile.interimMonths ?? 0}m interino)${experienceOverride?.note ? ` — ${experienceOverride.note}` : ''}`
                : '';
              return `Gerencial: ${managerialMonths}m + Interino: ${interimMonths}m = ${totalM}m totais (${years} anos × 5 pts/ano = ${Math.round(raw * 10) / 10} pts)`
                + (capped ? ` — cap atingido: máximo é 20 pts` : ` — ${expScore} de 20 pts possíveis`)
                + adjustedSuffix;
            })(),
      },
      {
        name: 'Projetos estratégicos da área',
        value: projScore,
        detail: (() => {
          const notesSuffix = areaProjectNotes.length > 0
            ? ` · Obs. da auditoria — ${areaProjectNotes.join(' ; ')}`
            : '';
          if (projItems.length === 0) {
            return `Nenhum projeto vinculado a esta área — 0 de 20 pts possíveis. Os projetos são vinculados pelo administrador durante a auditoria com base nos comprovantes enviados.${notesSuffix}`;
          }
          const rawTotal = projItems.reduce((a, i) => a + i.points, 0);
          const capped = rawTotal > 20;
          const itemsDesc = projItems.map((i) =>
            `"${i.label}" — ${i.points} pts (${
              i.weight === 'projeto estratégico central'
                ? 'classificado como estratégico central no catálogo oficial, representa a pontuação máxima de 20 pts'
                : `classificado como complementar no catálogo oficial, projetos complementares valem até 15 pts`
            })`
          ).join(' | ');
          const capMsg = capped
            ? ` — ATENÇÃO: a soma dos projetos seria ${rawTotal} pts, mas o limite máximo por área é 20 pts. Projetos adicionais não acrescentam mais pontos.`
            : ` — total apurado: ${projScore} pts (máximo possível por área: 20 pts).`;
          return itemsDesc + capMsg + notesSuffix;
        })(),
      },
      {
        name: 'Total bruto (0–80)',
        value: total80,
        detail: `Pós/MBA (${postMBADet.score} pts) + Experiência (${Math.round(expScore * 10) / 10} pts) + Projetos (${projScore} pts) = ${total80} pts — convertido para escala 0–10: ${score10} pts`,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Nine Box
// ─────────────────────────────────────────────────────────────────────────────

const NINE_BOX_QUADRANTS: { x: 'low' | 'mid' | 'high'; y: 'low' | 'mid' | 'high'; label: string }[] = [
  { x: 'high', y: 'high', label: 'Tecnicamente Alta — Comportamental Alta' },
  { x: 'mid',  y: 'high', label: 'Tecnicamente Média — Comportamental Alta' },
  { x: 'low',  y: 'high', label: 'Tecnicamente Baixa — Comportamental Alta' },
  { x: 'high', y: 'mid',  label: 'Tecnicamente Alta — Comportamental Média' },
  { x: 'mid',  y: 'mid',  label: 'Tecnicamente Média — Comportamental Média' },
  { x: 'low',  y: 'mid',  label: 'Tecnicamente Baixa — Comportamental Média' },
  { x: 'high', y: 'low',  label: 'Tecnicamente Alta — Comportamental Baixa' },
  { x: 'mid',  y: 'low',  label: 'Especialista Técnico sem Perfil de Liderança' },
  { x: 'low',  y: 'low',  label: 'Tecnicamente Baixa — Comportamental Baixa' },
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
  exceptionAssignments: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }> = {},
  rejectedItems: RejectedItemRef[] = [],
  allItemNotes: Record<string, string> = {},
  experienceOverride?: { managerialMonths?: number; interimMonths?: number; note?: string },
  projectRelabels: Record<string, string> = {},
  catalogItems: CatalogItem[] = CATALOG_ITEMS
): AreaAssessment {
  const disc = getLatestDisc(discReports, profile.id, area);
  const perf = getLatestPerformance(performanceRecords, profile.id, area);
  const perfConverted = perf ? convertPerformance(perf.score100) : undefined;

  const behavioral =
    disc && perfConverted !== undefined
      ? Math.round(((disc.score10 + perfConverted) / 2) * 10) / 10
      : undefined;

  const technical = computeTechnicalAdherence(profile, area, rejectedItems, allItemNotes, experienceOverride, projectRelabels, exceptionAssignments, catalogItems);

  const quadrant =
    behavioral !== undefined
      ? getQuadrant(technical.technicalAdherence, behavioral)
      : 'Dados incompletos para definição do quadrante';

  // Detectar títulos fora do catálogo (para registro de exceções)
  const unknownPost = (profile.postMBAs ?? []).filter(
    (label) => !catalogItems.some((i) => i.group === 'postMBA' && i.label === label)
  );
  const unknownProj = (profile.selectedProjects ?? []).filter(
    (label) => !catalogItems.some((i) => i.group === 'project' && i.label === label)
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
    postMBADetail: technical.postMBADetail,
    projectsDetail: technical.projectsDetail,
    excludedItems: technical.excludedItems,
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
          ? `(DISC ${disc.score10} + Performance convertida ${perfConverted}) / 2`
          : 'DISC ou Performance ausente',
      },
    ],
    exceptions,
  };
}
