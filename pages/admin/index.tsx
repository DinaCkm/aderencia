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
  { href: '/admin/employees', label: 'Empregados', icon: '👤' },
  { href: '/admin/validation', label: 'Validação', icon: '✅' },
];

const MENU_CARDS = [
  { href: '/admin/participants', icon: '👥', title: 'Participantes', desc: 'Visualize e gerencie todos os candidatos inscritos', color: '#5B2D8E' },
  { href: '/admin/ninebox', icon: '🎯', title: 'Nine Box por Área', desc: 'Visualize o mapa de talentos por unidade de gestão', color: '#00C9C8' },
  { href: '/admin/exceptions', icon: '⚠', title: 'Exceções Pendentes', desc: 'Revise e aprove solicitações de exceção dos participantes', color: '#f59e0b' },
  { href: '/admin/import-performance', icon: '📈', title: 'Importar Performance', desc: 'Faça upload do CSV de indicadores de engajamento', color: '#10b981' },
  { href: '/admin/import-disc', icon: '🔷', title: 'Importar DISC', desc: 'Faça upload dos resultados de perfil comportamental DISC', color: '#3b82f6' },
  { href: '/admin/catalogs', icon: '📚', title: 'Catálogos', desc: 'Gerencie pós/MBA, cursos e projetos reconhecidos', color: '#8b5cf6' },
  { href: '/admin/import-participants', icon: '📥', title: 'Importar Colaboradores', desc: 'Adicione novos participantes em lote via CSV', color: '#ec4899' },
  { href: '/admin/employees', icon: '👤', title: 'Gestão de Empregados', desc: 'Crie, edite e exclua empregados individualmente', color: '#0e7490' },
  { href: '/admin/validation', icon: '✅', title: 'Validação de Pontuações', desc: 'Confirme pontuações provisórias após checagem dos documentos', color: '#15803d' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ participants: 0, withResults: 0, exceptions: 0 });
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    const name = sessionStorage.getItem('aderenciaName');
    if (role !== 'admin') { router.push('/login'); return; }
    setAdminName(name || 'Administrador');
    fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  return (
    <>
      <Head><title>Admin | Banco de Sucessores Aderência</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLider" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderência</div>
            <div className="topbar-subtitle">Painel Administrativo · SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="topbar-user">🔐 {adminName}</span>
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
          <h1>Dashboard</h1>
          <p>Visão geral do Banco de Sucessores Aderência — SEBRAE Tocantins</p>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.participants}</div>
            <div className="stat-label">Participantes cadastrados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.withResults}</div>
            <div className="stat-label">Com resultados calculados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: stats.exceptions > 0 ? '#f59e0b' : undefined }}>{stats.exceptions}</div>
            <div className="stat-label">Exceções pendentes</div>
          </div>
        </div>

        {/* Menu Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {MENU_CARDS.map((card) => (
            <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
              <div className="section-card" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '20px 24px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(91,45,142,0.15)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: card.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: card.color, marginBottom: '4px' }}>{card.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{card.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
