import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'francisco.ramos@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];
  const wrongMBA = 'Competitividade e Inovação';
  const correctProject = 'Competitividade e inovação para pequenos negócios';
  const area = 'UAC';
  const justification = 'Projeto reconhecido por equivalência ao item "Competitividade e inovação para pequenos negócios", considerando sua atuação no acesso ao crédito, atendimento pós-crédito e fortalecimento financeiro das micro e pequenas empresas atendidas pelo Conexão Financeira/FAMPE.';

  // Remove MBA vinculado errado
  p.postMBAs = (p.postMBAs || []).filter((m: string) => m !== wrongMBA);

  // Adiciona projeto correto
  if (!p.selectedProjects) p.selectedProjects = [];
  if (!p.selectedProjects.includes(correctProject)) p.selectedProjects.push(correctProject);

  // proofMode do projeto
  if (!p.proofMode) p.proofMode = {};
  p.proofMode[`proj:${correctProject}`] = 'ugp-knows';

  // projectAreaMap
  if (!p.projectAreaMap) p.projectAreaMap = {};
  p.projectAreaMap[correctProject] = area;

  // Metadados da exceção
  p.exceptionCatalogLabel = correctProject;
  p.exceptionCatalogType = 'projeto';
  p.exceptionCatalogArea = area;
  p.exceptionApprovalJustification = justification;

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    postMBAs: p.postMBAs,
    selectedProjects: p.selectedProjects,
    projectAreaMap: p.projectAreaMap,
  });
}
