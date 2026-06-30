import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { CATALOG_ITEMS } from '../../../lib/constants';

const TRANSVERSAL = 'Programa de sucessão e desenvolvimento de lideranças';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  
  const impacted = [];

  for (const p of participants) {
    if (!(p.selectedProjects || []).includes(TRANSVERSAL)) continue;

    const areas = p.selectedAreas || [];
    const linkedArea = (p.projectAreaMap || {})[TRANSVERSAL];

    // Áreas onde vai ganhar pontuação nova (além da área vinculada)
    const newAreas = areas.filter((a: string) => {
      if (a === linkedArea) return false; // já pontua aqui
      const item = CATALOG_ITEMS.find(i => i.group === 'project' && i.label === TRANSVERSAL && i.area === a);
      return !!item; // só se existir no catálogo
    });

    if (newAreas.length > 0) {
      impacted.push({
        name: p.name,
        email: p.email,
        areas,
        linkedArea: linkedArea || 'não vinculado',
        newAreas,
        ptsPerArea: 15,
      });
    }
  }

  return res.status(200).json({
    total: impacted.length,
    candidates: impacted,
  });
}
