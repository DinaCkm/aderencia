import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

// Endpoint temporário — registra a rejeição fundamentada da exceção de
// Alorran de Freitas Barbosa. A justificativa apresentada descreve atribuições
// contínuas do cargo (gestão de comitê de governança de IA, definição de
// políticas, alfabetização em IA, benchmarking) e não um projeto concreto que
// a candidata tenha implementado ou conduzido com escopo e entrega definidos.
// Não há elemento equivalente a "projeto estratégico" do catálogo.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const idx = participants.findIndex(
    (p) => (p.email || '').toLowerCase() === 'alorran.barbosa@to.sebrae.com.br'
  );
  if (idx < 0) return res.status(404).json({ error: 'Participante não encontrado' });

  const p = participants[idx] as any;

  const justification =
    'Exceção não reconhecida. A justificativa apresentada descreve atribuições contínuas do cargo ' +
    '(gestão do comitê de governança de Inteligência Artificial, definição de políticas de uso, ' +
    'alfabetização dos colaboradores em IA, benchmarking com outros Sebraes estaduais e negociação ' +
    'com fornecedores), e não um projeto estratégico concreto — com escopo, entrega ou mudança ' +
    'específica implementada pela candidata — equivalente aos itens de "projeto" do catálogo oficial. ' +
    'Descrição de função/atribuição do cargo não configura, por si só, um projeto estratégico para fins ' +
    'de pontuação. Caso a candidata tenha um projeto específico dentro dessa frente de atuação (ex: ' +
    'implantação de uma solução, política ou comitê com data de início/entrega definida), poderá ' +
    'reenviar a exceção detalhando esse projeto concreto.';

  p.exceptionStatus = 'rejected';
  p.exceptionResolvedAt = new Date().toISOString();
  p.exceptionApprovalJustification = justification;

  participants[idx] = p;
  await writeJsonAsync('participants', participants);

  return res.status(200).json({ success: true, exceptionApprovalJustification: justification });
}
