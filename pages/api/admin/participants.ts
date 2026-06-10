import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Buscar todos os usuários cadastrados (kv_store key: 'users')
    const allUsers = await readJsonAsync<any[]>('users', []);
    const usersArray = Array.isArray(allUsers) ? allUsers : [];

    // Buscar participantes que já preencheram o formulário (kv_store key: 'participants')
    const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const participantsArray = Array.isArray(participants) ? participants : [];

    const participantsByEmail = new Map<string, ParticipantProfile>();
    for (const p of participantsArray) {
      if (p.email) participantsByEmail.set(p.email.toLowerCase(), p);
    }

    // Filtrar apenas colaboradores (não admins)
    const collaborators = usersArray.filter((u: any) => u.role !== 'admin');

    // Cruzar: para cada usuário, verificar se já preencheu o formulário
    const merged = collaborators.map((u: any) => {
      const p = participantsByEmail.get((u.email || '').toLowerCase());
      return {
        userId: u.id || u.email,
        name: u.name || '—',
        email: u.email,
        role: u.role || 'colaborador',
        lastSignedIn: u.lastSignedIn || null,
        formStatus: p ? 'preenchido' : u.lastSignedIn ? 'pendente' : 'nao_acessou',
        matrícula: p?.matrícula ?? u.matrícula ?? null,
        unit: p?.currentArea ?? null,
        selectedAreas: p?.selectedAreas ?? [],
        exceptionRequested: p?.exceptionRequested ?? false,
        exceptionStatus: p?.exceptionStatus ?? null,
        hasLegacyFiles: p ? Object.values(p.proofFiles || {}).some((v: any) => {
          if (!v || typeof v !== 'string') return false;
          if (v.startsWith('data:')) return false;
          if (v.length >= 50) { try { Buffer.from(v.slice(0, 100), 'base64'); return false; } catch { /* não é base64 */ } }
          return true;
        }) : false,
      };
    });

    // Ordenar: preenchidos primeiro, depois pendentes, depois não acessou; dentro de cada grupo, por nome
    const order: Record<string, number> = { preenchido: 0, pendente: 1, nao_acessou: 2 };
    merged.sort((a, b) => {
      const diff = (order[a.formStatus] ?? 2) - (order[b.formStatus] ?? 2);
      if (diff !== 0) return diff;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });

    return res.status(200).json({ participants: merged, total: merged.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
