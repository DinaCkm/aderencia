import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'admary.monteiro@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Corrige "Gestão de parcerias estratégicas" de REGIONAIS para URI
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Gestão de parcerias estratégicas': 'URI',
  };

  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: o projeto "Gestão de parcerias estratégicas" estava vinculado à área REGIONAIS, porém o catálogo oficial reconhece este projeto para a URI — Unidade de Relacionamento Institucional, área que a candidata também concorre. O comprovante apresentado (Termo de Cooperação Técnica e Financeira) confirma a aderência ao tema de parcerias institucionais. O vínculo foi corrigido para URI — 20 pts Estratégico Central. O projeto "Articulação estratégica Conselho-Diretoria" vinculado à UAC não pontua pois o catálogo reconhece este projeto para o CDE, área à qual a candidata não concorre, e a UAC não possui aderência temática com articulação do Conselho-Diretoria.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
