import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, cpf, password, role } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail obrigatório.' });

  const users: any[] = await readJsonAsync('users', []);

  if (role === 'admin') {
    const admin = users.find((u: any) => u.email === email && u.role === 'admin');
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: 'Credenciais de administrador inválidas.' });
    }
    return res.status(200).json({ role: 'admin', email: admin.email, name: admin.name || 'Administrador' });
  }

  // Participante: valida e-mail + CPF (apenas dígitos, com zeros à esquerda)
  const cpfNorm = String(cpf || '').replace(/\D/g, '').padStart(11, '0');
  const user = users.find((u: any) => u.email === email && u.role !== 'admin');
  if (!user) return res.status(401).json({ message: 'E-mail não encontrado.' });
  const storedCpf = String(user.cpf || '').replace(/\D/g, '').padStart(11, '0');
  if (storedCpf !== cpfNorm) return res.status(401).json({ message: 'CPF incorreto.' });
  return res.status(200).json({ role: 'participant', email: user.email, name: user.name || '' });
}
