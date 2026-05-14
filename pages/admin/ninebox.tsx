import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { AreaAssessment } from '../../lib/types';

// Nine Box grid layout:
// Eixo Y (comportamental): high=linha 0, mid=linha 1, low=linha 2
// Eixo X (técnico):        low=col 0,  mid=col 1,  high=col 2
const GRID_CELLS: { x: string; y: string; label: string; color: string; bg: string }[] = [
  { x: 'low',  y: 'high', label: 'Potencial de Curto Prazo',          color: '#0369a1', bg: '#e0f2fe' },
  { x: 'mid',  y: 'high', label: 'Pronto em Desenvolvimento',          color: '#7c3aed', bg: '#ede9fe' },
  { x: 'high', y: 'high', label: 'Alta Prontidao',                     color: '#15803d', bg: '#dcfce7' },
  { x: 'low',  y: 'mid',  label: 'Desenvolvimento Direcionado',        color: '#92400e', bg: '#fef3c7' },
  { x: 'mid',  y: 'mid',  label: 'Potencial de Médio Prazo',           color: '#5B2D8E', bg: '#f3e8ff' },
  { x: 'high', y: 'mid',  label: 'Destaque Técnico',                   color: '#0f766e', bg: '#ccfbf1' },
  { x: 'low',  y: 'low',  label: 'Baixa Aderência',                    color: '#9f1239', bg: '#ffe4e6' },
  { x: 'mid',  y: 'low',  label: 'Especialista sem Líderança',         color: '#c2410c', bg: '#ffedd5' },
  { x: 'high', y: 'low',  label: 'Risco de Líderança',                 color: '#b45309', bg: '#fef9c3' },
];

function getCell(quadrantLabel: string) {
  const map: Record<string, { x: string; y: string }> = {
    'Baixa Aderência': { x: 'low', y: 'low' },
    'Especialista Técnico sem Perfil de Líderança': { x: 'mid', y: 'low' },
    'Risco de Líderança': { x: 'high', y: 'low' },
    'Desenvolvimento Direcionado': { x: 'low', y: 'mid' },
    'Potencial de Médio Prazo': { x: 'mid', y: 'mid' },
    'Destaque Técnico, lapidar líderança': { x: 'high', y: 'mid' },
    'Potencial de Curto Prazo (gap técnico)': { x: 'low', y: 'high' },
    'Pronto em Desenvolvimento': { x: 'mid', y: 'high' },
    'Alta Prontidao': { x: 'high', y: 'high' },
  };
  // Normalize: remove accents for matching
  const normalized = quadrantLabel
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00e7/g, 'c').replace(/\u00e3/g, 'a').replace(/\u00e2/g, 'a')
    .replace(/\u00e9/g, 'e').replace(/\u00ea/g, 'e').replace(/\u00f3/g, 'o')
    .replace(/\u00fa/g, 'u').replace(/\u00ed/g, 'i');
  return map[normalized] || map[quadrantLabel] || null;
}

