import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'marcus.queiroz@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Programa de desenvolvimento territorial': 'UAC',
  };

  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: o projeto "Programa de desenvolvimento territorial" estava vinculado à área REGIONAIS, porém o catálogo oficial reconhece este projeto para a UAC — Unidade de Articulação e Competitividade, área que o candidato também concorre. O vínculo foi corrigido para UAC — 20 pts Estratégico Central.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
