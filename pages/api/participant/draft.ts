import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync, saveProofFile, loadProofFiles } from '../../../lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// Rascunho do formulário no servidor ("Salvar e continuar depois")
//   GET  ?email=...  → { draft: { profile, step, savedAt } | null }
//   POST { profile, step } → grava o rascunho
// O rascunho NÃO conta como formulário enviado: fica numa chave própria e só
// vira participação quando a pessoa clica em "Enviar" (api/participant/submit).
// Arquivos anexados vão para a tabela proof_files (a mesma usada no envio),
// então quem anexou um documento e saiu não precisa anexar de novo.
// ─────────────────────────────────────────────────────────────────────────────

export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

const keyFor = (email: string) => 'draft_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email obrigatório' });
    const draft: any = await readJsonAsync(keyFor(email), null as any);
    if (!draft || !draft.profile) return res.status(200).json({ draft: null });
    const files = await loadProofFiles(email);
    return res.status(200).json({
      draft: { ...draft, profile: { ...draft.profile, proofFiles: { ...(draft.profile.proofFiles || {}), ...files } } },
    });
  }

  if (req.method === 'POST') {
    const { profile, step } = (req.body || {}) as { profile?: any; step?: number };
    const email = String(profile?.email || '').trim().toLowerCase();
    if (!profile || !email) return res.status(400).json({ error: 'Dados incompletos.' });

    // Não grava rascunho de quem já enviou: o formulário enviado é a versão oficial
    const participants: any[] = await readJsonAsync('participants', []);
    if (Array.isArray(participants) && participants.some((p) => String(p.email || p.id || '').toLowerCase() === email)) {
      return res.status(409).json({ error: 'Formulário já enviado. Use "Enviar" para salvar as alterações.' });
    }

    const keptFiles: Record<string, string> = {};
    for (const [itemKey, fileData] of Object.entries((profile.proofFiles || {}) as Record<string, string>)) {
      if (!fileData) continue;
      const isBase64 = fileData.startsWith('data:') || fileData.length > 100;
      if (isBase64) {
        try {
          await saveProofFile(email, itemKey, fileData);
        } catch (err) {
          console.error(`[draft] Erro ao salvar proof_file ${email}/${itemKey}:`, err);
          keptFiles[itemKey] = fileData; // não perde o arquivo se a tabela falhar
        }
        if (!process.env.MYSQL_URL && !process.env.DATABASE_URL) keptFiles[itemKey] = fileData; // modo local
      } else {
        keptFiles[itemKey] = fileData;
      }
    }

    await writeJsonAsync(keyFor(email), {
      profile: { ...profile, proofFiles: keptFiles },
      step: Number(step) || 1,
      savedAt: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
