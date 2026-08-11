import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { CATALOG_ITEMS } from '../../../lib/constants';
import type { CatalogItem, ParticipantProfile } from '../../../lib/types';

// Grupos cuja pontuação (`points`) entra diretamente no cálculo da nota (ver lib/business.ts).
// Sem um valor explícito aqui, o motor de cálculo cai num fallback genérico (20 pts) que NÃO
// necessariamente corresponde à regra correta para a classificação escolhida — ex.: um
// Pós/MBA "transversal" sem `points` definido pontuaria como se fosse "específico de área"
// (20 pts), quando a regra oficial é 40 pts para transversal. Por isso `points` é obrigatório
// para estes grupos ao criar/editar pelo admin.
const SCORABLE_GROUPS = ['postMBA', 'project'];

// Sugestão de pontuação por grupo + classificação, usada só para validar um valor plausível
// e para o admin ter uma referência — a regra oficial completa está em lib/business.ts.
function suggestedPoints(group: string, classification: string): number | null {
  if (group === 'postMBA') return classification === 'transversal' ? 40 : 20;
  if (group === 'project') return 20; // varia por item (15–20 no catálogo oficial); serve de referência
  return null;
}

// Identifica participantes que já possuem, no cadastro, o rótulo (`label`) deste item de
// catálogo — usado para avisar o admin de quem será afetado pela alteração (a nota real só é
// recalculada na próxima vez que a ficha for aberta, já que o cálculo é sempre feito ao vivo
// com o catálogo mais atual — ver lib/catalog.ts::getEffectiveCatalogItems).
async function findAffectedParticipants(item: CatalogItem): Promise<{ id: string; name: string; email: string }[]> {
  if (!SCORABLE_GROUPS.includes(item.group)) return [];
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const list = Array.isArray(participants) ? participants : [];
  const field = item.group === 'postMBA' ? 'postMBAs' : 'selectedProjects';
  return list
    .filter((p) => Array.isArray((p as any)[field]) && (p as any)[field].includes(item.label))
    .map((p) => ({ id: p.id, name: p.name || p.email, email: p.email }));
}

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
    if (SCORABLE_GROUPS.includes(item.group) && (typeof item.points !== 'number' || Number.isNaN(item.points) || item.points <= 0)) {
      return res.status(400).json({
        error: `Pontuação (points) é obrigatória e deve ser um número maior que zero para itens do grupo "${item.group}". Sugestão para esta classificação: ${suggestedPoints(item.group, item.classification)} pts.`,
      });
    }
    const existing = customArray.findIndex((c) => c.id === item.id);
    if (existing >= 0) { customArray[existing] = item; } else { customArray.push(item); }
    await writeJsonAsync('catalogs', customArray);
    const affected = await findAffectedParticipants(item);
    return res.status(200).json({ catalogs: buildAll(), message: 'Item salvo com sucesso.', affected });
  }

  if (req.method === 'PUT') {
    const item = req.body as CatalogItem;
    if (!item || !item.id) return res.status(400).json({ error: 'ID obrigatório.' });
    if (SCORABLE_GROUPS.includes(item.group) && (typeof item.points !== 'number' || Number.isNaN(item.points) || item.points <= 0)) {
      return res.status(400).json({
        error: `Pontuação (points) é obrigatória e deve ser um número maior que zero para itens do grupo "${item.group}". Sugestão para esta classificação: ${suggestedPoints(item.group, item.classification)} pts.`,
      });
    }
    const idx = customArray.findIndex((c) => c.id === item.id);
    if (idx >= 0) { customArray[idx] = item; } else { customArray.push(item); }
    await writeJsonAsync('catalogs', customArray);
    const affected = await findAffectedParticipants(item);
    return res.status(200).json({ catalogs: buildAll(), message: 'Item atualizado com sucesso.', affected });
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
