import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, queryUsers } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

/** Retorna true se o valor é um nome de arquivo legado (não base64 nem data:) */
function isLegacyFile(v: unknown): boolean {
  if (!v || typeof v !== 'string') return false;
  if (v.startsWith('data:')) return false;
  if (v.length >= 50) {
    try { Buffer.from(v.slice(0, 100), 'base64'); return false; } catch { /* não é base64 */ }
  }
  return true;
}

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

    // Carregar todos os item_keys da tabela proof_files de uma só vez (eficiente)
    // Mapa: email_lower -> Set<item_key>
    const proofFilesInDB = new Map<string, Set<string>>();
    try {
      const rows = await queryUsers<{ email: string; item_key: string }[]>(
        'SELECT email, item_key FROM proof_files'
      );
      for (const row of rows) {
        const emailKey = (row.email || '').toLowerCase();
        if (!proofFilesInDB.has(emailKey)) proofFilesInDB.set(emailKey, new Set());
        proofFilesInDB.get(emailKey)!.add(row.item_key);
      }
    } catch {
      // Se a tabela não existir ainda, ignora silenciosamente
    }

    // Filtrar apenas colaboradores (não admins)
    const collaborators = usersArray.filter((u: any) => u.role !== 'admin');

    // Cruzar: para cada usuário, verificar se já preencheu o formulário
    const merged = collaborators.map((u: any) => {
      const p = participantsByEmail.get((u.email || '').toLowerCase());
      const emailLower = (u.email || '').toLowerCase();
      const dbKeys = proofFilesInDB.get(emailLower) ?? new Set<string>();

      // hasLegacyFiles: tem itens legados no proofFiles inline que NÃO estão na tabela proof_files
      // (se o arquivo já foi migrado para a tabela, não precisa reenviar)
      const hasLegacyFiles = p
        ? Object.entries(p.proofFiles || {}).some(([key, v]) => {
            if (!isLegacyFile(v)) return false;
            // Se já existe na tabela proof_files, não é mais legado
            if (dbKeys.has(key)) return false;
            return true;
          })
        : false;

      // hasPendingDocs: itens declarados sem comprovação (sem proofMode, sem arquivo válido e sem ugp-knows)
      // Conceito separado de hasLegacyFiles — representa documentos obrigatórios ausentes
      function hasValidProof(key: string): boolean {
        const mode = p?.proofMode?.[key];
        if (mode === 'ugp-knows') return true;
        if (mode === 'upload') {
          const v = p?.proofFiles?.[key];
          if (!v || typeof v !== 'string') return false;
          if (v.startsWith('data:')) return true;
          if (v.length >= 50) {
            try { Buffer.from(v.slice(0, 100), 'base64'); return true; } catch { /* não é base64 */ }
          }
          if (dbKeys.has(key)) return true;
          return false;
        }
        return false;
      }

      let hasPendingDocs = false;
      if (p) {
        const keysToCheck: string[] = [];
        if (p.graduation) keysToCheck.push(p.graduation);
        if ((p as any).graduation2) keysToCheck.push((p as any).graduation2);
        for (const mba of (p.postMBAs || [])) keysToCheck.push(mba);
        for (const cert of (p.certifications || [])) keysToCheck.push(cert);
        for (const proj of (p.selectedProjects || [])) keysToCheck.push(proj);
        hasPendingDocs = keysToCheck.some((key) => !hasValidProof(key));
      }

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
        hasLegacyFiles,
        hasPendingDocs,
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
