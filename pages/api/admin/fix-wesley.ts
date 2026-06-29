import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'wesley.cardoso@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Corrige "Desdobramento do planejamento estratégico" de UAC para UGE
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Desdobramento do planejamento estratégico': 'UGE',
  };

  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: o projeto "Desdobramento do planejamento estratégico" estava vinculado à área UAC, porém o catálogo oficial reconhece este projeto para a UGE — Unidade de Gestão Estratégica, área que o candidato também concorre. O vínculo foi corrigido para UGE. O projeto "Análise de cenários e inteligência institucional" permanece em análise — aguardando envio do comprovante pelo candidato.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
