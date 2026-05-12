import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { CatalogItem } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const catalogs = await readJsonAsync<CatalogItem[]>('catalogs', []);

  if (req.method === 'GET') {
    return res.status(200).json({ catalogs });
  }

  if (req.method === 'POST') {
    const item = req.body as CatalogItem;
    if (!item || !item.id || !item.label || !item.group || !item.classification) {
      return res.status(400).json({ error: 'Dados do catálogo incompletos.' });
    }
    catalogs.push(item);
    await writeJsonAsync('catalogs', catalogs);
    return res.status(200).json({ catalogs });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
