import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// Ferramenta de uso único — trocar senha de administrador(es)
// ─────────────────────────────────────────────────────────────────────────────
// Contexto: o usuário admin de seed (admin@sebraeto.com.br) tem a senha gravada em
// TEXTO PURO no código-fonte (lib/seed.ts: "admin@sebrae2026"). Se essa senha nunca foi
// trocada, ela é visível a qualquer pessoa com acesso ao repositório. Este endpoint permite
// listar os administradores existentes (nunca expõe a senha atual) e definir uma senha nova
// para cada um.
//
// LIMITAÇÃO CONHECIDA (não corrigida por este endpoint, fora de escopo aqui): as senhas
// continuam armazenadas em texto puro no banco (campo `password` em `users`), comparadas
// diretamente em pages/api/auth/login.ts — não há hashing. Trocar a senha aqui não resolve
// esse problema estrutural, só reduz o risco imediato de a senha atual estar "pública" no
// histórico do Git. Recomenda-se tratar o hashing de senhas como item à parte.
//
// USO (POST, nunca GET — evita segredo em histórico/logs):
//   curl -X POST https://aderencia.ecodobem.com/api/admin/manage-admins \
//     -H "Authorization: Bearer <ADMIN_MGMT_SECRET>" \
//     -H "Content-Type: application/json" \
//     -d '{"action":"list"}'
//   → lista email/nome de cada admin (nunca a senha)
//
//   curl -X POST https://aderencia.ecodobem.com/api/admin/manage-admins \
//     -H "Authorization: Bearer <ADMIN_MGMT_SECRET>" \
//     -H "Content-Type: application/json" \
//     -d '{"action":"setPassword","email":"admin@sebraeto.com.br","newPassword":"<nova senha>"}'
//   → define a nova senha para esse e-mail
//
// RECOMENDADO: depois de trocar as senhas necessárias, excluir este arquivo do repositório
// (ou remover a variável ADMIN_MGMT_SECRET do Railway).
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST com header Authorization: Bearer <ADMIN_MGMT_SECRET>.' });
  }

  const secretConfigured = process.env.ADMIN_MGMT_SECRET;
  if (!secretConfigured) {
    return res.status(403).json({ error: 'Endpoint desabilitado: variável de ambiente ADMIN_MGMT_SECRET não configurada no Railway.' });
  }
  const authHeader = req.headers.authorization || '';
  const providedSecret = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (providedSecret !== secretConfigured) {
    return res.status(403).json({ error: 'Não autorizado. Envie o header "Authorization: Bearer <ADMIN_MGMT_SECRET>".' });
  }

  const { action, email, newPassword } = req.body || {};
  const users: any[] = await readJsonAsync('users', []);

  if (action === 'list') {
    const admins = users
      .filter((u) => u.role === 'admin')
      .map((u) => ({ email: u.email, name: u.name || '—' })); // NUNCA inclui a senha
    return res.status(200).json({ admins, total: admins.length });
  }

  if (action === 'setPassword') {
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email obrigatório.' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'newPassword obrigatório, com no mínimo 8 caracteres.' });
    }
    const idx = users.findIndex((u) => u.role === 'admin' && u.email === email);
    if (idx < 0) {
      return res.status(404).json({ error: `Nenhum administrador encontrado com o e-mail ${email}.` });
    }
    users[idx].password = newPassword;
    await writeJsonAsync('users', users);
    return res.status(200).json({ success: true, email, message: 'Senha atualizada com sucesso.' });
  }

  return res.status(400).json({ error: 'action inválida. Use "list" ou "setPassword".' });
}
