import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { PerformanceRecord, ParticipantProfile } from '../../../lib/types';
import * as XLSX from 'xlsx';

interface UserRecord {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  selectedAreas?: string[];
}

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

/** Converte "99%" → 99 e percentuais numéricos do Excel (0,99) → 99 */
function parsePct(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).replace('%', '').replace(',', '.').trim();
  const n = Number(s);
  if (Number.isNaN(n)) return null;

  // O Excel pode armazenar 98% como o número 0,98.
  if (!String(val).includes('%') && n >= 0 && n <= 1) {
    return Math.round(n * 10000) / 100;
  }

  return n;
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

  // Carregar usuários do banco (todos os cadastrados, mesmo sem formulário preenchido)
  const users: UserRecord[] = await readJsonAsync('users', []);
  const participants: ParticipantProfile[] = await readJsonAsync('participants', []);

  // Índice de áreas de interesse pelos identificadores do formulário.
  // O e-mail é a chave principal, pois o id interno do usuário pode ser diferente
  // do id salvo no questionário.
  const areasIndex = new Map<string, string[]>();
  const normalizeIdentifier = (value: string | undefined) => (value || '').trim().toLowerCase();
  for (const p of participants) {
    if (!p.selectedAreas?.length) continue;
    for (const key of [p.email, p.id]) {
      const normalizedKey = normalizeIdentifier(key);
      if (normalizedKey) areasIndex.set(normalizedKey, p.selectedAreas);
    }
  }

  // Índice por nome normalizado → usuário
  const nameIndex = new Map<string, UserRecord>();
  for (const u of users) {
    if (u.role === 'participant' && u.name) {
      nameIndex.set(normalizeName(u.name), u);
    }
  }

  // Processar linhas de dados
  const date = '2026-07-31'; // data de fechamento do engajamento do BS3
  const performance: PerformanceRecord[] = await readJsonAsync('performance', []);
  const existingIds = new Set(performance.map((r) => r.id));

  const imported: string[] = [];
  const notFound: string[] = [];
  const skipped: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = String(row[colPessoa] ?? '').trim();
    if (!rawName) continue;

    // Neste ciclo, importar somente participantes do BS3.
    // startsWith cobre exportações em que a data aparece junto da turma (ex.: "BS3 31/07/2026").
    const turma = colTurma >= 0 ? String(row[colTurma] ?? '').trim().toUpperCase() : '';
    if (colTurma >= 0 && !turma.startsWith('BS3')) {
      skipped.push(`${rawName} (${turma || 'turma não informada'} — fora do ciclo BS3)`);
      continue;
    }

    const score100 = parsePct(row[colMedia]);
    if (score100 === null) {
      skipped.push(`${rawName} (score inválido: ${row[colMedia]})`);
      continue;
    }

    const user = nameIndex.get(normalizeName(rawName));
    if (!user) {
      notFound.push(rawName);
      continue;
    }

    const participantId = user.id || user.email || '';
    // Cruzamento principal por e-mail; fallback pelo id para registros legados.
    const areas: string[] =
      areasIndex.get(normalizeIdentifier(user.email)) ??
      areasIndex.get(normalizeIdentifier(participantId)) ??
      [];

    if (areas.length === 0) {
      // Participante ainda não preencheu o formulário — registrar score sem área específica
      // Usar área especial 'PENDING' para indicar que será vinculado quando o formulário for preenchido
      const id = `${participantId}-PENDING-${date}`;
      if (existingIds.has(id)) {
        const idx = performance.findIndex((r) => r.id === id);
        if (idx >= 0) performance[idx].score100 = score100;
      } else {
        performance.push({ id, participantId, area: 'PENDING' as any, score100, date });
        existingIds.add(id);
      }
      imported.push(`${rawName} → PENDING (formulário ainda não preenchido, score: ${score100}%)`);
      continue;
    }

    // Se uma importação anterior deixou o participante como PENDING por falha no
    // cruzamento, remover esse registro antes de gravar as áreas corretas.
    const pendingId = `${participantId}-PENDING-${date}`;
    const pendingIdx = performance.findIndex((r) => r.id === pendingId);
    if (pendingIdx >= 0) {
      performance.splice(pendingIdx, 1);
      existingIds.delete(pendingId);
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
