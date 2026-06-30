import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'thiago.silva@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "CRM e relacionamento com clientes" foi vinculado à área REGIONAIS, porém o catálogo oficial reconhece este projeto para a URC — Unidade de Relacionamento com Clientes, área à qual o candidato não concorre (áreas de interesse: REGIONAIS, UMC, UAC). Adicionalmente, o candidato já possui os projetos "Gestão de equipes e operações regionais" e "Programa de sucessão e desenvolvimento de lideranças" pontuando na REGIONAIS, atingindo a pontuação máxima de 20 pts por área. Por este motivo, o projeto não gera pontuação adicional. O projeto "Execução estratégica regional do portfólio" também consta na ficha, porém sem comprovação informada — pendente de regularização pelo candidato.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
