import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, queryUsers } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Buscar todos os usuários ativos do banco MySQL (exceto admins)
    const users = await queryUsers<{ id: number; name: string; email: string; role: string; lastSignedIn: string | null }[]>(
      `SELECT id, name, email, role, lastSignedIn FROM users WHERE role != 'admin' AND status = 'ativo' ORDER BY name ASC`
    );

    // Buscar participantes que já preencheram o formulário
    const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const participantsByEmail = new Map<string, ParticipantProfile>();
    for (const p of (Array.isArray(participants) ? participants : [])) {
      if (p.email) participantsByEmail.set(p.email.toLowerCase(), p);
    }

    // Cruzar: para cada usuário, verificar se já preencheu
    const merged = users.map((u) => {
      const p = participantsByEmail.get(u.email?.toLowerCase() ?? '');
      return {
        userId: u.id,
        name: u.name || '—',
        email: u.email,
        role: u.role,
        lastSignedIn: u.lastSignedIn,
        formStatus: p ? 'preenchido' : u.lastSignedIn ? 'pendente' : 'nao_acessou',
        matrícula: p?.matrícula ?? null,
        unit: p?.currentArea ?? null,
        selectedAreas: p?.selectedAreas ?? [],
        exceptionRequested: p?.exceptionRequested ?? false,
        exceptionStatus: p?.exceptionStatus ?? null,
      };
    });

    return res.status(200).json({ participants: merged, total: merged.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
