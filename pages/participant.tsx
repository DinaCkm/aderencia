import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { OFFICIAL_AREAS, CATALOG_ITEMS } from '../lib/constants';
import type { AreaCode, CatalogItem, ParticipantProfile } from '../lib/types';

const initialProfile: ParticipantProfile = {
  id: '',
  name: '',
  email: '',
  matricula: '',
  unit: '',
  currentRole: '',
  currentArea: '',
  selectedAreas: [],
  graduation: '',
  postMBAs: [],
  certifications: [],
  experienceMonths: 0,
  managerialMonths: 0,
  interimMonths: 0,
  positionsHeld: [],
  selectedCourses: [],
  courseHours: {},
  proofMode: {},
  proofFiles: {},
  selectedProjects: [],
  exceptionRequested: false,
  exceptionJustification: '',
  attachments: [],
  exceptionStatus: 'pending',
  validationStatus: 'provisional',
};

const getOptions = (group: CatalogItem['group']) =>
  CATALOG_ITEMS.filter((item) => item.group === group);

// Componente reutilizavel de comprovacao por item
function ProofSelector({ itemLabel, proofMode, proofFiles, onChange }: {
  itemLabel: string;
  proofMode: Record<string, 'ugp-knows' | 'upload'>;
  proofFiles: Record<string, string>;
  onChange: (mode: 'ugp-knows' | 'upload', fileName?: string) => void;
}) {
  const mode = proofMode[itemLabel];
  return (
    <div style={{ padding: '8px 12px 10px', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Como comprovar este item:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500,
          border: `1.5px solid ${mode === 'ugp-knows' ? 'var(--cyan)' : 'var(--border)'}`,
          background: mode === 'ugp-knows' ? '#ecfeff' : 'white', color: mode === 'ugp-knows' ? '#0891b2' : 'var(--text)'
        }}>
          <input type="radio" name={`proof-${itemLabel}`} value="ugp-knows"
            checked={mode === 'ugp-knows'}
            onChange={() => onChange('ugp-knows')}
            style={{ accentColor: 'var(--cyan)', width: 13, height: 13 }} />
          &#10003; A UGP ja tem conhecimento
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500,
          border: `1.5px solid ${mode === 'upload' ? 'var(--purple)' : 'var(--border)'}`,
          background: mode === 'upload' ? 'var(--gradient-soft)' : 'white', color: mode === 'upload' ? 'var(--purple)' : 'var(--text)'
        }}>
          <input type="radio" name={`proof-${itemLabel}`} value="upload"
            checked={mode === 'upload'}
            onChange={() => onChange('upload')}
            style={{ accentColor: 'var(--purple)', width: 13, height: 13 }} />
          &#128206; Enviar documento
        </label>
      </div>
      {mode === 'upload' && (
        <div style={{ marginTop: 8 }}>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange('upload', file.name);
            }}
            style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} />
          {proofFiles[itemLabel] && (
            <span style={{ fontSize: '0.72rem', color: '#16a34a', marginLeft: 8 }}>
              &#10003; {proofFiles[itemLabel]}
            </span>
          )}
        </div>
      )}
      {!mode && (
        <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 4 }}>
          &#9888; Selecione como vai comprovar este item
        </p>
      )}
    </div>
  );
}

