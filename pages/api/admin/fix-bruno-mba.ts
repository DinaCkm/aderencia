import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'bruno.rodrigues@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = ((p as any).adminNote ? (p as any).adminNote + ' ' : '') +
    'Análise do Pós/MBA realizada pela UGP em 29/06/2026: o título "Gestão de Serviços" é reconhecido no catálogo oficial para a área URC — Unidade de Relacionamento com Clientes, área à qual o candidato não concorre (áreas de interesse: REGIONAIS, UAC, URI). Foi avaliada possível aderência às áreas que o candidato concorre — não há equivalência temática com articulação regional (REGIONAIS), competitividade para pequenos negócios (UAC) ou relações institucionais (URI). Por este motivo, o título recebe a pontuação mínima de 20 pts, garantida a qualquer candidato que possua pós-graduação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
