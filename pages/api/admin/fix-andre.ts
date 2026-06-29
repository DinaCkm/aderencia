import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'andre.gomes@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Corrige projectAreaMap — projetos estavam vinculados às áreas erradas
  p.projectAreaMap = {
    'Jornada do cliente e padronização de atendimento': 'URC',
    'Execução estratégica regional do portfólio': 'REGIONAIS',
    'Articulação regional e parcerias territoriais': 'REGIONAIS',
  };

  // Registra nota administrativa para constar no documento
  (p as any).adminNote = 'Correção administrativa realizada pela UGP em 29/06/2026: os projetos estratégicos estavam vinculados às áreas incorretas no momento do preenchimento. "Jornada do cliente e padronização de atendimento" foi corrigido de REGIONAIS para URC; "Execução estratégica regional do portfólio" foi corrigido de URC para REGIONAIS; "Articulação regional e parcerias territoriais" foi corrigido de UAUD para REGIONAIS. Os vínculos foram ajustados para refletir as áreas corretas conforme o catálogo oficial.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