export default function ParticipantForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<ParticipantProfile>(initialProfile);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    const email = sessionStorage.getItem('aderenciaEmail');
    const name = sessionStorage.getItem('aderenciaName');
    if (role !== 'participant' || !email) {
      router.push('/login');
      return;
    }
    setParticipantName(name || '');
    setProfile((prev) => ({ ...prev, id: email, email, name: name || '' }));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const graduationOptions = useMemo(() => getOptions('graduation'), []);
  const postMBAOptions = useMemo(() => getOptions('postMBA'), []);
  const courseOptions = useMemo(() => getOptions('course'), []);
  const projectOptions = useMemo(() => getOptions('project'), []);

  const toggleArea = (area: AreaCode) => {
    setProfile((prev) => {
      const has = prev.selectedAreas.includes(area);
      if (!has && prev.selectedAreas.length >= 3) return prev;
      return {
        ...prev,
        selectedAreas: has
          ? prev.selectedAreas.filter((a) => a !== area)
          : [...prev.selectedAreas, area],
      };
    });
  };

  const toggleMulti = (
    field: 'postMBAs' | 'selectedCourses' | 'selectedProjects',
    value: string
  ) => {
    setProfile((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const setProof = (itemLabel: string, mode: 'ugp-knows' | 'upload', fileName?: string) => {
    setProfile((p) => ({
      ...p,
      proofMode: { ...p.proofMode, [itemLabel]: mode },
      proofFiles: fileName ? { ...p.proofFiles, [itemLabel]: fileName } : p.proofFiles,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Enviando...');
    try {
      const res = await fetch('/api/participant/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSubmitted(true);
        setStatus('');
      } else {
        const data = await res.json();
        setStatus(data.message || 'Erro ao enviar. Tente novamente.');
      }
    } catch {
      setStatus('Erro de conexao. Tente novamente.');
    }
  };

  const TOTAL_STEPS = 6;
  const stepLabels = ['Dados Basicos', 'Areas de Interesse', 'Formacao', 'Experiencia', 'Cursos', 'Projetos'];

  if (submitted) {
    return (
      <>
        <Head><title>Formulario enviado | Banco de Sucessores</title></Head>
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
            <button className="btn-logout" onClick={logout}>Sair</button>
          </div>
        </nav>
        <main className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: 80 }}>
          <div className="section-card" style={{ padding: '48px 40px' }}>
            {/* Banner provisorio */}
            <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 6 }}>
                &#9888; Pontuacao Provisoria
              </div>
              <p style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.6, margin: 0 }}>
                Sua pontuacao e posicao no Nine Box estao disponiveis agora, mas sao <strong>provisorias</strong>.
                A confirmacao definitiva ocorrera apos a <strong>checagem dos documentos</strong> enviados ou validacao pela UGP.
                Voce sera notificado quando sua pontuacao for confirmada.
              </p>
            </div>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>&#10003;</div>
            <h2 style={{ color: 'var(--purple)', marginBottom: '12px' }}>Formulario enviado com sucesso!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
              Seus dados foram registrados. Voce pode visualizar sua aderencia e posicao no Nine Box a qualquer momento.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/my-results">
                <button className="btn-primary">Ver meus resultados</button>
              </Link>
              <button className="btn-outline" onClick={() => setSubmitted(false)}>
                Editar formulario
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head><title>Formulario | Banco de Sucessores Aderencia</title></Head>

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
          <Link href="/my-results">
            <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
              Meus resultados
            </button>
          </Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      {/* Barra de progresso */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 0' }}>
        <div className="container" style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.68rem', fontWeight: 700,
                background: step > i + 1 ? 'var(--cyan)' : step === i + 1 ? 'var(--purple)' : 'var(--border)',
                color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s', flexShrink: 0,
              }}>
                {step > i + 1 ? '\u2713' : i + 1}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--purple)' : 'var(--text-muted)' }}>
                {label}
              </span>
              {i < TOTAL_STEPS - 1 && <div style={{ width: 14, height: 2, background: step > i + 1 ? 'var(--cyan)' : 'var(--border)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      <main className="container" style={{ maxWidth: 760, paddingTop: 32, paddingBottom: 48 }}>
        <form onSubmit={handleSubmit}>

          {/* ── STEP 1: DADOS BASICOS ── */}
          {step === 1 && (
            <div className="section-card">
              {/* Card de boas-vindas */}
              <div style={{
                background: 'linear-gradient(135deg, #5B2D8E 0%, #0891b2 100%)',
                borderRadius: 12, padding: '28px 32px', marginBottom: 28, color: 'white'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4, letterSpacing: '0.01em' }}>
                  &#127919; Programa de Desenvolvimento de Líderes e Sucessores
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.85, marginBottom: 18, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  Etapa de Fechamento do Banco de Sucessores
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: 1.75, margin: '0 0 12px', opacity: 0.97 }}>
                  O <strong>Programa de Desenvolvimento de Líderes e Sucessores</strong> é uma iniciativa estratégica do SEBRAE Tocantins voltada à preparação, valorização e desenvolvimento de talentos internos com potencial para assumir futuras posições de liderança.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.75, margin: '0 0 12px', opacity: 0.97 }}>
                  Esta etapa marca o <strong>fechamento do ciclo de desenvolvimento</strong> dos participantes do Banco de Sucessores, contemplando as turmas <strong>BS1, BS2 e BS3</strong>, conforme o cronograma definido para encerramento da temporada atual do programa.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.75, margin: '0 0 12px', opacity: 0.97 }}>
                  Ao longo da jornada, os participantes vivenciaram ações voltadas ao autoconhecimento, ampliação do repertório de liderança, mentorias, trilhas de aprendizagem, entregas práticas, projetos aplicados e fortalecimento da prontidão para sucessão.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.75, margin: '0 0 16px', opacity: 0.97 }}>
                  Neste momento, o objetivo é consolidar os resultados da trajetória realizada até aqui, considerando a performance, o engajamento e os elementos técnicos e comportamentais que compõem a análise de aderência de cada participante às áreas afins.
                </p>

                {/* Cronograma de fechamento */}
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    &#128197; Cronograma de Fechamento
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[['BS1','30/06/2026'],['BS2','30/05/2026'],['BS3','30/07/2026']].map(([turma, data]) => (
                      <div key={turma} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{turma}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 2 }}>Fechamento em</div>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', marginTop: 1 }}>{data}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.76rem', margin: '10px 0 0', opacity: 0.85, lineHeight: 1.6 }}>
                    Após esse fechamento, será calculado o <strong>Índice de Aderência</strong> de cada participante às áreas indicadas.
                  </p>
                </div>

                <p style={{ fontSize: '0.82rem', lineHeight: 1.75, margin: '0 0 12px', opacity: 0.97 }}>
                  Neste formulário, você poderá indicar até <strong>três áreas de interesse</strong> nas quais deseja ser considerado como possível sucessor. Para cada área escolhida, será calculado o seu <strong>Índice de Aderência</strong>, considerando critérios como formação acadêmica, experiência profissional, cursos realizados, participação em projetos, perfil comportamental e desempenho no programa de desenvolvimento.
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.75, margin: '0 0 20px', opacity: 0.97 }}>
                  A avaliação de aderência <strong>não possui caráter eliminatório</strong>. Ela representa uma fotografia do momento atual do participante e tem como finalidade apoiar a continuidade do seu desenvolvimento, oferecendo clareza sobre pontos fortes, oportunidades de evolução e caminhos possíveis para futuras posições de liderança. O resultado será disponibilizado com o detalhamento dos critérios utilizados no cálculo, reforçando a transparência do processo e o compromisso do SEBRAE Tocantins com o desenvolvimento de seus líderes e sucessores.
                </p>

                {/* Assinatura */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Realização</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>UGP — SEBRAE Tocantins</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parceria</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Ckm Talents</div>
                  </div>
                </div>
              </div>

              <div className="section-title">
                <span className="section-icon">&#128100;</span>
                <div><h2>Dados Basicos</h2></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Nome completo</label>
                  <input className="form-input" value={profile.name} disabled
                    style={{ background: '#f1f5f9', color: 'var(--text-muted)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" value={profile.email} disabled
                    style={{ background: '#f1f5f9', color: 'var(--text-muted)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Matricula *</label>
                  <input className="form-input" type="text" placeholder="Ex: 123456"
                    value={profile.matricula}
                    onChange={(e) => setProfile((p) => ({ ...p, matricula: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Funcao atual *</label>
                  <input className="form-input" type="text" placeholder="Ex: Analista de Gestao"
                    value={profile.currentRole}
                    onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Area em que atua atualmente *</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 10 }}>
                  Selecione a area onde voce trabalha hoje. Isso nos ajuda a entender quantas pessoas da mesma area tem aderencia a cada destino.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {OFFICIAL_AREAS.map((area) => {
                    const isCurrent = profile.currentArea === area;
                    return (
                      <button key={area} type="button"
                        onClick={() => setProfile((p) => ({ ...p, currentArea: area }))}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: isCurrent ? 700 : 400, cursor: 'pointer',
                          border: `2px solid ${isCurrent ? 'var(--cyan)' : 'var(--border)'}`,
                          background: isCurrent ? 'var(--cyan)' : 'white',
                          color: isCurrent ? 'white' : 'var(--text)', transition: 'all 0.2s'
                        }}>
                        {area}{isCurrent ? ' (atual)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
              {status && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.82rem', marginTop: 12 }}>{status}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (!profile.matricula) { setStatus('Informe sua matricula.'); return; }
                  if (!profile.currentRole) { setStatus('Informe seu cargo/funcao.'); return; }
                  if (!profile.currentArea) { setStatus('Selecione a area em que atua atualmente.'); return; }
                  setStatus(''); setStep(2);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: AREAS DE INTERESSE ── */}
          {step === 2 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127919;</span>
                <div>
                  <h2>Areas de Interesse</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Escolha entre 1 e 3 areas para onde voce deseja se candidatar. Cada area gera uma avaliacao de aderencia independente.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                {OFFICIAL_AREAS.map((area) => {
                  const selected = profile.selectedAreas.includes(area as AreaCode);
                  const isCurrent = profile.currentArea === area;
                  return (
                    <button key={area} type="button"
                      onClick={() => toggleArea(area as AreaCode)}
                      style={{
                        padding: '12px 8px', borderRadius: 10, fontSize: '0.8rem', fontWeight: selected ? 700 : 400, cursor: 'pointer',
                        border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white',
                        color: selected ? 'var(--purple)' : 'var(--text)', transition: 'all 0.2s', textAlign: 'center'
                      }}>
                      {area}{isCurrent ? '\n(atual)' : ''}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Selecionadas: <strong style={{ color: 'var(--purple)' }}>{profile.selectedAreas.length}/3</strong>
                {profile.selectedAreas.length > 0 && ` — ${profile.selectedAreas.join(', ')}`}
              </p>
              {status && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.82rem', marginTop: 12 }}>{status}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (profile.selectedAreas.length === 0) { setStatus('Selecione ao menos 1 area de interesse.'); return; }
                  setStatus(''); setStep(3);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: FORMACAO ── */}
          {step === 3 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127891;</span>
                <div>
                  <h2>Formacao Academica</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Titulos academicos valem ate <span style={{ color: 'var(--purple)', fontWeight: 600 }}>3 pontos</span> na aderencia tecnica
                  </p>
                </div>
              </div>

              {/* Graduacao com comprovacao */}
              <div className="form-group">
                <label className="form-label">Graduacao *</label>
                <select className="form-input" value={profile.graduation}
                  onChange={(e) => setProfile((p) => ({ ...p, graduation: e.target.value }))} required>
                  <option value="">Selecione sua graduacao</option>
                  {graduationOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                </select>
                {profile.graduation && (
                  <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <ProofSelector
                      itemLabel={profile.graduation}
                      proofMode={profile.proofMode}
                      proofFiles={profile.proofFiles}
                      onChange={(mode, fileName) => setProof(profile.graduation, mode, fileName)}
                    />
                  </div>
                )}
              </div>

              {/* Bloco didatico: transversal vs especifico */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, marginTop: 8 }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#065f46', marginBottom: 4 }}>&#127758; Titulo Transversal</div>
                  <p style={{ fontSize: '0.75rem', color: '#047857', lineHeight: 1.6, margin: 0 }}>
                    Vale para <strong>qualquer area</strong> de interesse. Titulos de gestao, lideranca e competencias gerais.
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#059669', marginTop: 4, fontStyle: 'italic' }}>
                    Ex: MBA em Gestao de Pessoas, Lideranca, Inovacao.
                  </p>
                </div>
                <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#5B2D8E', marginBottom: 4 }}>&#127919; Titulo Especifico da Area</div>
                  <p style={{ fontSize: '0.75rem', color: '#6d28d9', lineHeight: 1.6, margin: 0 }}>
                    Vale <strong>somente para a area correspondente</strong> e com pontuacao maior.
                  </p>
                  <p style={{ fontSize: '0.7rem', color: '#7c3aed', marginTop: 4, fontStyle: 'italic' }}>
                    Ex: MBA em Auditoria (UAUD), Direito Publico (AJUR).
                  </p>
                </div>
              </div>

              {/* Pos/MBA com comprovacao por item */}
              <div className="form-group">
                <label className="form-label">Pos-graduacao / MBA concluidos</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>
                  Selecione os titulos que voce concluiu e indique como comprova cada um.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', padding: '4px' }}>
                  {postMBAOptions.map((o) => {
                    const selected = profile.postMBAs.includes(o.label);
                    return (
                      <div key={o.id} style={{
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white',
                        overflow: 'hidden', transition: 'all 0.2s'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selected}
                            onChange={() => {
                              toggleMulti('postMBAs', o.label);
                              if (selected) {
                                setProfile((p) => {
                                  const m = { ...p.proofMode }; delete m[o.label];
                                  const f = { ...p.proofFiles }; delete f[o.label];
                                  return { ...p, proofMode: m, proofFiles: f };
                                });
                              }
                            }}
                            style={{ accentColor: 'var(--purple)', width: 15, height: 15, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>
                            {o.label}
                          </span>
                        </label>
                        {selected && (
                          <ProofSelector
                            itemLabel={o.label}
                            proofMode={profile.proofMode}
                            proofFiles={profile.proofFiles}
                            onChange={(mode, fileName) => setProof(o.label, mode, fileName)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {status && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.82rem', marginTop: 12 }}>{status}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (!profile.graduation) { setStatus('Selecione sua graduacao.'); return; }
                  setStatus(''); setStep(4);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: EXPERIENCIA ── */}
          {step === 4 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#128188;</span>
                <div>
                  <h2>Experiencia Gerencial</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Experiencia em cargos de gestao vale ate <span style={{ color: 'var(--purple)', fontWeight: 600 }}>4 pontos</span> na aderencia tecnica
                  </p>
                </div>
              </div>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.78rem', color: '#0369a1' }}>
                <strong>Como e calculado:</strong> 1 ponto a cada 6 meses completos em cargo gerencial ou interino, maximo de 4 pontos (24 meses).
              </div>

              {/* Gerencial efetivo */}
              <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#5B2D8E', marginBottom: 8 }}>
                  &#128081; Cargo Gerencial Efetivo
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6d28d9', marginBottom: 12 }}>
                  Cargo formal com equipe e atribuicoes permanentes. Ex: Gerente de Unidade, Coordenador, Superintendente.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Meses em cargo gerencial efetivo</label>
                  <input className="form-input" type="number" min={0} max={600}
                    value={profile.managerialMonths || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, managerialMonths: parseInt(e.target.value) || 0 }))}
                    placeholder="0" style={{ maxWidth: 120 }} />
                </div>
              </div>

              {/* Interino */}
              <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0369a1', marginBottom: 8 }}>
                  &#128203; Cargo Interino
                </div>
                <p style={{ fontSize: '0.75rem', color: '#0284c7', marginBottom: 12 }}>
                  Substituicao temporaria com as mesmas atribuicoes do cargo gerencial por periodo determinado.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Meses em cargo interino</label>
                  <input className="form-input" type="number" min={0} max={600}
                    value={profile.interimMonths || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, interimMonths: parseInt(e.target.value) || 0 }))}
                    placeholder="0" style={{ maxWidth: 120 }} />
                </div>
              </div>

              {/* Preview do calculo */}
              {(profile.managerialMonths > 0 || profile.interimMonths > 0) && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#166534' }}>
                  Gerencial: <strong>{profile.managerialMonths}m</strong> + Interino: <strong>{profile.interimMonths}m</strong> = <strong>{profile.managerialMonths + profile.interimMonths}m</strong> totais
                  &nbsp;&rarr;&nbsp; <strong style={{ color: 'var(--purple)' }}>{Math.min(4, Math.floor((profile.managerialMonths + profile.interimMonths) / 6))} ponto(s)</strong> (max 4)
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(3)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => { setStatus(''); setStep(5); }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 5: CURSOS ESTRATEGICOS ── */}
          {step === 5 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127775;</span>
                <div>
                  <h2>Cursos Estrategicos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Cursos estrategicos concluidos valem ate <span style={{ color: 'var(--purple)', fontWeight: 600 }}>3 pontos</span> na aderencia tecnica
                  </p>
                </div>
              </div>

              {/* Definicao didatica */}
              <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: '0.78rem', color: '#92400e' }}>
                <strong>O que sao cursos estrategicos?</strong> Sao formacoes de desenvolvimento continuado — diferentes de Pos/MBA. Incluem cursos, workshops, treinamentos e certificacoes profissionais. Para pontuar, o curso deve ter <strong>no minimo 16 horas</strong>. A validacao final e feita pelo RH/UGP.
              </div>

              {/* Transversal vs especifico */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#065f46', marginBottom: 4 }}>&#127758; Curso Transversal</div>
                  <p style={{ fontSize: '0.75rem', color: '#047857', lineHeight: 1.6, margin: 0 }}>
                    Competencias gerenciais e comportamentais que contribuem para <strong>qualquer area</strong> escolhida.
                  </p>
                </div>
                <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#5B2D8E', marginBottom: 4 }}>&#127919; Curso Especifico da Area</div>
                  <p style={{ fontSize: '0.75rem', color: '#6d28d9', lineHeight: 1.6, margin: 0 }}>
                    Cursos tecnicos ligados a uma unidade especifica. Pontuam <strong>somente na area correspondente</strong>.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cursos estrategicos concluidos</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>Ao marcar um curso, informe a carga horaria e como vai comprova-lo.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', padding: '4px' }}>
                  {courseOptions.map((o) => {
                    const selected = profile.selectedCourses.includes(o.label);
                    const hours = profile.courseHours?.[o.label] || 0;
                    const belowMin = selected && hours > 0 && hours < 16;
                    return (
                      <div key={o.id} style={{
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${belowMin ? '#fca5a5' : selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: belowMin ? '#fff1f2' : selected ? 'var(--gradient-soft)' : 'white',
                        overflow: 'hidden', transition: 'all 0.2s'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selected}
                            onChange={() => {
                              toggleMulti('selectedCourses', o.label);
                              if (selected) {
                                setProfile((p) => {
                                  const h = { ...p.courseHours }; delete h[o.label];
                                  const m = { ...p.proofMode }; delete m[o.label];
                                  const f = { ...p.proofFiles }; delete f[o.label];
                                  return { ...p, courseHours: h, proofMode: m, proofFiles: f };
                                });
                              }
                            }}
                            style={{ accentColor: 'var(--purple)', width: 15, height: 15, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: belowMin ? '#dc2626' : selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400, flex: 1 }}>{o.label}</span>
                        </label>
                        {selected && (
                          <>
                            <div style={{ padding: '0 12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Carga horaria (h):</label>
                              <input type="number" min={1} max={999}
                                value={hours || ''}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 0;
                                  setProfile((p) => ({ ...p, courseHours: { ...p.courseHours, [o.label]: v } }));
                                }}
                                placeholder="Ex: 40"
                                style={{ width: 80, padding: '4px 8px', border: `1px solid ${belowMin ? '#fca5a5' : 'var(--border)'}`, borderRadius: 6, fontSize: '0.78rem' }} />
                              {belowMin && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>&#9888; Abaixo de 16h — nao pontua</span>}
                              {selected && hours >= 16 && <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>&#10003; Valido</span>}
                            </div>
                            <ProofSelector
                              itemLabel={o.label}
                              proofMode={profile.proofMode}
                              proofFiles={profile.proofFiles}
                              onChange={(mode, fileName) => setProof(o.label, mode, fileName)}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(4)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => { setStatus(''); setStep(6); }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 6: PROJETOS ESTRATEGICOS ── */}
          {step === 6 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#128203;</span>
                <div>
                  <h2>Projetos Estrategicos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Participacao em projetos estrategicos da organizacao contribui para a aderencia tecnica
                  </p>
                </div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: '0.78rem', color: '#0369a1' }}>
                <strong>O que sao projetos estrategicos?</strong> Sao iniciativas institucionais formais da organizacao nas quais voce participou como membro, lider ou colaborador. Projetos especificos de uma area pontuam com peso maior naquela area.
              </div>

              <div className="form-group">
                <label className="form-label">Projetos estrategicos participados</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>Selecione os projetos em que participou e indique como vai comprova-los.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', padding: '4px' }}>
                  {projectOptions.map((o) => {
                    const selected = profile.selectedProjects.includes(o.label);
                    return (
                      <div key={o.id} style={{
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white',
                        overflow: 'hidden', transition: 'all 0.2s'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selected}
                            onChange={() => {
                              toggleMulti('selectedProjects', o.label);
                              if (selected) {
                                setProfile((p) => {
                                  const m = { ...p.proofMode }; delete m[o.label];
                                  const f = { ...p.proofFiles }; delete f[o.label];
                                  return { ...p, proofMode: m, proofFiles: f };
                                });
                              }
                            }}
                            style={{ accentColor: 'var(--purple)', width: 15, height: 15, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>
                            {o.label}
                          </span>
                        </label>
                        {selected && (
                          <ProofSelector
                            itemLabel={o.label}
                            proofMode={profile.proofMode}
                            proofFiles={profile.proofFiles}
                            onChange={(mode, fileName) => setProof(o.label, mode, fileName)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Excecao */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 12 }}>
                  <input type="checkbox" checked={profile.exceptionRequested}
                    onChange={(e) => setProfile((p) => ({ ...p, exceptionRequested: e.target.checked }))}
                    style={{ accentColor: 'var(--purple)', width: 15, height: 15 }} />
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.85rem' }}>
                    Solicitar excecao — tenho formacao ou experiencia nao listada acima
                  </span>
                </label>
                {profile.exceptionRequested && (
                  <textarea className="form-input" rows={3}
                    placeholder="Descreva a formacao ou experiencia que nao esta na lista e justifique por que deve ser considerada..."
                    value={profile.exceptionJustification}
                    onChange={(e) => setProfile((p) => ({ ...p, exceptionJustification: e.target.value }))}
                    style={{ resize: 'vertical', fontSize: '0.82rem' }} />
                )}
              </div>

              {status && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.82rem', marginTop: 12 }}>{status}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(5)}>&larr; Voltar</button>
                <button type="submit" className="btn-primary" style={{ minWidth: 180 }}>
                  &#10003; Enviar formulario
                </button>
              </div>
            </div>
          )}

        </form>
      </main>
    </>
  );
}
