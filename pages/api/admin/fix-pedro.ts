import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'pedro.junior@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Corrige Sistema de indicadores OKR/BSC de UGP para UGE
  p.projectAreaMap = {
    ...p.projectAreaMap,
    'Sistema de indicadores OKR/BSC': 'UGE',
  };

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: (1) "Sistema de indicadores OKR/BSC" corrigido de UGP para UGE, onde é reconhecido no catálogo oficial e o candidato concorre. (2) "Planejamento orçamentário anual e plurianual" foi vinculado à UAF, porém o catálogo oficial reconhece este projeto para a UGOC — Unidade de Gestão Orçamentária, Contabilidade e Finanças. A UAF tem foco em gestão patrimonial, suprimentos e contratos administrativos, não havendo aderência temática com planejamento orçamentário. Como o candidato não concorre à UGOC, o projeto não gera pontuação. (3) "Análise de cenários e inteligência institucional" vinculado à UGE permanece em análise pela UGP — aguardando avaliação de aderência à área.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({
    success: true,
    projectAreaMap: p.projectAreaMap,
    adminNote: (p as any).adminNote,
  });
}
