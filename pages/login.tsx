import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCpf = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                 .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
                 .replace(/(\d{3})(\d{3})/, '$1.$2')
                 .replace(/(\d{3})/, '$1');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const body = isAdmin ? { email, password, role: 'admin' } : { email, cpf: cpf.replace(/\D/g, ''), role: 'participant' };
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || 'Credenciais inválidas.'); return; }
    sessionStorage.setItem('aderenciaRole', data.role);
    sessionStorage.setItem('aderenciaEmail', data.email);
    sessionStorage.setItem('aderenciaName', data.name || '');
    if (data.role === 'admin') router.push('/admin');
    else router.push('/participant');
  };

  return (
    <>
      <Head><title>Banco de Sucessores Aderência | Login</title></Head>
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <img src="/eco-logo.png" alt="EcoLider" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h1 className="login-title">Banco de Sucessores</h1>
          <p className="login-subtitle">Aderência · EcoLider · SEBRAE Tocantins</p>
          <div style={{ textAlign: 'center', margin: '12px 0 20px' }}>
            <p style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leia antes de acessar</p>
            <a
              href="/comunicado_aderencia.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: '#f0f7ff', color: '#1a3a6e',
                textDecoration: 'none', fontWeight: 700,
                fontSize: '0.78rem', padding: '8px 16px', borderRadius: '8px',
                border: '1.5px solid #0891b2'
              }}
            >
              📄 Comunicado de Levantamento de Aderência
            </a>
          </div>

          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
            <button type="button" onClick={() => setIsAdmin(false)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', background: !isAdmin ? 'white' : 'transparent', color: !isAdmin ? 'var(--purple)' : '#6b7280', boxShadow: !isAdmin ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              👤 Participante
            </button>
            <button type="button" onClick={() => setIsAdmin(true)} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', background: isAdmin ? 'white' : 'transparent', color: isAdmin ? 'var(--purple)' : '#6b7280', boxShadow: isAdmin ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              🔐 Administrador
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu e-mail corporativo" autoComplete="email" />
            </div>
            {!isAdmin ? (
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input className="form-input" type="text" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} required placeholder="000.000.000-00" autoComplete="off" inputMode="numeric" />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
              </div>
            )}
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '24px' }}>
            Participantes: use seu e-mail corporativo e CPF.<br />
            Em caso de dúvidas, contate o RH.
          </p>

        </div>
      </div>
    </>
  );
}
