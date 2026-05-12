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

// Componente de tooltip/popover informativo
function InfoTooltip({ content }: { content: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #6ee7b7',
          background: open ? '#065f46' : '#f0fdf4', color: open ? 'white' : '#065f46',
          fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', lineHeight: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          flexShrink: 0
        }}
        title="Ver critérios de classificação"
      >?</button>
      {open && (
        <div style={{
          position: 'absolute', top: 24, left: 0, zIndex: 200,
          background: 'white', border: '1.5px solid #6ee7b7',
          borderRadius: 10, padding: '14px 16px', width: 340,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontSize: '0.75rem', color: '#1a1a2e', lineHeight: 1.65
        }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280', lineHeight: 1, marginLeft: 8 }}
          >×</button>
          {content}
        </div>
      )}
    </span>
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
    // Restaurar rascunho salvo no sessionStorage
    const draft = sessionStorage.getItem('aderenciaDraft');
    if (draft) {
      try {
        const saved = JSON.parse(draft) as ParticipantProfile;
        setProfile(saved);
        const savedStep = sessionStorage.getItem('aderenciaStep');
        if (savedStep) setStep(parseInt(savedStep, 10));
      } catch { /* ignora rascunho invalido */ }
    } else {
      setProfile((prev) => ({ ...prev, id: email, email, name: name || '' }));
    }
  }, [router]);

  // Salvar rascunho automaticamente sempre que profile ou step mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (profile.id) {
      sessionStorage.setItem('aderenciaDraft', JSON.stringify(profile));
      sessionStorage.setItem('aderenciaStep', String(step));
    }
  }, [profile, step]);

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
        // Limpar rascunho apos envio bem-sucedido
        sessionStorage.removeItem('aderenciaDraft');
        sessionStorage.removeItem('aderenciaStep');
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

  const TOTAL_STEPS = 7;
  const stepLabels = ['Dados Basicos', 'Areas de Interesse', 'Graduacao', 'Pos/MBA', 'Cursos Extracurriculares', 'Experiencia', 'Projetos'];

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
        <main className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: 96 }}>
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

      {/* Sidebar de navegação lateral esquerda */}
      <div style={{
        position: 'fixed', top: 64, left: 0, bottom: 0, width: 200,
        background: 'white', borderRight: '1px solid var(--border)',
        zIndex: 999, overflowY: 'auto', padding: '24px 0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {stepLabels.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i + 1)}
              title={`Ir para: ${label}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: step === i + 1 ? 'rgba(91,45,142,0.08)' : 'none',
                border: step === i + 1 ? '1.5px solid rgba(91,45,142,0.2)' : '1.5px solid transparent',
                cursor: 'pointer', padding: '10px 12px', borderRadius: 10,
                transition: 'all 0.15s', textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => { if (step !== i + 1) e.currentTarget.style.background = 'rgba(91,45,142,0.04)'; }}
              onMouseLeave={e => { if (step !== i + 1) e.currentTarget.style.background = 'none'; }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                background: step > i + 1 ? 'var(--cyan)' : step === i + 1 ? 'var(--purple)' : 'var(--border)',
                color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '\u2713' : i + 1}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--purple)' : 'var(--text-muted)', lineHeight: 1.3 }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main style={{ marginLeft: 200, paddingTop: 80, paddingBottom: 48, minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
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
                  <label className="form-label">Cargo / Função atual *</label>
                  <select className="form-input" value={profile.currentRole}
                    onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} required>
                    <option value="">Selecione seu cargo...</option>
                    <optgroup label="Cargos Técnicos">
                      <option>Analista Técnico I</option>
                      <option>Analista Técnico II</option>
                      <option>Analista Técnico III</option>
                      <option>Assistente I</option>
                      <option>Assistente II</option>
                    </optgroup>
                    <optgroup label="Cargos de Gestão">
                      <option>Gerente</option>
                      <option>Diretor</option>
                    </optgroup>
                    <optgroup label="Outros">
                      <option>Estagiário</option>
                      <option>Secretaria DIREX</option>
                    </optgroup>
                  </select>
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
                  <h2>Áreas de Interesse</h2>
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)', border: '1.5px solid #ddd6fe', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.8, margin: 0 }}>
                  Escolha de <strong>1 a 3 áreas</strong> nas quais você deseja ser considerado como possível sucessor no <strong>Programa de Desenvolvimento de Líderes e Sucessores</strong>.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.8, margin: '8px 0 0' }}>
                  Cada área selecionada gerará uma <strong>análise de aderência independente</strong>, considerando sua trajetória, formação, experiências profissionais, participação em projetos, perfil comportamental e performance no programa.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.8, margin: '8px 0 0' }}>
                  A escolha das áreas deve refletir onde você acredita ter maior <strong>interesse</strong>, <strong>potencial de contribuição</strong> e <strong>disposição para se desenvolver</strong>.
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '10px 0 0', fontStyle: 'italic' }}>
                  Após selecionar as áreas desejadas, clique em <strong>Próximo</strong> para continuar.
                </p>
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

              {/* Texto de orientacao da etapa */}
              <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.7 }}>
                <p style={{ margin: 0, marginBottom: 8 }}>
                  Informe a área e o nome completo do seu curso de graduação, conforme consta no diploma, certificado ou histórico acadêmico.
                </p>
                <p style={{ margin: 0, marginBottom: 8 }}>
                  Caso não identifique sua área de formação ou o nome do seu curso nas opções disponíveis, selecione <strong>"Outro curso / Área não identificada"</strong> e registre as informações no campo de exceção para análise da equipe responsável.
                </p>
                <p style={{ margin: 0 }}>
                  As informações declaradas poderão ser verificadas posteriormente e serão utilizadas para o cálculo do Índice de Aderência às áreas escolhidas.
                </p>
              </div>

              {/* Aviso de validade */}
              <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>&#9888;&#65039;</span>
                <p style={{ fontSize: '0.78rem', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  <strong>Atenção:</strong> Somente graduações <strong>concluídas até 31/12/2025</strong> serão consideradas válidas para pontuação. Graduações em andamento não pontuam.
                  Se você possui mais de uma graduação, o sistema considerará automaticamente a de <strong>maior relevância</strong> para cada área de interesse escolhida.
                </p>
              </div>

              {/* Graduacao principal com comprovacao */}
              <div className="form-group">
                <label className="form-label">Área da graduação *</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 6 }}>Selecione a área mais próxima da sua formação.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <select className="form-input" value={profile.graduation}
                    onChange={(e) => setProfile((p) => ({ ...p, graduation: e.target.value, graduationCourseName: '', graduationException: '' } as any))} required>
                    <option value="">Selecione a área da sua graduação</option>
                    {graduationOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                    <option value="__outro__">Outro curso / Área não identificada</option>
                  </select>
                  <input className="form-input" type="number" min="1980" max="2025" placeholder="Ano de conclusão"
                    value={(profile as any).graduationYear || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, graduationYear: e.target.value } as any))}
                    style={{ textAlign: 'center' }} />
                </div>
                {profile.graduation && profile.graduation !== '__outro__' && (
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

              {/* Nome completo do curso de graduacao */}
              <div className="form-group">
                <label className="form-label">Nome do curso de graduação *</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 6 }}>Digite o nome completo do curso conforme consta no diploma, certificado ou histórico acadêmico.</p>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ex.: Bacharelado em Administração, Ciências Contábeis, Psicologia, Comunicação Social – Publicidade e Propaganda"
                  value={(profile as any).graduationCourseName || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, graduationCourseName: e.target.value } as any))}
                  required
                />
              </div>

              {/* Campo condicional de excecao */}
              {profile.graduation === '__outro__' && (
                <div className="form-group">
                  <div style={{ background: '#fef9ec', border: '1.5px solid #fbbf24', borderRadius: 10, padding: '14px 16px' }}>
                    <label className="form-label" style={{ color: '#92400e', marginBottom: 6 }}>Curso não encontrado / Exceção *</label>
                    <p style={{ color: '#b45309', fontSize: '0.75rem', marginBottom: 8, lineHeight: 1.6 }}>
                      Preencha este campo apenas se sua área ou curso não estiver contemplado nas opções disponíveis. Sua informação será analisada pela equipe responsável.
                    </p>
                    <textarea
                      className="form-input form-textarea"
                      placeholder="Informe o nome completo do curso e descreva brevemente a área de formação para análise."
                      value={(profile as any).graduationException || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, graduationException: e.target.value } as any))}
                      rows={3}
                      required
                      style={{ minHeight: 80 }}
                    />
                  </div>
                </div>
              )}

              {/* Segunda graduacao (opcional) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox"
                    checked={!!(profile as any).graduation2HasField}
                    onChange={(e) => {
                      if (!e.target.checked) setProfile((p) => { const np = { ...p } as any; delete np.graduation2; delete np.graduation2Year; delete np.graduation2CourseName; delete np.graduation2Exception; np.graduation2HasField = false; return np; });
                      else setProfile((p) => ({ ...p, graduation2: '', graduation2HasField: true } as any));
                    }}
                    style={{ accentColor: 'var(--purple)', width: 15, height: 15 }} />
                  <span>Possuo uma segunda graduação concluída até 2025</span>
                </label>
                {(profile as any).graduation2HasField && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Área + Ano */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                      <select className="form-input" value={(profile as any).graduation2 || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, graduation2: e.target.value, graduation2CourseName: '', graduation2Exception: '' } as any))}>
                        <option value="">Selecione a área da 2ª graduação</option>
                        {graduationOptions.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
                        <option value="__outro2__">Outro curso / Área não identificada</option>
                      </select>
                      <input className="form-input" type="number" min="1980" max="2025" placeholder="Ano de conclusão"
                        value={(profile as any).graduation2Year || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, graduation2Year: e.target.value } as any))}
                        style={{ textAlign: 'center' }} />
                    </div>
                    {/* Nome do curso da 2ª graduação */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Nome do curso da 2ª graduação *</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginBottom: 6 }}>Digite o nome completo do curso conforme consta no diploma, certificado ou histórico acadêmico.</p>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Ex.: Licenciatura em Matemática, Bacharelado em Ciências Sociais"
                        value={(profile as any).graduation2CourseName || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, graduation2CourseName: e.target.value } as any))}
                      />
                    </div>
                    {/* Campo condicional de excecao da 2ª graduacao */}
                    {(profile as any).graduation2 === '__outro2__' && (
                      <div style={{ background: '#fef9ec', border: '1.5px solid #fbbf24', borderRadius: 10, padding: '14px 16px' }}>
                        <label className="form-label" style={{ color: '#92400e', marginBottom: 6 }}>Curso não encontrado / Exceção — 2ª Graduação *</label>
                        <p style={{ color: '#b45309', fontSize: '0.75rem', marginBottom: 8, lineHeight: 1.6 }}>
                          Preencha este campo apenas se sua área ou curso não estiver contemplado nas opções disponíveis. Sua informação será analisada pela equipe responsável.
                        </p>
                        <textarea
                          className="form-input form-textarea"
                          placeholder="Informe o nome completo do curso e descreva brevemente a área de formação para análise."
                          value={(profile as any).graduation2Exception || ''}
                          onChange={(e) => setProfile((p) => ({ ...p, graduation2Exception: e.target.value } as any))}
                          rows={3}
                          style={{ minHeight: 80 }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {status && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 16px', color: '#dc2626', fontSize: '0.82rem', marginTop: 12 }}>{status}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  if (!profile.graduation) { setStatus('Selecione a área da sua graduação.'); return; }
                  if (!(profile as any).graduationCourseName?.trim()) { setStatus('Informe o nome completo do curso de graduação.'); return; }
                  if (profile.graduation === '__outro__' && !(profile as any).graduationException?.trim()) { setStatus('Preencha o campo de exceção com o nome e descrição do seu curso.'); return; }
                  if (profile.graduation !== '__outro__') {
                    const mode = profile.proofMode[profile.graduation];
                    if (!mode) { setStatus('Selecione como vai comprovar sua graduação (A UGP já tem conhecimento ou Enviar documento).'); return; }
                    if (mode === 'upload' && !profile.proofFiles[profile.graduation]) { setStatus('Você selecionou "Enviar documento" para a graduação — escolha o arquivo antes de continuar.'); return; }
                  }
                  if ((profile as any).graduation2HasField) {
                    if (!(profile as any).graduation2) { setStatus('Selecione a área da 2ª graduação.'); return; }
                    if (!(profile as any).graduation2CourseName?.trim()) { setStatus('Informe o nome completo do curso da 2ª graduação.'); return; }
                    if ((profile as any).graduation2 === '__outro2__' && !(profile as any).graduation2Exception?.trim()) { setStatus('Preencha o campo de exceção da 2ª graduação.'); return; }
                  }
                  setStatus(''); setStep(4);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: POS/MBA ── */}
          {step === 4 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127891;</span>
                <div>
                  <h2>Pós-graduação / MBA</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Títulos de pós-graduação e MBA valem até <span style={{ color: 'var(--purple)', fontWeight: 600 }}>3 pontos</span> na aderência técnica
                  </p>
                </div>
              </div>

              {/* Instrucoes detalhadas */}
              <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.7 }}>
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>Como funciona a pontuação de Pós-graduação / MBA:</p>
                <p style={{ margin: 0, marginBottom: 6 }}>Selecione abaixo todos os títulos de pós-graduação, MBA, especialização ou formação executiva que você <strong>concluiu até 31/12/2025</strong>. Para cada título selecionado, indique como vai comprová-lo.</p>
                <p style={{ margin: 0, marginBottom: 6 }}>Os títulos são classificados em duas categorias:</p>
                <ul style={{ paddingLeft: 16, margin: '0 0 6px', lineHeight: 1.8 }}>
                  <li><strong>Título Transversal:</strong> vale para qualquer área de interesse escolhida (foco em liderança, gestão, estratégia, inovação, governança).</li>
                  <li><strong>Título Específico da Área:</strong> vale somente para a área correspondente, com pontuação maior.</li>
                </ul>
                <p style={{ margin: 0 }}>Caso seu título não esteja na lista, utilize o campo de exceção ao final do formulário para registrar a informação para análise da equipe responsável.</p>
              </div>

              {/* Bloco didatico: transversal vs especifico */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, marginTop: 8 }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#065f46', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                    &#127758; Titulo Transversal
                    <InfoTooltip content={
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: 6, color: '#065f46' }}>Critérios para Título Transversal</p>
                        <p style={{ marginBottom: 8 }}>Será considerado Título Transversal apenas o curso de pós-graduação, MBA, especialização ou formação executiva cujo nome indique claramente foco principal em:</p>
                        <ul style={{ paddingLeft: 16, marginBottom: 8, lineHeight: 1.8 }}>
                          <li>Liderança ou gestão de pessoas</li>
                          <li>Desenvolvimento humano e organizacional</li>
                          <li>Estratégia organizacional</li>
                          <li>Gestão de projetos ou processos</li>
                          <li>Inovação ou transformação digital aplicada à gestão</li>
                          <li>Governança corporativa ou gestão da mudança</li>
                        </ul>
                        <p style={{ marginBottom: 6 }}><strong>Exemplos:</strong> MBA em Gestão de Pessoas, Pós em Liderança, MBA em Gestão Estratégica de Pessoas, Especialização em Desenvolvimento Organizacional, MBA em Gestão de Projetos, MBA em Planejamento Estratégico, Pós em Governança Corporativa.</p>
                        <p style={{ color: '#dc2626', marginBottom: 6 }}><strong>Não serão classificados como Transversal</strong> formações técnicas ou funcionais de área específica, como Marketing, Finanças, Controladoria, Auditoria, Direito, Comunicação, Logística, Vendas ou Gestão Comercial — ainda que contenham disciplinas de gestão ou liderança.</p>
                        <p style={{ color: '#7c3aed' }}>Nesses casos, a formação poderá ser considerada <strong>Título Específico da Área</strong> quando houver relação direta com a área de interesse escolhida.</p>
                      </div>
                    } />
                  </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                <button type="button" className="btn-outline" onClick={() => setStep(3)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  // Validar comprovacao dos pos/MBA selecionados
                  for (const item of profile.postMBAs) {
                    const mode = profile.proofMode[item];
                    if (!mode) { setStatus(`Selecione como vai comprovar o título: "${item}".`); return; }
                    if (mode === 'upload' && !profile.proofFiles[item]) { setStatus(`Você selecionou "Enviar documento" para "${item}" — escolha o arquivo antes de continuar.`); return; }
                  }
                  setStatus(''); setStep(5);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 5: CURSOS ESTRATEGICOS ── */}
          {step === 5 && (
            <div className="section-card">
              <div className="section-title">
                <span className="section-icon">&#127775;</span>
                <div>
                  <h2>Cursos Extracurriculares</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Cursos extracurriculares concluídos valem até <span style={{ color: 'var(--purple)', fontWeight: 600 }}>3 pontos</span> na aderência técnica
                  </p>
                </div>
              </div>

              {/* Instrucoes detalhadas */}
              <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.7 }}>
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>O que são cursos extracurriculares?</p>
                <p style={{ margin: 0, marginBottom: 6 }}>São formações de desenvolvimento continuado — diferentes de Pós/MBA. Incluem cursos, workshops, treinamentos e certificações profissionais realizados fora do ambiente acadêmico formal.</p>
                <p style={{ margin: 0, marginBottom: 6 }}><strong>Requisito mínimo:</strong> o curso deve ter <strong>no mínimo 16 horas</strong> de carga horária para ser considerado válido para pontuação. Cursos com menos de 16h serão desconsiderados automaticamente.</p>
                <p style={{ margin: 0, marginBottom: 6 }}>Para cada curso selecionado, informe a carga horária e indique como vai comprová-lo (documento ou conhecimento da UGP).</p>
                <p style={{ margin: 0 }}>A validação final é feita pelo RH/UGP. Cursos não listados podem ser registrados no campo de exceção da última etapa.</p>
              </div>

              {/* Transversal vs especifico */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#f0fdf4', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#065f46', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                    &#127758; Curso Transversal
                    <InfoTooltip content={
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: 6, color: '#065f46' }}>Critérios para Curso Transversal</p>
                        <p style={{ marginBottom: 8 }}>Será considerado Curso Transversal apenas o curso cujo nome indique claramente foco principal em:</p>
                        <ul style={{ paddingLeft: 16, marginBottom: 8, lineHeight: 1.8 }}>
                          <li>Liderança ou gestão de pessoas</li>
                          <li>Desenvolvimento humano e organizacional</li>
                          <li>Estratégia organizacional</li>
                          <li>Gestão de projetos ou processos</li>
                          <li>Inovação ou transformação digital aplicada à gestão</li>
                          <li>Governança corporativa ou gestão da mudança</li>
                        </ul>
                        <p style={{ color: '#dc2626', marginBottom: 6 }}><strong>Não serão classificados como Transversal</strong> cursos técnicos ou funcionais de área específica, como Marketing, Finanças, Controladoria, Auditoria, Direito, Comunicação, Logística, Vendas ou Gestão Comercial.</p>
                        <p style={{ color: '#7c3aed' }}>Nesses casos, o curso poderá ser considerado <strong>Curso Específico da Área</strong> quando houver relação direta com a área de interesse escolhida.</p>
                      </div>
                    } />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#047857', lineHeight: 1.6, margin: 0 }}>
                    Competências gerenciais e comportamentais que contribuem para <strong>qualquer área</strong> escolhida.
                  </p>
                </div>
                <div style={{ background: '#faf5ff', border: '1.5px solid #d8b4fe', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#5B2D8E', marginBottom: 4 }}>&#127919; Curso Especifico da Area</div>
                  <p style={{ fontSize: '0.75rem', color: '#6d28d9', lineHeight: 1.6, margin: 0 }}>
                    Cursos técnicos ligados a uma unidade específica. Pontuam <strong>somente na área correspondente</strong>.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cursos extracurriculares concluídos</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>Ao marcar um curso, informe a carga horária e como vai comprová-lo.</p>
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
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Carga horária (h):</label>
                              <input type="number" min={1} max={999}
                                value={hours || ''}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 0;
                                  setProfile((p) => ({ ...p, courseHours: { ...p.courseHours, [o.label]: v } }));
                                }}
                                placeholder="Ex: 40"
                                style={{ width: 80, padding: '4px 8px', border: `1px solid ${belowMin ? '#fca5a5' : 'var(--border)'}`, borderRadius: 6, fontSize: '0.78rem' }} />
                              {belowMin && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>&#9888; Abaixo de 16h — não pontua</span>}
                              {selected && hours >= 16 && <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>&#10003; Válido</span>}
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
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  for (const item of profile.selectedCourses) {
                    const mode = profile.proofMode[item];
                    if (!mode) { setStatus(`Selecione como vai comprovar o curso: "${item}".`); return; }
                    if (mode === 'upload' && !profile.proofFiles[item]) { setStatus(`Você selecionou "Enviar documento" para "${item}" — escolha o arquivo antes de continuar.`); return; }
                  }
                  setStatus(''); setStep(6);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 6: EXPERIENCIA ── */}
          {step === 6 && (
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
                <button type="button" className="btn-outline" onClick={() => setStep(5)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => { setStatus(''); setStep(7); }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 5: CURSOS ESTRATEGICOS (DUPLICADO - REMOVIDO) ── */}
          {step === -5 && (
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
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#065f46', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                    &#127758; Curso Transversal
                    <InfoTooltip content={
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: 6, color: '#065f46' }}>Critérios para Curso Transversal</p>
                        <p style={{ marginBottom: 8 }}>Será considerado Curso Transversal apenas o curso cujo nome indique claramente foco principal em:</p>
                        <ul style={{ paddingLeft: 16, marginBottom: 8, lineHeight: 1.8 }}>
                          <li>Liderança ou gestão de pessoas</li>
                          <li>Desenvolvimento humano e organizacional</li>
                          <li>Estratégia organizacional</li>
                          <li>Gestão de projetos ou processos</li>
                          <li>Inovação ou transformação digital aplicada à gestão</li>
                          <li>Governança corporativa ou gestão da mudança</li>
                        </ul>
                        <p style={{ color: '#dc2626', marginBottom: 6 }}><strong>Não serão classificados como Transversal</strong> cursos técnicos ou funcionais de área específica, como Marketing, Finanças, Controladoria, Auditoria, Direito, Comunicação, Logística, Vendas ou Gestão Comercial — ainda que contenham conteúdo de gestão ou liderança.</p>
                        <p style={{ color: '#7c3aed' }}>Nesses casos, o curso poderá ser considerado <strong>Curso Específico da Área</strong> quando houver relação direta com a área de interesse escolhida.</p>
                      </div>
                    } />
                  </div>
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
                <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => {
                  // Validar comprovacao dos cursos selecionados
                  for (const item of profile.selectedCourses) {
                    const mode = profile.proofMode[item];
                    if (!mode) { setStatus(`Selecione como vai comprovar o curso: "${item}".`); return; }
                    if (mode === 'upload' && !profile.proofFiles[item]) { setStatus(`Você selecionou "Enviar documento" para "${item}" — escolha o arquivo antes de continuar.`); return; }
                  }
                  setStatus(''); setStep(6);
                }}>Proximo &rarr;</button>
              </div>
            </div>
          )}

          {/* ── STEP 7: PROJETOS ESTRATEGICOS ── */}
          {step === 7 && (
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
                <button type="button" className="btn-outline" onClick={() => setStep(6)}>&larr; Voltar</button>
                <button type="button" className="btn-primary" style={{ minWidth: 180 }} onClick={(e) => {
                  // Validar comprovacao dos projetos selecionados
                  for (const item of profile.selectedProjects) {
                    const mode = profile.proofMode[item];
                    if (!mode) { setStatus(`Selecione como vai comprovar o projeto: "${item}".`); return; }
                    if (mode === 'upload' && !profile.proofFiles[item]) { setStatus(`Você selecionou "Enviar documento" para "${item}" — escolha o arquivo antes de continuar.`); return; }
                  }
                  handleSubmit(e as any);
                }}>
                  &#10003; Enviar formulario
                </button>
              </div>
            </div>
          )}

        </form>
        </div>{/* fim do div maxWidth 760 */}
      </main>
    </>
  );
}
