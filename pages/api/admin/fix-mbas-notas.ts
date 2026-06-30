import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

const notas: Record<string, string> = {
  'odilo.carvalho@to.sebrae.com.br': 'Análise do Pós/MBA realizada pela UGP em 29/06/2026: o título "Finanças Corporativas" é reconhecido no catálogo oficial para as áreas UAUD e UGOC. Foi avaliada possível aderência às áreas de interesse do candidato (UGE, URC, REGIONAIS) — não há equivalência temática com gestão estratégica (UGE), relacionamento com clientes (URC) ou atuação regional (REGIONAIS). Por este motivo, o título recebe a pontuação mínima de 20 pts.',
  'layala.cardoso@to.sebrae.com.br': 'Análise do Pós/MBA realizada pela UGP em 29/06/2026: os títulos "Comunicação Corporativa" e "Marketing Estratégico" são reconhecidos no catálogo oficial para a área UMC — Unidade de Marketing e Comunicação, área à qual a candidata não concorre (áreas de interesse: UGE, UAC, URC). Foi avaliada possível aderência às áreas que a candidata concorre — não há equivalência temática com gestão estratégica (UGE), competitividade para pequenos negócios (UAC) ou relacionamento com clientes (URC). Por este motivo, ambos os títulos recebem a pontuação mínima de 20 pts.',
  'millena.rodrigues@to.sebrae.com.br': 'Análise do Pós/MBA realizada pela UGP em 29/06/2026: o título "Direito Empresarial" é reconhecido no catálogo oficial para a área CDE — Conselho Deliberativo Estadual, área à qual a candidata não concorre (áreas de interesse: REGIONAIS, UGP). Foi avaliada possível aderência às áreas que a candidata concorre — não há equivalência temática com atuação regional (REGIONAIS) ou gestão de pessoas (UGP). Por este motivo, o título recebe a pontuação mínima de 20 pts.',
  'emerson.lima@to.sebrae.com.br': 'Análise do Pós/MBA realizada pela UGP em 29/06/2026: os títulos "Desenvolvimento Regional" e "Gestão de Pequenos Negócios" são reconhecidos para as áreas REGIONAIS e UAC respectivamente — áreas às quais o candidato não concorre (área única de interesse: URC). O título "Gestão de Processos Organizacionais" é reconhecido para o CDE. Foi avaliada possível aderência à URC — não há equivalência temática entre desenvolvimento regional/pequenos negócios e relacionamento com clientes. Por este motivo, todos os títulos recebem a pontuação mínima de 20 pts.',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const results: Record<string, string> = {};

  for (const [email, nota] of Object.entries(notas)) {
    const idx = participants.findIndex((p) => p.email === email);
    if (idx < 0) { results[email] = 'não encontrado'; continue; }
    const p = participants[idx];
    (p as any).adminNote = (p as any).adminNote
      ? (p as any).adminNote + ' ' + nota
      : nota;
    participants[idx] = p;
    results[email] = 'OK';
  }

  await writeJsonAsync('participants', participants);
  return res.status(200).json({ success: true, results });
}
