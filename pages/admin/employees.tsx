import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import type { ParticipantProfile } from '../../lib/types';

interface Employee {
  email: string;
  name: string;
  cpf: string;
  role: string;
}

interface AreaAssessmentResult {
  area: string;
  technicalAdherence: number;
  behavioralAdherence?: number;
  quadrant: string;
  quadrantX?: 'low' | 'mid' | 'high';
  quadrantY?: 'low' | 'mid' | 'high';
  calculationSteps: { name: string; value: number | string; detail?: string }[];
  postMBADetail?: { titleUsed: string | null; classification: string; score: number };
  projectsDetail?: { label: string; points: number }[];
  discRecord?: {
    correlationPct: number;
    personD: number; personI: number; personS: number; personC: number;
    jobD: number; jobI: number; jobS: number; jobC: number;
    strengths: string[]; developments: string[];
    importedAt: string;
  } | null;
}

interface EmployeeProfileData {
  profile: ParticipantProfile;
  areaAssessments: AreaAssessmentResult[];
}

const QUADRANT_DESC: Record<string, string> = {
  'Potencial de Curto Prazo':    'Perfil comportamental alto, mas aderência técnica baixa. Tem o perfil certo para a área, mas ainda precisa de capacitação técnica. Pode ser desenvolvido a médio prazo.',
  'Pronto em Desenvolvimento':   'Perfil comportamental excelente e aderência técnica em desenvolvimento (média). Tem grande potencial e pode ser preparado rapidamente com capacitação técnica.',
  'Alta Prontidao':              'Candidato com alta aderência técnica E comportamental. Candidato ideal: está pronto para assumir a posição agora ou em curto prazo.',
  'Alta Prontidão':              'Candidato com alta aderência técnica E comportamental. Candidato ideal: está pronto para assumir a posição agora ou em curto prazo.',
  'Desenvolvimento Direcionado': 'Técnica e comportamento ambos baixos-médios. Precisa de um plano de desenvolvimento estruturado antes de ser considerado para sucessão.',
  'Potencial de Médio Prazo':    'Técnica e comportamento ambos médios. Candidato equilibrado, mas ainda não está pronto. Precisa de desenvolvimento em ambas as dimensões.',
  'Destaque Técnico':            'Aderência técnica alta, mas perfil comportamental médio. Domina o conteúdo, mas precisa desenvolver competências de liderança e comportamento.',
  'Baixa Aderência':             'Técnica e comportamento ambos baixos. Não há aderência significativa à área neste momento. Não é recomendado para sucessão sem um plano de desenvolvimento profundo.',
  'Especialista sem Liderança':  'Técnica média, mas comportamento baixo para a área. Conhece o trabalho, mas o perfil DISC não se alinha ao cargo. Pode ser um bom especialista, mas não necessariamente um bom gestor nessa área.',
  'Risco de Liderança':          'Técnica alta, mas comportamento baixo. O candidato tem o conhecimento técnico, mas o perfil comportamental pode gerar conflitos ou dificuldades na gestão.',
};

function formatCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
          .replace(/(\d{3})(\d{3})/, '$1.$2')
          .replace(/(\d{3})/, '$1');
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  );
}

function EmployeeProfileModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [data, setData] = useState<EmployeeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/admin/employee-profile?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Erro ao carregar dados.'); setLoading(false); });
  }, [email]);

  const p = data?.profile;
  const areas = data?.areaAssessments || [];

  const proofLabel = (mode: 'ugp-knows' | 'upload' | undefined) =>
    mode === 'ugp-knows' ? '✓ A UGP já tem conhecimento' : mode === 'upload' ? '📎 Documento enviado' : '—';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '28px 28px 32px', maxWidth: 860, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', marginTop: 20, marginBottom: 20,
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
              Ficha Completa do Candidato
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--purple)', fontWeight: 800 }}>
              {loading ? 'Carregando...' : (p?.name || email)}
            </h2>
            {p && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {p.email} &nbsp;|&nbsp; {p.unit || '—'} &nbsp;|&nbsp; {p.currentRole || '—'}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            ✕ Fechar
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            Carregando ficha completa...
          </div>
        )}

        {error && (
          <div style={{ padding: '16px 20px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>
            ⚠ {error === 'Participante não encontrado' ? 'Este empregado ainda não preencheu o formulário de aderência.' : error}
          </div>
        )}

        {!loading && !error && p && (
          <>
            {/* Status geral */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                background: p.validationStatus === 'validated' ? '#dcfce7' : '#fef3c7',
                color: p.validationStatus === 'validated' ? '#15803d' : '#92400e',
                border: `1px solid ${p.validationStatus === 'validated' ? '#86efac' : '#fcd34d'}`,
              }}>
                {p.validationStatus === 'validated' ? '✓ Validado' : '⏳ Provisório'}
              </span>
              {p.submittedAt && (
                <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  Enviado em {new Date(p.submittedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              {p.exceptionRequested && (
                <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' }}>
                  ⚠ Exceção solicitada
                </span>
              )}
            </div>

            {/* ── Aderência por Área ── */}
            {areas.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 14, borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
                  📊 Aderência por Área de Interesse
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {areas.map((a) => (
                    <div key={a.area} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>{a.area}</div>
                          {a.quadrant && a.quadrant !== 'Dados incompletos para definição do quadrante' ? (
                            <div style={{
                              display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
                              background: a.technicalAdherence >= 7.5 && (a.behavioralAdherence ?? 0) >= 7.5 ? '#dcfce7' :
                                          a.technicalAdherence >= 5 && (a.behavioralAdherence ?? 0) >= 5 ? '#fef3c7' : '#fee2e2',
                              color: a.technicalAdherence >= 7.5 && (a.behavioralAdherence ?? 0) >= 7.5 ? '#15803d' :
                                     a.technicalAdherence >= 5 && (a.behavioralAdherence ?? 0) >= 5 ? '#92400e' : '#b91c1c',
                              border: `1px solid ${a.technicalAdherence >= 7.5 && (a.behavioralAdherence ?? 0) >= 7.5 ? '#86efac' : a.technicalAdherence >= 5 && (a.behavioralAdherence ?? 0) >= 5 ? '#fcd34d' : '#fca5a5'}`,
                            }}>
                              ◉ {a.quadrant}
                              {QUADRANT_DESC[a.quadrant] && (
                                <span
                                  title={QUADRANT_DESC[a.quadrant]}
                                  style={{ cursor: 'help', fontSize: '0.8rem', marginLeft: 4, opacity: 0.7 }}
                                >👁️</span>
                              )}
                            </div>
                          ) : a.quadrant === 'Dados incompletos para definição do quadrante' ? (
                            <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              ⏳ Aguardando DISC para definir quadrante
                            </div>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ background: 'var(--gradient-soft)', border: '1px solid var(--purple)', borderRadius: 8, padding: '3px 12px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--purple)' }}>
                            Técnica: {a.technicalAdherence.toFixed(1)}
                          </span>
                          {a.behavioralAdherence !== undefined ? (
                            <span style={{ background: '#f0fdfa', border: '1px solid #0e7490', borderRadius: 8, padding: '3px 12px', fontSize: '0.82rem', fontWeight: 800, color: '#0e7490' }}>
                              Comportamental: {a.behavioralAdherence.toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '3px 12px', fontSize: '0.82rem', color: '#94a3b8' }}>
                              Comportamental: —
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 3 }}>Aderência Técnica</div>
                          <ScoreBar value={a.technicalAdherence} max={10} color="var(--purple)" />
                        </div>
                        {a.behavioralAdherence !== undefined && (
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 3 }}>Aderência Comportamental</div>
                            <ScoreBar value={a.behavioralAdherence} max={10} color="#0e7490" />
                          </div>
                        )}
                      </div>
                      {/* Detalhamento técnico */}
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {a.calculationSteps?.filter(s => !s.name.toLowerCase().includes('comportamental') && !s.name.toLowerCase().includes('disc') && !s.name.toLowerCase().includes('performance')).map((step, i) => (
                          <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 5, marginBottom: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#374151', padding: '3px 0 1px' }}>
                              <span>{step.name}</span>
                              <span style={{ fontWeight: 700, color: 'var(--purple)' }}>{typeof step.value === 'number' ? step.value.toFixed(1) : step.value}</span>
                            </div>
                            {step.detail && (
                              <div style={{ fontSize: '0.68rem', color: '#64748b', paddingLeft: 8, lineHeight: 1.4 }}>
                                ↳ {step.detail}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* DISC */}
                      {a.discRecord && (
                        <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>🔷 DISC — Correlação: {a.discRecord.correlationPct}%</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {[
                              { label: 'D', person: a.discRecord.personD, job: a.discRecord.jobD },
                              { label: 'I', person: a.discRecord.personI, job: a.discRecord.jobI },
                              { label: 'S', person: a.discRecord.personS, job: a.discRecord.jobS },
                              { label: 'C', person: a.discRecord.personC, job: a.discRecord.jobC },
                            ].map(({ label, person, job }) => (
                              <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: 6, padding: '4px 6px', border: '1px solid #e0f2fe' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369a1' }}>{label}</div>
                                <div style={{ fontSize: '0.68rem', color: '#6366f1' }}>P: {person}</div>
                                <div style={{ fontSize: '0.68rem', color: '#0e7490' }}>C: {job}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {areas.length === 0 && (
              <div style={{ marginBottom: 24, padding: '16px 20px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>
                Este candidato ainda não selecionou áreas de interesse ou não enviou o formulário.
              </div>
            )}

            {/* ── Identificação ── */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 10, borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>
                👤 Identificação
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <tbody>
                  {[
                    ['Matrícula', p.matrícula || '—'],
                    ['Unidade atual', p.unit || '—'],
                    ['Cargo atual', p.currentRole || '—'],
                    ['Área atual', p.currentArea || '—'],
                    ['Áreas de interesse', (p.selectedAreas || []).join(', ') || '—'],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', width: '35%' }}>{label}</td>
                      <td style={{ padding: '5px 0', color: '#111827' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Formação Acadêmica ── */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 10, borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>
                🎓 Formação Acadêmica
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', width: '35%' }}>Graduação 1</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{p.graduation || '—'}</td>
                  </tr>
                  {p.graduation2 && (
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Graduação 2</td>
                      <td style={{ padding: '5px 0', color: '#111827' }}>{p.graduation2}</td>
                    </tr>
                  )}
                  {p.graduationCourseName && (
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Curso (nome livre)</td>
                      <td style={{ padding: '5px 0', color: '#111827' }}>{p.graduationCourseName}</td>
                    </tr>
                  )}
                  {(p.postMBAs || []).length > 0 ? (
                    (p.postMBAs || []).map((title, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Pós/MBA {i + 1}</td>
                        <td style={{ padding: '5px 0', color: '#111827' }}>
                          {title}
                          <span style={{ marginLeft: 8, fontSize: '0.7rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 4, padding: '1px 6px' }}>entra no cálculo</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Pós/MBA</td>
                      <td style={{ padding: '5px 0', color: '#9ca3af', fontStyle: 'italic' }}>Nenhum informado</td>
                    </tr>
                  )}
                  {(p.certifications || []).length > 0 && (
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', verticalAlign: 'top' }}>Certificações</td>
                      <td style={{ padding: '5px 0', color: '#111827' }}>{(p.certifications || []).join(', ')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Experiência Gerencial ── */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 10, borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>
                💼 Experiência Gerencial / Interina <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.75rem' }}>(entra no cálculo)</span>
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', width: '35%' }}>Meses gerencial efetivo</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{p.managerialMonths ?? 0} meses ({((p.managerialMonths ?? 0) / 12).toFixed(1)} anos)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Meses interino</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{p.interimMonths ?? 0} meses ({((p.interimMonths ?? 0) / 12).toFixed(1)} anos)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Total combinado</td>
                    <td style={{ padding: '5px 0', color: '#111827', fontWeight: 700 }}>
                      {(p.managerialMonths ?? 0) + (p.interimMonths ?? 0)} meses
                    </td>
                  </tr>
                  {(p.positionsHeld || []).length > 0 && (
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', verticalAlign: 'top' }}>Cargos exercidos</td>
                      <td style={{ padding: '5px 0', color: '#111827' }}>{(p.positionsHeld || []).join(', ')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Projetos Estratégicos ── */}
            {(p.selectedProjects || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 10, borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>
                  📋 Projetos Estratégicos <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.75rem' }}>(entram no cálculo)</span>
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Projeto</th>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Área vinculada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(p.selectedProjects || []).map((proj, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '5px 8px', color: '#111827' }}>{proj}</td>
                        <td style={{ padding: '5px 8px', color: '#374151' }}>{p.projectAreaMap?.[proj] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Cursos Extracurriculares ── */}
            {(p.selectedCourses || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 10, borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>
                  📚 Cursos Extracurriculares <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.75rem' }}>(não entram na nota)</span>
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Curso</th>
                      <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Horas</th>
                      <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Comprovação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(p.selectedCourses || []).map((course, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '5px 8px', color: '#111827' }}>{course}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', color: '#374151' }}>{p.courseHours?.[course] ?? '—'}h</td>
                        <td style={{ padding: '5px 8px', color: '#374151' }}>{proofLabel(p.proofMode?.[course])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Exceções ── */}
            {p.exceptionRequested && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', marginBottom: 10, borderBottom: '2px solid #fcd34d', paddingBottom: 6 }}>
                  ⚠ Exceção Solicitada
                </h3>
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.78rem', color: '#92400e', marginBottom: 4 }}>
                    <strong>Status:</strong>{' '}
                    <span style={{
                      background: p.exceptionStatus === 'approved' ? '#dcfce7' : p.exceptionStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: p.exceptionStatus === 'approved' ? '#15803d' : p.exceptionStatus === 'rejected' ? '#b91c1c' : '#92400e',
                      borderRadius: 4, padding: '1px 8px', fontWeight: 700, fontSize: '0.75rem',
                    }}>
                      {p.exceptionStatus === 'approved' ? 'Aprovada' : p.exceptionStatus === 'rejected' ? 'Rejeitada' : 'Pendente'}
                    </span>
                  </div>
                  {p.exceptionJustification && (
                    <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: 6 }}>
                      <strong>Justificativa:</strong> {p.exceptionJustification}
                    </div>
                  )}
                </div>
                {(p.exceptionItems || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(p.exceptionItems || []).map((item, i) => (
                      <div key={i} style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 4, padding: '1px 8px', fontWeight: 700, fontSize: '0.7rem' }}>
                            {item.type === 'projeto' ? 'Projeto' : item.type === 'pos-mba' ? 'Pós/MBA' : item.type === 'curso' ? 'Curso' : item.type === 'experiencia' ? 'Experiência' : 'Outro'}
                          </span>
                          {item.targetArea && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '1px 8px', fontSize: '0.7rem' }}>
                              Área: {item.targetArea}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#374151' }}>
                          <strong>Item:</strong> {item.itemName}<br />
                          <strong>Objetivo:</strong> {item.objective}<br />
                          <strong>Justificativa:</strong> {item.justification}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Nota de validação */}
            {p.validationNote && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem' }}>
                <strong style={{ color: '#0369a1' }}>Nota do RH/Admin:</strong>{' '}
                <span style={{ color: '#0c4a6e' }}>{p.validationNote}</span>
                {p.validatedAt && (
                  <span style={{ marginLeft: 8, color: '#64748b', fontSize: '0.72rem' }}>
                    ({new Date(p.validatedAt).toLocaleDateString('pt-BR')})
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminEmployees() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  // Formulário de novo empregado
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [saving, setSaving] = useState(false);
  // Edição inline
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editNewEmail, setEditNewEmail] = useState('');
  // Modal de ficha completa
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    loadEmployees();
  }, [router]);

  const loadEmployees = () => {
    setLoading(true);
    fetch('/api/admin/employees')
      .then((r) => r.json())
      .then((d) => { setEmployees(d.employees || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newCpf.trim()) {
      notify('Preencha nome, e-mail e CPF.', 'error'); return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, cpf: newCpf.replace(/\D/g, '') }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Empregado criado com sucesso!');
      setNewName(''); setNewEmail(''); setNewCpf(''); setShowForm(false);
      loadEmployees();
    } else {
      notify(data.error || 'Erro ao criar empregado.', 'error');
    }
  };

  const startEdit = (emp: Employee) => {
    setEditEmail(emp.email);
    setEditName(emp.name);
    setEditCpf(formatCpf(emp.cpf));
    setEditNewEmail(emp.email);
  };

  const handleEdit = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editEmail, name: editName, cpf: editCpf.replace(/\D/g, ''), newEmail: editNewEmail }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Empregado atualizado!');
      setEditEmail('');
      loadEmployees();
    } else {
      notify(data.error || 'Erro ao atualizar.', 'error');
    }
  };

  const handleDelete = async (email: string, name: string) => {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch('/api/admin/employees', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      notify('Empregado excluído.');
      loadEmployees();
    } else {
      notify('Erro ao excluir.', 'error');
    }
  };

  const logout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head><title>Gestão de Empregados | Admin</title></Head>
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
          <Link href="/admin"><button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Dashboard</button></Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 900, paddingTop: 92, paddingBottom: 60 }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple)', margin: 0 }}>
              &#128101; Gestão de Empregados
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
              {employees.length} empregado{employees.length !== 1 ? 's' : ''} cadastrado{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm((v) => !v); setMsg(''); }}
            style={{ fontSize: '0.82rem' }}>
            {showForm ? '✕ Cancelar' : '+ Novo empregado'}
          </button>
        </div>

        {/* Mensagem de feedback */}
        {msg && (
          <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
            background: msgType === 'success' ? '#d1fae5' : '#fee2e2',
            color: msgType === 'success' ? '#065f46' : '#dc2626',
            border: `1px solid ${msgType === 'success' ? '#6ee7b7' : '#fca5a5'}` }}>
            {msgType === 'success' ? '✓ ' : '⚠ '}{msg}
          </div>
        )}

        {/* Formulário de criação */}
        {showForm && (
          <div className="section-card" style={{ marginBottom: 24, border: '2px solid var(--purple)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 16 }}>
              &#43; Novo Empregado
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome completo *</label>
                <input className="form-input" type="text" value={newName}
                  onChange={(e) => setNewName(e.target.value)} placeholder="Ex: João da Silva" />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail corporativo *</label>
                <input className="form-input" type="email" value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)} placeholder="joao@sebraeto.com.br" />
              </div>
              <div className="form-group">
                <label className="form-label">CPF (será a senha de acesso) *</label>
                <input className="form-input" type="text" value={newCpf}
                  onChange={(e) => setNewCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={handleCreate} disabled={saving} style={{ fontSize: '0.82rem' }}>
                {saving ? 'Salvando...' : '✓ Criar empregado'}
              </button>
              <button className="btn-outline" onClick={() => setShowForm(false)} style={{ fontSize: '0.82rem' }}>
                Cancelar
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
              &#128274; O CPF será usado como senha de acesso do colaborador. Informe o CPF correto.
            </p>
          </div>
        )}

        {/* Busca */}
        <div className="section-card" style={{ marginBottom: 0, padding: '14px 20px' }}>
          <input className="form-input" type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="&#128269; Buscar por nome ou e-mail..." style={{ marginBottom: 0 }} />
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="section-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            {search ? 'Nenhum empregado encontrado para a busca.' : 'Nenhum empregado cadastrado.'}
          </div>
        ) : (
          <div>
            {filtered.map((emp) => (
              <div key={emp.email} className="section-card" style={{ marginTop: 10, padding: '14px 20px' }}>
                {editEmail === emp.email ? (
                  /* Modo edição */
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nome</label>
                        <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">E-mail</label>
                        <input className="form-input" type="email" value={editNewEmail} onChange={(e) => setEditNewEmail(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">CPF (senha)</label>
                        <input className="form-input" value={editCpf} onChange={(e) => setEditCpf(formatCpf(e.target.value))} inputMode="numeric" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={handleEdit} disabled={saving} style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
                        {saving ? 'Salvando...' : '✓ Salvar'}
                      </button>
                      <button className="btn-outline" onClick={() => setEditEmail('')} style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualização */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, border: '2px solid #d8b4fe' }}>
                        &#128100;
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          CPF: {formatCpf(emp.cpf)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setProfileEmail(emp.email)}
                        style={{ background: 'var(--gradient-soft)', border: '1px solid var(--purple)', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 700 }}>
                        📋 Ver ficha
                      </button>
                      <button onClick={() => startEdit(emp)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 600 }}>
                        ✏ Editar
                      </button>
                      <button onClick={() => handleDelete(emp.email, emp.name)}
                        style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                        ✕ Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de ficha completa */}
      {profileEmail && (
        <EmployeeProfileModal email={profileEmail} onClose={() => setProfileEmail(null)} />
      )}
    </>
  );
}
