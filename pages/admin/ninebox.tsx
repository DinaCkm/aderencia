import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { AreaAssessment, AssessmentCalculation, PostMBADetail, ProjectDetail } from '../../lib/types';

type AssessmentWithMeta = AreaAssessment & {
  participantName: string;
  technicalScore: number;
  behavioralScore?: number;
  postMBADetail?: PostMBADetail;
  projectsDetail?: ProjectDetail[];
  calculationSteps: AssessmentCalculation[];
};

// Nine Box grid layout
const GRID_CELLS: { x: string; y: string; label: string; color: string; bg: string }[] = [
  { x: 'low',  y: 'high', label: 'Potencial de Curto Prazo',          color: '#0369a1', bg: '#e0f2fe' },
  { x: 'mid',  y: 'high', label: 'Pronto em Desenvolvimento',          color: '#7c3aed', bg: '#ede9fe' },
  { x: 'high', y: 'high', label: 'Alta Prontidao',                     color: '#15803d', bg: '#dcfce7' },
  { x: 'low',  y: 'mid',  label: 'Desenvolvimento Direcionado',        color: '#92400e', bg: '#fef3c7' },
  { x: 'mid',  y: 'mid',  label: 'Potencial de Médio Prazo',           color: '#5B2D8E', bg: '#f3e8ff' },
  { x: 'high', y: 'mid',  label: 'Destaque Técnico',                   color: '#0f766e', bg: '#ccfbf1' },
  { x: 'low',  y: 'low',  label: 'Baixa Aderência',                    color: '#9f1239', bg: '#ffe4e6' },
  { x: 'mid',  y: 'low',  label: 'Especialista sem Liderança',         color: '#c2410c', bg: '#ffedd5' },
  { x: 'high', y: 'low',  label: 'Risco de Liderança',                 color: '#b45309', bg: '#fef9c3' },
];

function getCell(quadrantLabel: string) {
  const map: Record<string, { x: string; y: string }> = {
    'Baixa Aderência': { x: 'low', y: 'low' },
    'Especialista Técnico sem Perfil de Liderança': { x: 'mid', y: 'low' },
    'Especialista sem Liderança': { x: 'mid', y: 'low' },
    'Risco de Liderança': { x: 'high', y: 'low' },
    'Desenvolvimento Direcionado': { x: 'low', y: 'mid' },
    'Potencial de Médio Prazo': { x: 'mid', y: 'mid' },
    'Destaque Técnico, lapidar liderança': { x: 'high', y: 'mid' },
    'Destaque Técnico': { x: 'high', y: 'mid' },
    'Potencial de Curto Prazo (gap técnico)': { x: 'low', y: 'high' },
    'Potencial de Curto Prazo': { x: 'low', y: 'high' },
    'Pronto em Desenvolvimento': { x: 'mid', y: 'high' },
    'Alta Prontidão': { x: 'high', y: 'high' },
    'Alta Prontidao': { x: 'high', y: 'high' },
  };
  return map[quadrantLabel] || null;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', background: color || 'var(--purple)', borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
}

