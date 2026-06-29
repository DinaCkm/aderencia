import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'eliwania.santos@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];
  const catalogLabel = 'Programa de gestão de riscos e integridade';
  const area = 'UGE';
  const justification = 'Projeto reconhecido por equivalência ao item "Programa de gestão de riscos e integridade" da UGE, considerando que o projeto "Implementação do novo modelo de governança alinhada à Política de Controles Internos do Sistema SEBRAE" trata diretamente de gestão de riscos, compliance e integridade institucional, com implementação de estrutura de governança corporativa alinhada às diretrizes sistêmicas do SEBRAE.';

  // Adiciona projeto ao selectedProjects
  if (!p.selectedProjects) p.selectedProjects = [];
  if (!p.selectedProjects.includes(catalogLabel)) {
    p.selectedProjects.push(catalogLabel);
  }

  // Vincula à área UGE no projectAreaMap
  if (!p.projectAreaMap) p.projectAreaMap = {};
  p.projectAreaMap[catalogLabel] = area;

  // Registra proofMode como ugp-knows
  if (!p.proofMode) p.proofMode = {};
  p.proofMode[`proj:${catalogLabel}`] = 'ugp-knows';

  // Registra metadados da exceção
  p.exceptionStatus = 'approved';
  p.exceptionRequested = true;
  p.exceptionCatalogLabel = catalogLabel;
  p.exceptionCatalogType = 'projeto';
  p.exceptionCatalogArea = area;
  p.exceptionApprovalJustification = justification;
  p.exceptionResolvedAt = new Date().toISOString();

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    selectedProjects: p.selectedProjects,
    projectAreaMap: p.projectAreaMap,
    justification,
  });
}
