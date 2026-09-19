import type { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import { readJsonAsync } from '../../../lib/db';
import {
  buildAreaAssessment,
  sortByAdherenceRanking,
  dedupeItemValidations,
} from '../../../lib/business';
import { getEffectiveCatalogItems } from '../../../lib/catalog';
import type {
  ParticipantProfile,
  AreaAssessment,
  DiscReport,
  PerformanceRecord,
} from '../../../lib/types';

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  validatedAt?: string;
}
interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
  experienceOverride?: { managerialMonths?: number; interimMonths?: number; note?: string };
  projectRelabels?: Record<string, string>;
  exceptionAssignments?: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }>;
}

type AssessmentRow = {
  area: string;
  rank: number | string;
  name: string;
  matricula: string;
  unit: string;
  role: string;
  validationStatus: string;
  quadrant: string;
  technicalScore: number | null;
  technicalPotential: number | null;
  rawTotal: number;
  postMBATitle: string;
  postMBAPoints: number;
  managerialMonths: number;
  interimMonths: number;
  expPoints: number;
  projects: string;
  projectPoints: number;
  behavioralScore: number | null;
  performance100: number | null;
  performanceConverted: number | null;
  discScore: number | null;
  totalAdherence: number | null;
  validationStatus2: string;
  hasPending: string;
  // for sorting only
  _behavioralAdherence?: number;
  _performanceConverted?: number;
  _participantId: string;
};

const PURPLE = '5B2D8E';
const WHITE  = 'FFFFFFFF';
const BORDER = 'FFCCCCCC';

