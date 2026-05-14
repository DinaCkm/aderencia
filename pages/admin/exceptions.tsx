import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParticipantProfile } from '../../lib/types';

export default function AdminExceptions() {
  const router = useRouter();
  const [pending, setPending] = useState<ParticipantProfile[]>([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderênciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/exceptions')
      .then((res) => res.json())
      .then((data) => setPending(data.pending || []));
  }, [router]);

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      setPending((cur) => cur.filter((p) => p.id !== id));
      setIsError(false);
      setMessage(`Exceção ${action === 'approve' ? 'aprovada' : 'rejeitada'} para ${id}.`);
    } else {
      setIsError(true);
      setMessage('Erro ao processar exceção.');
    }
  };

  return (
    <>
      <Head><title>Exceções Pendentes | Admin</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLíder"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderência</div>
            <div className="topbar-subtitle">Painel Administrativo</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Link href="/admin"><button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Dashboard</button></Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 800, paddingTop: 92 }}>
        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#9888;</span>
            <div>
              <h2>Exceções Pendentes</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Valide itens fora do catálogo antes do processamento das avaliações
              </p>
            </div>
          </div>

          {message && (
            <div style={{ background: isError ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isError ? '#fecaca' : '#86efac'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: isError ? '#dc2626' : '#15803d', fontSize: '0.82rem', marginBottom: 16 }}>
              {message}
            </div>
          )}

          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#10003;</div>
              <p style={{ fontSize: '0.88rem' }}>Nenhuma exceção pendente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map((p) => (
                <div key={p.id} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', background: '#fffbf5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{p.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'var(--gradient-soft)', borderRadius: 6, padding: '6px 10px', marginTop: 6 }}>
                        <strong>Justificativa:</strong> {p.exceptionJustification || 'Sem justificativa'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button type="button" className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', padding: '7px 16px', fontSize: '0.78rem', width: 'auto' }}
                        onClick={() => updateStatus(p.id, 'approve')}>
                        Aprovar
                      </button>
                      <button type="button" className="btn-outline"
                        style={{ borderColor: '#dc2626', color: '#dc2626', padding: '7px 16px', fontSize: '0.78rem' }}
                        onClick={() => updateStatus(p.id, 'reject')}>
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
