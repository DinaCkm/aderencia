import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  positionsHeld: [],
  selectedCourses: [],
  selectedProjects: [],
  exceptionRequested: false,
  exceptionJustification: '',
  attachments: [],
  exceptionStatus: 'pending',
};

const getOptions = (group: CatalogItem['group']) =>
  CATALOG_ITEMS.filter((item) => item.group === group);

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

  const matriculaOptions = useMemo(() => getOptions('matricula'), []);
  const roleOptions = useMemo(() => getOptions('role'), []);
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

  const stepLabels = ['Dados Basicos', 'Areas de Interesse', 'Formacao', 'Experiencia', 'Cursos e Projetos'];

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
        <div className="container" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700,
                background: step > i + 1 ? 'var(--cyan)' : step === i + 1 ? 'var(--purple)' : 'var(--border)',
                color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s', flexShrink: 0,
              }}>
                {step > i + 1 ? '\u2713' : i + 1}
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--purple)' : 'var(--text-muted)' }}>
                {label}
              </span>
              {i < 4 && <div style={{ width: 18, height: 2, background: step > i + 1 ? 'var(--cyan)' : 'var(--border)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      <main className="container" style={{ maxWidth: 760, paddingTop: 28, paddingBottom: 60 }}>
        <form onSubmit={handleSubmit}>

          {/* ── STEP 1: DADOS BÁSICOS ── */}
          {step === 1 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#128100;</span>
                <div>
                  <h2>Dados Basicos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Suas informacoes funcionais</p>
                </div>
              </div>

              {/* Identificação vinda do login */}
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', marginBottom: 20, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem' }}>&#128100;</span>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Identificado como: </span>
                  <strong style={{ color: 'var(--purple)' }}>{participantName}</strong>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Matricula *</label>
                  <input className="form-input" type="text" value={profile.matricula}
                    onChange={(e) => setProfile((p) => ({ ...p, matricula: e.target.value }))}
                    required placeholder="Ex: 12345" autoComplete="off" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Funcao atual *</label>
                  <select className="form-input" value={profile.currentRole}
                    onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} required>
                    <option value="">Selecione seu cargo</option>
                    {roleOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Área de atuação atual */}
              <div className="form-group">
                <label className="form-label">Area em que atua atualmente *</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 10 }}>
                  Selecione a area onde voce trabalha hoje. Isso permite comparar quantas pessoas da mesma area tiveram aderencia a cada area de destino.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {(OFFICIAL_AREAS as AreaCode[]).map((area) => {
                    const selected = profile.currentArea === area;
                    return (
                      <button key={area} type="button"
                        onClick={() => setProfile((p) => ({ ...p, currentArea: area }))}
                        style={{
                          padding: '10px 8px', borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${selected ? '#0e7490' : 'var(--border)'}`,
                          background: selected ? '#e0fafa' : 'white',
                          color: selected ? '#0e7490' : 'var(--text)',
                          fontWeight: selected ? 700 : 400, cursor: 'pointer',
                          transition: 'all 0.2s', fontSize: '0.82rem',
                        }}>
                        {selected ? '\u2713 ' : ''}{area}
                      </button>
                    );
                  })}
                </div>
                {profile.currentArea && (
                  <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#0e7490', fontWeight: 600 }}>
                    &#10003; Area atual selecionada: <strong>{profile.currentArea}</strong>
                  </div>
                )}
              </div>

              {status && <p style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 8 }}>{status}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (!profile.matricula || !profile.currentRole || !profile.currentArea) {
                    setStatus('Preencha todos os campos: matricula, cargo e area de atuacao.');
                    return;
                  }
                  setStatus(''); setStep(2);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: ÁREAS DE INTERESSE ── */}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {(OFFICIAL_AREAS as AreaCode[]).map((area) => {
                  const selected = profile.selectedAreas.includes(area);
                  const isCurrentArea = profile.currentArea === area;
                  return (
                    <button key={area} type="button"
                      onClick={() => toggleArea(area as AreaCode)}
                      style={{
                        padding: '12px 8px', borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white',
                        color: selected ? 'var(--purple)' : 'var(--text)',
                        fontWeight: selected ? 700 : 400, cursor: 'pointer',
                        transition: 'all 0.2s', fontSize: '0.82rem',
                        opacity: !selected && profile.selectedAreas.length >= 3 ? 0.4 : 1,
                        position: 'relative',
                      }}>
                      {selected ? '\u2713 ' : ''}{area}
                      {isCurrentArea && (
                        <span style={{ display: 'block', fontSize: '0.6rem', color: '#0e7490', fontWeight: 600, marginTop: 2 }}>
                          (atual)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--purple)' }}>
                {profile.selectedAreas.length === 0
                  ? 'Selecione pelo menos 1 area de interesse.'
                  : `${profile.selectedAreas.length} area(s) selecionada(s): ${profile.selectedAreas.join(', ')}`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (profile.selectedAreas.length === 0) { setStatus('Selecione pelo menos 1 area.'); return; }
                  setStatus(''); setStep(3);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: FORMAÇÃO ── */}
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
              <div className="form-group">
                <label className="form-label">Graduacao *</label>
                <select className="form-input" value={profile.graduation}
                  onChange={(e) => setProfile((p) => ({ ...p, graduation: e.target.value }))} required>
                  <option value="">Selecione sua graduacao</option>
                  {graduationOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pos-graduacao / MBA concluidos</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 8 }}>
                  Selecione os que voce concluiu. Pos/MBA especificos da area de interesse valem mais pontos.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', maxHeight: 260, overflowY: 'auto', padding: '4px' }}>
                  {postMBAOptions.map((o) => {
                    const selected = profile.postMBAs.includes(o.label);
                    return (
                      <label key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleMulti('postMBAs', o.label)}
                          style={{ accentColor: 'var(--purple)', width: 15, height: 15 }} />
                        <span style={{ fontSize: '0.82rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>
                          {o.label}
                          {o.area && <span style={{ fontSize: '0.68rem', color: 'var(--cyan)', marginLeft: 4 }}>({o.area})</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (!profile.graduation) { setStatus('Selecione sua graduacao.'); return; }
                  setStatus(''); setStep(4);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: EXPERIÊNCIA ── */}
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
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--purple)' }}>
                <strong>Como e calculado:</strong> 1 ponto a cada 6 meses completos em cargo gerencial ou interino, maximo de 4 pontos (24 meses).
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Meses em cargo gerencial ou interino</label>
                  <input type="number" className="form-input" min={0} max={120}
                    value={profile.experienceMonths || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, experienceMonths: parseInt(e.target.value) || 0 }))}
                    placeholder="Ex: 18" />
                  {profile.experienceMonths > 0 && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--cyan)', marginTop: 6, fontWeight: 600 }}>
                      = {Math.min(Math.floor(profile.experienceMonths / 6), 4)} ponto(s) ({profile.experienceMonths} meses &divide; 6 = {(profile.experienceMonths / 6).toFixed(1)} periodos, max 4)
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(3)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => { setStatus(''); setStep(5); }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 5: CURSOS E PROJETOS ── */}
          {step === 5 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127775;</span>
                <div>
                  <h2>Cursos e Projetos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Cursos e projetos estrategicos valem ate <span style={{ color: 'var(--purple)', fontWeight: 600 }}>3 pontos</span> na aderencia tecnica
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cursos estrategicos concluidos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', maxHeight: 240, overflowY: 'auto', padding: '4px' }}>
                  {courseOptions.map((o) => {
                    const selected = profile.selectedCourses.includes(o.label);
                    return (
                      <label key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleMulti('selectedCourses', o.label)}
                          style={{ accentColor: 'var(--purple)', width: 15, height: 15 }} />
                        <span style={{ fontSize: '0.82rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Projetos estrategicos participados</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', maxHeight: 240, overflowY: 'auto', padding: '4px' }}>
                  {projectOptions.map((o) => {
                    const selected = profile.selectedProjects.includes(o.label);
                    return (
                      <label key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleMulti('selectedProjects', o.label)}
                          style={{ accentColor: 'var(--purple)', width: 15, height: 15 }} />
                        <span style={{ fontSize: '0.82rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>
                          {o.label}
                          {o.area && <span style={{ fontSize: '0.68rem', color: 'var(--cyan)', marginLeft: 4 }}>({o.area})</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
              {status && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.82rem', marginTop: 12 }}>
                  {status}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(4)}>&larr; Voltar</button>
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
