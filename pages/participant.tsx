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
    setProfile((prev) => ({ ...prev, id: email, email }));
  }, [router]);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const nameOptions = useMemo(() => getOptions('name'), []);
  const matriculaOptions = useMemo(() => getOptions('matricula'), []);
  const unitOptions = useMemo(() => getOptions('unit'), []);
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
            <button className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              Meus resultados
            </button>
          </Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                background: step > i + 1 ? 'var(--cyan)' : step === i + 1 ? 'var(--purple)' : 'var(--border)',
                color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {step > i + 1 ? '\u2713' : i + 1}
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: step === i + 1 ? 600 : 400,
                color: step === i + 1 ? 'var(--purple)' : 'var(--text-muted)',
              }}>
                {label}
              </span>
              {i < 4 && <div style={{ width: 20, height: 2, background: step > i + 1 ? 'var(--cyan)' : 'var(--border)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      <main className="container" style={{ maxWidth: 760, paddingTop: 32, paddingBottom: 60 }}>
        <form onSubmit={handleSubmit}>

          {step === 1 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#128100;</span>
                <div>
                  <h2>Dados Basicos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Suas informacoes pessoais e funcionais</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome completo *</label>
                  <select className="form-input" value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required>
                    <option value="">Selecione seu nome</option>
                    {nameOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Matricula *</label>
                  <select className="form-input" value={profile.matricula}
                    onChange={(e) => setProfile((p) => ({ ...p, matricula: e.target.value }))} required>
                    <option value="">Selecione</option>
                    {matriculaOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Unidade atual *</label>
                  <select className="form-input" value={profile.unit}
                    onChange={(e) => setProfile((p) => ({ ...p, unit: e.target.value }))} required>
                    <option value="">Selecione</option>
                    {unitOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo atual *</label>
                  <select className="form-input" value={profile.currentRole}
                    onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} required>
                    <option value="">Selecione</option>
                    {roleOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {status && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{status}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-primary" onClick={() => {
                  if (!profile.name || !profile.matricula || !profile.unit || !profile.currentRole) {
                    setStatus('Preencha todos os campos obrigatorios.');
                    return;
                  }
                  setStatus(''); setStep(2);
                }}>Proximo</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127919;</span>
                <div>
                  <h2>Areas de Interesse</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Escolha entre 1 e 3 areas. Cada area gera uma avaliacao de aderencia independente.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {(OFFICIAL_AREAS as AreaCode[]).map((area) => {
                  const selected = profile.selectedAreas.includes(area);
                  return (
                    <button key={area} type="button"
                      onClick={() => toggleArea(area as AreaCode)}
                      style={{
                        padding: '12px 8px', borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white',
                        color: selected ? 'var(--purple)' : 'var(--text)',
                        fontWeight: selected ? 700 : 400, cursor: 'pointer',
                        transition: 'all 0.2s', fontSize: '0.88rem',
                        opacity: !selected && profile.selectedAreas.length >= 3 ? 0.4 : 1,
                      }}>
                      {selected ? '\u2713 ' : ''}{area}
                    </button>
                  );
                })}
              </div>
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--purple)' }}>
                {profile.selectedAreas.length === 0
                  ? 'Selecione pelo menos 1 area de interesse.'
                  : `${profile.selectedAreas.length} area(s) selecionada(s): ${profile.selectedAreas.join(', ')}`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>Voltar</button>
                <button type="button" className="btn-primary" onClick={() => {
                  if (profile.selectedAreas.length === 0) { setStatus('Selecione pelo menos 1 area.'); return; }
                  setStatus(''); setStep(3);
                }}>Proximo</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127891;</span>
                <div>
                  <h2>Formacao Academica</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Graduacao e pos-graduacao/MBA concluidos</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Graduacao (apenas registro)</label>
                <select className="form-input" value={profile.graduation}
                  onChange={(e) => setProfile((p) => ({ ...p, graduation: e.target.value }))}>
                  <option value="">Selecione</option>
                  {graduationOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Pos-graduacao / MBA concluidos{' '}
                  <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>(vale ate 3 pontos na aderencia tecnica)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', maxHeight: 280, overflowY: 'auto', padding: '4px' }}>
                  {postMBAOptions.map((o) => {
                    const selected = profile.postMBAs.includes(o.label);
                    return (
                      <label key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleMulti('postMBAs', o.label)}
                          style={{ accentColor: 'var(--purple)', width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.85rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>Voltar</button>
                <button type="button" className="btn-primary" onClick={() => { setStatus(''); setStep(4); }}>Proximo</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#128188;</span>
                <div>
                  <h2>Experiencia Gerencial / Interina</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Tempo em funcoes de gestao ou interinidade{' '}
                    <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>(vale ate 4 pontos)</span>
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tempo total de experiencia gerencial/interina (em meses)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <input type="number" className="form-input" style={{ maxWidth: 160 }} min={0} max={240}
                    value={profile.experienceMonths}
                    onChange={(e) => setProfile((p) => ({ ...p, experienceMonths: Number(e.target.value) }))} />
                  <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '0.85rem', color: 'var(--purple)', fontWeight: 600 }}>
                    = {Math.min(4, Math.floor(profile.experienceMonths / 6))} ponto(s) de 4 possiveis
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  1 ponto a cada 6 meses completos, maximo 4 pontos (24 meses).
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(3)}>Voltar</button>
                <button type="button" className="btn-primary" onClick={() => { setStatus(''); setStep(5); }}>Proximo</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#128218;</span>
                <div>
                  <h2>Cursos e Projetos Estrategicos</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Selecione os que voce concluiu{' '}
                    <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>(vale ate 3 pontos)</span>
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
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleMulti('selectedCourses', o.label)}
                          style={{ accentColor: 'var(--purple)', width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.85rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>{o.label}</span>
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
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)', border: `1.5px solid ${selected ? 'var(--purple)' : 'var(--border)'}`,
                        background: selected ? 'var(--gradient-soft)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleMulti('selectedProjects', o.label)}
                          style={{ accentColor: 'var(--purple)', width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.85rem', color: selected ? 'var(--purple)' : 'var(--text)', fontWeight: selected ? 600 : 400 }}>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: 12 }}>
                  <input type="checkbox" checked={profile.exceptionRequested}
                    onChange={(e) => setProfile((p) => ({ ...p, exceptionRequested: e.target.checked }))}
                    style={{ accentColor: 'var(--purple)', width: 16, height: 16 }} />
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    Solicitar excecao - tenho formacao/experiencia nao listada acima
                  </span>
                </label>
                {profile.exceptionRequested && (
                  <textarea className="form-input" rows={3}
                    placeholder="Descreva a formacao ou experiencia que nao esta na lista e justifique por que deve ser considerada..."
                    value={profile.exceptionJustification}
                    onChange={(e) => setProfile((p) => ({ ...p, exceptionJustification: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                )}
              </div>
              {status && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.85rem', marginTop: 12 }}>
                  {status}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(4)}>Voltar</button>
                <button type="submit" className="btn-primary" style={{ minWidth: 180 }}>
                  Enviar formulario
                </button>
              </div>
            </div>
          )}

        </form>
      </main>
    </>
  );
}
