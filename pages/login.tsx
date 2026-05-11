import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { ADMIN_USER } from '../lib/constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
      sessionStorage.setItem('aderenciaRole', 'admin');
      router.push('/admin');
      return;
    }
    if (email.endsWith('@aderencia.local')) {
      sessionStorage.setItem('aderenciaRole', 'participant');
      sessionStorage.setItem('aderenciaEmail', email);
      router.push('/participant');
      return;
    }
    setError('Usuário ou senha inválidos. Use e-mail válido ou admin@aderencia.local.');
  };

  return (
    <main className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <label>
          E-mail
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Senha
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p>
        Use <strong>admin@aderencia.local</strong> / <strong>admin123</strong> para admin. Para participante, use um e-mail qualquer que termine em <strong>@aderencia.local</strong>.
      </p>
    </main>
  );
}
