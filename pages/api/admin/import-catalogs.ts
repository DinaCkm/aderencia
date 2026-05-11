import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson, writeJson } from '../../../lib/db';
import { OFFICIAL_AREAS } from '../../../lib/constants';
import type { CatalogItem, AreaCode } from '../../../lib/types';

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
  if (!text) {
    return res.status(400).json({ error: 'Request body must be CSV text.' });
  }

  const rows = parseCsv(text);
  const catalogs = readJson<CatalogItem[]>('catalogs', []);
  let imported = 0;

  for (const row of rows) {
    const [id, label, group, classification, area] = row;
    if (!id || !label || !group || !classification) {
      continue;
    }

    const item: CatalogItem = {
      id,
      label,
      group: group as CatalogItem['group'],
      classification: classification as CatalogItem['classification'],
      area: (area as AreaCode) || undefined
    };

    const existingIndex = catalogs.findIndex((entry) => entry.id === item.id);
    if (existingIndex >= 0) {
      catalogs[existingIndex] = item;
    } else {
      catalogs.push(item);
    }
    imported += 1;
  }

  writeJson('catalogs', catalogs);
  return res.status(200).json({ message: `Importados ${imported} itens de catálogo.` });
}
