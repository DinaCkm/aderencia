import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

interface AdminUser {
  email: string;
  name: string;
  password: string;
  role: 'admin';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const users = await readJsonAsync<any[]>('users', []);

  // GET — listar administradores (nunca inclui a senha)
  if (req.method === 'GET') {
    const admins = users
      .filter((u) => u.role === 'admin')
      .map((u) => ({ email: u.email, name: u.name || '—' }));
    return res.status(200).json({ admins });
  }

  // POST — criar novo administrador
  if (req.method === 'POST') {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha precisa ter no mínimo 8 caracteres.' });
    }
    const emailNorm = email.trim().toLowerCase();
    if (users.find((u) => u.email === emailNorm)) {
      return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
    }
    const newAdmin: AdminUser = { email: emailNorm, name: name.trim(), password, role: 'admin' };
    users.push(newAdmin);
    await writeJsonAsync('users', users);
    return res.status(201).json({ success: true, admin: { email: newAdmin.email, name: newAdmin.name } });
  }

  // PUT — editar administrador existente (nome, e-mail e/ou senha)
  if (req.method === 'PUT') {
    const { email, name, newEmail, newPassword } = req.body as {
      email: string; name?: string; newEmail?: string; newPassword?: string;
    };
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório para identificar o administrador.' });
    const idx = users.findIndex((u) => u.email === email && u.role === 'admin');
    if (idx === -1) return res.status(404).json({ error: 'Administrador não encontrado.' });

    if (name) users[idx].name = name.trim();

    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'A nova senha precisa ter no mínimo 8 caracteres.' });
      }
      users[idx].password = newPassword;
    }

    if (newEmail) {
      const newEmailNorm = newEmail.trim().toLowerCase();
      if (users.find((u) => u.email === newEmailNorm && u.email !== email)) {
        return res.status(409).json({ error: 'Já existe um usuário com o novo e-mail.' });
      }
      users[idx].email = newEmailNorm;
    }

    await writeJsonAsync('users', users);
    return res.status(200).json({ success: true, admin: { email: users[idx].email, name: users[idx].name } });
  }

  // DELETE — excluir administrador
  if (req.method === 'DELETE') {
    const { email } = req.body as { email: string };
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório.' });
    const idx = users.findIndex((u) => u.email === email && u.role === 'admin');
    if (idx === -1) return res.status(404).json({ error: 'Administrador não encontrado.' });

    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    if (totalAdmins <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o último administrador do sistema.' });
    }

    users.splice(idx, 1);
    await writeJsonAsync('users', users);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
