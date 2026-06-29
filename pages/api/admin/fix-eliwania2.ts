import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'eliwania.santos@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  (p as any).adminNote = 'Análise administrativa realizada pela UGP em 29/06/2026: os projetos "Analytics e painéis de auditoria" (vinculado à UGOC) e "Programa de integridade e conformidade institucional" (vinculado à UGE) não pontuaram porque o catálogo oficial reconhece ambos para a área UAUD — Unidade de Auditoria Interna. Embora a candidata concorra à UAUD, esta área já atingiu a pontuação máxima de 20 pts com o projeto "Mapeamento e melhoria de controles internos". Portanto, mesmo que os projetos fossem reconhecidos para a UAUD, não gerariam pontuação adicional.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
