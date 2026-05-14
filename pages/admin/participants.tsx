import { useState, useEffect } from 'react';
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

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  preenchido:  { label: 'Preenchido',   badgeClass: 'badge-green'  },
  pendente:    { label: 'Pendente',     badgeClass: 'badge-yellow' },
  nao_acessou: { label: 'Não acessou', badgeClass: 'badge-gray'   },
};

export default function AdminParticipants() {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/participants')
      .then(r => r.json())
      .then(d => {
        setParticipants(Array.isArray(d.participants) ? d.participants : []);
        setTotal(d.total || 0);
        setLoading(false);
      });
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const filtered = participants.filter(p => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.unit?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || p.formStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    preenchido:  participants.filter(p => p.formStatus === 'preenchido').length,
    pendente:    participants.filter(p => p.formStatus === 'pendente').length,
    nao_acessou: participants.filter(p => p.formStatus === 'nao_acessou').length,
  };

  return (
    <>
      <Head><title>Participantes | Banco de Sucessores</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLíder"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderência</div>
            <div className="topbar-subtitle">Painel Administrativo · SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Link href="/admin"><button className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Dashboard</button></Link>
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
          <p>Lista de todos os colaboradores cadastrados no sistema e status do preenchimento do formulário.</p>
        </div>

        {/* Cards de resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total de colaboradores', value: total, color: '#6d28d9', bg: '#f5f3ff' },
            { label: 'Formulário preenchido', value: counts.preenchido, color: '#15803d', bg: '#f0fdf4' },
            { label: 'Pendente (acessou)', value: counts.pendente, color: '#b45309', bg: '#fffbeb' },
            { label: 'Nunca acessou', value: counts.nao_acessou, color: '#6b7280', bg: '#f9fafb' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, border: `1.5px solid ${c.color}22`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#374151', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div className="section-card">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="form-input" style={{ maxWidth: '280px' }} type="text"
                placeholder="🔍 Buscar por nome, e-mail ou unidade..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="form-input" style={{ maxWidth: '200px' }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="todos">Todos os status</option>
                <option value="preenchido">Preenchido</option>
                <option value="pendente">Pendente</option>
                <option value="nao_acessou">Não acessou</option>
              </select>
            </div>
            <span className="badge badge-purple">{filtered.length} colaborador(es)</span>
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
                    <th>Cargo</th>
                    <th>Status do formulário</th>
                    <th>Matrícula</th>
                    <th>Unidade atual</th>
                    <th>Áreas de interesse</th>
                    <th>Exceção</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Nenhum colaborador encontrado.</td></tr>
                  ) : filtered.map((p: any) => {
                    const st = STATUS_CONFIG[p.formStatus] ?? STATUS_CONFIG.nao_acessou;
                    return (
                      <tr key={p.userId || p.email}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.email}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.role}</td>
                        <td>
                          <span className={`badge ${st.badgeClass}`}>{st.label}</span>
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
