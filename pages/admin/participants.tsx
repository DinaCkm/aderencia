import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/participants', label: 'Participantes', icon: '👥' },
  { href: '/admin/import-participants', label: 'Importar Colaboradores', icon: '📥' },
  { href: '/admin/import-performance', label: 'Importar Performance', icon: '📈' },
  { href: '/admin/import-disc', label: 'Importar DISC', icon: '🔷' },
  { href: '/admin/catalogs', label: 'Catálogos', icon: '📚' },
  { href: '/admin/exceptions', label: 'Exceções', icon: '⚠' },
  { href: '/admin/ninebox', label: 'Nine Box', icon: '🎯' },
];

export default function AdminParticipants() {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = sessionStorage.getItem('aderênciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/participants').then(r => r.json()).then(d => { setParticipants(d.participants || []); setLoading(false); });
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };
  const filtered = participants.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.unit?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head><title>Participantes | Banco de Sucessores</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLíder" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderência</div>
            <div className="topbar-subtitle">Painel Administrativo · SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <div className="admin-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={`admin-nav-item ${router.pathname === item.href ? 'active' : ''}`}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      <main className="container-wide" style={{ paddingTop: 96 }}>
        <div className="page-header" style={{ marginTop: '28px' }}>
          <h1>👥 Participantes</h1>
          <p>Lista de todos os colaboradores inscritos no Banco de Sucessores.</p>
        </div>

        <div className="section-card">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <input className="form-input" style={{ maxWidth: '320px' }} type="text" placeholder="🔍 Buscar por nome, e-mail ou unidade..." value={search} onChange={e => setSearch(e.target.value)} />
            <span className="badge badge-purple">{filtered.length} participante(s)</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Matrícula</th>
                    <th>Unidade</th>
                    <th>Áreas de interesse</th>
                    <th>Exceção</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Nenhum participante encontrado.</td></tr>
                  ) : filtered.map((p: any) => (
                    <tr key={p.id || p.email}>
                      <td style={{ fontWeight: 600 }}>{p.name || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.email}</td>
                      <td>{p.matrícula || '—'}</td>
                      <td>{p.unit || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(p.selectedAreas || []).map((a: string) => <span key={a} className="badge badge-purple">{a}</span>)}
                        </div>
                      </td>
                      <td>
                        {p.exceptionRequested ? (
                          <span className={`badge ${p.exceptionStatus === 'approved' ? 'badge-green' : p.exceptionStatus === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                            {p.exceptionStatus === 'approved' ? 'Aprovada' : p.exceptionStatus === 'rejected' ? 'Rejeitada' : 'Pendente'}
                          </span>
                        ) : <span className="badge badge-gray">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
