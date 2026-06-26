import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, queryUsers } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email obrigatório' });

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const p = (Array.isArray(participants) ? participants : []).find(
    (x) => (x.email || '').toLowerCase() === email.toLowerCase()
  );
  if (!p) return res.status(404).json({ error: 'Participante não encontrado' });

  // Carregar dbKeys
  const dbKeys = new Set<string>();
  try {
    const rows = await queryUsers<{ item_key: string }[]>(
      'SELECT item_key FROM proof_files WHERE email = ?', [email.toLowerCase()]
    );
    for (const r of rows) dbKeys.add(r.item_key.trim());
  } catch {}

  function normalizeKey(key: string): string {
    const i = key.indexOf(':');
    if (i < 0) return key.trim();
    return `${key.slice(0, i).trim()}:${key.slice(i + 1).trim()}`;
  }

  function isValidBase64Proof(v: string): boolean {
    if (v.startsWith('data:')) return true;
    if (v.length < 50) return false;
    if (/\.(pdf|docx?|xlsx?|png|jpe?g|gif|webp)$/i.test(v.trim())) return false;
    try { Buffer.from(v.slice(0, 100), 'base64'); return true; } catch { return false; }
  }

  function hasValidProof(rawKey: string): { valid: boolean; reason: string } {
    const key = normalizeKey(rawKey);
    const mode = p!.proofMode?.[rawKey] ?? p!.proofMode?.[key];
    if (mode === 'ugp-knows') return { valid: true, reason: 'ugp-knows' };
    if (mode === 'upload') {
      const v = p!.proofFiles?.[rawKey] ?? p!.proofFiles?.[key];
      if (v && isValidBase64Proof(v)) return { valid: true, reason: 'inline base64' };
      if (dbKeys.has(rawKey) || dbKeys.has(key)) return { valid: true, reason: 'no banco' };
      return { valid: false, reason: 'upload sem arquivo válido' };
    }
    return { valid: false, reason: `sem proofMode (mode=${mode ?? 'undefined'})` };
  }

  const keysToCheck: { rawKey: string; result: ReturnType<typeof hasValidProof> }[] = [];

  if (p.graduation) {
    const raw = p.graduation === '__outro__'
      ? `grad:${(p as any).graduationCourseName?.trim() || p.graduation}`
      : `grad:${p.graduation}`;
    keysToCheck.push({ rawKey: raw, result: hasValidProof(raw) });
  }
  if ((p as any).graduation2) {
    const raw = `grad2:${(p as any).graduation2CourseName?.trim() || (p as any).graduation2}`;
    keysToCheck.push({ rawKey: raw, result: hasValidProof(raw) });
  }
  for (const [i, mba] of ((p as any).postMBAs || []).entries()) {
    const raw = `mba_${i}:${(typeof mba === 'string' ? mba : mba?.name || '').trim()}`;
    keysToCheck.push({ rawKey: raw, result: hasValidProof(raw) });
  }
  for (const course of (p.selectedCourses || [])) {
    const raw = `curso7:${course}`;
    keysToCheck.push({ rawKey: raw, result: hasValidProof(raw) });
  }
  for (const [i, course] of ((p as any).freeCourses || []).entries()) {
    if (course?.name?.trim() && course?.area && (course?.hours || 0) >= 16) {
      const raw = `curso5_${i}:${course.name.trim()}`;
      keysToCheck.push({ rawKey: raw, result: hasValidProof(raw) });
    }
  }
  for (const proj of (p.selectedProjects || [])) {
    const raw = `proj:${proj}`;
    keysToCheck.push({ rawKey: raw, result: hasValidProof(raw) });
  }

  return res.status(200).json({
    email: p.email,
    proofMode: p.proofMode,
    proofFilesKeys: Object.keys(p.proofFiles || {}),
    dbKeys: Array.from(dbKeys),
    keysChecked: keysToCheck,
    hasPendingDocs: keysToCheck.some((k) => !k.result.valid),
  });
}
