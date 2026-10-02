import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { CLIENT } from '../../../lib/client-config';
import { ecoliderEnabled, listEcoliderAlunos } from '../../../lib/ecolider';

// ─────────────────────────────────────────────────────────────────────────────
// Sincronizar participantes com o EcoLíder (somente leitura lá)
//   GET  → prévia: quantos estão no EcoLíder, quantos são novos e quantos mudam
//   POST → grava/atualiza no Aderência (nome, e-mail, credencial de acesso)
// Nunca remove ninguém e nunca altera administradores.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!CLIENT.ecolider) return res.status(404).json({ error: 'Este cliente não usa o acesso do EcoLíder.' });
  if (!ecoliderEnabled()) return res.status(503).json({ error: 'ECOLIDER_MYSQL_URL não configurada no Railway.' });
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  let alunos;
  try {
    alunos = await listEcoliderAlunos();
  } catch (err: any) {
    console.error('[ecolider-sync] Falha ao ler o EcoLíder:', err);
    return res.status(502).json({ error: 'Não foi possível ler o banco do EcoLíder: ' + (err?.message || 'erro') });
  }

  const users: any[] = await readJsonAsync('users', []);
  const byEmail = new Map<string, any>();
  for (const u of users) byEmail.set(String(u.email || '').toLowerCase(), u);

  const novos: string[] = [];
  const atualizados: string[] = [];
  const ignorados: string[] = [];
  for (const a of alunos) {
    const u = byEmail.get(a.email);
    if (!u) { novos.push(a.name); continue; }
    if (u.role === 'admin') { ignorados.push(a.email); continue; }
    if (String(u.cpf || '') !== a.credential || !u.name) atualizados.push(a.name);
  }

  if (req.method === 'GET') {
    return res.status(200).json({ total: alunos.length, novos, atualizados, ignorados, program: CLIENT.ecolider.programNameLike });
  }

  for (const a of alunos) {
    const u = byEmail.get(a.email);
    if (!u) {
      users.push({ email: a.email, name: a.name, cpf: a.credential, role: 'participant', source: 'ecolider' });
    } else if (u.role !== 'admin') {
      u.cpf = a.credential;
      if (!u.name) u.name = a.name;
    }
  }
  await writeJsonAsync('users', users);
  return res.status(200).json({ ok: true, total: alunos.length, novos: novos.length, atualizados: atualizados.length });
}
