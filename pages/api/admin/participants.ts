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

      // Espelha a lógica de normalizeKey do audit.tsx
      function normalizeKey(key: string): string {
        const colonIdx = key.indexOf(':');
        if (colonIdx < 0) return key.trim();
        return `${key.slice(0, colonIdx).trim()}:${key.slice(colonIdx + 1).trim()}`;
      }

      // Retorna true se o valor inline é base64 real (não nome de arquivo legado)
      function isValidBase64Proof(v: string): boolean {
        if (v.startsWith('data:')) return true;
        if (v.length < 50) return false;
        if (/\.(pdf|docx?|xlsx?|png|jpe?g|gif|webp)$/i.test(v.trim())) return false;
        try { Buffer.from(v.slice(0, 100), 'base64'); return true; } catch { return false; }
      }

      function hasValidProof(rawKey: string): boolean {
        const key = normalizeKey(rawKey);
        // Checa proofMode com ambas as variações (raw e normalizada)
        const mode = p?.proofMode?.[rawKey] ?? p?.proofMode?.[key];
        if (mode === 'ugp-knows') return true;
        if (mode === 'upload') {
          // 1. Arquivo inline válido
          const v = p?.proofFiles?.[rawKey] ?? p?.proofFiles?.[key];
          if (v && typeof v === 'string' && isValidBase64Proof(v)) return true;
          // 2. Arquivo na tabela proof_files do banco
          if (dbKeys.has(rawKey) || dbKeys.has(key)) return true;
          return false;
        }
        return false;
      }

      let hasPendingDocs = false;
      if (p) {
        const keysToCheck: string[] = [];
        // Graduação — chave: grad:nome ou grad:__outro__ => grad:nomeLivre
        if (p.graduation) {
          const gradRaw = p.graduation === '__outro__'
            ? `grad:${(p as any).graduationCourseName?.trim() || p.graduation}`
            : `grad:${p.graduation}`;
          keysToCheck.push(gradRaw);
        }
        if ((p as any).graduation2) {
          const grad2Raw = `grad2:${(p as any).graduation2CourseName?.trim() || (p as any).graduation2}`;
          keysToCheck.push(grad2Raw);
        }
        // Pós/MBA — chave: mba_i:nome (i = índice original)
        for (const [i, mba] of ((p as any).postMBAs || []).entries()) {
          keysToCheck.push(`mba_${i}:${(typeof mba === 'string' ? mba : mba?.name || '').trim()}`);
        }
        // Cursos do catálogo — chave: curso7:nome
        for (const course of (p.selectedCourses || [])) {
          keysToCheck.push(`curso7:${course}`);
        }
        // Cursos livres — chave: curso5_i:nome
        for (const [i, course] of ((p as any).freeCourses || []).entries()) {
          if (course?.name?.trim() && course?.area && (course?.hours || 0) >= 16) {
            keysToCheck.push(`curso5_${i}:${course.name.trim()}`);
          }
        }
        // Projetos — chave: proj:nome
        for (const proj of (p.selectedProjects || [])) {
          keysToCheck.push(`proj:${proj}`);
        }
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
