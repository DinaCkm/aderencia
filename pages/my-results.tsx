import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const QUADRANT_INFO: Record<string, { color: string; bg: string; icon: string; desc: string }> = {
  'Alta Prontidao':                         { color: '#065f46', bg: '#d1fae5', icon: '\u{1F3C6}', desc: 'Alta aderencia tecnica E comportamental. Candidato prioritario para sucessao.' },
  'Pronto em Desenvolvimento':              { color: '#1d4ed8', bg: '#dbeafe', icon: '\u2B50', desc: 'Boa aderencia comportamental, em desenvolvimento tecnico. Potencial elevado.' },
  'Potencial de Curto Prazo':               { color: '#0e7490', bg: '#cffafe', icon: '\u{1F680}', desc: 'Forte aderencia comportamental, precisa desenvolver competencias tecnicas.' },
  'Destaque Tecnico, lapidar lideranca':    { color: '#7c3aed', bg: '#ede9fe', icon: '\u{1F527}', desc: 'Excelente base tecnica. Requer desenvolvimento de competencias comportamentais.' },
  'Potencial de Medio Prazo':               { color: '#b45309', bg: '#fef3c7', icon: '\u{1F4C8}', desc: 'Aderencia moderada em ambas as dimensoes. Plano de desenvolvimento recomendado.' },
  'Desenvolvimento Direcionado':            { color: '#92400e', bg: '#fef9c3', icon: '\u{1F3AF}', desc: 'Boa aderencia tecnica, comportamental em desenvolvimento.' },
  'Potencial de Longo Prazo':               { color: '#6b7280', bg: '#f3f4f6', icon: '\u{1F331}', desc: 'Aderencia inicial. Requer plano de desenvolvimento estruturado.' },
  'Em Desenvolvimento':                     { color: '#6b7280', bg: '#f3f4f6', icon: '\u{1F4DA}', desc: 'Aderencia tecnica moderada, comportamental baixa. Foco em engajamento.' },
  'Baixa Aderencia':                        { color: '#dc2626', bg: '#fee2e2', icon: '\u26A0\uFE0F', desc: 'Aderencia baixa em ambas as dimensoes para esta area especifica.' },
  'Dados incompletos para quadrant':        { color: '#6b7280', bg: '#f3f4f6', icon: '\u23F3', desc: 'Aguardando importacao de dados de performance e/ou DISC para calcular posicao.' },
};

function ScoreBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', background: color || 'var(--purple)', borderRadius: 99, transition: 'width 0.6s ease' }} />
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
            <button type="button" onClick={() => setOpen((o) => !o)} title="Como este valor e calculado?"
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
      .then((data) => { setResults(data.results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  return (
    <>
      <Head><title>Meus Resultados | Banco de Sucessores</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLider"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderencia</div>
            <div className="topbar-subtitle">SEBRAE Tocantins</div>
          </div>
        </div>
        <div className="topbar-actions">
          {participantName && <span className="topbar-user">&#128100; {participantName}</span>}
          <Link href="/participant">
            <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Meu formulario</button>
          </Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 800, paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 6 }}>
            &#127919; Meus Resultados de Aderencia
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Veja abaixo sua pontuacao detalhada para cada area de interesse. Todos os calculos sao exibidos de forma transparente
            — clique no <strong>?</strong> ao lado de cada item para entender como aquele valor foi obtido.
          </p>
        </div>

        <div className="section-card" style={{ marginBottom: 28, background: 'var(--gradient-soft)', border: '1px solid #d8b4fe' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 12 }}>
            &#128218; Como funciona o calculo de aderencia?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { title: 'Aderencia Tecnica (0-10)', items: ['Pos/MBA reconhecido: ate 3 pts', 'Experiencia gerencial: ate 4 pts', 'Cursos e projetos estrategicos: ate 3 pts'] },
              { title: 'Aderencia Comportamental (0-10)', items: ['Performance (engajamento 0-100 → 0-5)', 'Perfil DISC (escala 0-10)', 'Formula: (Performance + DISC) / 2'] },
              { title: 'Posicao no Nine Box', items: ['Eixo X = Aderencia Tecnica', 'Eixo Y = Aderencia Comportamental', 'Baixo: 0-3 | Medio: 4-6 | Alto: 7-10'] },
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

        {/* Banner de pontuacao provisoria */}
        {!loading && results.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>&#9888;</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 4 }}>Pontuacao Provisoria</div>
              <p style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6, margin: 0 }}>
                Sua pontuacao e posicao no Nine Box sao <strong>provisorias</strong> e estao sujeitas a confirmacao pelo RH/UGP apos a checagem dos documentos comprobatorios enviados.
                Itens marcados como <em>"A UGP ja tem conhecimento"</em> serao validados diretamente pela equipe. Itens com upload de documento aguardam analise.
                Voce sera informado quando sua pontuacao for <strong>confirmada definitivamente</strong>.
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
            <h3 style={{ color: 'var(--purple)', marginBottom: 8, fontSize: '1rem' }}>Resultados ainda nao disponiveis</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.85rem' }}>
              Seus resultados serao exibidos apos o envio do formulario e processamento pelo RH.
            </p>
            <Link href="/participant"><button className="btn-primary">&#8592; Ir para o formulario</button></Link>
          </div>
        )}

        {!loading && results.map((r: any) => {
          const qi = QUADRANT_INFO[r.nineBoxClassification] || QUADRANT_INFO['Dados incompletos para quadrant'];
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
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Area de interesse</div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--purple)' }}>&#128205; {r.area}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Aderencia Total</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--purple)', lineHeight: 1 }}>
                    {totalScore.toFixed(1)}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 20</span>
                  </div>
                </div>
              </div>

              <div style={{ background: qi.bg, border: '2px solid ' + qi.color + '40', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{qi.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: qi.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Posicao no Nine Box</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: qi.color, marginBottom: 4 }}>{r.nineBoxClassification}</div>
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
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple)' }}>&#128218; Aderencia Tecnica</h3>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--purple)' }}>
                    {techScore.toFixed(1)}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
                  </span>
                </div>
                <ScoreBar value={techScore} max={10} color="var(--purple)" />
                <div style={{ marginTop: 16 }}>
                  <ScoreRow label="&#127891; Pos-graduacao / MBA" value={r.breakdown?.postMBA} max={3} color="#7c3aed"
                    detail={r.breakdown?.postMBA > 0 ? 'reconhecido' : 'nao informado'}
                    explain={'Vale 3 pontos se voce tiver ao menos 1 pos-graduacao ou MBA reconhecido no catalogo oficial do SEBRAE TO. Pos/MBA especificos da area ' + r.area + ' e os transversais pontuam. Se nao houver nenhum reconhecido, a pontuacao e 0.'} />
                  <ScoreRow label="&#128188; Experiencia gerencial / interina" value={r.breakdown?.experience} max={4} color="#0e7490"
                    detail={expDetail}
                    explain={'Cada 6 meses completos em cargo gerencial ou interino = 1 ponto, maximo de 4 pontos (24 meses). Formula: floor(meses / 6), limitado a 4. Exemplo: 18 meses = 3 pontos; 24 meses ou mais = 4 pontos.'} />
                  <ScoreRow label="&#128203; Cursos e projetos estrategicos" value={r.breakdown?.coursesProjects} max={3} color="#059669"
                    detail={courseDetail}
                    explain={'Cada curso ou projeto do catalogo que seja transversal ou especifico da area ' + r.area + ' vale 1,2 pontos, maximo de 3 pontos. Itens de outras areas especificas nao pontuam aqui. Formula: min(3, quantidade x 1,2).'} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 24 }} />

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0e7490' }}>&#129504; Aderencia Comportamental</h3>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0e7490' }}>
                    {behavScore !== undefined ? behavScore.toFixed(1) : '—'}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
                  </span>
                </div>
                {behavScore !== undefined
                  ? <ScoreBar value={behavScore} max={10} color="#0e7490" />
                  : <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: '#f3f4f6', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                      Aguardando importacao de dados de performance e/ou DISC pelo RH.
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
                          O indicador de performance vem do ranking de engajamento do SEBRAE TO (escala 0-100). Convertido para 0-5 pela formula: <strong>(score / 100) x 5</strong>.
                          {perfRaw !== undefined && perfRaw !== 'ausente' && (
                            <span> Seu score: {perfRaw} / 100 = <strong>{((Number(perfRaw) / 100) * 5).toFixed(1)} pts</strong>.</span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0e7490', marginLeft: 12, whiteSpace: 'nowrap' }}>
                        {r.breakdown?.performance !== undefined ? r.breakdown.performance.toFixed(1) : '—'} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 5</span>
                      </span>
                    </div>
                    {r.breakdown?.performance !== undefined && <ScoreBar value={r.breakdown.performance} max={5} color="#0e7490" />}
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
                          O perfil DISC avalia o alinhamento comportamental com o perfil esperado para a area {r.area}. Score fornecido na escala 0-10 pelo instrumento DISC aplicado pelo RH. Valores mais altos = maior alinhamento comportamental.
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
                      <strong>Formula comportamental:</strong> (Performance convertida + DISC) / 2 = ({r.breakdown?.performance?.toFixed(1) ?? '?'} + {r.breakdown?.disc?.toFixed(1) ?? '?'}) / 2 = <strong>{behavScore.toFixed(1)}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginBottom: 20 }} />

              <div style={{ background: 'var(--gradient-soft)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Tecnica</div>
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
                  <strong>&#9888; Itens fora do catalogo (aguardando validacao do RH):</strong>
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