export default function AdminNineBox() {
  const router = useRouter();
  const [report, setReport] = useState<Record<string, AreaAssessment[]>>({});
  const [selectedArea, setSelectedArea] = useState<string>(OFFICIAL_AREAS[0].code);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderênciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/ninebox')
      .then((res) => res.json())
      .then((data) => { setReport(data.report || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const areaData = report[selectedArea] || [];

  // Build grid: for each cell, find participants in that quadrant
  const cellParticipants = (x: string, y: string) =>
    areaData.filter((a) => {
      const cell = getCell(a.quadrant);
      return cell && cell.x === x && cell.y === y;
    });

  return (
    <>
      <Head><title>Nine Box | Admin | Banco de Sucessores</title></Head>

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
          <Link href="/admin"><button className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Dashboard</button></Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 1100, paddingTop: 96, paddingBottom: 60 }}>
        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#127919;</span>
            <div>
              <h2>Nine Box por Area</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Eixo X = Aderência Técnica &nbsp;|&nbsp; Eixo Y = Aderência Comportamental
              </p>
            </div>
          </div>

          {/* Area selector */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {OFFICIAL_AREAS.map((area) => (
              <button key={area.code} type="button"
                onClick={() => setSelectedArea(area.code)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: selectedArea === area.code ? 700 : 400,
                  border: `2px solid ${selectedArea === area.code ? 'var(--purple)' : 'var(--border)'}`,
                  background: selectedArea === area.code ? 'var(--gradient-soft)' : 'white',
                  color: selectedArea === area.code ? 'var(--purple)' : 'var(--text)', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {area.label}
                {report[area.code] && report[area.code].length > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--purple)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem' }}>
                    {report[area.code].length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Carregando dados...</div>
          ) : areaData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#128202;</div>
              <p>Nenhuma avaliação processada para <strong>{selectedArea}</strong>.</p>
              <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Os participantes precisam preencher o fórmulario e ter dados de performance e DISC importados.</p>
            </div>
          ) : (
            <>
              {/* Nine Box Grid */}
              <div style={{ position: 'relative', marginBottom: 32 }}>
                {/* Y axis label */}
                <div style={{
                  position: 'absolute', left: -32, top: '50%', transform: 'translateY(-50%) rotate(-90deg)',
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                }}>
                  Aderência Comportamental
                </div>

                <div style={{ marginLeft: 16 }}>
                  {/* Y axis labels */}
                  <div style={{ display: 'flex', marginBottom: 4, marginLeft: 60 }}>
                    {['Baixo (0-3)', 'Médio (4-6)', 'Alto (7-10)'].map((l) => (
                      <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{l}</div>
                    ))}
                  </div>

                  {/* Grid rows: high, mid, low (Y axis) */}
                  {(['high', 'mid', 'low'] as const).map((yVal, rowIdx) => (
                    <div key={yVal} style={{ display: 'flex', alignItems: 'stretch', marginBottom: 4 }}>
                      {/* Y axis row label */}
                      <div style={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {yVal === 'high' ? 'Alto' : yVal === 'mid' ? 'Médio' : 'Baixo'}
                      </div>
                      {/* 3 cells in this row */}
                      {(['low', 'mid', 'high'] as const).map((xVal) => {
                        const cellDef = GRID_CELLS.find((c) => c.x === xVal && c.y === yVal)!;
                        const participants = cellParticipants(xVal, yVal);
                        return (
                          <div key={xVal} style={{
                            flex: 1, minHeight: 120, border: `2px solid ${cellDef.color}30`,
                            borderRadius: 'var(--radius-sm)', background: cellDef.bg,
                            padding: '10px', marginRight: xVal !== 'high' ? 4 : 0,
                            display: 'flex', flexDirection: 'column',
                          }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cellDef.color, marginBottom: 8, lineHeight: 1.3 }}>
                              {cellDef.label}
                            </div>
                            {participants.length === 0 ? (
                              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>—</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {participants.map((p) => (
                                  <div key={`${p.participantId}-${p.area}`}
                                    style={{
                                      background: 'white', borderRadius: 4, padding: '4px 8px',
                                      fontSize: '0.75rem', color: cellDef.color, fontWeight: 600,
                                      border: `1px solid ${cellDef.color}40`,
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                                    }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {p.participantId}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.8, flexShrink: 0 }}>
                                      T:{p.technicalAdherence} B:{p.behavioralAdherence ?? '?'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* X axis label */}
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 60 }}>
                    Aderência Técnica
                  </div>
                </div>
              </div>

              {/* Participants table */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 12 }}>
                  Detalhamento — {selectedArea} ({areaData.length} avaliação(oes))
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--gradient-soft)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Participante</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Técnica</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Comportamental</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Quadrante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaData
                        .sort((a, b) => (b.technicalAdherence + (b.behavioralAdherence ?? 0)) - (a.technicalAdherence + (a.behavioralAdherence ?? 0)))
                        .map((a, i) => (
                          <tr key={`${a.participantId}-${a.area}`} style={{ background: i % 2 === 0 ? 'white' : 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 500 }}>{a.participantId}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{ background: 'var(--gradient-soft)', color: 'var(--purple)', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                                {a.technicalAdherence}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {a.behavioralAdherence !== undefined ? (
                                <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                                  {a.behavioralAdherence}
                                </span>
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>sem dados</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{a.quadrant}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

              {/* Tutorial de cálculo */}
              <div style={{ marginTop: 32, borderTop: '2px solid var(--border)', paddingTop: 24 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 16 }}>
                  Como o Nine Box e calculado?
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>

                  {/* Aderência Técnica */}
                  <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--purple)', fontSize: '0.88rem', marginBottom: 10 }}>
                      Eixo X — Aderência Técnica (0 a 10 pts)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}>
                        <span>Pós-graduação / MBA concluído</span>
                        <strong style={{ color: 'var(--purple)' }}>até 3 pts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}>
                        <span>Experiência gerencial/interina</span>
                        <strong style={{ color: 'var(--purple)' }}>até 4 pts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}>
                        <span>Cursos e projetos estratégicos</span>
                        <strong style={{ color: 'var(--purple)' }}>até 3 pts</strong>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Experiência: 1 pt a cada 6 meses completos (max 24 meses = 4 pts).<br />
                        Cursos/projetos: 1,2 pt por item estratégico da area, max 3 pts.
                      </div>
                    </div>
                  </div>

                  {/* Aderência Comportamental */}
                  <div style={{ background: '#e0f2fe', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.88rem', marginBottom: 10 }}>
                      Eixo Y — Aderência Comportamental (0 a 10 pts)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bae6fd', paddingBottom: 4, marginBottom: 4 }}>
                        <span>Nota DISC (0-10)</span>
                        <strong style={{ color: '#0369a1' }}>50%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bae6fd', paddingBottom: 4, marginBottom: 4 }}>
                        <span>Indicador de Performance (0-100 → 0-10)</span>
                        <strong style={{ color: '#0369a1' }}>50%</strong>
                      </div>
                      <div style={{ marginTop: 8, padding: '8px 10px', background: 'white', borderRadius: 6, fontSize: '0.75rem', fontFamily: 'monospace', color: '#0369a1' }}>
                        Comportamental = (DISC + Performance/10) / 2
                      </div>
                      <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Requer importação de DISC e Performance para ser calculado.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quadrantes */}
                <div style={{ background: '#fafafa', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.85rem', marginBottom: 12 }}>
                    Classificação dos Quadrantes
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'Alta Prontidao', desc: 'Técnica alta + Comportamental alta', color: '#15803d', bg: '#dcfce7' },
                      { label: 'Pronto em Desenvolvimento', desc: 'Técnica média + Comportamental alta', color: '#7c3aed', bg: '#ede9fe' },
                      { label: 'Potencial de Curto Prazo', desc: 'Técnica baixa + Comportamental alta', color: '#0369a1', bg: '#e0f2fe' },
                      { label: 'Destaque Técnico', desc: 'Técnica alta + Comportamental média', color: '#0f766e', bg: '#ccfbf1' },
                      { label: 'Potencial de Médio Prazo', desc: 'Técnica média + Comportamental média', color: '#5B2D8E', bg: '#f3e8ff' },
                      { label: 'Desenvolvimento Direcionado', desc: 'Técnica baixa + Comportamental média', color: '#92400e', bg: '#fef3c7' },
                      { label: 'Risco de Líderança', desc: 'Técnica alta + Comportamental baixa', color: '#b45309', bg: '#fef9c3' },
                      { label: 'Especialista sem Líderança', desc: 'Técnica média + Comportamental baixa', color: '#c2410c', bg: '#ffedd5' },
                      { label: 'Baixa Aderência', desc: 'Técnica baixa + Comportamental baixa', color: '#9f1239', bg: '#ffe4e6' },
                    ].map((q) => (
                      <div key={q.label} style={{ background: q.bg, borderRadius: 6, padding: '8px 12px', border: `1px solid ${q.color}30` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: q.color, marginBottom: 2 }}>{q.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{q.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Faixas: Baixo = 0-3 pts &nbsp;|&nbsp; Médio = 4-6 pts &nbsp;|&nbsp; Alto = 7-10 pts
                  </div>
                </div>
              </div>

        </div>
      </main>
    </>
  );
}
