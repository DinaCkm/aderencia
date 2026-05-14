import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParticipantProfile } from '../../lib/types';

export default function AdminValidation() {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'provisional' | 'confirmed'>('all');

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const load = () => {
    fetch('/api/admin/employees')
      .then((r) => r.json())
      .then((data) => { setParticipants(data.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    load();
  }, [router]);

  const confirmValidation = async (id: string) => {
    const res = await fetch('/api/admin/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, validationStatus: 'confirmed' }),
    });
    if (res.ok) {
      setIsError(false);
      setMessage(`Pontuação confirmada para ${id}.`);
      load();
    } else {
      setIsError(true);
      setMessage('Erro ao confirmar validação.');
    }
  };

  const revertToProvisional = async (id: string) => {
    const res = await fetch('/api/admin/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, validationStatus: 'provisional' }),
    });
    if (res.ok) {
      setIsError(false);
      setMessage(`Pontuação revertida para provisória: ${id}.`);
      load();
    } else {
      setIsError(true);
      setMessage('Erro ao reverter validação.');
    }
  };

  const filtered = participants.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (p as any).validationStatus === filter || (!((p as any).validationStatus) && filter === 'provisional');
    return matchSearch && matchFilter;
  });

  const provisional = participants.filter((p) => !(p as any).validationStatus || (p as any).validationStatus === 'provisional').length;
  const confirmed = participants.filter((p) => (p as any).validationStatus === 'confirmed').length;

  return (
    <>
      <Head><title>Validação de Pontuações | Admin</title></Head>
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

      <main className="container" style={{ maxWidth: 900, paddingTop: 92 }}>

        {/* Resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total de empregados', value: participants.length, color: 'var(--purple)', bg: 'var(--gradient-soft)' },
            { label: 'Aguardando validação', value: provisional, color: '#92400e', bg: '#fffbeb' },
            { label: 'Pontuação confirmada', value: confirmed, color: '#065f46', bg: '#f0fdf4' },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#10003;</span>
            <div>
              <h2>Validação de Pontuações</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Confirme a pontuação dos empregados após checar os documentos comprobatórios enviados
              </p>
            </div>
          </div>

          {message && (
            <div style={{ background: isError ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isError ? '#fecaca' : '#86efac'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: isError ? '#dc2626' : '#15803d', fontSize: '0.82rem', marginBottom: 16 }}>
              {message}
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 280, fontSize: '0.82rem' }}
            />
            {(['all', 'provisional', 'confirmed'] as const).map((f) => (
              <button key={f} type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: filter === f ? 700 : 400, cursor: 'pointer',
                  border: `1.5px solid ${filter === f ? 'var(--purple)' : 'var(--border)'}`,
                  background: filter === f ? 'var(--gradient-soft)' : 'white',
                  color: filter === f ? 'var(--purple)' : 'var(--text-muted)'
                }}>
                {f === 'all' ? 'Todos' : f === 'provisional' ? 'Provisórios' : 'Confirmados'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#128203;</div>
              <p style={{ fontSize: '0.88rem' }}>Nenhum empregado encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((p) => {
                const status = (p as any).validationStatus || 'provisional';
                const isConfirmed = status === 'confirmed';
                const hasSubmitted = !!(p as any).selectedAreas?.length;
                return (
                  <div key={p.id} style={{
                    border: `1.5px solid ${isConfirmed ? '#86efac' : hasSubmitted ? '#fcd34d' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                    background: isConfirmed ? '#f0fdf4' : hasSubmitted ? '#fffbeb' : 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{p.name || p.id}</span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: isConfirmed ? '#dcfce7' : hasSubmitted ? '#fef9c3' : '#f3f4f6',
                          color: isConfirmed ? '#15803d' : hasSubmitted ? '#92400e' : '#6b7280'
                        }}>
                          {isConfirmed ? '✓ Confirmado' : hasSubmitted ? '⏳ Aguardando validação' : 'Sem formulário'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{p.email}</div>
                      {hasSubmitted && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Areas: <strong>{((p as any).selectedAreas || []).join(', ') || '—'}</strong>
                          {(p as any).proofMode && Object.keys((p as any).proofMode).length > 0 && (
                            <span style={{ marginLeft: 10 }}>
                              Comprovações: {Object.entries((p as any).proofMode).map(([item, mode]: [string, any]) => (
                                <span key={item} style={{ marginLeft: 4, background: mode === 'ugp-knows' ? '#cffafe' : '#ede9fe', borderRadius: 4, padding: '1px 5px', fontSize: '0.68rem', color: mode === 'ugp-knows' ? '#0e7490' : '#5B2D8E' }}>
                                  {mode === 'ugp-knows' ? '✓ UGP' : '📄 Upload'}: {item.length > 20 ? item.slice(0, 20) + '...' : item}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {hasSubmitted && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {!isConfirmed ? (
                          <button type="button" className="btn-primary"
                            style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', padding: '7px 16px', fontSize: '0.78rem', width: 'auto' }}
                            onClick={() => confirmValidation(p.id)}>
                            ✓ Confirmar pontuação
                          </button>
                        ) : (
                          <button type="button" className="btn-outline"
                            style={{ borderColor: '#f59e0b', color: '#92400e', padding: '7px 16px', fontSize: '0.78rem' }}
                            onClick={() => revertToProvisional(p.id)}>
                            Reverter para provisório
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
