import { CATALOG_ITEMS } from './constants';
import { readJson } from './db';
import type { AreaAssessment, ParticipantProfile, PerformanceRecord, DiscReport, CatalogItem } from './types';

// Projetos transversais — pontuam automaticamente em TODAS as áreas de interesse do
// candidato, independente da "área de aplicação" única atribuída pelo administrador.
// Exportada para ser a fonte única também nas telas de recálculo pós-auditoria
// (print-profile.tsx e employees.tsx), que antes ignoravam essa regra e por isso
// subestimavam a nota técnica recalculada em áreas onde o projeto conta por ser
// transversal, mas não é a área "oficialmente" vinculada.
export const TRANSVERSAL_PROJECTS = [
  'Programa de sucessão e desenvolvimento de lideranças',
];

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

// Resolve o rótulo de área/catálogo (usado internamente para o cálculo/matching de Pós/MBA)
// para o NOME REAL do curso digitado pelo candidato (mbaBlocks[].name) — usado só para
// EXIBIÇÃO em texto. Sem isso, textos como "Título considerado: X" mostravam o rótulo de
// área do catálogo (ex.: "Gestão da Inovação") em vez do nome real do curso (ex.: "MBA
// Executivo em Negócios e Competências Digitais"), divergindo do nome mostrado em outras
// seções/telas que leem o nome real direto do bloco. Nunca usar o retorno desta função para
// comparação/matching — só para o texto exibido ao usuário.
function resolveMbaDisplayName(areaLabel: string, mbaBlocks: Array<{ area?: string; name?: string }>): string {
  const block = mbaBlocks.find((b) => b.area === areaLabel && b.name?.trim());
  return block?.name?.trim() || areaLabel;
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
      classification: `Título não relacionado à área ${area} — já recebe a pontuação mínima de 20 pts por possuir pós-graduação, mesmo que o tema não seja específico da área. Para aumentar essa pontuação (até 40 pts com um título transversal, ou mantendo 20 pts como título específico reconhecido) seria necessário um título constante no catálogo oficial para a área ${area}.`,
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
  postMBADetail: { titleUsed: string | null; titleUsedDisplay?: string | null; classification: string; score: number };
  projectsDetail: { label: string; points: number }[];
  excludedItems: { label: string; type: 'postMBA' | 'projeto' | 'experiencia'; pointsRemoved: number; note?: string }[];
} {
  const rejectedKeys = new Set(rejectedItems.map((r) => r.itemKey));
  const noteFor = (key: string) => rejectedItems.find((r) => r.itemKey === key)?.note;
  const excludedItems: { label: string; type: 'postMBA' | 'projeto' | 'experiencia'; pointsRemoved: number; note?: string }[] = [];

  // Pós/MBA — IMPORTANTE: `profile.postMBAs` é uma projeção FILTRADA de `profile.mbaBlocks`
  // (exclui blocos com área "__outro_mba__" e guarda apenas o valor de ÁREA, não o nome real
  // do título) — por isso o índice em `postMBAs` NÃO corresponde ao índice original do bloco
  // em `mbaBlocks`, que é o índice usado pela chave `postmba-i` salva na auditoria
  // (pages/admin/audit.tsx). Usar `postMBAs` diretamente aqui misturava nome/motivo de
  // rejeição de um título com o de outro (ex.: um título "Outro" rejeitado desaparecia da
  // lista e seu motivo era atribuído ao título seguinte). Usamos `mbaBlocks` com o índice
  // original (mesma convenção de audit.tsx/print-profile.tsx/employees.tsx) para achar
  // corretamente quais títulos foram rejeitados e com qual motivo, mantendo a fórmula de
  // pontuação (título "Outro" continua fora do cálculo quando não rejeitado, como já era).
  const mbaBlocksArr: Array<{ area?: string; name?: string }> = (profile as any).mbaBlocks ?? [];
  const validMbaBlocks = mbaBlocksArr
    .map((b, origIdx) => ({ ...b, origIdx }))
    .filter((b) => b.area && b.name?.trim());
  const postMBAsConsidered: string[] = [];
  if (validMbaBlocks.length > 0) {
    validMbaBlocks.forEach((b) => {
      const itemKey = `postmba-${b.origIdx}`;
      if (rejectedKeys.has(itemKey)) {
        // Aproxima os pontos que esse título específico teria (para exibir ao candidato quanto foi retirado)
        const approxLabel = b.area !== '__outro_mba__' ? b.area! : b.name!.trim();
        const wouldBeDetail = bestPostMBADetail([approxLabel], area, catalogItems);
        excludedItems.push({ label: b.name!.trim(), type: 'postMBA', pointsRemoved: wouldBeDetail.score, note: noteFor(itemKey) });
      } else if (b.area && b.area !== '__outro_mba__') {
        postMBAsConsidered.push(b.area);
      }
    });
  } else {
    // Fallback para participantes antigos sem mbaBlocks salvo (dados legados) — mantém o
    // comportamento anterior baseado em postMBAs.
    const allPostMBAs = profile.postMBAs ?? [];
    allPostMBAs.forEach((label, i) => {
      if (rejectedKeys.has(`postmba-${i}`)) {
        const wouldBeDetail = bestPostMBADetail([label], area, catalogItems);
        excludedItems.push({ label, type: 'postMBA', pointsRemoved: wouldBeDetail.score, note: noteFor(`postmba-${i}`) });
      } else {
        postMBAsConsidered.push(label);
      }
    });
  }
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
  // Nome real do curso (mbaBlocks) pra exibição, resolvido a partir do rótulo de área/catálogo
  // usado internamente pra pontuação — ver resolveMbaDisplayName() para o motivo. Exposto aqui
  // como campo próprio pra qualquer tela (Visão do Colaborador, PDF, etc.) usar diretamente,
  // sem precisar reconstruir essa resolução por conta própria (o que já causou o mesmo bug
  // aparecer de novo em my-results.tsx mesmo depois da correção no texto de calculationSteps).
  const postMBADetWithDisplay = {
    ...postMBADet,
    titleUsedDisplay: postMBADet.titleUsed ? resolveMbaDisplayName(postMBADet.titleUsed, mbaBlocksArr) : null,
  };

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
  // (ver TRANSVERSAL_PROJECTS exportada no topo do módulo)

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
    postMBADetail: postMBADetWithDisplay,
    projectsDetail: projItems.map((i) => ({ label: i.label, points: i.points, weight: i.weight })),
    excludedItems,
    calculationSteps: [
      {
        name: 'Pós/MBA (melhor título para a área)',
        value: postMBADet.score,
        detail: postMBADet.titleUsed
          ? `Título considerado: "${resolveMbaDisplayName(postMBADet.titleUsed, mbaBlocksArr)}" — ${postMBADet.classification}${exceptionPostMBALabels.includes(postMBADet.titleUsed || '') ? ' · Reconhecido por exceção aprovada pela UGP (equivalência ao catálogo)' : ''}`
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
              // IMPORTANTE: usar `rawExpScore` (já calculado acima via `experienceScore()`,
              // a mesma função que gera o valor realmente usado na nota) em vez de recalcular
              // aqui com `years` truncado × 5 — essa segunda conta usa uma ordem de
              // arredondamento diferente e podia gerar um número contraditório na mesma frase
              // (ex.: "× 5 pts/ano = 15.5 pts" seguido de "15.8 de 20 pts possíveis", sendo
              // 15.8 o valor correto e realmente somado na nota).
              const capped = expScore === 20 && rawExpScore >= 20;
              const adjustedSuffix = hasOverride
                ? ` · Ajustado pelo administrador (declarado pelo candidato: ${profile.managerialMonths ?? 0}m gerencial + ${profile.interimMonths ?? 0}m interino)${experienceOverride?.note ? ` — ${experienceOverride.note}` : ''}`
                : '';
              return `Gerencial: ${managerialMonths}m + Interino: ${interimMonths}m = ${totalM}m totais (${years} anos × 5 pts/ano = ${rawExpScore} pts)`
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

// Faixa única de classificação de nota (Baixa/Média/Alta) — fonte única para o Nine Box.
// ANTES desta correção, pages/my-results.tsx tinha seus próprios limiares (4 / 7) só para
// decidir qual célula da matriz visual destacar, diferentes dos limiares oficiais usados aqui
// (5 / 7,5) para gerar o TEXTO do quadrante — uma nota técnica de 7,2, por exemplo, aparecia
// como "Média" no texto mas acendia a célula "Alta" no desenho. Qualquer tela que precise
// classificar uma nota em Baixa/Média/Alta deve usar esta função, nunca reimplementar limiares.
export function classifyScoreBand(score: number): 'low' | 'mid' | 'high' {
  return score < 5 ? 'low' : score < 7.5 ? 'mid' : 'high';
}

function getQuadrant(technical: number, behavioral: number): string {
  // Faixas: Baixa = 0–4,9 | Média = 5,0–7,4 | Alta = 7,5–10
  const x = classifyScoreBand(technical);
  const y = classifyScoreBand(behavioral);
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
  catalogItems: CatalogItem[] = CATALOG_ITEMS,
  // Validações item a item do candidato — usadas para separar a nota CONFIRMADA (só itens
  // já aprovados explicitamente) da nota POTENCIAL (aprovados + pendentes, que é o cálculo
  // antigo, de antes desta separação). Decisão de política: item pendente não pontua na nota
  // definitiva, aparece só como simulação. Ver getPendingScorableItems() para a regra.
  itemValidations: ItemValidationLite[] = []
): AreaAssessment {
  const disc = getLatestDisc(discReports, profile.id, area);
  const perf = getLatestPerformance(performanceRecords, profile.id, area);
  const perfConverted = perf ? convertPerformance(perf.score100) : undefined;

  const behavioral =
    disc && perfConverted !== undefined
      ? Math.round(((disc.score10 + perfConverted) / 2) * 10) / 10
      : undefined;

  // Nota POTENCIAL: comportamento histórico — só exclui itens explicitamente rejeitados.
  // Reaproveitada como está para não haver NENHUMA mudança de resultado para quem não tem
  // item pendente (garantia dada na aprovação da correção).
  const potential = computeTechnicalAdherence(profile, area, rejectedItems, allItemNotes, experienceOverride, projectRelabels, exceptionAssignments, catalogItems);

  // Nota CONFIRMADA: além dos rejeitados, também exclui itens ainda pendentes (sem decisão
  // explícita de aprovação). Esta é a nota "oficial" — a que vale para decisão de sucessão.
  const pendingItems = getPendingScorableItems(profile, itemValidations, exceptionAssignments);
  const confirmedExclusions: RejectedItemRef[] = [...rejectedItems, ...pendingItems.map((p) => ({ itemKey: p.itemKey }))];
  const technical = computeTechnicalAdherence(profile, area, confirmedExclusions, allItemNotes, experienceOverride, projectRelabels, exceptionAssignments, catalogItems);

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
    // Nota potencial (informativa): quanto seria a nota técnica se todos os itens hoje
    // pendentes fossem aprovados. Nunca soma na nota oficial (technicalAdherence acima).
    technicalAdherencePotential: potential.technicalAdherence,
    pendingItems,
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

// ─────────────────────────────────────────────────────────────────────────────
// Análise de auditoria por item (Pós/MBA e Projetos) — FONTE ÚNICA
// ─────────────────────────────────────────────────────────────────────────────
// Usada por pages/admin/print-profile.tsx e pages/admin/employees.tsx para explicar,
// item a item, se um título/projeto pontua, por quê, e com que comprovante — para fins
// de auditoria/exibição (não confundir com computeTechnicalAdherence, que decide qual
// título de Pós/MBA efetivamente "vence" para compor a nota de cada área).
//
// IMPORTANTE — histórico: até esta consolidação, print-profile.tsx e employees.tsx
// mantinham CADA UM sua própria cópia independente desta lógica, e elas já haviam
// divergido de forma real (não só de texto):
//   - employees.tsx verificava se a área vinculada de um projeto está entre as áreas
//     de interesse do candidato; print-profile.tsx não verificava, podendo exibir
//     "pontua" para uma área que o candidato nem concorre.
//   - employees.tsx aplicava o teto de 20 pts por área de forma incremental por item
//     (mostrando "limitado a X pts"); print-profile.tsx mostrava sempre o valor bruto
//     do catálogo por item, só aplicando o teto no agregado — dando a impressão de que
//     cada projeto vale mais do que realmente conta.
// Esta função usa o comportamento mais completo (o de employees.tsx) como canônico.
// ─────────────────────────────────────────────────────────────────────────────
// Estado de decisão por item pontuável (aprovado / pendente / rejeitado) — FONTE ÚNICA
// ─────────────────────────────────────────────────────────────────────────────
// Usada por: (1) pages/api/admin/audit-profile.ts, para travar a conclusão da ficha
// enquanto houver item pontuável pendente; (2) buildAreaAssessment, para separar a nota
// confirmada (só itens aprovados) da nota potencial (aprovados + pendentes, como no
// comportamento antigo). As duas pontas usam exatamente a mesma enumeração de itens —
// se um item aqui, ele conta pros dois propósitos; nenhuma tela ou endpoint deve refazer
// essa lista por conta própria.
export type ScorableItemType = 'postMBA' | 'projeto' | 'experiencia' | 'excecao';

export interface ScorableItemState {
  itemKey: string;
  type: ScorableItemType;
  label: string;
  status: 'approved' | 'pending' | 'rejected';
}

export function getScorableItemsState(
  profile: ParticipantProfile,
  itemValidations: ItemValidationLite[],
  exceptionAssignments: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }> = {}
): ScorableItemState[] {
  const statusFor = (key: string): 'approved' | 'pending' | 'rejected' => {
    const matches = itemValidations.filter((iv) => iv.itemKey === key);
    if (matches.length === 0) return 'pending'; // sem registro = mesmo estado hoje já exibido como "⏳ Pendente" na UI
    // IMPORTANTE: pode haver mais de um registro para o mesmo itemKey (ex.: um "pending"
    // antigo do auditor aguardando retorno, seguido depois por um "approved"/"rejected" mais
    // recente). Usar sempre o primeiro registro encontrado (.find()) fazia um "pending" antigo
    // prevalecer para sempre, mesmo depois de uma decisão posterior — bug real confirmado em
    // produção (caso Alorran de Freitas Barbosa). Usamos o registro com `validatedAt` mais
    // recente; em empate (ou ausência de validatedAt), o que aparece depois na lista vence.
    const mostRecent = matches.reduce((latest, current) =>
      (current.validatedAt || '') >= (latest.validatedAt || '') ? current : latest
    );
    if (mostRecent.status === 'approved') return 'approved';
    if (mostRecent.status === 'rejected') return 'rejected';
    return 'pending';
  };

  const items: ScorableItemState[] = [];

  // Pós/MBA — cada bloco válido (área preenchida + nome preenchido), exceto títulos "Outro"
  // (__outro_mba__), que só entram no cálculo se reconhecidos por exceção — nesse caso já
  // aparecem via exceptionAssignments abaixo, então não são listados duas vezes aqui.
  const mbaBlocksArr: Array<{ area?: string; name?: string }> = (profile as any).mbaBlocks ?? [];
  mbaBlocksArr
    .map((b, origIdx) => ({ ...b, origIdx }))
    .filter((b) => b.area && b.area !== '__outro_mba__' && b.name?.trim())
    .forEach((b) => {
      const itemKey = `postmba-${b.origIdx}`;
      items.push({ itemKey, type: 'postMBA', label: b.name!.trim(), status: statusFor(itemKey) });
    });

  // Experiência — só é item pontuável se houver meses gerenciais/interinos declarados
  const totalMonths = (profile.managerialMonths ?? 0) + (profile.interimMonths ?? 0);
  if (totalMonths > 0) {
    items.push({ itemKey: 'experiencia', type: 'experiencia', label: 'Experiência gerencial/interina', status: statusFor('experiencia') });
  }

  // Projetos — cada projeto selecionado pelo candidato
  (profile.selectedProjects ?? []).forEach((label, idx) => {
    const itemKey = `projeto-${idx}`;
    items.push({ itemKey, type: 'projeto', label, status: statusFor(itemKey) });
  });

  // Exceções com área/catálogo já atribuídos pelo admin — mesmo tratamento de um projeto
  Object.entries(exceptionAssignments).forEach(([itemKey, assignment]) => {
    items.push({ itemKey, type: 'excecao', label: assignment.label, status: statusFor(itemKey) });
  });

  return items;
}

export function getPendingScorableItems(
  profile: ParticipantProfile,
  itemValidations: ItemValidationLite[],
  exceptionAssignments: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }> = {}
): ScorableItemState[] {
  return getScorableItemsState(profile, itemValidations, exceptionAssignments).filter((i) => i.status === 'pending');
}


export interface ItemValidationLite {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  validatedAt?: string;
}

// Deduplica itemValidations por itemKey, mantendo só o registro mais recente (por
// validatedAt). FONTE ÚNICA: qualquer código que precise filtrar itemValidations por status
// (ex.: montar a lista de itens rejeitados para excluir da nota) deve passar por aqui primeiro
// — filtrar direto no array bruto é o mesmo bug já corrigido em getScorableItemsState/
// getValidation/getAuditV: um registro antigo (ex. "rejected") podia continuar sendo
// considerado mesmo depois de uma decisão mais recente reverter para "approved".
export function dedupeItemValidations(itemValidations: ItemValidationLite[]): ItemValidationLite[] {
  const latestByKey = new Map<string, ItemValidationLite>();
  for (const v of itemValidations) {
    const existing = latestByKey.get(v.itemKey);
    if (!existing || (v.validatedAt || '') >= (existing.validatedAt || '')) {
      latestByKey.set(v.itemKey, v);
    }
  }
  return Array.from(latestByKey.values());
}

export interface MbaAnalysisItem {
  title: string;
  blockIdx: number;
  status: 'pontua' | 'nao-pontua' | 'rejeitado';
  reason: string;
  pts: number;
  proof: string;
  auditNote?: string;
}

export interface ProjAnalysisItem {
  proj: string;
  status: 'pontua' | 'nao-pontua' | 'rejeitado';
  reason: string;
  pts: number;
  area: string | null;
  proof: string;
  auditNote?: string;
}

export function buildMbaAnalysis(
  profile: ParticipantProfile,
  itemValidations: ItemValidationLite[],
  proofStatus: (key: string) => string,
  catalogItems: CatalogItem[] = CATALOG_ITEMS
): MbaAnalysisItem[] {
  // Mesmo bug já corrigido em getScorableItemsState/getValidation: usa o registro mais
  // recente por validatedAt, não o primeiro — evita que um "pending" antigo prevaleça sobre
  // uma decisão posterior na exibição do motivo/status deste item.
  const getAuditV = (key: string) => {
    const matches = itemValidations.filter((v) => v.itemKey === key);
    if (matches.length === 0) return undefined;
    return matches.reduce((latest, current) => ((current.validatedAt || '') >= (latest.validatedAt || '') ? current : latest));
  };
  const allMBAs = profile.postMBAs || [];
  const candidateAreas: string[] = (profile as any).selectedAreas || [];
  const blocksList: Array<{ area?: string; name?: string }> = (profile as any).mbaBlocks || [];
  const usedMbaBlockIdx = new Set<number>();

  const base: MbaAnalysisItem[] = allMBAs.map((title, idx) => {
    // `profile.postMBAs` é uma projeção filtrada de `mbaBlocks` (guarda só a área) — por
    // isso `idx` aqui não corresponde ao índice original do bloco. Localizamos o bloco
    // certo pela área (o mesmo valor que popula `postMBAs`) e usamos o índice original
    // para tudo, preferindo um bloco ainda não usado (duas Pós/MBA podem ter a mesma área).
    let blockIdx = blocksList.findIndex((b, i) => b?.area === title && !usedMbaBlockIdx.has(i));
    if (blockIdx < 0) blockIdx = blocksList.findIndex((b) => b?.area === title);
    if (blockIdx >= 0) usedMbaBlockIdx.add(blockIdx);
    const effIdx = blockIdx >= 0 ? blockIdx : idx;
    const auditV = getAuditV(`postmba-${effIdx}`);
    const mbaBlock = blocksList[effIdx];
    const mbaKey = `mba_${effIdx}:${mbaBlock?.name?.trim() || title}`;
    const proof = proofStatus(mbaKey);
    if (auditV?.status === 'rejected') {
      return { title, blockIdx: effIdx, status: 'rejeitado', reason: `Comprovante rejeitado pelo auditor${auditV.note ? ` — ${auditV.note}` : ''}`, pts: 0, proof, auditNote: auditV.note };
    }
    const matches = catalogItems.filter((i) => i.group === 'postMBA' && i.label === title);
    if (matches.length === 0) {
      return { title, blockIdx: effIdx, status: 'nao-pontua', reason: 'Título não encontrado no catálogo oficial — recebe pontuação mínima de 20 pts por possuir pós-graduação', pts: 20, proof, auditNote: auditV?.note };
    }
    // Empate entre itens do catálogo com o mesmo rótulo em áreas diferentes: prioriza a
    // área que o candidato de fato concorre, para não apontar para uma área que ele nem
    // disputa (não pode depender da ordem arbitrária de CATALOG_ITEMS).
    const inCandidateAreas = matches.filter((m) => !m.area || candidateAreas.includes(m.area));
    const pool = inCandidateAreas.length > 0 ? inCandidateAreas : matches;
    const best = pool.reduce((a, b) => (((b as any).points ?? 0) > ((a as any).points ?? 0) ? b : a));
    const cls = (best as any).classification === 'transversal'
      ? 'Título transversal — válido para qualquer área de interesse — pontuação máxima de 40 pts'
      : `Título específico para ${(best as any).area || 'área(s) específica(s)'} — 20 pts`;
    return { title, blockIdx: effIdx, status: 'pontua', reason: cls, pts: (best as any).points, proof, auditNote: auditV?.note };
  });

  // Títulos com área "Outro" (__outro_mba__) nunca entram em `postMBAs` — adicionamos
  // aqui apenas os REJEITADOS, só para exibição (não entram na pontuação).
  const outroMbaRejeitados: MbaAnalysisItem[] = blocksList
    .map((b, origIdx) => ({ ...b, origIdx }))
    .filter((b) => b.area === '__outro_mba__' && b.name?.trim())
    .map((b): MbaAnalysisItem | null => {
      const auditV = getAuditV(`postmba-${b.origIdx}`);
      const mbaKey = `mba_${b.origIdx}:${b.name!.trim()}`;
      if (auditV?.status !== 'rejected') return null;
      return { title: b.name!.trim(), blockIdx: b.origIdx, status: 'rejeitado', reason: `Comprovante rejeitado pelo auditor${auditV.note ? ` — ${auditV.note}` : ''}`, pts: 0, proof: proofStatus(mbaKey), auditNote: auditV.note };
    })
    .filter((x): x is MbaAnalysisItem => x !== null);

  return [...base, ...outroMbaRejeitados].map((m) => (
    m.status !== 'rejeitado' && m.auditNote
      ? { ...m, reason: `${m.reason} · Obs. da auditoria: "${m.auditNote}"` }
      : m
  ));
}

export function buildProjAnalysis(
  profile: ParticipantProfile,
  itemValidations: ItemValidationLite[],
  proofStatus: (key: string) => string,
  projectRelabels: Record<string, string> = {},
  catalogItems: CatalogItem[] = CATALOG_ITEMS
): ProjAnalysisItem[] {
  const getAuditV = (key: string) => {
    const matches = itemValidations.filter((v) => v.itemKey === key);
    if (matches.length === 0) return undefined;
    return matches.reduce((latest, current) => ((current.validatedAt || '') >= (latest.validatedAt || '') ? current : latest));
  };
  const allProjects = profile.selectedProjects || [];
  const selectedAreas: string[] = (profile as any).selectedAreas || [];
  const projectAreaMap: Record<string, string> = (profile as any).projectAreaMap || {};

  const result: ProjAnalysisItem[] = allProjects.map((proj, idx) => {
    const auditV = getAuditV(`projeto-${idx}`);
    const auditNote = auditV?.note;
    const effProj = projectRelabels[`projeto-${idx}`] || proj;
    const proof = proofStatus(`proj:${proj}`);
    const vinculadaArea = projectAreaMap[proj] || null;
    if (auditV?.status === 'rejected') {
      return { proj, status: 'rejeitado', reason: `Comprovante rejeitado pelo auditor${auditNote ? ` — ${auditNote}` : ''}`, pts: 0, area: vinculadaArea, proof, auditNote };
    }
    const catalogItem = catalogItems.find((i) => i.group === 'project' && i.label === effProj && i.area === vinculadaArea);
    const altAreaMatch = catalogItems.find(
      (i) => i.group === 'project' && i.label === effProj && i.area !== vinculadaArea && selectedAreas.includes((i.area || '') as any)
    );
    const altSuggestion = altAreaMatch
      ? ` Este projeto está catalogado para a área ${altAreaMatch.area} (${(altAreaMatch as any).points} pts), que também é uma das áreas de interesse do candidato — considere vincular o projeto a essa área em vez de ${vinculadaArea || 'nenhuma'}.`
      : '';
    if (!vinculadaArea) {
      return { proj, status: 'nao-pontua', reason: 'Projeto sem área vinculada — não entra no cálculo' + altSuggestion, pts: 0, area: null, proof, auditNote };
    }
    // Área vinculada precisa estar entre as áreas de interesse do candidato — senão o
    // motor central (computeTechnicalAdherence) nunca soma este projeto em nenhuma área.
    if (!selectedAreas.includes(vinculadaArea as any)) {
      return { proj, status: 'nao-pontua', reason: `Área vinculada (${vinculadaArea}) não está entre as áreas de interesse selecionadas` + altSuggestion, pts: 0, area: vinculadaArea, proof, auditNote };
    }
    if (!catalogItem) {
      return { proj, status: 'nao-pontua', reason: `O tema deste projeto não é aderente à área ${vinculadaArea} conforme o catálogo oficial de projetos estratégicos.` + altSuggestion, pts: 0, area: vinculadaArea, proof, auditNote };
    }
    // Teto de 20 pts por área, aplicado por ordem de declaração — mesmo critério já usado
    // no recálculo agregado (Math.min(20, soma)), mas explicitado por item para o auditor
    // ver exatamente quanto cada projeto está realmente contribuindo.
    const projsInSameArea = allProjects.filter((pp) => projectAreaMap[pp] === vinculadaArea);
    const itemsInArea = catalogItems.filter((i) => i.group === 'project' && projsInSameArea.includes(i.label) && i.area === vinculadaArea);
    const totalBefore = itemsInArea
      .filter((i) => projsInSameArea.indexOf(i.label) < projsInSameArea.indexOf(proj))
      .reduce((acc, i) => acc + (i as any).points, 0);
    const pts = (catalogItem as any).points;
    const effective = Math.max(0, Math.min(pts, 20 - totalBefore));
    const relabelNote = effProj !== proj ? ` · Reclassificado pelo administrador de "${proj}" para "${effProj}"` : '';
    if (effective <= 0) {
      return { proj, status: 'nao-pontua', reason: `Cap de 20 pts já atingido para a área ${vinculadaArea} — este projeto não adiciona pontos`, pts: 0, area: vinculadaArea, proof, auditNote };
    }
    return { proj, status: 'pontua', reason: `Área ${vinculadaArea} — ${pts} pts no catálogo${effective < pts ? ` (limitado a ${effective} pts pelo cap de 20 pts da área)` : ''}${relabelNote}`, pts: effective, area: vinculadaArea, proof, auditNote };
  });

  return result.map((m) => (
    m.status !== 'rejeitado' && m.auditNote
      ? { ...m, reason: `${m.reason} · Obs. da auditoria: "${m.auditNote}"` }
      : m
  ));
}
