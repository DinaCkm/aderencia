import type { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import { readJsonAsync } from '../../../lib/db';
import { buildAreaAssessment, dedupeItemValidations, sortByAdherenceRanking, getLatestPerformance } from '../../../lib/business';
import { getEffectiveCatalogItems } from '../../../lib/catalog';
import type { ParticipantProfile, PerformanceRecord, DISCRecord } from '../../../lib/types';
import type { ProfileAudit } from './audit-profile';

// ─────────────────────────────────────────────────────────────────────────────
// Ranking de Aderência por Unidade — exportação para Excel
// ─────────────────────────────────────────────────────────────────────────────
// Reproduz EXATAMENTE os mesmos números já usados na ficha de conclusão e na tela de
// Colaboradores: chama buildAreaAssessment (o mesmo motor central usado em todo o sistema),
// nunca recalcula nada de forma independente. As unidades são descobertas dinamicamente a
// partir das áreas de interesse realmente selecionadas pelos participantes — não há lista
// fixa de unidades no código. A ordenação usa sortByAdherenceRanking (lib/business.ts),
// a mesma função usada no ranking individual de cada ficha.
// ─────────────────────────────────────────────────────────────────────────────

interface RankRow {
  area: string;
  position: number;
  totalInArea: number;
  name: string;
  email: string;
  matricula: string;
  cargoAtual: string;
  areaAtual: string;
  notaTecnica: number | null; // null = dados incompletos
  notaComportamental: number | null;
  aderenciaTotal: number | null;
  nineBox: string;
  notaTecnicaPotencial: number | null;
}

const HEADER_FILL = 'FF1F4E78';
const HEADER_FONT_COLOR = 'FFFFFFFF';

function styleTitleRow(ws: ExcelJS.Worksheet, lastCol: number, title: string) {
  ws.mergeCells(1, 1, 1, lastCol);
  const cell = ws.getCell(1, 1);
  cell.value = title;
  cell.font = { bold: true, size: 14 };
  cell.alignment = { horizontal: 'center' };
}

function styleHeaderRow(ws: ExcelJS.Worksheet, rowNum: number, lastCol: number) {
  for (let c = 1; c <= lastCol; c++) {
    const cell = ws.getCell(rowNum, c);
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: 'center' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discReports = await readJsonAsync<any[]>('discReports', []);
  const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);
  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const catalogItems = await getEffectiveCatalogItems();

  const submitted = participants.filter((p) => p.submittedAt);

  // Correlação DISC (%) mais recente por participante+área — usada só como critério de
  // desempate (item "correlação DISC" da regra de ordenação), não como nota principal.
  const discCorrMap: Record<string, number> = {};
  for (const r of discRecords) {
    discCorrMap[`${r.participantId}__${r.area}`] = r.correlationPct;
  }

  // Monta uma entrada por participante × área de interesse — reproduzindo exatamente o
  // mesmo cálculo (buildAreaAssessment) usado na ficha individual e na tela de Colaboradores.
  type Entry = RankRow & { participantId: string };
  const entriesByArea: Record<string, Entry[]> = {};

  for (const p of submitted) {
    const audit = audits.find((a) => a.participantId === p.id);
    const dedupedValidations = dedupeItemValidations(audit?.itemValidations || []);
    const exceptionAssignments = (audit as any)?.exceptionAssignments || {};
    const rejectedItems = dedupedValidations.filter((v) => v.status === 'rejected').map((v) => ({ itemKey: v.itemKey, note: v.note }));
    const experienceOverride = (audit as any)?.experienceOverride;
    const projectRelabels = (audit as any)?.projectRelabels || {};

    for (const area of p.selectedAreas || []) {
      const assessment = buildAreaAssessment(p, area, performance, discReports, exceptionAssignments, rejectedItems, {}, experienceOverride, projectRelabels, catalogItems, dedupedValidations);
      const perfRecord = getLatestPerformance(performance, p.id, area);

      const entry: Entry = {
        area,
        position: 0, // preenchido depois de ordenar
        totalInArea: 0,
        participantId: p.id,
        name: p.name,
        email: p.email,
        matricula: p['matrícula'] || '',
        cargoAtual: p.currentRole || '',
        areaAtual: p.currentArea || '',
        notaTecnica: assessment.technicalAdherence,
        notaComportamental: assessment.behavioralAdherence ?? null,
        aderenciaTotal: assessment.behavioralAdherence !== undefined ? Math.round((assessment.technicalAdherence + assessment.behavioralAdherence) * 10) / 10 : null,
        nineBox: assessment.quadrant,
        notaTecnicaPotencial: assessment.technicalAdherencePotential ?? assessment.technicalAdherence,
      };
      (entry as any)._performanceConverted = perfRecord ? Math.round((perfRecord.score100 / 100) * 100) / 10 : undefined;
      (entry as any)._discCorrelationPct = discCorrMap[`${p.id}__${area}`];

      entriesByArea[area] = entriesByArea[area] || [];
      entriesByArea[area].push(entry);
    }
  }

  // Unidades descobertas dinamicamente (nunca uma lista fixa no código) — ordem alfabética.
  const units = Object.keys(entriesByArea).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Ordena cada unidade com o critério de desempate completo e atribui a posição.
  for (const unit of units) {
    const rankable = entriesByArea[unit].map((e) => ({
      participantId: e.participantId,
      name: e.name,
      technicalAdherence: e.notaTecnica ?? 0,
      behavioralAdherence: e.notaComportamental === null ? undefined : e.notaComportamental,
      performanceConverted: (e as any)._performanceConverted,
      discCorrelationPct: (e as any)._discCorrelationPct,
    }));
    const sorted = sortByAdherenceRanking(rankable);
    const orderedEntries = sorted.map((r) => entriesByArea[unit].find((e) => e.participantId === r.participantId)!);
    orderedEntries.forEach((e, idx) => {
      e.position = idx + 1;
      e.totalInArea = orderedEntries.length;
    });
    entriesByArea[unit] = orderedEntries;
  }

  // ── Montagem do Excel ──────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Banco de Sucessores Aderência — Sebrae/TO';
  wb.created = new Date();

  // Aba 1 — Resumo Geral (todos os participantes, todas as unidades, uma linha por área de interesse)
  const wsGeral = wb.addWorksheet('Resumo Geral');
  const geralHeaders = ['Unidade', 'Posição', 'Nome', 'E-mail', 'Matrícula', 'Cargo Atual', 'Área Atual', 'Nota Técnica', 'Nota Comportamental', 'Aderência Total', 'Nine Box', 'Nota Técnica Potencial'];
  styleTitleRow(wsGeral, geralHeaders.length, 'RANKING DE ADERÊNCIA POR UNIDADE');
  wsGeral.addRow(geralHeaders);
  styleHeaderRow(wsGeral, 2, geralHeaders.length);
  wsGeral.columns = [
    { width: 12 }, { width: 12 }, { width: 30 }, { width: 34 }, { width: 12 },
    { width: 20 }, { width: 15 }, { width: 14 }, { width: 20 }, { width: 16 },
    { width: 42 }, { width: 20 },
  ];
  for (const unit of units) {
    for (const e of entriesByArea[unit]) {
      const row = wsGeral.addRow([
        e.area,
        `${e.position}º de ${e.totalInArea}`,
        e.name,
        e.email,
        e.matricula,
        e.cargoAtual,
        e.areaAtual,
        e.notaTecnica ?? 'Não disponível',
        e.notaComportamental ?? 'Não disponível',
        e.aderenciaTotal ?? 'Não disponível',
        e.nineBox,
        e.notaTecnicaPotencial ?? 'Não disponível',
      ]);
      [8, 9, 10, 12].forEach((col) => { row.getCell(col).numFmt = '0.0'; });
    }
  }
  wsGeral.views = [{ state: 'frozen', ySplit: 2 }];
  wsGeral.autoFilter = { from: { row: 2, column: 1 }, to: { row: wsGeral.rowCount, column: geralHeaders.length } };

  // Aba 2 — Resumo por Unidade
  const wsResumo = wb.addWorksheet('Resumo por Unidade');
  const resumoHeaders = ['Unidade', 'Quantidade de interessados', 'Maior aderência total', '1º colocado'];
  wsResumo.addRow(resumoHeaders);
  styleHeaderRow(wsResumo, 1, resumoHeaders.length);
  wsResumo.columns = [{ width: 15 }, { width: 25 }, { width: 22 }, { width: 35 }];
  for (const unit of units) {
    const entries = entriesByArea[unit];
    const withTotal = entries.filter((e) => e.aderenciaTotal !== null);
    const maxTotal = withTotal.length > 0 ? Math.max(...withTotal.map((e) => e.aderenciaTotal as number)) : null;
    const first = entries[0];
    const row = wsResumo.addRow([unit, entries.length, maxTotal ?? 'N/A', first ? first.name : '—']);
    if (typeof maxTotal === 'number') row.getCell(3).numFmt = '0.0';
  }

  // Abas 3+ — Uma por unidade
  const perUnitHeaders = ['Posição', 'Nome', 'E-mail', 'Matrícula', 'Cargo Atual', 'Área Atual', 'Nota Técnica', 'Nota Comportamental', 'Aderência Total', 'Nine Box'];
  for (const unit of units) {
    // Nomes de aba no Excel têm limite de 31 caracteres e não podem repetir — improvável
    // acontecer com códigos de unidade, mas o corte protege contra nomes futuros longos.
    const sheetName = unit.slice(0, 31);
    const ws = wb.addWorksheet(sheetName);
    styleTitleRow(ws, perUnitHeaders.length, `RANKING — ${unit}`);
    ws.addRow(perUnitHeaders);
    styleHeaderRow(ws, 2, perUnitHeaders.length);
    ws.columns = [
      { width: 12 }, { width: 30 }, { width: 34 }, { width: 12 }, { width: 20 },
      { width: 15 }, { width: 14 }, { width: 20 }, { width: 16 }, { width: 42 },
    ];
    for (const e of entriesByArea[unit]) {
      const row = ws.addRow([
        `${e.position}º de ${e.totalInArea}`,
        e.name,
        e.email,
        e.matricula,
        e.cargoAtual,
        e.areaAtual,
        e.notaTecnica ?? 'Não disponível',
        e.notaComportamental ?? 'Não disponível',
        e.aderenciaTotal ?? 'Não disponível',
        e.nineBox,
      ]);
      [7, 8, 9].forEach((col) => { row.getCell(col).numFmt = '0.0'; });
    }
    ws.views = [{ state: 'frozen', ySplit: 2 }];
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: ws.rowCount, column: perUnitHeaders.length } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Ranking_de_Aderencia_por_Unidade_${date}.xlsx"`);
  return res.status(200).send(Buffer.from(buffer));
}
