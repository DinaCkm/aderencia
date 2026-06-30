import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'cesar.moreira@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: o projeto "Políticas públicas para pequenos negócios" foi vinculado à área REGIONAIS, porém o catálogo oficial reconhece este projeto para a UAC — Unidade de Articulação e Competitividade, área à qual o candidato não concorre (área única de interesse: REGIONAIS). Adicionalmente, o candidato já possui o projeto "Desenvolvimento regional e interiorização" pontuando na REGIONAIS, atingindo a pontuação máxima de 20 pts por área. Por este motivo, o projeto não gera pontuação adicional.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
