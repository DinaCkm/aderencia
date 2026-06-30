import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'eligeneth@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Move Campanhas de URC para REGIONAIS onde pontua
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Campanhas de comunicação e marketing estratégico': 'REGIONAIS',
  };

  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: (1) "Campanhas de comunicação e marketing estratégico" corrigido de URC para REGIONAIS, área que a candidata também concorre e onde o projeto é reconhecido no catálogo oficial como item Complementar — 15 pts. (2) "Mapeamento e melhoria de controles internos" foi vinculado à área URC, porém o catálogo oficial reconhece este projeto para a UAUD e UGOC, áreas às quais a candidata não concorre. Não há aderência temática com os itens de relacionamento e atendimento ao cliente do catálogo da URC. Por este motivo, o projeto não gera pontuação.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
