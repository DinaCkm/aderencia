import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS } from '../lib/constants';

// Definição das 9 células do Nine Box
const GRID_CELLS: { x: string; y: string; label: string; color: string; bg: string; border: string }[] = [
  { x: 'low',  y: 'high', label: 'Potencial de Curto Prazo (gap técnico)', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' },
  { x: 'mid',  y: 'high', label: 'Pronto em Desenvolvimento',              color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  { x: 'high', y: 'high', label: 'Alta Prontidão',                         color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  { x: 'low',  y: 'mid',  label: 'Desenvolvimento Direcionado',            color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  { x: 'mid',  y: 'mid',  label: 'Potencial de Médio Prazo',               color: '#5B2D8E', bg: '#f3e8ff', border: '#d8b4fe' },
  { x: 'high', y: 'mid',  label: 'Destaque Técnico, lapidar liderança',   color: '#0f766e', bg: '#ccfbf1', border: '#5eead4' },
  { x: 'low',  y: 'low',  label: 'Baixa Aderência',                        color: '#9f1239', bg: '#ffe4e6', border: '#fca5a5' },
  { x: 'mid',  y: 'low',  label: 'Especialista Técnico sem Perfil de Liderança', color: '#c2410c', bg: '#ffedd5', border: '#fdba74' },
  { x: 'high', y: 'low',  label: 'Risco de Liderança',                     color: '#b45309', bg: '#fef9c3', border: '#fde047' },
];

function getCell(quadrantLabel: string): { x: string; y: string } | null {
  const map: Record<string, { x: string; y: string }> = {
    // Labels exatos do business.ts
    'Alta Prontidão':                                         { x: 'high', y: 'high' },
    'Pronto em Desenvolvimento':                              { x: 'mid',  y: 'high' },
    'Potencial de Curto Prazo (gap técnico)':                 { x: 'low',  y: 'high' },
    'Destaque Técnico, lapidar liderança':                    { x: 'high', y: 'mid'  },
    'Potencial de Médio Prazo':                               { x: 'mid',  y: 'mid'  },
    'Desenvolvimento Direcionado':                            { x: 'low',  y: 'mid'  },
    'Risco de Liderança':                                     { x: 'high', y: 'low'  },
    'Especialista Técnico sem Perfil de Liderança':           { x: 'mid',  y: 'low'  },
    'Baixa Aderência':                                        { x: 'low',  y: 'low'  },
    // Aliases de compatibilidade
    'Alta Prontidao':                                         { x: 'high', y: 'high' },
    'Potencial de Curto Prazo':                               { x: 'low',  y: 'high' },
    'Destaque Técnico':                                       { x: 'high', y: 'mid'  },
    'Especialista sem Liderança':                             { x: 'mid',  y: 'low'  },
  };
  return map[quadrantLabel] || null;
}

const Y_LABELS = ['high', 'mid', 'low'];
const X_LABELS = ['low', 'mid', 'high'];

export default function NineBoxPublic() {
  const router = useRouter();
  const [participantName, setParticipantName] = useState('');
  const [myEmail, setMyEmail] = useState('');
  const [report, setReport] = useState<Record<string, { name: string; quadrant: string }[]>>({});
  const [allowedAreas, setAllowedAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    const email = sessionStorage.getItem('aderenciaEmail');
    const name = sessionStorage.getItem('aderenciaName');
    if (!role || !email) { router.push('/login'); return; }
    setParticipantName(name || '');
    setMyEmail(email);

    fetch(`/api/participant/ninebox-public?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data.report || {});
        const areas: string[] = data.allowedAreas || [];
        setAllowedAreas(areas);
        if (areas.length > 0) setSelectedArea(areas[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  // Participantes da área selecionada
  const areaParticipants = report[selectedArea] || [];

  // Participantes por célula do Nine Box
  const cellParticipants = (x: string, y: string) =>
    areaParticipants.filter((p) => {
      const cell = getCell(p.quadrant);
      return cell && cell.x === x && cell.y === y;
    });

  // Área selecionada label
  const areaLabel = OFFICIAL_AREAS.find((a) => a.code === selectedArea)?.label || selectedArea;

  return (
    <>
      <Head><title>Nine Box — Visão Geral | Banco de Sucessores</title></Head>

      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLíder"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores — Aderência</div>
            <div className="topbar-subtitle">SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions" style={{ gap: 10 }}>
          {participantName && (
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 6 }}>
              👤 {participantName}
            </span>
          )}
          <Link href="/my-results"><button className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Meus resultados</button></Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 1100, paddingTop: 96, paddingBottom: 60 }}>

        {/* Banner de aviso de resultado provisório */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2.5px solid #f59e0b',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          gap: 18,
          alignItems: 'flex-start',
          boxShadow: '0 4px 20px rgba(245,158,11,0.18)',
        }}>
          <div style={{ fontSize: '2.2rem', flexShrink: 0, lineHeight: 1 }}>&#9888;&#65039;</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e', marginBottom: 6, letterSpacing: '0.2px' }}>
              RESULTADO PROVISÓRIO — SUJEITO A ANÁLISE E COMPROVAÇÃO
            </div>
            <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: 1.7, margin: 0 }}>
              As posições exibidas neste Nine Box são <strong>provisórias</strong> e foram geradas
              automaticamente com base nas informações declaradas pelos próprios participantes.
              Todos os dados estão sujeitos à <strong>validação, análise e comprovação documental
              pelo RH/UGP</strong> antes de qualquer decisão oficial. A posição final pode ser
              alterada após a conferência dos comprovantes entregues.
            </p>
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="section-card" style={{ marginBottom: 24 }}>
          <div className="section-title">
            <span className="section-icon">🎯</span>
            <div>
              <h2>Nine Box — Visão por Área</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Veja a posição dos colegas nos quadrantes das áreas que você selecionou como interesse.
                As notas não são exibidas — apenas os nomes nos quadrantes.
              </p>
            </div>
          </div>

          {/* Seletor de área */}
          {!loading && allowedAreas.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {allowedAreas.map((code) => {
                const area = OFFICIAL_AREAS.find((a) => a.code === code);
                const label = area?.label || code;
                const count = (report[code] || []).length;
                return (
                  <button key={code} type="button"
                    onClick={() => setSelectedArea(code)}
                    style={{
                      padding: '7px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                      fontWeight: selectedArea === code ? 700 : 400,
                      border: `2px solid ${selectedArea === code ? 'var(--purple)' : 'var(--border)'}`,
                      background: selectedArea === code ? 'var(--gradient-soft)' : 'white',
                      color: selectedArea === code ? 'var(--purple)' : 'var(--text)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {label}
                    <span style={{ marginLeft: 6, background: selectedArea === code ? 'var(--purple)' : '#e5e7eb', color: selectedArea === code ? 'white' : '#6b7280', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem' }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            Carregando Nine Box...
          </div>
        )}

        {!loading && allowedAreas.length === 0 && (
          <div className="section-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <h3 style={{ color: 'var(--purple)', marginBottom: 8, fontSize: '1rem' }}>Nenhuma área selecionada</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.85rem' }}>
              Você ainda não selecionou áreas de interesse no formulário.
            </p>
            <Link href="/participant"><button className="btn-primary">Ir para o formulário</button></Link>
          </div>
        )}

        {!loading && selectedArea && (
          <>
            {/* Legenda dos eixos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--purple)' }}>Eixo Y (vertical):</strong> Aderência Comportamental &nbsp;|&nbsp;
                <strong style={{ color: 'var(--cyan)' }}>Eixo X (horizontal):</strong> Aderência Técnica
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 6, padding: '4px 10px' }}>
                {areaParticipants.length} participante{areaParticipants.length !== 1 ? 's' : ''} em <strong>{areaLabel}</strong>
              </div>
            </div>

            {/* Grid Nine Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr 36px', gap: 4, minHeight: 520 }}>

              {/* Rótulos do eixo Y (vertical) */}
              {['Alta', 'Média', 'Baixa'].map((label, i) => (
                <div key={label} style={{
                  gridColumn: 1, gridRow: i + 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  letterSpacing: '0.5px',
                }}>
                  {label}
                </div>
              ))}

              {/* Células do Nine Box */}
              {Y_LABELS.map((y, yi) =>
                X_LABELS.map((x, xi) => {
                  const cellDef = GRID_CELLS.find((c) => c.x === x && c.y === y)!;
                  const people = cellParticipants(x, y);
                  const isMyCell = people.some((p) => {
                    // Destaca o próprio participante
                    const me = report[selectedArea]?.find((pp) => pp.name === participantName);
                    return me && me.quadrant === cellDef.label;
                  });

                  return (
                    <div key={`${x}-${y}`} style={{
                      gridColumn: xi + 2, gridRow: yi + 1,
                      background: cellDef.bg,
                      border: `2px solid ${cellDef.border}`,
                      borderRadius: 10,
                      padding: '10px 12px',
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      position: 'relative',
                    }}>
                      {/* Label do quadrante */}
                      <div style={{
                        fontSize: '0.65rem', fontWeight: 700, color: cellDef.color,
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                        borderBottom: `1px solid ${cellDef.border}`,
                        paddingBottom: 5, marginBottom: 4,
                        lineHeight: 1.3,
                      }}>
                        {cellDef.label}
                      </div>

                      {/* Nomes dos participantes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                        {people.length === 0 ? (
                          <div style={{ fontSize: '0.68rem', color: `${cellDef.color}60`, fontStyle: 'italic', marginTop: 4 }}>
                            —
                          </div>
                        ) : (
                          people.map((p) => {
                            const isMe = p.name === participantName;
                            return (
                              <div key={p.name} style={{
                                fontSize: '0.75rem',
                                fontWeight: isMe ? 800 : 500,
                                color: isMe ? cellDef.color : `${cellDef.color}cc`,
                                background: isMe ? `${cellDef.border}60` : 'transparent',
                                borderRadius: isMe ? 4 : 0,
                                padding: isMe ? '2px 6px' : '1px 0',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                {isMe && <span style={{ fontSize: '0.65rem' }}>👤</span>}
                                {p.name}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Contador */}
                      {people.length > 0 && (
                        <div style={{
                          position: 'absolute', top: 6, right: 8,
                          background: cellDef.color, color: 'white',
                          borderRadius: 10, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700,
                        }}>
                          {people.length}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Rótulos do eixo X (horizontal) */}
              {['Baixa', 'Média', 'Alta'].map((label, i) => (
                <div key={label} style={{
                  gridColumn: i + 2, gridRow: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
                  letterSpacing: '0.5px',
                }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Legenda de destaque */}
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 4, padding: '2px 8px', fontWeight: 700, color: '#7c3aed', fontSize: '0.72rem' }}>
                👤 Você
              </span>
              <span>Seu nome aparece destacado no quadrante correspondente.</span>
            </div>
          </>
        )}
      </main>
    </>
  );
}
