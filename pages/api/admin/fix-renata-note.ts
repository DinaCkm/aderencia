import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  validatedAt?: string;
}
interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
  overallStatus?: string;
  overallNote?: string;
}

// Endpoint temporário — preenche a observação do item "MBA/Pós em Liderança" (postmba-1),
// já rejeitado pela UGP em 15/06/2026, explicando o impacto técnico da rejeição no cálculo.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const participant = participants.find(
    (p) => (p.email || '').toLowerCase() === 'renata.alves@to.sebrae.com.br'
  );
  if (!participant) return res.status(404).json({ error: 'Participante não encontrado' });

  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const idx = audits.findIndex((a) => a.participantId === participant.id);
  if (idx < 0) return res.status(404).json({ error: 'Auditoria não encontrada para este participante' });

  const note =
    'Título "MBA/Pós em Liderança" não reconhecido nesta auditoria pela UGP. Como este título é ' +
    'transversal (válido para qualquer área, 40 pts), ele estava sendo escolhido automaticamente como ' +
    'o melhor título de Pós/MBA nas três áreas de interesse (REGIONAIS, URC e UAC), retirando 40 pts do ' +
    'total bruto do bloco de Pós/MBA em cada uma. Com a rejeição, o cálculo passa a considerar o outro ' +
    'título informado, "Políticas Públicas" (20 pts), refletindo a pontuação correta nas três áreas.';

  const itemIdx = audits[idx].itemValidations.findIndex((v) => v.itemKey === 'postmba-1');
  if (itemIdx < 0) return res.status(404).json({ error: 'Item postmba-1 não encontrado na auditoria' });

  audits[idx].itemValidations[itemIdx] = {
    ...audits[idx].itemValidations[itemIdx],
    note,
  };

  await writeJsonAsync('profile_audits', audits);

  return res.status(200).json({ success: true, note });
}
