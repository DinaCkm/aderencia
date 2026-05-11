import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson, writeJson } from '../../../lib/db';
import type { PerformanceRecord } from '../../../lib/types';

export const config = {
  api: {
    bodyParser: false
  }
};

function parseCsv(csv: string) {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

async function readRawBody(request: NextApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const text = await readRawBody(req);
  if (!text) return res.status(400).json({ error: 'Request body must be CSV text.' });

  const rows = parseCsv(text);
  const performance = readJson<PerformanceRecord[]>('performance', []);
  for (const row of rows) {
    const [participantId, area, scoreString, date] = row;
    const score100 = Number(scoreString);
    if (!participantId || !area || Number.isNaN(score100) || !date) continue;
    performance.push({ id: `${participantId}-${area}-${date}`, participantId, area: area as any, score100, date });
  }
  writeJson('performance', performance);
  return res.status(200).json({ message: `Importados ${rows.length} registros.` });
}
