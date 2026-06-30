import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'francisco.ramos@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).exceptionApprovalJustification = 'Exceção aprovada com base na resposta detalhada do candidato. Francisco atua como Coordenador Estadual do Programa Conexão Financeira e Gestor do Projeto TO-Conexão Financeira, comprovado por registro no sistema LEME (sistema de gestão de projetos do SEBRAE). Sua atuação concentra-se na carteira de Acesso a Crédito e Serviços Financeiros: consultoria de crédito orientado e assistido, seminários e rodadas de crédito, articulação com o ecossistema financeiro local (bancos, FIETO) e gestão de projeto aprovado pelo SEBRAE NA no valor de R$ 385.000,00 para acesso ao crédito das MPEs do Tocantins. O Programa/Projeto Conexão Financeira está formalmente vinculado à área UAC — Unidade de Articulação e Competitividade, onde se concentram os programas estratégicos do SEBRAE Nacional voltados ao público empreendedor. Por equivalência temática e organizacional, o projeto foi reconhecido como "Competitividade e inovação para pequenos negócios" — item do catálogo oficial da UAC, classificado como Estratégico Central — 20 pts.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, justification: (p as any).exceptionApprovalJustification });
}
