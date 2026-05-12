import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';

interface Employee {
  email: string;
  name: string;
  cpf: string;
  role: 'participant' | 'admin';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const users = await readJsonAsync<Employee[]>('users', []);

  // GET — listar todos os participantes (não admins)
  if (req.method === 'GET') {
    const participants = users.filter((u) => u.role !== 'admin');
    return res.status(200).json({ employees: participants });
  }

  // POST — criar novo empregado
  if (req.method === 'POST') {
    const { name, email, cpf } = req.body as Partial<Employee>;
    if (!name || !email || !cpf) {
      return res.status(400).json({ error: 'Nome, e-mail e CPF são obrigatórios.' });
    }
    const cpfNorm = String(cpf).replace(/\D/g, '').padStart(11, '0');
    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
    }
    const newUser: Employee = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      cpf: cpfNorm,
      role: 'participant'
    };
    users.push(newUser);
    await writeJsonAsync('users', users);
    return res.status(201).json({ success: true, employee: newUser });
  }

  // PUT — editar empregado existente
  if (req.method === 'PUT') {
    const { email, name, cpf, newEmail } = req.body as {
      email: string;
      name?: string;
      cpf?: string;
      newEmail?: string;
    };
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório para identificar o empregado.' });
    const idx = users.findIndex((u) => u.email === email && u.role !== 'admin');
    if (idx === -1) return res.status(404).json({ error: 'Empregado não encontrado.' });
    if (name) users[idx].name = name.trim();
    if (cpf) users[idx].cpf = String(cpf).replace(/\D/g, '').padStart(11, '0');
    if (newEmail) {
      if (users.find((u) => u.email === newEmail && u.email !== email)) {
        return res.status(409).json({ error: 'Já existe um usuário com o novo e-mail.' });
      }
      users[idx].email = newEmail.trim().toLowerCase();
    }
    await writeJsonAsync('users', users);
    return res.status(200).json({ success: true, employee: users[idx] });
  }

  // DELETE — excluir empregado
  if (req.method === 'DELETE') {
    const { email } = req.body as { email: string };
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório.' });
    const idx = users.findIndex((u) => u.email === email && u.role !== 'admin');
    if (idx === -1) return res.status(404).json({ error: 'Empregado não encontrado.' });
    users.splice(idx, 1);
    await writeJsonAsync('users', users);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
