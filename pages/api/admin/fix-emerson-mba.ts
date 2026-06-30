import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<any[]>('participants', []);
  const idx = participants.findIndex((p) => p.email === 'emerson.lima@to.sebrae.com.br');
  if (idx < 0) return res.status(404).json({ error: 'não encontrado' });

  const p = participants[idx];

  // Atualiza a nota para refletir que Gestão de Processos agora pontua na URC
  (p as any).adminNote = 'Análise do Pós/MBA realizada pela UGP em 29/06/2026: os títulos "Desenvolvimento Regional" e "Gestão de Pequenos Negócios" são reconhecidos para as áreas REGIONAIS e UAC respectivamente — áreas às quais o candidato não concorre (área única de interesse: URC). Não há equivalência temática com relacionamento com clientes (URC). Por este motivo, esses dois títulos recebem a pontuação mínima de 20 pts. O título "Gestão de Processos Organizacionais" foi reconhecido para a área URC, considerando que processos organizacionais incluem processos de atendimento ao cliente — escopo central da URC. Este título pontua como específico da área URC — 20 pts.';

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, adminNote: (p as any).adminNote });
}
