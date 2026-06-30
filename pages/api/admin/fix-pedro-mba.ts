import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'pedro.junior@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  const mbaNota = 'Análise do Pós/MBA realizada pela UGP em 29/06/2026: o título "Gestão de Pequenos Negócios" é reconhecido no catálogo oficial para as áreas REGIONAIS e UAC — áreas às quais o candidato não concorre (áreas de interesse: UAF, UGE, UGP). Gestão de Pequenos Negócios está diretamente ligada ao core business do SEBRAE, porém as áreas que o candidato concorre têm escopo voltado à administração/finanças, gestão estratégica e gestão de pessoas, sem aderência direta ao tema. Por este motivo, o título recebe a pontuação mínima de 20 pts, garantida a qualquer candidato que possua pós-graduação. O título "Controladoria" foi reconhecido para a área UAF, onde é aderente à gestão financeira operacional.';

  (p as any).adminNote = (p as any).adminNote
    ? (p as any).adminNote + ' ' + mbaNota
    : mbaNota;

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
