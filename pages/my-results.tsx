import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const NINEBOX_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'Alto Potencial': { label: 'Alto Potencial', color: '#065f46', bg: '#d1fae5' },
  'Estrela em Ascensão': { label: 'Estrela em Ascensão', color: '#1e40af', bg: '#dbeafe' },
  'Diamante': { label: 'Diamante', color: '#5B2D8E', bg: '#f5f0ff' },
  'Sólido Contribuidor': { label: 'Sólido Contribuidor', color: '#92400e', bg: '#fef3c7' },
  'Profissional Eficaz': { label: 'Profissional Eficaz', color: '#374151', bg: '#f3f4f6' },
  'Potencial Inexplorado': { label: 'Potencial Inexplorado', color: '#0e7490', bg: '#e0fafa' },
  'Em Desenvolvimento': { label: 'Em Desenvolvimento', color: '#991b1b', bg: '#fee2e2' },
  'Precisa de Suporte': { label: 'Precisa de Suporte', color: '#7c3aed', bg: '#ede9fe' },
  'Risco de Retenção': { label: 'Risco de Retenção', color: '#b45309', bg: '#fef3c7' },
};

export default function MyResults() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    const email = sessionStorage.getItem('aderenciaEmail');
    const name = sessionStorage.getItem('aderenciaName');
    if (role !== 'participant' || !email) { router.push('/login'); return; }
    setUserName(name || email);
    fetch('/api/participant/results?email=' + encodeURIComponent(email))
      .then((r) => r.json())
      .then((d) => { setResults(d.results || []); setLoading(false); });
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  return (
    <>
      <Head><title>Minha Aderência | Banco de Sucessores</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLider" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderência</div>
            <div className="topbar-subtitle">EcoLider · SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="topbar-user">👤 {userName}</span>
          <Link href="/participant" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            ← Meu Perfil
          </Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container">
        <div className="page-header">
          <h1>Minha Aderência</h1>
          <p>Veja sua pontuação e posição no Nine Box para cada área de interesse selecionada.</p>
        </div>

        {loading && (
          <div className="section-card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <p style={{ color: 'var(--text-muted)' }}>Calculando sua aderência...</p>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="section-card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <h3 style={{ color: 'var(--purple)', marginBottom: '8px' }}>Resultados ainda não disponíveis</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Seus resultados serão exibidos após o processamento pelo RH.<br />
              Certifique-se de ter enviado seu formulário de candidatura.
            </p>
            <Link href="/participant" className="btn-secondary">← Voltar ao formulário</Link>
          </div>
        )}

        {!loading && results.map((r: any) => {
          const nb = NINEBOX_LABELS[r.nineBoxClassification] || { label: r.nineBoxClassification, color: '#374151', bg: '#f3f4f6' };
          return (
            <div key={r.area} className="section-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0 }}>📍 Área: {r.area}</h2>
                <span className="badge badge-purple" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  Aderência Total: {r.totalScore?.toFixed(1) ?? '—'} / 20
                </span>
              </div>

              {/* Nine Box Position */}
              <div style={{ background: nb.bg, border: `2px solid ${nb.color}30`, borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '2rem' }}>🎯</div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Posição no Nine Box</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: nb.color }}>{nb.label}</div>
                </div>
              </div>

              {/* Scores por quesito */}
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Pontuação por Quesito</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: '🎓 Aderência Técnica', value: r.technicalScore, max: 10, desc: 'Pós/MBA + Experiência + Cursos/Projetos' },
                  { label: '🧠 Aderência Comportamental', value: r.behavioralScore, max: 10, desc: 'Performance + DISC' },
                  { label: '📚 Pós/MBA', value: r.breakdown?.postMBA, max: 3, desc: 'Formação pós-graduada reconhecida' },
                  { label: '💼 Experiência Gerencial', value: r.breakdown?.experience, max: 4, desc: 'Tempo em funções gerenciais/interinas' },
                  { label: '📋 Cursos e Projetos', value: r.breakdown?.coursesProjects, max: 3, desc: 'Cursos e projetos estratégicos' },
                  { label: '📊 Performance', value: r.breakdown?.performance, max: 5, desc: 'Indicador de engajamento e desempenho' },
                  { label: '🔷 Perfil DISC', value: r.breakdown?.disc, max: 5, desc: 'Alinhamento comportamental DISC' },
                ].filter((item) => item.value !== undefined).map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{item.desc}</span>
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--purple)' }}>
                        {item.value?.toFixed(1) ?? '—'} / {item.max}
                      </span>
                    </div>
                    <div className="score-bar-track">
                      <div className="score-bar-fill" style={{ width: `${Math.min(100, ((item.value || 0) / item.max) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Transparência */}
              <div style={{ background: '#f8f7fc', borderRadius: '10px', padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--purple)' }}>
                <strong style={{ color: 'var(--purple)' }}>ℹ Sobre este resultado:</strong> A aderência técnica é calculada com base nos itens do catálogo oficial do SEBRAE TO. Cursos e projetos marcados como ★ transversais valem para todas as áreas. Os demais pontuam apenas na área correspondente. A aderência comportamental combina seu indicador de performance com o perfil DISC.
              </div>
            </div>
          );
        })}
      </main>
    </>
  );
}
