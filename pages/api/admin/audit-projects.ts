import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { CATALOG_ITEMS } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);

  const issues: Array<{
    name: string;
    email: string;
    project: string;
    linkedArea: string;
    candidateAreas: string[];
    catalogArea: string | null;
    reason: string;
  }> = [];

  for (const p of participants) {
    if (!p.selectedProjects?.length || !p.projectAreaMap) continue;

    for (const proj of p.selectedProjects) {
      const linkedArea = p.projectAreaMap[proj];
      if (!linkedArea) continue; // sem vínculo — outro levantamento

      // Verifica se existe no catálogo para a área vinculada
      const catalogMatch = CATALOG_ITEMS.find(
        (i) => i.group === 'project' && i.label === proj && i.area === linkedArea
      );

      if (!catalogMatch) {
        // Verifica em qual área existe no catálogo
        const catalogAny = CATALOG_ITEMS.find(
          (i) => i.group === 'project' && i.label === proj
        );

        issues.push({
          name: p.name || p.email,
          email: p.email,
          project: proj,
          linkedArea,
          candidateAreas: p.selectedAreas || [],
          catalogArea: (catalogAny as any)?.area || null,
          reason: catalogAny
            ? `Projeto existe no catálogo para "${(catalogAny as any).area}", mas foi vinculado à "${linkedArea}"`
            : `Projeto não encontrado no catálogo oficial`,
        });
      }
    }
  }

  // Agrupa por candidato
  const byCandidate = issues.reduce((acc, issue) => {
    const key = issue.email;
    if (!acc[key]) acc[key] = { name: issue.name, email: issue.email, candidateAreas: issue.candidateAreas, projects: [] };
    acc[key].projects.push({ project: issue.project, linkedArea: issue.linkedArea, catalogArea: issue.catalogArea, reason: issue.reason });
    return acc;
  }, {} as Record<string, any>);

  return res.status(200).json({
    total: issues.length,
    candidates: Object.values(byCandidate),
  });
}
