import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  
  const LABELS = ['Gestão Estratégica', 'MBA em Gestão Estratégica', 'Gestão Estratégica Empresarial', 
                  'Gestão de Estratégia Empresarial', 'Estratégia Empresarial', 'Estratégia Organizacional'];

  const impacted = participants
    .filter(p => (p.postMBAs || []).some((mba: string) => LABELS.some(l => mba?.toLowerCase().includes(l.toLowerCase()))))
    .map(p => ({
      name: p.name,
      email: p.email,
      areas: p.selectedAreas,
      mbas: (p.postMBAs || []).filter((mba: string) => LABELS.some(l => mba?.toLowerCase().includes(l.toLowerCase()))),
    }));

  return res.status(200).json({ total: impacted.length, candidates: impacted });
}
