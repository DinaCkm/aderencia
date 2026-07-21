import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { CATALOG_ITEMS } from '../../../lib/constants';
import type { CatalogItem } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const customItems = await readJsonAsync<CatalogItem[]>('catalogs', []);
  const customArray = Array.isArray(customItems) ? customItems : [];

  // Mantido aqui (com o campo 'source' extra, só para exibição na tela de Catálogos).
  // O cálculo de pontuação e os seletores usam lib/catalog.ts::getEffectiveCatalogItems,
  // que aplica a mesma lógica de merge sem o campo 'source'.
  const buildAll = () => {
    const customIds = new Set(customArray.map((c) => c.id));
    const fixedOverridden = CATALOG_ITEMS.map((i) => {
      const override = customArray.find((c) => c.id === i.id);
      return override ? { ...override, source: 'custom' as const } : { ...i, source: 'fixed' as const };
    });
    const extraCustom = customArray.filter((c) => !CATALOG_ITEMS.find((i) => i.id === c.id));
    return [...fixedOverridden, ...extraCustom.map((i) => ({ ...i, source: 'custom' as const }))];
  };

  if (req.method === 'GET') {
    const allItems = buildAll();
    return res.status(200).json({ catalogs: allItems, total: allItems.length });
  }

  if (req.method === 'POST') {
    const item = req.body as CatalogItem;
    if (!item || !item.id || !item.label || !item.group || !item.classification) {
      return res.status(400).json({ error: 'Dados do catálogo incompletos.' });
    }
    const existing = customArray.findIndex((c) => c.id === item.id);
    if (existing >= 0) { customArray[existing] = item; } else { customArray.push(item); }
    await writeJsonAsync('catalogs', customArray);
    return res.status(200).json({ catalogs: buildAll(), message: 'Item salvo com sucesso.' });
  }

  if (req.method === 'PUT') {
    const item = req.body as CatalogItem;
    if (!item || !item.id) return res.status(400).json({ error: 'ID obrigatório.' });
    const idx = customArray.findIndex((c) => c.id === item.id);
    if (idx >= 0) { customArray[idx] = item; } else { customArray.push(item); }
    await writeJsonAsync('catalogs', customArray);
    return res.status(200).json({ catalogs: buildAll(), message: 'Item atualizado com sucesso.' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const updated = customArray.filter((c) => c.id !== String(id));
    await writeJsonAsync('catalogs', updated);
    return res.status(200).json({ message: 'Item removido.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
