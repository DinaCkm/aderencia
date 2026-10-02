import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import { CLIENT } from '../../../lib/client-config';
import { ecoliderEnabled, findEcoliderAluno, normalizeCredential } from '../../../lib/ecolider';

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

  // ── Clientes com login pelo EcoLíder (ex.: Sebrae/AC) ─────────────────────
  // Mesmo e-mail + mesma credencial do EcoLíder (CPF ou ID de acesso).
  // 1) confere no cadastro local; 2) se não bater, confere no EcoLíder e cria/atualiza
  //    o participante aqui — assim quem entrou no EcoLíder depois já consegue acessar.
  if (CLIENT.ecolider) {
    const emailNorm = String(email).trim().toLowerCase();
    const cred = normalizeCredential(String(cpf || ''));
    if (!cred) return res.status(400).json({ message: 'Informe seu CPF ou ID de acesso do EcoLíder.' });

    const local = users.find((u: any) => String(u.email || '').toLowerCase() === emailNorm && u.role !== 'admin');
    const sameCred = (stored: string) => {
      const s = normalizeCredential(stored);
      if (s === cred) return true;
      const sd = s.replace(/\D/g, ''), cd = cred.replace(/\D/g, '');
      return /^\d+$/.test(s) && /^\d+$/.test(cred) && sd.padStart(11, '0') === cd.padStart(11, '0');
    };
    if (local && sameCred(String(local.cpf || ''))) {
      return res.status(200).json({ role: 'participant', email: local.email, name: local.name || '' });
    }

    if (ecoliderEnabled()) {
      try {
        const aluno = await findEcoliderAluno(emailNorm, String(cpf || ''));
        if (aluno) {
          if (local) {
            local.cpf = aluno.credential;
            if (!local.name) local.name = aluno.name;
          } else {
            users.push({ email: aluno.email, name: aluno.name, cpf: aluno.credential, role: 'participant', source: 'ecolider' });
          }
          await writeJsonAsync('users', users);
          return res.status(200).json({ role: 'participant', email: aluno.email, name: local?.name || aluno.name });
        }
      } catch (err) {
        console.error('[login] Falha ao consultar o EcoLíder:', err);
        if (!local) return res.status(503).json({ message: 'Não foi possível validar seu acesso agora. Tente novamente em alguns minutos.' });
      }
    }
    return res.status(401).json({ message: 'E-mail ou CPF/ID de acesso não conferem com o seu cadastro no EcoLíder.' });
  }

  // Participante: valida e-mail + CPF (apenas dígitos, com zeros à esquerda)
  const cpfNorm = String(cpf || '').replace(/\D/g, '').padStart(11, '0');
  const user = users.find((u: any) => u.email === email && u.role !== 'admin');
  if (!user) return res.status(401).json({ message: 'E-mail não encontrado.' });
  const storedCpf = String(user.cpf || '').replace(/\D/g, '').padStart(11, '0');
  if (storedCpf !== cpfNorm) return res.status(401).json({ message: 'CPF incorreto.' });
  return res.status(200).json({ role: 'participant', email: user.email, name: user.name || '' });
}
