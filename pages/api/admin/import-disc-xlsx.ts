import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import * as XLSX from 'xlsx';
import type { AreaCode, DISCRecord, DiscReport } from '../../../lib/types';
import { randomUUID } from 'crypto';

export const config = { api: { bodyParser: false } };

const VALID_AREAS: AreaCode[] = [
  'UAC','UAS','UAUD','UGE','UGOC','UGP','UMC','URC','URI','UTIC','REGIONAIS',
  'RBP','RME','RMN','RNO','RPJ','RSG','RSU','RVA',
];

function norm(s: unknown): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await readRawBody(req);
  if (!body.length) return res.status(400).json({ error: 'Arquivo vazio.' });

  // Ler Excel — procura aba com "Dados" ou "DISC" no nome, senão usa a primeira
  let rows: any[][];
  try {
    const wb = XLSX.read(body, { type: 'buffer' });
    const sheetName =
      wb.SheetNames.find(n => n.includes('Dados') || n.includes('DISC')) ??
      wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
  } catch {
    return res.status(400).json({ error: 'Não foi possível ler o arquivo Excel.' });
  }

  // Encontrar linha de cabeçalho — estratégia em camadas:
  // 1) Busca dinâmica por linha com >= 5 colunas preenchidas contendo 'nome'
  // 2) Fallback: linha 3 (índice 2) se tiver >= 5 colunas preenchidas
  // 3) Fallback: qualquer linha com >= 8 colunas preenchidas
  let headerIdx = -1;

  // Estratégia 1: busca dinâmica
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = rows[i];
    const normed = r.map((c: unknown) => norm(c));
    const filled = normed.filter((c: string) => c.length > 0).length;
    if (filled < 5) continue;
    const hasNome = normed.some((c: string) => c.includes('nome'));
    const hasArea = normed.some((c: string) => c.includes('area') || c.includes('codigo'));
    const hasDISC = normed.some((c: string) => c.includes('domin') || c.includes('influ') || c.includes('correla'));
    if (hasNome && (hasArea || hasDISC)) {
      headerIdx = i;
      break;
    }
  }

  // Estratégia 2: fallback linha 3 (índice 2) — posição padrão do modelo
  if (headerIdx === -1 && rows.length >= 3) {
    const r = rows[2];
    const filled = r.filter((c: unknown) => String(c).trim().length > 0).length;
    if (filled >= 5) headerIdx = 2;
  }

  // Estratégia 3: fallback — primeira linha com >= 8 colunas preenchidas
  if (headerIdx === -1) {
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const filled = rows[i].filter((c: unknown) => String(c).trim().length > 0).length;
      if (filled >= 8) { headerIdx = i; break; }
    }
  }

  if (headerIdx === -1) {
    const preview = rows.slice(0, 5).map((r, i) => ({
      linha: i + 1,
      colunas_preenchidas: r.filter((c: unknown) => String(c).trim()).length,
      primeiros_valores: r.slice(0, 4).map((c: unknown) => String(c).slice(0, 30)),
    }));
    return res.status(400).json({
      error: 'Cabeçalho não encontrado. Verifique se está usando a aba "📊 Dados DISC".',
      debug_preview: preview,
    });
  }

  const headers = rows[headerIdx].map((c: unknown) => norm(c));

  // Mapear índices de colunas
  const findCol = (kw: string, after = -1) =>
    headers.findIndex((h: string, i: number) => i > after && h.includes(kw));

  const iNome = findCol('nome');
  const iArea = headers.findIndex((h: string) => h.includes('area') || h === 'codigo da area' || h.includes('codigo'));
  const iCorr = findCol('correla');

  // D/I/S/C da pessoa (primeiras ocorrências)
  const iDP = findCol('domin');
  const iIP = findCol('influ');
  const iSP = findCol('estab');
  const iCP = findCol('confor');

  // D/I/S/C do cargo (segundas ocorrências)
  const iDC = iDP >= 0 ? findCol('domin', iDP) : -1;
  const iIC = iIP >= 0 ? findCol('influ', iIP) : -1;
  const iSC = iSP >= 0 ? findCol('estab', iSP) : -1;
  const iCC = iCP >= 0 ? findCol('confor', iCP) : -1;

  // Características
  const iPos = findCol('positiv') >= 0 ? findCol('positiv') : findCol('destac');
  const iDev = findCol('desenvolv') >= 0 ? findCol('desenvolv') : findCol('nao se destac');

  if (iNome < 0 || iArea < 0 || iCorr < 0) {
    return res.status(400).json({
      error: `Colunas obrigatórias não encontradas. nome:${iNome}, area:${iArea}, correlação:${iCorr}. Cabeçalho linha ${headerIdx + 1}: ${headers.slice(0, 6).join(' | ')}`,
    });
  }

  // Carregar dados existentes
  const [discRecords, discReports, users] = await Promise.all([
    readJsonAsync<DISCRecord[]>('disc_records', []),
    readJsonAsync<DiscReport[]>('discReports', []),
    readJsonAsync<any[]>('users', []),
  ]);

  // Mapa nome normalizado → participantId
  const userMap = new Map<string, string>();
  for (const u of users) {
    if (u.name) userMap.set(norm(u.name), u.id || u.email);
  }

  const imported: string[] = [];
  const notFound: string[] = [];
  const errors: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  const updatedRecords = [...discRecords];
  const updatedReports = [...discReports];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const nome = String(row[iNome] ?? '').trim();
    const areaRaw = String(row[iArea] ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const corrRaw = row[iCorr];

    if (!nome || !areaRaw) continue;

    const area = areaRaw as AreaCode;
    if (!VALID_AREAS.includes(area)) {
      errors.push(`Linha ${i + 1}: área inválida "${areaRaw}" para ${nome}`);
      continue;
    }

    const corr = Number(String(corrRaw).replace('%', '').trim());
    if (isNaN(corr) || corr < 0 || corr > 100) {
      errors.push(`Linha ${i + 1}: correlação inválida "${corrRaw}" para ${nome}`);
      continue;
    }

    const participantId = userMap.get(norm(nome));
    if (!participantId) {
      notFound.push(`${nome} (${area})`);
      continue;
    }

    const pD = iDP >= 0 ? (Number(row[iDP]) || 0) : 0;
    const pI = iIP >= 0 ? (Number(row[iIP]) || 0) : 0;
    const pS = iSP >= 0 ? (Number(row[iSP]) || 0) : 0;
    const pC = iCP >= 0 ? (Number(row[iCP]) || 0) : 0;
    const jD = iDC >= 0 ? (Number(row[iDC]) || 0) : 0;
    const jI = iIC >= 0 ? (Number(row[iIC]) || 0) : 0;
    const jS = iSC >= 0 ? (Number(row[iSC]) || 0) : 0;
    const jC = iCC >= 0 ? (Number(row[iCC]) || 0) : 0;

    const posRaw = iPos >= 0 ? String(row[iPos] ?? '').trim() : '';
    const devRaw = iDev >= 0 ? String(row[iDev] ?? '').trim() : '';
    const strengths    = posRaw ? posRaw.split(';').map(s => s.trim()).filter(Boolean) : [];
    const developments = devRaw ? devRaw.split(';').map(s => s.trim()).filter(Boolean) : [];

    const record: DISCRecord = {
      id: randomUUID(),
      participantId,
      participantName: nome,
      area,
      correlationPct: corr,
      personD: pD, personI: pI, personS: pS, personC: pC,
      jobD: jD, jobI: jI, jobS: jS, jobC: jC,
      strengths,
      developments,
      importedAt: today,
    };

    // Upsert disc_records
    const existIdx = updatedRecords.findIndex(
      r => r.participantId === participantId && r.area === area
    );
    if (existIdx >= 0) {
      updatedRecords[existIdx] = { ...record, id: updatedRecords[existIdx].id };
    } else {
      updatedRecords.push(record);
    }

    // Upsert discReports (compatibilidade legado)
    const score10 = Math.round(corr / 10 * 10) / 10;
    const existReportIdx = updatedReports.findIndex(
      r => r.participantId === participantId && r.area === area
    );
    if (existReportIdx >= 0) {
      updatedReports[existReportIdx] = { ...updatedReports[existReportIdx], score10, date: today };
    } else {
      updatedReports.push({ id: randomUUID(), participantId, area, score10, date: today });
    }

    imported.push(`${nome} → ${area} (${corr}%)`);
  }

  await Promise.all([
    writeJsonAsync('disc_records', updatedRecords),
    writeJsonAsync('discReports', updatedReports),
  ]);

  return res.status(200).json({
    success: true,
    imported: imported.length,
    notFound: notFound.length,
    errors: errors.length,
    details: { imported, notFound, errors },
  });
}
