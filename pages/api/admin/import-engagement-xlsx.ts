import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { PerformanceRecord, ParticipantProfile } from '../../../lib/types';
import * as XLSX from 'xlsx';

export const config = { api: { bodyParser: false } };

/** Normaliza nome: remove acentos, lowercase, espaços simples */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Converte "99%" → 99 */
function parsePct(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).replace('%', '').trim();
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
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

  // Parsear Excel
  let rows: any[][];
  try {
    const wb = XLSX.read(body, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
  } catch {
    return res.status(400).json({ error: 'Não foi possível ler o arquivo Excel. Verifique o formato.' });
  }

  if (rows.length < 2) return res.status(400).json({ error: 'Planilha sem dados.' });

  // Identificar colunas pelo cabeçalho
  const header = rows[0].map((h: any) => String(h).toLowerCase().trim());
  const colPessoa = header.findIndex((h) => h.includes('pessoa') || h.includes('nome'));
  const colTurma  = header.findIndex((h) => h.includes('turma'));
  const colMedia  = header.findIndex((h) => h.includes('média') || h.includes('media') || h.includes('final'));

  if (colPessoa === -1 || colMedia === -1) {
    return res.status(400).json({
      error: 'Colunas obrigatórias não encontradas. A planilha deve ter as colunas "Pessoa" e "Ind. Média: Engajamento Final".',
    });
  }

  // Carregar participantes do banco
  const participants: ParticipantProfile[] = await readJsonAsync('participants', []);

  // Índice por nome normalizado
  const nameIndex = new Map<string, ParticipantProfile>();
  for (const p of participants) {
    if (p.name) nameIndex.set(normalizeName(p.name), p);
  }

  // Processar linhas de dados
  const date = '2026-05-31'; // data de fechamento do engajamento
  const performance: PerformanceRecord[] = await readJsonAsync('performance', []);
  const existingIds = new Set(performance.map((r) => r.id));

  const imported: string[] = [];
  const notFound: string[] = [];
  const skipped: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = String(row[colPessoa] ?? '').trim();
    if (!rawName) continue;

    // Filtrar BS3 (fora do escopo deste ciclo)
    const turma = colTurma >= 0 ? String(row[colTurma] ?? '').trim().toUpperCase() : '';
    if (turma === 'BS3') {
      skipped.push(`${rawName} (BS3 — fora do escopo)`);
      continue;
    }

    const score100 = parsePct(row[colMedia]);
    if (score100 === null) {
      skipped.push(`${rawName} (score inválido: ${row[colMedia]})`);
      continue;
    }

    const participant = nameIndex.get(normalizeName(rawName));
    if (!participant) {
      notFound.push(rawName);
      continue;
    }

    const participantId = participant.id || participant.email;
    const areas: string[] = participant.selectedAreas ?? [];

    if (areas.length === 0) {
      skipped.push(`${rawName} (sem áreas de interesse cadastradas)`);
      continue;
    }

    // Criar um registro de performance para cada área de interesse
    for (const area of areas) {
      const id = `${participantId}-${area}-${date}`;
      if (existingIds.has(id)) {
        // Atualizar score existente
        const idx = performance.findIndex((r) => r.id === id);
        if (idx >= 0) performance[idx].score100 = score100;
      } else {
        performance.push({ id, participantId, area: area as any, score100, date });
        existingIds.add(id);
      }
    }
    imported.push(`${rawName} → ${areas.join(', ')} (${score100}%)`);
  }

  await writeJsonAsync('performance', performance);

  return res.status(200).json({
    message: `Engajamento importado com sucesso.`,
    imported: imported.length,
    notFound: notFound.length,
    skipped: skipped.length,
    details: { imported, notFound, skipped },
  });
}
