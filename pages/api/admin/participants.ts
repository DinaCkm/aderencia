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
      // e também NÃO têm link externo válido (proofLinks) — link externo é comprovação válida
      const proofLinks: Record<string, string> = (p as any)?.proofLinks || {};
      // Extrai prefixo de uma chave (ex: 'curso5_2' de 'curso5_2:Nome')
      function keyPrefix(k: string): string {
        const i = k.indexOf(':');
        return i >= 0 ? k.slice(0, i) : k;
      }

      const hasLegacyFiles = p
        ? Object.entries(p.proofFiles || {}).some(([key, v]) => {
            if (!isLegacyFile(v)) return false;
            const normalizedKey = normalizeKey(key);
            const normalizedKeyFull = normalizeKeyFull(key);
            // Se já existe na tabela proof_files (chave exata, normalizada ou full-normalizada)
            if (dbKeys.has(key) || dbKeys.has(normalizedKey) || dbKeys.has(normalizedKeyFull)) return false;
            // Compara normalizando espaços em torno de ':' em todas as chaves do banco
            if (Array.from(dbKeys).some((k) => normalizeKeyFull(k) === normalizedKeyFull)) return false;
            // Se prefixo numerado (ex: curso5_2, mba_1): verifica slot no banco
            const prefix = keyPrefix(key);
            const isNumberedPrefix = /^[a-z]+\d+_\d+$/.test(prefix) || /^mba_\d+$/.test(prefix);
            if (isNumberedPrefix && Array.from(dbKeys).some((k) => keyPrefix(k) === prefix)) return false;
            // Se tem link externo (chave com ou sem prefixo)
            const keyWithoutPrefix = key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
            if (proofLinks[key] || proofLinks[normalizedKey] || proofLinks[normalizedKeyFull] || proofLinks[keyWithoutPrefix]) return false;
            return true;
          })
        : false;

      // hasPendingDocs: itens declarados sem comprovação (sem proofMode, sem arquivo válido e sem ugp-knows)
      // Conceito separado de hasLegacyFiles — representa documentos obrigatórios ausentes

      // Espelha a lógica de normalizeKey do audit.tsx + normaliza espaços em torno de todos os ':'
      function normalizeKey(key: string): string {
        const colonIdx = key.indexOf(':');
        if (colonIdx < 0) return key.trim();
        // Remove espaços ao redor do primeiro ':' (prefixo:nome)
        const prefix = key.slice(0, colonIdx).trim();
        const rest = key.slice(colonIdx + 1).trim();
        return `${prefix}:${rest}`;
      }
      // Versão que também normaliza espaços ao redor de ':' internos no nome
      function normalizeKeyFull(key: string): string {
        return key.replace(/\s*:\s*/g, ':').trim();
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

      // hasPendingDocs: reconstrói chaves reais de cada item e verifica comprovação
      function hasValidProofForKey(rawKey: string): boolean {
        const key = normalizeKey(rawKey);
        const keyFull = normalizeKeyFull(rawKey);
        // Busca proofMode com todas as variações de chave
        const mode = p?.proofMode?.[rawKey] ?? p?.proofMode?.[key] ?? p?.proofMode?.[keyFull];
        if (mode === 'ugp-knows') return true;
        if (mode === 'upload') {
          const v = p?.proofFiles?.[rawKey] ?? p?.proofFiles?.[key] ?? p?.proofFiles?.[keyFull];
          if (v && isValidBase64Proof(v)) return true;
          if (dbKeys.has(rawKey) || dbKeys.has(key) || dbKeys.has(keyFull)) return true;
          // Verifica no banco normalizando todas as chaves (espaços em torno de ':')
          if (Array.from(dbKeys).some((k) => normalizeKeyFull(k) === keyFull)) return true;
          // Verifica por prefixo numerado (slot)
          const prefix = keyPrefix(rawKey);
          const isNumberedPrefix = /^[a-z]+\d+_\d+$/.test(prefix) || /^mba_\d+$/.test(prefix);
          if (isNumberedPrefix && Array.from(dbKeys).some((k) => keyPrefix(k) === prefix)) return true;
          return false;
        }
        // Sem proofMode: verifica se há arquivo no banco
        if (dbKeys.has(rawKey) || dbKeys.has(key) || dbKeys.has(keyFull)) return true;
        if (Array.from(dbKeys).some((k) => normalizeKeyFull(k) === keyFull)) return true;
        const prefix = keyPrefix(rawKey);
        const isNumberedPrefix = /^[a-z]+\d+_\d+$/.test(prefix) || /^mba_\d+$/.test(prefix);
        if (isNumberedPrefix && Array.from(dbKeys).some((k) => keyPrefix(k) === prefix)) return true;
        return false;
      }

      let hasPendingDocs = false;
      if (p) {
        const keysToCheck: string[] = [];

        // Graduação
        if (p.graduation) {
          keysToCheck.push(p.graduation === '__outro__'
            ? `grad:${(p as any).graduationCourseName?.trim() || p.graduation}`
            : `grad:${p.graduation}`);
        }
        if ((p as any).graduation2) {
          keysToCheck.push(`grad2:${(p as any).graduation2CourseName?.trim() || (p as any).graduation2}`);
        }
        // Pós/MBA — usa mbaBlocks com índice original (igual ao audit.tsx)
        const mbaBlocksArr: Array<{area?: string; name?: string}> = (p as any).mbaBlocks || [];
        mbaBlocksArr
          .map((b, origIdx) => ({ ...b, origIdx }))
          .filter((b) => b.area && b.name?.trim())
          .forEach((b) => keysToCheck.push(`mba_${b.origIdx}:${b.name!.trim()}`));
        // Cursos do catálogo
        for (const course of (p.selectedCourses || [])) keysToCheck.push(`curso7:${course}`);
        // Cursos livres
        ((p as any).freeCourses || []).forEach((c: any, i: number) => {
          if (c?.name?.trim() && c?.area && (c?.hours || 0) >= 16)
            keysToCheck.push(`curso5_${i}:${c.name.trim()}`);
        });
        // Projetos
        for (const proj of (p.selectedProjects || [])) keysToCheck.push(`proj:${proj}`);

        hasPendingDocs = keysToCheck.length > 0 && keysToCheck.some((k) => !hasValidProofForKey(k));
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
