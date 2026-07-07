import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const QUADRANT_INFO: Record<string, { color: string; bg: string; icon: string; desc: string }> = {
  'Alta Prontidão':                          { color: '#065f46', bg: '#d1fae5', icon: '🏆', desc: 'Candidato com alta aderência técnica E comportamental. Candidato ideal: está pronto para assumir a posição agora ou em curto prazo.' },
  'Alta Prontidao':                          { color: '#065f46', bg: '#d1fae5', icon: '🏆', desc: 'Candidato com alta aderência técnica E comportamental. Candidato ideal: está pronto para assumir a posição agora ou em curto prazo.' },
  'Pronto em Desenvolvimento':              { color: '#1d4ed8', bg: '#dbeafe', icon: '⭐', desc: 'Perfil comportamental excelente e aderência técnica em desenvolvimento (média). Tem grande potencial e pode ser preparado rapidamente com capacitação técnica.' },
  'Potencial de Curto Prazo':               { color: '#0e7490', bg: '#cffafe', icon: '🚀', desc: 'Perfil comportamental alto, mas aderência técnica baixa. Tem o perfil certo para a área, mas ainda precisa de capacitação técnica. Pode ser desenvolvido a médio prazo.' },
  'Destaque Técnico, lapidar liderança':    { color: '#7c3aed', bg: '#ede9fe', icon: '🔧', desc: 'Aderência técnica alta, mas perfil comportamental médio. Domina o conteúdo, mas precisa desenvolver competências de liderança e comportamento.' },
  'Destaque Técnico':                       { color: '#0f766e', bg: '#ccfbf1', icon: '🔧', desc: 'Aderência técnica alta, mas perfil comportamental médio. Domina o conteúdo, mas precisa desenvolver competências de liderança e comportamento.' },
  'Potencial de Médio Prazo':               { color: '#b45309', bg: '#fef3c7', icon: '📈', desc: 'Técnica e comportamento ambos médios. Candidato equilibrado, mas ainda não está pronto. Precisa de desenvolvimento em ambas as dimensões.' },
  'Desenvolvimento Direcionado':            { color: '#92400e', bg: '#fef9c3', icon: '🎯', desc: 'Técnica e comportamento ambos baixos-médios. Precisa de um plano de desenvolvimento estruturado antes de ser considerado para sucessão.' },
  'Potencial de Longo Prazo':               { color: '#6b7280', bg: '#f3f4f6', icon: '🌱', desc: 'Aderência inicial. Requer plano de desenvolvimento estruturado.' },
  'Em Desenvolvimento':                     { color: '#6b7280', bg: '#f3f4f6', icon: '📚', desc: 'Aderência técnica moderada, comportamental baixa. Foco em engajamento.' },
  'Especialista sem Liderança':             { color: '#c2410c', bg: '#ffedd5', icon: '💼', desc: 'Técnica média, mas comportamento baixo para a área. Conhece o trabalho, mas o perfil DISC não se alinha ao cargo. Pode ser um bom especialista, mas não necessariamente um bom gestor nessa área.' },
  'Risco de Liderança':                    { color: '#b45309', bg: '#fef9c3', icon: '⚠️', desc: 'Técnica alta, mas comportamento baixo. O candidato tem o conhecimento técnico, mas o perfil comportamental pode gerar conflitos ou dificuldades na gestão.' },
  'Baixa Aderência':                        { color: '#dc2626', bg: '#fee2e2', icon: '⚠️', desc: 'Técnica e comportamento ambos baixos. Não há aderência significativa à área neste momento. Não é recomendado para sucessão sem um plano de desenvolvimento profundo.' },
  'Dados incompletos para definição do quadrante': { color: '#6b7280', bg: '#f3f4f6', icon: '⏳', desc: 'Aguardando importação de dados de performance e/ou DISC para definição do quadrante.' },
};

function ScoreBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', background: color || 'var(--purple)', borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function TechDetailRow({ label, score, maxScore, color, summary, details }: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
  summary: string;
  details: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 4, padding: '1px 7px', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
          <button type="button" onClick={() => setOpen(o => !o)}
            style={{ background: open ? color : 'none', border: `1px solid ${color}`, borderRadius: 4, padding: '1px 8px', cursor: 'pointer', fontSize: '0.68rem', color: open ? 'white' : color, fontWeight: 600, flexShrink: 0 }}>
            {open ? '▲ Fechar' : '▼ Ver detalhes'}
          </button>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color, marginLeft: 12, whiteSpace: 'nowrap' }}>
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

