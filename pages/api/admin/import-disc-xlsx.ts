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

function normalizeStr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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

  // Ler Excel
  let rows: any[][];
  try {
    const wb = XLSX.read(body, { type: 'buffer' });
    // Procura aba "Dados DISC" ou usa a segunda aba, ou a primeira
    let sheetName = wb.SheetNames.find(n => n.includes('Dados') || n.includes('DISC'));
    if (!sheetName) sheetName = wb.SheetNames[1] ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
  } catch {
    return res.status(400).json({ error: 'Não foi possível ler o arquivo Excel. Verifique o formato.' });
  }

  // Encontrar linha de cabeçalho (contém "Nome" e "Área")
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i].map(c => normalizeStr(String(c)));
    if (row.some(c => c.includes('nome')) && row.some(c => c.includes('area') || c.includes('área'))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) {
    return res.status(400).json({ error: 'Cabeçalho não encontrado. Verifique se está usando o modelo correto.' });
  }

  const headers = rows[headerRow].map(c => normalizeStr(String(c)));

  // Mapeamento de colunas por palavra-chave
  const findCol = (keyword: string, startAfter = -1) =>
    headers.findIndex((h, idx) => idx > startAfter && h.includes(keyword));

  const iNome = findCol('nome');
  const iArea = headers.findIndex(h => h.includes('area') || h.includes('área'));
  const iCorr = findCol('correla');

  // Pessoa: primeiras ocorrências de D/I/S/C
  const iDP = findCol('domin');
  const iIP = findCol('influ');
  const iSP = findCol('estab');
  const iCP = findCol('confor');

  // Cargo: segundas ocorrências (após as da pessoa)
  const iDC = iDP !== -1 ? findCol('domin', iDP) : -1;
  const iIC = iIP !== -1 ? findCol('influ', iIP) : -1;
  const iSC = iSP !== -1 ? findCol('estab', iSP) : -1;
  const iCC = iCP !== -1 ? findCol('confor', iCP) : -1;

  const iPosA = findCol('positiv');
  const iPos = iPosA !== -1 ? iPosA : findCol('destac');
  const iDevA = findCol('desenvolv');
  const iDev = iDevA !== -1 ? iDevA : findCol('nao se destac');

  if (iNome === -1 || iArea === -1 || iCorr === -1) {
    return res.status(400).json({
      error: `Colunas obrigatórias não encontradas. (nome:${iNome}, area:${iArea}, correlação:${iCorr}). Verifique o modelo.`
    });
  }

  // Carregar dados existentes
  const [discRecords, discReports, users] = await Promise.all([
    readJsonAsync<DISCRecord[]>('disc_records', []),
    readJsonAsync<DiscReport[]>('discReports', []),
    readJsonAsync<any[]>('users', []),
  ]);

  // Mapa de normalizedName -> userId
  const userMap = new Map<string, string>();
  for (const u of users) {
    if (u.name) userMap.set(normalizeStr(u.name), u.id || u.email);
  }

  const imported: string[] = [];
  const notFound: string[] = [];
  const errors: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  const updatedRecords = [...discRecords];
  const updatedReports = [...discReports];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const nome = String(row[iNome] ?? '').trim();
    const areaRaw = String(row[iArea] ?? '').trim().toUpperCase();
    const corrRaw = row[iCorr];

    if (!nome || !areaRaw) continue;

    const area = areaRaw as AreaCode;
    if (!VALID_AREAS.includes(area)) {
      errors.push(`Linha ${i + 1}: área inválida "${areaRaw}"`);
      continue;
    }

    const corr = Number(corrRaw);
    if (isNaN(corr) || corr < 0 || corr > 100) {
      errors.push(`Linha ${i + 1}: correlação inválida "${corrRaw}" para ${nome}`);
      continue;
    }

    // Cruzar nome com usuários
    const participantId = userMap.get(normalizeStr(nome));
    if (!participantId) {
      notFound.push(`${nome} (${area})`);
      continue;
    }

    const personD = iDP !== -1 ? (Number(row[iDP] ?? 0) || 0) : 0;
    const personI = iIP !== -1 ? (Number(row[iIP] ?? 0) || 0) : 0;
    const personS = iSP !== -1 ? (Number(row[iSP] ?? 0) || 0) : 0;
    const personC = iCP !== -1 ? (Number(row[iCP] ?? 0) || 0) : 0;
    const jobD    = iDC !== -1 ? (Number(row[iDC] ?? 0) || 0) : 0;
    const jobI    = iIC !== -1 ? (Number(row[iIC] ?? 0) || 0) : 0;
    const jobS    = iSC !== -1 ? (Number(row[iSC] ?? 0) || 0) : 0;
    const jobC    = iCC !== -1 ? (Number(row[iCC] ?? 0) || 0) : 0;

    const posRaw = iPos !== -1 ? String(row[iPos] ?? '').trim() : '';
    const devRaw = iDev !== -1 ? String(row[iDev] ?? '').trim() : '';
    const strengths    = posRaw ? posRaw.split(';').map(s => s.trim()).filter(Boolean) : [];
    const developments = devRaw ? devRaw.split(';').map(s => s.trim()).filter(Boolean) : [];

    const record: DISCRecord = {
      id: randomUUID(),
      participantId,
      participantName: nome,
      area,
      correlationPct: corr,
      personD, personI, personS, personC,
      jobD, jobI, jobS, jobC,
      strengths,
      developments,
      importedAt: today,
    };

    // Upsert em disc_records
    const existingIdx = updatedRecords.findIndex(
      r => r.participantId === participantId && r.area === area
    );
    if (existingIdx >= 0) {
      updatedRecords[existingIdx] = { ...record, id: updatedRecords[existingIdx].id };
    } else {
      updatedRecords.push(record);
    }

    // Upsert em discReports (score10 = correlação / 10) — mantém compatibilidade com sistema legado
    const score10 = Math.round(corr / 10 * 10) / 10;
    const existingReportIdx = updatedReports.findIndex(
      r => r.participantId === participantId && r.area === area
    );
    if (existingReportIdx >= 0) {
      updatedReports[existingReportIdx] = {
        ...updatedReports[existingReportIdx],
        score10,
        date: today,
      };
    } else {
      updatedReports.push({
        id: randomUUID(),
        participantId,
        area,
        score10,
        date: today,
      });
    }

    imported.push(`${nome} → ${area} (${corr}%)`);
  }

  // Persistir
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
