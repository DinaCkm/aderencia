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

  if (rows.length < 2) {
    return res.status(400).json({ error: 'O arquivo parece estar vazio ou sem dados.' });
  }

  // Cabeçalho sempre na linha 1 (índice 0)
  const headerIdx = 0;
  const headers = rows[headerIdx].map((c: unknown) => norm(c));

  // Mapear índices de colunas
  const findCol = (kw: string, after = -1) =>
    headers.findIndex((h: string, i: number) => i > after && h.includes(kw));

  const iEmail = findCol('email');
  const iNome  = findCol('nome');
  const iArea  = headers.findIndex((h: string) => h.includes('area') || h === 'codigo da area' || h.includes('codigo'));
  const iCorr  = findCol('correla');

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

  // Precisa de pelo menos: (email OU nome) + area + correlação
  if ((iEmail < 0 && iNome < 0) || iArea < 0 || iCorr < 0) {
    return res.status(400).json({
      error: `Colunas obrigatórias não encontradas. email:${iEmail}, nome:${iNome}, area:${iArea}, correlação:${iCorr}. Cabeçalho lido: ${headers.slice(0, 8).join(' | ')}`,
    });
  }

  // Carregar dados existentes
  const [discRecords, discReports, users] = await Promise.all([
    readJsonAsync<DISCRecord[]>('disc_records', []),
    readJsonAsync<DiscReport[]>('discReports', []),
    readJsonAsync<any[]>('users', []),
  ]);

  // Mapa email → participantId  (prioridade)
  const emailMap = new Map<string, string>();
  for (const u of users) {
    if (u.email) emailMap.set(u.email.toLowerCase().trim(), u.id || u.email);
  }

  // Mapa nome normalizado → participantId  (fallback)
  const nameMap = new Map<string, string>();
  for (const u of users) {
    if (u.name) nameMap.set(norm(u.name), u.id || u.email);
  }

  // Mapa participantId → nome real (para log)
  const nameById = new Map<string, string>();
  for (const u of users) {
    nameById.set(u.id || u.email, u.name || u.email);
  }

  const imported: string[] = [];
  const notFound: string[] = [];
  const errors: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  const updatedRecords = [...discRecords];
  const updatedReports = [...discReports];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const emailRaw = iEmail >= 0 ? String(row[iEmail] ?? '').toLowerCase().trim() : '';
    const nome     = iNome  >= 0 ? String(row[iNome]  ?? '').trim() : '';
    const areaRaw  = String(row[iArea] ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const corrRaw  = row[iCorr];

    // Pular linhas completamente vazias
    if (!emailRaw && !nome && !areaRaw) continue;
    if (!areaRaw) continue;

    // Aceitar REGIONAL como sinônimo de REGIONAIS
    const areaNorm = areaRaw === 'REGIONAL' ? 'REGIONAIS' : areaRaw;
    const area = areaNorm as AreaCode;
    if (!VALID_AREAS.includes(area)) {
      errors.push(`Linha ${i + 1}: área inválida "${areaRaw}" para ${emailRaw || nome}`);
      continue;
    }

    const corr = Number(String(corrRaw).replace('%', '').trim());
    if (isNaN(corr) || corr < 0 || corr > 100) {
      errors.push(`Linha ${i + 1}: correlação inválida "${corrRaw}" para ${emailRaw || nome}`);
      continue;
    }

    // Buscar participante: 1º por e-mail, 2º por nome
    let participantId: string | undefined;
    let matchedBy = '';

    if (emailRaw) {
      participantId = emailMap.get(emailRaw);
      if (participantId) matchedBy = 'email';
    }
    if (!participantId && nome) {
      participantId = nameMap.get(norm(nome));
      if (participantId) matchedBy = 'nome';
    }

    if (!participantId) {
      notFound.push(emailRaw ? `${emailRaw}${nome ? ` (${nome})` : ''}` : nome);
      continue;
    }

    const nomeReal = nameById.get(participantId) || nome || emailRaw;

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
      participantName: nomeReal,
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

    imported.push(`${nomeReal} → ${area} (${corr}%) [via ${matchedBy}]`);
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