function ScoreRow({ label, value, max, color, detail, explain }: {
  label: string; value: number | undefined; max: number;
  color?: string; detail?: string; explain: string;
}) {
  const [open, setOpen] = useState(false);
  const v = value ?? 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
            {detail && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>{detail}</span>}
            <button type="button" onClick={() => setOpen((o) => !o)} title="Como este valor é calculado?"
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ?
            </button>
          </div>
          {open && (
            <div style={{ marginTop: 6, background: '#f8f7fc', borderLeft: '3px solid var(--purple)', borderRadius: 4, padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {explain}
            </div>
          )}
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: color || 'var(--purple)', marginLeft: 12, whiteSpace: 'nowrap' }}>
          {v.toFixed(1)} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {max}</span>
        </span>
      </div>
      <ScoreBar value={v} max={max} color={color} />
    </div>
  );
}

// Barra comparativa DISC (pessoa vs cargo)
function DISCBar({ label, personVal, jobVal }: { label: string; personVal: number; jobVal: number }) {
  const base = Math.max(personVal, jobVal);
  const proximity = base === 0 ? 100 : 100 - (Math.abs(personVal - jobVal) / base) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>
          Você: <strong style={{ color: '#7c3aed' }}>{personVal}%</strong> | Cargo: <strong style={{ color: '#0e7490' }}>{jobVal}%</strong>
          {' '}| Proximidade: <strong style={{ color: proximity >= 70 ? '#15803d' : proximity >= 50 ? '#b45309' : '#dc2626' }}>{proximity.toFixed(0)}%</strong>
        </span>
      </div>
      <div style={{ position: 'relative', height: 10, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        {/* Barra do cargo (fundo) */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: jobVal + '%', background: '#0e7490', opacity: 0.25, borderRadius: 99 }} />
        {/* Barra da pessoa */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: personVal + '%', background: '#7c3aed', borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function DISCDetailSection({ discDetail, area, discScore }: {
  discDetail: {
    correlationPct: number;
    personD: number; personI: number; personS: number; personC: number;
    jobD: number; jobI: number; jobS: number; jobC: number;
    strengths: string[];
    developments: string[];
    importedAt: string;
  };
  area: string;
  discScore?: number;
}) {
  const [open, setOpen] = useState(false);
  const corr = discDetail.correlationPct;
  const corrColor = corr >= 70 ? '#065f46' : corr >= 50 ? '#92400e' : '#991b1b';
  const corrBg = corr >= 70 ? '#d1fae5' : corr >= 50 ? '#fef3c7' : '#fee2e2';
  const corrLabel = corr >= 70 ? 'Alta aderência' : corr >= 50 ? 'Aderência moderada' : 'Baixa aderência';

  return (
    <div style={{ marginTop: 16, background: '#f8f7fc', border: '1.5px solid #d8b4fe', borderRadius: 10, overflow: 'hidden' }}>
      {/* Cabeçalho clicável */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#7c3aed' }}>&#128311; Detalhamento DISC — Correlação com o cargo da {area}</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, color: corrColor,
            background: corrBg, borderRadius: 20, padding: '2px 10px',
          }}>
            {corr}% — {corrLabel}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>{open ? '▲ Fechar' : '▼ Ver detalhamento'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Gráfico de correlação */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>ÍNDICE DE CORRELAÇÃO</div>
                <div style={{ height: 14, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: corr + '%', background: `linear-gradient(90deg, ${corrColor}, #7c3aed)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: corrColor, lineHeight: 1 }}>{corr}%</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>de correlação</div>
              </div>
            </div>
            <div style={{ background: corrBg, borderRadius: 6, padding: '8px 12px', fontSize: '0.75rem', color: corrColor, lineHeight: 1.5 }}>
              <strong>O que significa:</strong> O índice de correlação mede o quanto o seu perfil comportamental se aproxima do perfil ideal esperado para o cargo da {area}.
              Ele é calculado comparando, indicador por indicador (Dominância, Influência, Estabilidade e Conformidade), o quanto o seu resultado em cada um se aproxima do ideal do cargo naquele mesmo indicador — quanto menor a distância entre os dois, maior a proximidade. O índice final é a média das 4 proximidades.
              Valores acima de 70% indicam alta aderência natural; entre 50–70% indicam aderência moderada com pontos de desenvolvimento;
              abaixo de 50% indicam que o cargo exige comportamentos que precisam ser desenvolvidos.
              {discScore !== undefined && <span> Esse índice gerou a nota DISC de <strong>{discScore.toFixed(1)} / 10</strong> no cálculo comportamental.</span>}
            </div>
          </div>

          {/* Gráfico comparativo D/I/S/C */}
          {(discDetail.personD > 0 || discDetail.jobD > 0) && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
                Perfil comparativo: <span style={{ color: '#7c3aed' }}>■ Você</span> vs <span style={{ color: '#0e7490' }}>■ Cargo ideal</span>
              </div>
              <DISCBar label="D — Dominância" personVal={discDetail.personD} jobVal={discDetail.jobD} />
              <DISCBar label="I — Influência" personVal={discDetail.personI} jobVal={discDetail.jobI} />
              <DISCBar label="S — Estabilidade" personVal={discDetail.personS} jobVal={discDetail.jobS} />
              <DISCBar label="C — Conformidade" personVal={discDetail.personC} jobVal={discDetail.jobC} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                <strong>D (Dominância):</strong> orientação para resultados e desafios. &nbsp;
                <strong>I (Influência):</strong> comunicação e persuasão. &nbsp;
                <strong>S (Estabilidade):</strong> consistência e trabalho em equipe. &nbsp;
                <strong>C (Conformidade):</strong> precisão e qualidade.
              </div>
            </div>
          )}

          {/* Pontos de destaque */}
          {discDetail.strengths.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', marginBottom: 6 }}>✅ Características que se destacam</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {discDetail.strengths.map((s, i) => (
                  <li key={i} style={{ fontSize: '0.78rem', color: '#374151', marginBottom: 3, lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {discDetail.strengths.length === 0 && (
            <div style={{ marginBottom: 14, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Nenhuma característica de destaque registrada para esta área.
            </div>
          )}

          {/* Pontos de desenvolvimento */}
          {discDetail.developments.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginBottom: 6 }}>📈 Pontos de desenvolvimento</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {discDetail.developments.map((d, i) => (
                  <li key={i} style={{ fontSize: '0.78rem', color: '#374151', marginBottom: 3, lineHeight: 1.5 }}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          {discDetail.developments.length === 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Nenhum ponto de desenvolvimento registrado para esta área.
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: '0.68rem', color: '#94a3b8', textAlign: 'right' }}>
            Dados importados em: {discDetail.importedAt}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyResults() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantName, setParticipantName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    const email = sessionStorage.getItem('aderenciaEmail');
    const name = sessionStorage.getItem('aderenciaName');
    if (!role || !email) { router.push('/login'); return; }
    setParticipantName(name || '');
    fetch('/api/participant/results?email=' + encodeURIComponent(email))
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.results || []).sort((a: any, b: any) => {
          const scoreA = (a.technicalScore ?? 0) + (a.behavioralScore ?? 0);
          const scoreB = (b.technicalScore ?? 0) + (b.behavioralScore ?? 0);
          return scoreB - scoreA;
        });
        setResults(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  return (
    <>
      <Head><title>Meus Resultados | Banco de Sucessores</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLíder"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores — Aderência</div>
            <div className="topbar-subtitle">SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions">
          {participantName && <span className="topbar-user">&#128100; {participantName}</span>}
          <Link href="/ninebox-public">
            <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>&#127919; Nine Box Geral</button>
          </Link>
          <Link href="/participant">
            <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Meu formulário</button>
          </Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 800, paddingTop: 96, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 6 }}>
            🎯 Meus Resultados de Aderência
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Veja abaixo sua pontuação detalhada para cada área de interesse.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Em caso de dúvida se o seu título de pós-graduação ou projeto recebeu a pontuação correta, consulte o{' '}
            <a href="/catalogo_pontuacao.pdf" target="_blank" rel="noreferrer"
              style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'underline' }}>
              📋 Catálogo de Pontuação
            </a>.
          </p>
        </div>

        <div className="section-card" style={{ marginBottom: 28, background: 'var(--gradient-soft)', border: '1px solid #d8b4fe' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 12 }}>
            📘 Como funciona o cálculo de aderência?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { title: 'Aderência Técnica (0–10)', items: ['Pós/MBA reconhecido: até 40 pts (escala 0–80)', 'Experiência gerencial/interina: até 20 pts (5 pts/ano)', 'Projetos estratégicos da área: até 20 pts', 'Total bruto 0–80 convertido para 0–10'] },
              { title: 'Aderência Comportamental (0–10)', items: ['Performance (engajamento 0–100 → 0–10)', 'Perfil DISC fornecido pelo RH (escala 0–10)', 'Fórmula: (Performance + DISC) / 2'] },
              { title: 'Posição no Nine Box', items: ['Eixo X = Aderência Técnica', 'Eixo Y = Aderência Comportamental', 'Baixa: 0–4,9 | Média: 5–7,4 | Alta: 7,5–10'] },
            ].map((block) => (
              <div key={block.title} style={{ background: 'white', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 6 }}>{block.title}</div>
                {block.items.map((item) => (
                  <div key={item} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>&#10003;</span> {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Banner de pontuação provisória */}
        {!loading && results.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>&#9888;</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 4 }}>⚠ Pontuação Provisória</div>
              <p style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6, margin: 0 }}>
                Sua pontuação e posição no Nine Box são <strong>provisórias</strong> e estão sujeitas à confirmação pelo RH/UGP após a checagem dos documentos comprobatórios enviados.
                Itens marcados como <em>"A UGP já tem conhecimento"</em> serão validados diretamente pela equipe. Itens com upload de documento aguardam análise.
                Você será informado quando sua pontuação for <strong>confirmada definitivamente</strong>.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#8987;</div>
            Carregando seus resultados...
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="section-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128203;</div>
            <h3 style={{ color: 'var(--purple)', marginBottom: 8, fontSize: '1rem' }}>Resultados ainda não disponíveis</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.85rem' }}>
              Seus resultados serão exibidos após o envio do formulário e processamento pelo RH.
            </p>
            <Link href="/participant"><button className="btn-primary">← Ir para o formulário</button></Link>
          </div>
        )}



        {!loading && results.map((r: any) => {
          const qi = QUADRANT_INFO[r.nineBoxClassification] || QUADRANT_INFO['Dados incompletos para definição do quadrante'];
          const techScore: number = r.technicalScore ?? 0;
          const behavScore: number | undefined = r.behavioralScore;
          const totalScore: number = techScore + (behavScore ?? 0);
          const perfRaw = r.calculationSteps?.find((s: any) => s.name.includes('Performance'))?.value;
          const discRaw = r.calculationSteps?.find((s: any) => s.name.includes('DISC'))?.value;
          const expDetail = r.calculationSteps?.find((s: any) => s.name.includes('Experi'))?.detail ?? '';
          const courseDetail = r.calculationSteps?.find((s: any) => s.name.includes('Cursos'))?.detail ?? '';

          return (
            <div key={r.area} className="section-card" style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Área de Interesse</div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--purple)' }}>&#128205; {r.area}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Aderência Total</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--purple)', lineHeight: 1 }}>
                    {totalScore.toFixed(1)}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 20</span>
                  </div>
                </div>
              </div>

              <div style={{ background: qi.bg, border: '2px solid ' + qi.color + '40', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{qi.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: qi.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Posição no Nine Box</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: qi.color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{r.nineBoxClassification}</span>
                    <span title={qi.desc} style={{ cursor: 'help', fontSize: '0.9rem', opacity: 0.6 }}>👁️</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: qi.color, opacity: 0.85 }}>{qi.desc}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 20px)', gridTemplateRows: 'repeat(3, 20px)', gap: 2, flexShrink: 0 }}>
                  {['high','mid','low'].map((y) =>
                    ['low','mid','high'].map((x) => {
                      const tx = techScore < 4 ? 'low' : techScore < 7 ? 'mid' : 'high';
                      const ty = behavScore === undefined ? '' : behavScore < 4 ? 'low' : behavScore < 7 ? 'mid' : 'high';
                      const isActive = tx === x && ty === y;
                      return (
                        <div key={x+y} style={{ width: 20, height: 20, borderRadius: 3, background: isActive ? qi.color : '#e5e7eb', border: isActive ? '2px solid ' + qi.color : '1px solid #d1d5db' }} />
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple)' }}>📘 Aderência Técnica</h3>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--purple)' }}>
                    {techScore.toFixed(1)}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
                  </span>
                </div>
                <ScoreBar value={techScore} max={10} color="var(--purple)" />
                <div style={{ marginTop: 16 }}>
                  <TechDetailRow
                    label="🎓 Pós-graduação / MBA"
                    score={r.postMBADetail?.score ?? 0}
                    maxScore={40}
                    color="#7c3aed"
                    summary={r.postMBADetail?.titleUsed
                      ? `"${r.postMBADetail.titleUsed}" — ${r.postMBADetail.classification}`
                      : 'Nenhum título informado'}
                    details={[
                      { label: 'Título considerado', value: r.postMBADetail?.titleUsed ?? 'Nenhum' },
                      { label: 'Classificação', value: r.postMBADetail?.classification ?? '—' },
                      { label: 'Pontuação atribuída', value: `${r.postMBADetail?.score ?? 0} pts de 40 possíveis` },
                      { label: 'Regra', value: 'Transversal = 40 pts | Específico da área = 20 pts | Não relacionado à área = 20 pts (pontuação mínima do bloco) | Sem título = 0 pts' },
                    ]}
                  />
                  <TechDetailRow
                    label="&#128188; Experiência gerencial / interina"
                    score={Number(r.calculationSteps?.find((s: any) => s.name.includes('Experi'))?.value ?? 0)}
                    maxScore={20}
                    color="#0e7490"
                    summary={expDetail || 'Sem experiência gerencial informada'}
                    details={[
                      { label: 'Fórmula', value: '5 pts por ano, máx. 20 pts' },
                      { label: 'Detalhe', value: expDetail || 'Nenhum mês informado' },
                    ]}
                  />
                  <TechDetailRow
                    label="&#128203; Projetos estratégicos da área"
                    score={Number(r.calculationSteps?.find((s: any) => s.name.includes('Projetos'))?.value ?? 0)}
                    maxScore={20}
                    color="#059669"
                    summary={r.projectsDetail?.length > 0
                      ? `${r.projectsDetail.length} projeto(s) considerado(s) para ${r.area}`
                      : 'Nenhum projeto selecionado para esta área'}
                    details={[
                      ...(r.projectsDetail?.length > 0
                        ? r.projectsDetail.map((p: any) => ({
                            label: p.label,
                            value: `${p.points} pts (${p.points === 20 ? 'Projeto Estruturante' : 'Projeto Relevante'})`
                          }))
                        : [{ label: 'Projetos', value: 'Nenhum projeto desta área foi selecionado' }]),
                      { label: 'Regra', value: 'Estruturante = 20 pts | Relevante = 15 pts | Máx. 20 pts por área' },
                    ]}
                  />
                  <div style={{ marginTop: 12, background: '#f0f4ff', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', border: '1px solid #c7d2fe' }}>
                    <span style={{ color: '#4338ca', fontWeight: 600 }}>Total bruto (0–80) → convertido para escala 0–10</span>
                    <span style={{ fontWeight: 800, color: 'var(--purple)' }}>
                      {(
                        (r.postMBADetail?.score ?? 0) +
                        Number(r.calculationSteps?.find((s: any) => s.name.includes('Experi'))?.value ?? 0) +
                        Number(r.calculationSteps?.find((s: any) => s.name.includes('Projetos'))?.value ?? 0)
                      ).toFixed(1)} / 80
                      &nbsp;→&nbsp; <strong>{r.technicalScore?.toFixed(1)} / 10</strong>
                    </span>
                  </div>
                  {r.excludedItems?.length > 0 && (
                    <div style={{ marginTop: 12, background: '#fef2f2', borderRadius: 8, padding: '12px 14px', border: '1.5px solid #fca5a5' }}>
                      <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>
                        ⚠️ Itens não considerados na pontuação — rejeitados pela UGP
                      </div>
                      {r.excludedItems.map((ex: any, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.78rem', color: '#7f1d1d', marginBottom: idx < r.excludedItems.length - 1 ? 8 : 0, lineHeight: 1.5 }}>
                          <strong>"{ex.label}"</strong> — {ex.pointsRemoved} pts retirados
                          {ex.note && <div style={{ marginTop: 2, color: '#991b1b' }}>Motivo: {ex.note}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 24 }} />

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0e7490' }}>🧠 Aderência Comportamental</h3>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0e7490' }}>
                    {behavScore !== undefined ? behavScore.toFixed(1) : '—'}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
                  </span>
                </div>
                {behavScore !== undefined
                  ? <ScoreBar value={behavScore} max={10} color="#0e7490" />
                  : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                      Aguardando importação de dados de performance e/ou DISC pelo RH.
                    </div>
                }
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>&#128200; Performance (engajamento)</span>
                          {perfRaw !== undefined && perfRaw !== 'ausente' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>
                              Score bruto: {perfRaw} / 100
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 6, background: '#f8f7fc', borderLeft: '3px solid #0e7490', borderRadius: 4, padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          O indicador de performance vem do ranking de engajamento do SEBRAE TO (escala 0–100). Convertido para 0–10 pela fórmula: <strong>(score / 100) × 10</strong>.
                          {perfRaw !== undefined && perfRaw !== 'ausente' && (
                            <span> Seu score: {perfRaw} / 100 = <strong>{((Number(perfRaw) / 100) * 10).toFixed(1)} pts</strong>.</span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0e7490', marginLeft: 12, whiteSpace: 'nowrap' }}>
                        {r.breakdown?.performance !== undefined ? r.breakdown.performance.toFixed(1) : '—'} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 10</span>
                      </span>
                    </div>
                    {r.breakdown?.performance !== undefined && <ScoreBar value={r.breakdown.performance} max={10} color="#0e7490" />}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>&#128311; Perfil DISC</span>
                          {discRaw !== undefined && discRaw !== 'ausente' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>
                              Score DISC: {discRaw} / 10
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 6, background: '#f8f7fc', borderLeft: '3px solid #7c3aed', borderRadius: 4, padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          O perfil DISC avalia o alinhamento comportamental com o perfil esperado para a área {r.area}. A nota (escala 0–10) é calculada comparando, indicador por indicador (D/I/S/C), o quanto o seu resultado se aproxima do ideal do cargo — a distância entre os dois é medida em relação ao maior dos dois valores, e a nota final é a média de proximidade dos 4 indicadores. Valores mais altos indicam maior alinhamento comportamental.
                        </div>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7c3aed', marginLeft: 12, whiteSpace: 'nowrap' }}>
                        {r.breakdown?.disc !== undefined ? r.breakdown.disc.toFixed(1) : '—'} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 10</span>
                      </span>
                    </div>
                    {r.breakdown?.disc !== undefined && <ScoreBar value={r.breakdown.disc} max={10} color="#7c3aed" />}
                  </div>

                  {behavScore !== undefined && (
                    <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#065f46', border: '1px solid #bbf7d0' }}>
                      <strong>Fórmula comportamental:</strong> (Performance 0–10 + DISC 0–10) / 2 = ({r.breakdown?.performance?.toFixed(1) ?? '?'} + {r.breakdown?.disc?.toFixed(1) ?? '?'}) / 2 = <strong>{behavScore.toFixed(1)}</strong>
                    </div>
                  )}

                  {/* Detalhamento DISC */}
                  {r.discDetail && (
                    <DISCDetailSection discDetail={r.discDetail} area={r.area} discScore={r.breakdown?.disc} />
                  )}
                  {!r.discDetail && (
                    <div style={{ marginTop: 14, background: '#f8fafc', border: '1px dashed #cbd5e0', borderRadius: 8, padding: '12px 16px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
                      📊 Detalhamento DISC ainda não disponível para esta área. O RH importará os dados em breve.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 20 }} />

              <div style={{ background: 'var(--gradient-soft)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Técnica</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--purple)' }}>{techScore.toFixed(1)}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>de 10</div>
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--border)', fontWeight: 300 }}>+</div>
                <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Comportamental</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0e7490' }}>{behavScore !== undefined ? behavScore.toFixed(1) : '—'}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>de 10</div>
                </div>
                <div style={{ fontSize: '1.2rem', color: 'var(--border)', fontWeight: 300 }}>=</div>
                <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Total</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--purple)' }}>{totalScore.toFixed(1)}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>de 20</div>
                </div>
                <div style={{ flex: 2, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Nine Box</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: qi.color, background: qi.bg, borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
                    {qi.icon} {r.nineBoxClassification}
                  </div>
                </div>
              </div>

              {r.exceptions && r.exceptions.length > 0 && (
                <div style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#92400e' }}>
                  <strong>⚠ Itens fora do catálogo (aguardando validação do RH):</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    {r.exceptions.map((ex: string, i: number) => <li key={i}>{ex}</li>)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </>
  );
}
