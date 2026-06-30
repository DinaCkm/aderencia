import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { CATALOG_ITEMS } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);

  const issues: Array<{
    name: string;
    email: string;
    selectedAreas: string[];
    mba: string;
    status: string;
    reason: string;
    pts: number;
  }> = [];

  for (const p of participants) {
    const mbas = p.postMBAs || [];
    const areas = p.selectedAreas || [];

    for (const mba of mbas) {
      if (!mba) continue;

      // Verifica se existe no catálogo
      const matches = CATALOG_ITEMS.filter(i => i.group === 'postMBA' && i.label === mba);

      if (matches.length === 0) {
        // Fora do catálogo — recebe 20 pts mínimo
        issues.push({
          name: p.name,
          email: p.email,
          selectedAreas: areas,
          mba,
          status: 'fora-catalogo',
          reason: 'Título não encontrado no catálogo — recebe 20 pts mínimo',
          pts: 20,
        });
      } else {
        // Verifica se é transversal (40 pts) ou específico (20 pts)
        const transversal = matches.find(i => (i as any).classification === 'transversal');
        const best = matches.reduce((a, b) => b.points > a.points ? b : a);

        // Verifica se algum dos títulos é específico para uma área que o candidato concorre
        const specificForArea = matches.filter(i =>
          (i as any).classification !== 'transversal' &&
          areas.includes((i as any).area || '')
        );

        if (transversal) {
          // Tudo certo — 40 pts transversal
        } else if (specificForArea.length > 0) {
          // Tudo certo — 20 pts específico para área que concorre
        } else if (matches.length > 0) {
          // Existe no catálogo mas para área que não concorre — recebe 20 pts mesmo assim
          issues.push({
            name: p.name,
            email: p.email,
            selectedAreas: areas,
            mba,
            status: 'especifico-area-diferente',
            reason: `Título específico para ${matches.map(i => (i as any).area).join('/')} — candidato não concorre a essa área mas recebe 20 pts`,
            pts: 20,
          });
        }
      }
    }
  }

  // Agrupa por candidato
  const byCandidate = issues.reduce((acc, issue) => {
    const key = issue.email;
    if (!acc[key]) acc[key] = { name: issue.name, email: issue.email, selectedAreas: issue.selectedAreas, mbas: [] };
    acc[key].mbas.push({ mba: issue.mba, status: issue.status, reason: issue.reason, pts: issue.pts });
    return acc;
  }, {} as Record<string, any>);

  return res.status(200).json({
    total: issues.length,
    candidates: Object.values(byCandidate),
  });
}
