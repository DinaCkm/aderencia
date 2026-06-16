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
  { href: '/admin/audit', label: 'Auditoria de Fichas', icon: '🔎' },
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
  { href: '/admin/audit', icon: '🔎', title: 'Auditoria de Fichas', desc: 'Leia a ficha completa de cada candidato, valide item por item e solicite informações por e-mail', color: '#7c3aed' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ participants: 0, withResults: 0, exceptions: 0 });
  const [adminName, setAdminName] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [processClosed, setProcessClosed] = useState<boolean | null>(null);
  const [processToggling, setProcessToggling] = useState(false);

  const downloadCSV = async (type: string, label: string) => {
    setDownloading(type);
    try {
      const res = await fetch(`/api/admin/export-csv?type=${type}`);
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `${type}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao baixar o arquivo. Tente novamente.');
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    const name = sessionStorage.getItem('aderenciaName');
    if (role !== 'admin') { router.push('/login'); return; }
    setAdminName(name || 'Administrador');
    fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {});
    fetch('/api/admin/process-config').then(r => r.json()).then(d => setProcessClosed(d.processClosed ?? false)).catch(() => {});
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const toggleProcess = async () => {
    if (processToggling) return;
    const newClosed = !processClosed;
    const msg = newClosed
      ? 'Tem certeza que deseja ENCERRAR o processo? Os candidatos não poderão mais editar o formulário.'
      : 'Tem certeza que deseja REABRIR o processo? Os candidatos voltarão a poder editar o formulário.';
    if (!window.confirm(msg)) return;
    setProcessToggling(true);
    try {
      const res = await fetch('/api/admin/process-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processClosed: newClosed, closedBy: adminName }),
      });
      if (res.ok) {
        setProcessClosed(newClosed);
        alert(newClosed ? '✅ Processo encerrado. Candidatos não podem mais editar.' : '✅ Processo reaberto. Candidatos podem editar novamente.');
      } else {
        alert('Erro ao alterar o status do processo. Tente novamente.');
      }
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setProcessToggling(false);
    }
  };

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

        {/* Painel de Controle do Processo */}
        <div className="section-card" style={{ marginBottom: '28px', padding: '24px 28px', border: processClosed ? '2px solid #ef4444' : '2px solid #22c55e', background: processClosed ? '#fef2f2' : '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.6rem' }}>{processClosed ? '\uD83D\uDD12' : '\uD83D\uDD13'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: processClosed ? '#b91c1c' : '#15803d' }}>
                  {processClosed === null ? 'Carregando...' : processClosed ? 'Processo Encerrado' : 'Processo Aberto'}
                </div>
                <div style={{ fontSize: '0.8rem', color: processClosed ? '#991b1b' : '#166534', marginTop: 2 }}>
                  {processClosed
                    ? 'Candidatos n\u00e3o podem editar o formul\u00e1rio. Apenas o admin pode fazer ajustes.'
                    : 'Candidatos podem preencher e editar o formul\u00e1rio normalmente.'}
                </div>
              </div>
            </div>
            <button
              onClick={toggleProcess}
              disabled={processToggling || processClosed === null}
              style={{
                background: processClosed ? '#22c55e' : '#ef4444',
                color: 'white', border: 'none', borderRadius: '8px',
                padding: '10px 24px', fontWeight: 700, cursor: processToggling ? 'wait' : 'pointer',
                fontSize: '0.9rem', opacity: processToggling ? 0.7 : 1,
                minWidth: 180,
              }}>
              {processToggling ? '\u23F3 Aguarde...' : processClosed ? '\uD83D\uDD13 Reabrir Processo' : '\uD83D\uDD12 Encerrar Processo'}
            </button>
          </div>
        </div>

        {/* Exportação de Dados */}
        <div className="section-card" style={{ marginBottom: '28px', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.3rem' }}>💾</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>Exportar Dados para CSV</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Baixe os dados do sistema para guardar no seu computador. Os arquivos abrem no Excel.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => downloadCSV('completo', 'Exportação Completa')}
              disabled={downloading === 'completo'}
              style={{ background: '#5B2D8E', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', opacity: downloading === 'completo' ? 0.7 : 1 }}>
              {downloading === 'completo' ? '⏳ Baixando...' : '📥 Exportação Completa (todos os dados)'}
            </button>
            <button
              onClick={() => downloadCSV('participants', 'Participantes')}
              disabled={downloading === 'participants'}
              style={{ background: '#00C9C8', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', opacity: downloading === 'participants' ? 0.7 : 1 }}>
              {downloading === 'participants' ? '⏳ Baixando...' : '👥 Participantes e Formulários'}
            </button>
            <button
              onClick={() => downloadCSV('performance', 'Performance')}
              disabled={downloading === 'performance'}
              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', opacity: downloading === 'performance' ? 0.7 : 1 }}>
              {downloading === 'performance' ? '⏳ Baixando...' : '📈 Notas de Performance'}
            </button>
            <button
              onClick={() => downloadCSV('disc', 'DISC')}
              disabled={downloading === 'disc'}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', opacity: downloading === 'disc' ? 0.7 : 1 }}>
              {downloading === 'disc' ? '⏳ Baixando...' : '🔷 Resultados DISC'}
            </button>
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