function borderCell(cell: ExcelJS.Cell) {
  const b: ExcelJS.Border = { style: 'thin', color: { argb: BORDER } };
  cell.border = { top: b, left: b, bottom: b, right: b };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const participants  = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const performance   = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discs         = await readJsonAsync<DiscReport[]>('discReports', []);
  const profileAudits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const catalogItems  = await getEffectiveCatalogItems();

  const rows: (Omit<AssessmentRow, 'rank'> & { _sort: number | null })[] = [];

  for (const participant of participants) {
    if (!participant.selectedAreas?.length) continue;

    const profileAudit      = profileAudits.find((a) => a.participantId === participant.id);
    const rawValidations    = profileAudit?.itemValidations || [];
    const dedupedValidations = dedupeItemValidations(rawValidations);

    const rejectedItems = dedupedValidations
      .filter((v) => v.status === 'rejected')
      .map((v) => ({ itemKey: v.itemKey, note: v.note }));

    const allItemNotes: Record<string, string> = {};
    dedupedValidations.forEach((v) => { if (v.note) allItemNotes[v.itemKey] = v.note; });

    const experienceOverride  = profileAudit?.experienceOverride;
    const projectRelabels     = profileAudit?.projectRelabels     || {};
    const exceptionAssignments = profileAudit?.exceptionAssignments || {};

    const hasPending = dedupedValidations.some((v) => v.status === 'pending');

    // effective experience months (considers admin override)
    const hasOverride = experienceOverride &&
      (experienceOverride.managerialMonths !== undefined || experienceOverride.interimMonths !== undefined);
    const effManagerial = hasOverride && experienceOverride!.managerialMonths !== undefined
      ? experienceOverride!.managerialMonths!
      : (participant.managerialMonths ?? 0);
    const effInterim = hasOverride && experienceOverride!.interimMonths !== undefined
      ? experienceOverride!.interimMonths!
      : (participant.interimMonths ?? 0);

    for (const area of participant.selectedAreas) {
      const assessment: AreaAssessment = buildAreaAssessment(
        participant, area, performance, discs,
        exceptionAssignments, rejectedItems, allItemNotes,
        experienceOverride, projectRelabels, catalogItems,
        dedupedValidations,
      );

      const stepNum = (name: string): number => {
        const s = assessment.calculationSteps.find((c) => c.name === name);
        return (typeof s?.value === 'number' ? s.value : 0);
      };

      const postMBAPoints = stepNum('Pós/MBA (melhor título para a área)');
      const expPoints     = stepNum('Experiência gerencial/interina');
      const projPoints    = stepNum('Projetos estratégicos da área');
      const rawTotal      = postMBAPoints + expPoints + projPoints;

      const totalAdh = assessment.behavioralAdherence !== undefined
        ? Math.round((assessment.technicalAdherence + assessment.behavioralAdherence) * 10) / 10
        : null;

      rows.push({
        area,
        name:            participant.name || participant.id,
        matricula:       participant.matrícula || '',
        unit:            participant.unit || '',
        role:            participant.currentRole || '',
        validationStatus: participant.validationStatus || '',
        quadrant:        assessment.quadrant,
        technicalScore:  assessment.technicalAdherence,
        technicalPotential: assessment.technicalAdherencePotential ?? null,
        rawTotal,
        postMBATitle:    assessment.postMBADetail?.titleUsedDisplay
                           || assessment.postMBADetail?.titleUsed || '(nenhum)',
        postMBAPoints,
        managerialMonths: effManagerial,
        interimMonths:    effInterim,
        expPoints,
        projects:  (assessment.projectsDetail || []).map((p) => p.label).join('; ') || '(nenhum)',
        projectPoints: projPoints,
        behavioralScore:      assessment.behavioralAdherence     ?? null,
        performance100:       assessment.performanceScore        ?? null,
        performanceConverted: assessment.performanceConverted    ?? null,
        discScore:            assessment.discScore               ?? null,
        totalAdherence:       totalAdh,
        validationStatus2:    participant.validationStatus || '',
        hasPending:           hasPending ? 'Sim' : 'Não',
        _behavioralAdherence: assessment.behavioralAdherence,
        _performanceConverted: assessment.performanceConverted ?? undefined,
        _participantId: participant.id,
        _sort: totalAdh,
      });
    }
  }

  // Sort rows: by area alphabetically, then by adherence ranking within each area
  const areaOrder = [...new Set(rows.map((r) => r.area))].sort();

  const workbook = new ExcelJS.Workbook();
  workbook.creator  = 'Aderência — CKM Talents / SEBRAE-TO';
  workbook.created  = new Date();

  // ── Sheet 1 — Aderência por Área ─────────────────────────────────────────

  const sheet = workbook.addWorksheet('Aderência por Área', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  const COL_DEFS = [
    { header: 'Área',                       key: 'area',               width: 9  },
    { header: 'Posição',                    key: 'rank',               width: 8  },
    { header: 'Nome',                       key: 'name',               width: 30 },
    { header: 'Matrícula',                  key: 'matricula',          width: 11 },
    { header: 'Unidade',                    key: 'unit',               width: 9  },
    { header: 'Cargo Atual',                key: 'role',               width: 22 },
    { header: 'Quadrante Nine Box',         key: 'quadrant',           width: 38 },
    { header: 'Nota Técnica\n(0-10)',        key: 'technicalScore',     width: 13 },
    { header: 'Nota Técnica\nPotencial',    key: 'technicalPotential', width: 14 },
    { header: 'Total Bruto\n(0-80)',         key: 'rawTotal',           width: 12 },
    { header: 'Pós/MBA — Título',           key: 'postMBATitle',       width: 35 },
    { header: 'Pts Pós/MBA\n(0-40)',         key: 'postMBAPoints',      width: 13 },
    { header: 'Meses\nGerencial',            key: 'managerialMonths',   width: 11 },
    { header: 'Meses\nInterino',             key: 'interimMonths',      width: 11 },
    { header: 'Pts Experiência\n(0-20)',     key: 'expPoints',          width: 14 },
    { header: 'Projetos Vinculados',        key: 'projects',           width: 40 },
    { header: 'Pts Projetos\n(0-20)',        key: 'projectPoints',      width: 13 },
    { header: 'Nota\nComportamental\n(0-10)',key: 'behavioralScore',    width: 15 },
    { header: 'Performance\n(0-100)',        key: 'performance100',     width: 13 },
    { header: 'Perf. Convertida\n(0-10)',   key: 'performanceConverted',width: 15 },
    { header: 'DISC\n(0-10)',               key: 'discScore',          width: 11 },
    { header: 'Aderência Total\n(Téc+Comp)',key: 'totalAdherence',     width: 16 },
    { header: 'Status\nValidação',           key: 'validationStatus2',  width: 13 },
    { header: 'Itens\nPendentes?',           key: 'hasPending',         width: 12 },
  ];

  sheet.columns = COL_DEFS;

  // Header row style
  const hdr = sheet.getRow(1);
  hdr.height = 42;
  hdr.eachCell((cell) => {
    cell.fill        = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PURPLE } };
    cell.font        = { bold: true, color: { argb: WHITE }, size: 9 };
    cell.alignment   = { vertical: 'middle', horizontal: 'center', wrapText: true };
    borderCell(cell);
  });

  // Data rows
  let rowIdx = 2;
  const PALE_PURPLE = 'EDE7F6';
  const PALE_GRAY   = 'F5F5F5';
  let toggle = false;

  // Numeric cols (1-indexed)
  const NUM_COLS = new Set([8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22]);

  for (const area of areaOrder) {
    toggle = !toggle;
    const bg = toggle ? PALE_PURPLE : PALE_GRAY;

    const areaEntries = rows.filter((r) => r.area === area);

    // Build sortable entries
    const sortable = areaEntries.map((r) => ({
      ...r,
      participantId:        r._participantId,
      behavioralAdherence:  r._behavioralAdherence,
      performanceConverted: r._performanceConverted,
      discCorrelationPct:   undefined as number | undefined,
    }));

    const sorted = sortByAdherenceRanking(sortable);

    let rank = 1;
    for (const row of sorted) {
      const hasFullData = row.behavioralAdherence !== undefined;
      const rankDisplay = hasFullData ? rank++ : '—';

      const excelRow = sheet.getRow(rowIdx++);
      excelRow.height = 18;

      const n = (v: number | null | undefined) => (v !== null && v !== undefined) ? v : '';

      excelRow.values = [
        '',               // col 1 — area (filled below)
        rankDisplay,
        row.name,
        row.matricula,
        row.unit,
        row.role,
        row.quadrant,
        n(row.technicalScore),
        n(row.technicalPotential),
        n(row.rawTotal),
        row.postMBATitle,
        n(row.postMBAPoints),
        row.managerialMonths,
        row.interimMonths,
        n(row.expPoints),
        row.projects,
        n(row.projectPoints),
        n(row.behavioralScore),
        n(row.performance100),
        n(row.performanceConverted),
        n(row.discScore),
        n(row.totalAdherence),
        row.validationStatus2,
        row.hasPending,
      ];
      // Set area in col 1 directly (values[0] is ignored by ExcelJS when using .values = [...])
      excelRow.getCell(1).value = area;

      excelRow.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } };
        cell.font      = { size: 9 };
        cell.alignment = { vertical: 'middle', wrapText: false };
        borderCell(cell);

        if (NUM_COLS.has(col) && typeof cell.value === 'number') {
          cell.numFmt    = '0.0';
          cell.alignment = { ...cell.alignment, horizontal: 'center' };
        }

        // Center: area, rank, unit, status, pending
        if ([1, 2, 5, 23, 24].includes(col)) {
          cell.alignment = { ...cell.alignment, horizontal: 'center' };
        }

        // Highlight pending
        if (col === 24 && cell.value === 'Sim') {
          cell.font = { ...cell.font, bold: true, color: { argb: 'FFC0392B' } };
        }

        // Color Nine Box quadrant cell
        if (col === 7) {
          const q = String(cell.value || '');
          if (q.includes('Alta') && q.includes('Comportamental Alta') && q.includes('Técnica')) {
            // Both high → green
            if (q.startsWith('Tecnicamente Alta')) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27AE60' } };
              cell.font = { ...cell.font, color: { argb: WHITE } };
            }
          } else if (q.includes('Baixa') && q.includes('Comportamental Baixa')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE74C3C' } };
            cell.font = { ...cell.font, color: { argb: WHITE } };
          }
        }
      });
    }
  }

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: rowIdx - 1, column: COL_DEFS.length },
  };

  // ── Sheet 2 — Resumo por Área ─────────────────────────────────────────────

  const sumSheet = workbook.addWorksheet('Resumo por Área', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  sumSheet.columns = [
    { header: 'Área',                      key: 'area',          width: 12 },
    { header: 'Candidatos',                key: 'count',         width: 13 },
    { header: 'Média Técnica',             key: 'avgTech',       width: 16 },
    { header: 'Média Comportamental',      key: 'avgBeh',        width: 20 },
    { header: 'Média Aderência Total',     key: 'avgTotal',      width: 20 },
    { header: 'Nota Técnica Máx.',         key: 'maxTech',       width: 17 },
    { header: 'Nota Técnica Mín.',         key: 'minTech',       width: 17 },
    { header: 'Com DISC + Performance',    key: 'withBehavioral',width: 22 },
    { header: 'Com Itens Pendentes',       key: 'withPending',   width: 20 },
  ];

  const sumHdr = sumSheet.getRow(1);
  sumHdr.height = 30;
  sumHdr.eachCell((cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PURPLE } };
    cell.font      = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    borderCell(cell);
  });

  const avg = (vals: number[]) =>
    vals.length === 0 ? null : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;

  for (const area of areaOrder) {
    const ar = rows.filter((r) => r.area === area);
    const techs  = ar.map((r) => r.technicalScore).filter((v): v is number => v !== null);
    const behs   = ar.map((r) => r.behavioralScore).filter((v): v is number => v !== null);
    const totals = ar.map((r) => r.totalAdherence).filter((v): v is number => v !== null);

    const sumRow = sumSheet.addRow({
      area,
      count:         ar.length,
      avgTech:       avg(techs),
      avgBeh:        avg(behs),
      avgTotal:      avg(totals),
      maxTech:       techs.length ? Math.max(...techs) : null,
      minTech:       techs.length ? Math.min(...techs) : null,
      withBehavioral: ar.filter((r) => r.behavioralScore !== null).length,
      withPending:    ar.filter((r) => r.hasPending === 'Sim').length,
    });
    sumRow.height = 20;
    sumRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font      = { size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      borderCell(cell);
      if (typeof cell.value === 'number') cell.numFmt = '0.0';
    });
  }

  // ── Respond ───────────────────────────────────────────────────────────────

  const date     = new Date().toISOString().slice(0, 10);
  const filename = `aderencia-sebrae-to-${date}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const buffer = await workbook.xlsx.writeBuffer();
  return res.status(200).send(buffer);
}