function DetailRow({ label, score, maxScore, color, summary, details }: {
  label: string; score: number; maxScore: number; color: string; summary: string;
  details: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 4, padding: '1px 7px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
          <button type="button" onClick={() => setOpen(o => !o)}
            style={{ background: open ? color : 'none', border: `1px solid ${color}`, borderRadius: 4, padding: '1px 8px', cursor: 'pointer', fontSize: '0.68rem', color: open ? 'white' : color, fontWeight: 600, flexShrink: 0 }}>
            {open ? '▲ Fechar' : '▼ Detalhes'}
          </button>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color, marginLeft: 8, whiteSpace: 'nowrap' }}>
          {score.toFixed(1)} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {maxScore}</span>
        </span>
      </div>
      <ScoreBar value={score} max={maxScore} color={color} />
      {open && (
        <div style={{ marginTop: 8, background: '#f8f7fc', border: `1.5px solid ${color}30`, borderRadius: 8, padding: '12px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <tbody>
              {details.map((d, i) => (
                <tr key={i} style={{ borderBottom: i < details.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '6px 8px 6px 0', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', width: '35%' }}>{d.label}</td>
                  <td style={{ padding: '6px 0', color: 'var(--text)', lineHeight: 1.5 }}>{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ParticipantModal({ p, onClose }: { p: AssessmentWithMeta; onClose: () => void }) {
  const techScore: number = p.technicalScore ?? 0;
  const behavScore: number | undefined = p.behavioralScore;
  const expDetail = p.calculationSteps?.find((s) => s.name.includes('Experi'))?.detail ?? '';
  const perfRaw = p.calculationSteps?.find((s) => s.name.includes('Performance'))?.value;
  const discRaw = p.calculationSteps?.find((s) => s.name.includes('DISC'))?.value;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 680, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Detalhamento de Pontuação</div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--purple)', fontWeight: 800 }}>{p.participantName}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Área: <strong>{p.area}</strong> &nbsp;|&nbsp; Quadrante: <strong>{p.quadrant}</strong></div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            ✕ Fechar
          </button>
        </div>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'var(--gradient-soft)', border: '2px solid var(--purple)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>📘 Aderência Técnica</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--purple)', lineHeight: 1 }}>{techScore.toFixed(1)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>nota em 0–10</div>
            <div style={{ marginTop: 10 }}><ScoreBar value={techScore} max={10} color="var(--purple)" /></div>
          </div>
          <div style={{ background: '#f0fdfa', border: '2px solid #0e7490', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>🧠 Aderência Comportamental</div>
            {behavScore !== undefined ? (
              <>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0e7490', lineHeight: 1 }}>{behavScore.toFixed(1)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>nota em 0–10</div>
                <div style={{ marginTop: 10 }}><ScoreBar value={behavScore} max={10} color="#0e7490" /></div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#9ca3af', lineHeight: 1, marginTop: 8 }}>—</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>Aguardando performance e DISC</div>
              </>
            )}
          </div>
        </div>

        {/* Aderência Técnica — detalhamento */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple)' }}>📘 Detalhamento Técnico</h3>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--purple)' }}>
              {techScore.toFixed(1)}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
            </span>
          </div>
          <ScoreBar value={techScore} max={10} color="var(--purple)" />
          <div style={{ marginTop: 16 }}>
            <DetailRow
              label="🎓 Pós-graduação / MBA"
              score={p.postMBADetail?.score ?? 0}
              maxScore={40}
              color="#7c3aed"
              summary={p.postMBADetail?.titleUsed
                ? `"${p.postMBADetail.titleUsed}" — ${p.postMBADetail.classification}`
                : 'Nenhum título informado'}
              details={[
                { label: 'Título considerado', value: p.postMBADetail?.titleUsed ?? 'Nenhum' },
                { label: 'Classificação', value: p.postMBADetail?.classification ?? '—' },
                { label: 'Pontuação', value: `${p.postMBADetail?.score ?? 0} pts de 40 possíveis` },
                { label: 'Regra', value: 'Transversal = 40 pts | Específico da área = 20 pts | Não relacionado = 20 pts | Sem título = 0 pts' },
              ]}
            />
            <DetailRow
              label="💼 Experiência gerencial / interina"
              score={Number(p.calculationSteps?.find((s) => s.name.includes('Experi'))?.value ?? 0)}
              maxScore={20}
              color="#0e7490"
              summary={expDetail || 'Sem experiência gerencial informada'}
              details={[
                { label: 'Fórmula', value: '5 pts por ano, máx. 20 pts' },
                { label: 'Detalhe', value: expDetail || 'Nenhum mês informado' },
              ]}
            />
            <DetailRow
              label="📋 Projetos estratégicos da área"
              score={Number(p.calculationSteps?.find((s) => s.name.includes('Projetos'))?.value ?? 0)}
              maxScore={20}
              color="#059669"
              summary={p.projectsDetail && p.projectsDetail.length > 0
                ? `${p.projectsDetail.length} projeto(s) para ${p.area}`
                : 'Nenhum projeto selecionado para esta área'}
              details={[
                ...(p.projectsDetail && p.projectsDetail.length > 0
                  ? p.projectsDetail.map((proj) => ({
                      label: proj.label,
                      value: `${proj.points} pts (${proj.points === 20 ? 'Estruturante' : 'Relevante'})`
                    }))
                  : [{ label: 'Projetos', value: 'Nenhum projeto desta área foi selecionado' }]),
                { label: 'Regra', value: 'Estruturante = 20 pts | Relevante = 15 pts | Máx. 20 pts por área' },
              ]}
            />
            <div style={{ marginTop: 10, background: '#f0f4ff', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', border: '1px solid #c7d2fe' }}>
              <span style={{ color: '#4338ca', fontWeight: 600 }}>Total bruto (0–80) → convertido para escala 0–10</span>
              <span style={{ fontWeight: 800, color: 'var(--purple)' }}>
                {(() => {
                  const raw = Number(p.calculationSteps?.find((s) => s.name.includes('bruto') || s.name.includes('Bruto') || s.name.includes('Total'))?.value ?? 0);
                  return `${raw} pts brutos → ${techScore.toFixed(1)}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Aderência Comportamental — detalhamento */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0e7490' }}>🧠 Detalhamento Comportamental</h3>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0e7490' }}>
              {behavScore !== undefined ? behavScore.toFixed(1) : '—'}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
            </span>
          </div>
          {behavScore !== undefined && <ScoreBar value={behavScore} max={10} color="#0e7490" />}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>📈 Performance (Engajamento)</span>
                <span style={{ fontWeight: 800, color: '#0e7490', fontSize: '0.9rem' }}>
                  {perfRaw !== undefined ? `${Number(perfRaw).toFixed(1)} / 10` : '—'}
                </span>
              </div>
              {perfRaw !== undefined && <ScoreBar value={Number(perfRaw)} max={10} color="#0e7490" />}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Score de engajamento (0–100) convertido para escala 0–10
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>🔷 Perfil DISC</span>
                <span style={{ fontWeight: 800, color: '#0e7490', fontSize: '0.9rem' }}>
                  {discRaw !== undefined ? `${Number(discRaw).toFixed(1)} / 10` : '—'}
                </span>
              </div>
              {discRaw !== undefined && <ScoreBar value={Number(discRaw)} max={10} color="#0e7490" />}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Nota DISC fornecida pelo RH (escala 0–10)
              </div>
            </div>
            {behavScore !== undefined && (
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#0f766e', fontWeight: 600 }}>Fórmula: (Performance + DISC) ÷ 2</span>
                <span style={{ fontWeight: 800, color: '#0e7490' }}>{behavScore.toFixed(1)} / 10</span>
              </div>
            )}
          </div>
        </div>

        {/* Exceções */}
        {p.exceptions && p.exceptions.length > 0 && (
          <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠ Exceções aplicadas</div>
            {p.exceptions.map((ex, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: 2 }}>• {ex}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminNineBox() {
  const router = useRouter();
  const [report, setReport] = useState<Record<string, AssessmentWithMeta[]>>({});
  const [selectedArea, setSelectedArea] = useState<string>(OFFICIAL_AREAS[0].code);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AssessmentWithMeta | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/ninebox')
      .then((res) => res.json())
      .then((data) => { setReport(data.report || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const areaData = report[selectedArea] || [];

  const cellParticipants = (x: string, y: string) =>
    areaData.filter((a) => {
      const cell = getCell(a.quadrant);
      return cell && cell.x === x && cell.y === y;
    });

  return (
    <>
      <Head><title>Nine Box | Admin | Banco de Sucessores</title></Head>

      {/* Modal de detalhamento */}
      {selected && <ParticipantModal p={selected} onClose={() => setSelected(null)} />}

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
              <h2>Nine Box por Área</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Eixo X = Aderência Técnica &nbsp;|&nbsp; Eixo Y = Aderência Comportamental &nbsp;|&nbsp;
                <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Clique em um participante para ver o detalhamento completo</span>
              </p>
            </div>
          </div>

          {/* Seletor de área */}
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
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
              <p>Nenhuma avaliação processada para <strong>{selectedArea}</strong>.</p>
              <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Os participantes precisam preencher o formulário e ter dados de performance e DISC importados.</p>
            </div>
          ) : (
            <>
              {/* Nine Box Grid */}
              <div style={{ position: 'relative', marginBottom: 32 }}>
                <div style={{
                  position: 'absolute', left: -32, top: '50%', transform: 'translateY(-50%) rotate(-90deg)',
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                }}>
                  Aderência Comportamental
                </div>

                <div style={{ marginLeft: 16 }}>
                  {/* Cabeçalho X */}
                  <div style={{ display: 'flex', marginBottom: 4, marginLeft: 60 }}>
                    {['Baixo (0-3)', 'Médio (4-6)', 'Alto (7-10)'].map((l) => (
                      <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{l}</div>
                    ))}
                  </div>

                  {/* Linhas do grid */}
                  {(['high', 'mid', 'low'] as const).map((yVal) => (
                    <div key={yVal} style={{ display: 'flex', alignItems: 'stretch', marginBottom: 4 }}>
                      <div style={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {yVal === 'high' ? 'Alto' : yVal === 'mid' ? 'Médio' : 'Baixo'}
                      </div>
                      {(['low', 'mid', 'high'] as const).map((xVal) => {
                        const cellDef = GRID_CELLS.find((c) => c.x === xVal && c.y === yVal)!;
                        const participants = cellParticipants(xVal, yVal);
                        return (
                          <div key={xVal} style={{
                            flex: 1, minHeight: 130, border: `2px solid ${cellDef.color}30`,
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
                                  <button
                                    key={`${p.participantId}-${p.area}`}
                                    type="button"
                                    onClick={() => setSelected(p)}
                                    title="Clique para ver detalhamento completo"
                                    style={{
                                      background: 'white', borderRadius: 6, padding: '5px 8px',
                                      fontSize: '0.75rem', color: cellDef.color, fontWeight: 600,
                                      border: `1px solid ${cellDef.color}40`,
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
                                      cursor: 'pointer', textAlign: 'left', width: '100%',
                                      transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = cellDef.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = cellDef.color; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = `${cellDef.color}40`; }}
                                  >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      {p.participantName || p.participantId}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.75, flexShrink: 0, fontWeight: 400 }}>
                                      T:{p.technicalScore?.toFixed(1)} B:{p.behavioralScore !== undefined ? p.behavioralScore.toFixed(1) : '?'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 60 }}>
                    Aderência Técnica
                  </div>
                </div>
              </div>

              {/* Tabela de detalhamento */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 12 }}>
                  Detalhamento — {selectedArea} ({areaData.length} avaliação(ões))
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--gradient-soft)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Participante</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Técnica</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Comportamental</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Quadrante</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaData
                        .sort((a, b) => (b.technicalScore + (b.behavioralScore ?? 0)) - (a.technicalScore + (a.behavioralScore ?? 0)))
                        .map((a, i) => (
                          <tr key={`${a.participantId}-${a.area}`} style={{ background: i % 2 === 0 ? 'white' : 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.participantName || a.participantId}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span style={{ background: 'var(--gradient-soft)', color: 'var(--purple)', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                                {a.technicalScore?.toFixed(1)}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {a.behavioralScore !== undefined ? (
                                <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                                  {a.behavioralScore.toFixed(1)}
                                </span>
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>sem dados</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{a.quadrant}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button type="button" onClick={() => setSelected(a)}
                                style={{ background: 'var(--gradient-soft)', border: '1px solid var(--purple)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--purple)', fontWeight: 600 }}>
                                Ver detalhes
                              </button>
                            </td>
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
              Como o Nine Box é calculado?
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--purple)', fontSize: '0.88rem', marginBottom: 10 }}>Eixo X — Aderência Técnica (0 a 10 pts)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}><span>Pós-graduação / MBA concluído</span><strong style={{ color: 'var(--purple)' }}>até 40 pts</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}><span>Experiência gerencial/interina</span><strong style={{ color: 'var(--purple)' }}>até 20 pts</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}><span>Projetos estratégicos da área</span><strong style={{ color: 'var(--purple)' }}>até 20 pts</strong></div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total bruto 0–80 convertido para 0–10.</div>
                </div>
              </div>
              <div style={{ background: '#f0fdfa', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid #99f6e4' }}>
                <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '0.88rem', marginBottom: 10 }}>Eixo Y — Aderência Comportamental (0 a 10 pts)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #99f6e4', paddingBottom: 4, marginBottom: 4 }}><span>Performance / Engajamento (0–100 → 0–10)</span><strong style={{ color: '#0f766e' }}>50%</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}><span>Perfil DISC (0–10)</span><strong style={{ color: '#0f766e' }}>50%</strong></div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fórmula: (Performance + DISC) ÷ 2</div>
                </div>
              </div>
              <div style={{ background: '#fafafa', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem', marginBottom: 10 }}>Faixas de classificação</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}><span>Baixo</span><strong>0 – 3,9</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}><span>Médio</span><strong>4 – 6,9</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Alto</span><strong>7 – 10</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
