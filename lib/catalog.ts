import { readJsonAsync } from './db';
import { CATALOG_ITEMS } from './constants';
import type { CatalogItem } from './types';

/**
 * Retorna o catálogo "efetivo" — a lista fixa (definida em lib/constants.ts) combinada com
 * os itens customizados criados pelo admin na tela de Catálogos (armazenados no banco, sob a
 * chave 'catalogs'). Um item customizado com o mesmo `id` de um item fixo o SOBRESCREVE;
 * itens customizados com `id` novo são simplesmente ADICIONADOS à lista.
 *
 * Este é o catálogo que deve ser usado em qualquer lugar que precise refletir itens criados
 * pelo admin — cálculo de pontuação, seletores de reclassificação de projeto/exceção, etc.
 * Usar CATALOG_ITEMS diretamente (import de lib/constants) ignora os itens customizados.
 */
export async function getEffectiveCatalogItems(): Promise<CatalogItem[]> {
  const customItems = await readJsonAsync<CatalogItem[]>('catalogs', []);
  const customArray = Array.isArray(customItems) ? customItems : [];
  const fixedOverridden = CATALOG_ITEMS.map((i) => {
    const override = customArray.find((c) => c.id === i.id);
    return override ? override : i;
  });
  const extraCustom = customArray.filter((c) => !CATALOG_ITEMS.find((i) => i.id === c.id));
  return [...fixedOverridden, ...extraCustom];
}
