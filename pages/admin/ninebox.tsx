import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { AreaAssessment, AssessmentCalculation, PostMBADetail, ProjectDetail, ParticipantProfile, DISCRecord } from '../../lib/types';

type AssessmentWithMeta = AreaAssessment & {
  participantName: string;
  technicalScore: number;
  behavioralScore?: number;
  postMBADetail?: PostMBADetail;
  projectsDetail?: ProjectDetail[];
  calculationSteps: AssessmentCalculation[];
  profile: ParticipantProfile;
  discRecord?: DISCRecord;
};

const QUADRANT_DESC: Record<string, string> = {
  'Tecnicamente Baixa — Comportamental Alta':    'Perfil comportamental alto, mas aderência técnica baixa. Tem o perfil certo para a área, mas ainda precisa de capacitação técnica. Pode ser desenvolvido a médio prazo.',
  'Tecnicamente Média — Comportamental Alta':   'Perfil comportamental excelente e aderência técnica em desenvolvimento (média). Tem grande potencial e pode ser preparado rapidamente com capacitação técnica.',
  'Alta Prontidao':              'Candidato com alta aderência técnica E comportamental. Candidato ideal: está pronto para assumir a posição agora ou em curto prazo.',
  'Tecnicamente Alta — Comportamental Alta':              'Candidato com alta aderência técnica E comportamental. Candidato ideal: está pronto para assumir a posição agora ou em curto prazo.',
  'Tecnicamente Baixa — Comportamental Média': 'Técnica e comportamento ambos baixos-médios. Precisa de um plano de desenvolvimento estruturado antes de ser considerado para sucessão.',
  'Tecnicamente Média — Comportamental Média':    'Técnica e comportamento ambos médios. Candidato equilibrado, mas ainda não está pronto. Precisa de desenvolvimento em ambas as dimensões.',
  'Destaque Técnico':            'Aderência técnica alta, mas perfil comportamental médio. Domina o conteúdo, mas precisa desenvolver competências de liderança e comportamento.',
  'Tecnicamente Baixa — Comportamental Baixa':             'Técnica e comportamento ambos baixos. Não há aderência significativa à área neste momento. Não é recomendado para sucessão sem um plano de desenvolvimento profundo.',
  'Tecnicamente Média — Comportamental Baixa':  'Técnica média, mas comportamento baixo para a área. Conhece o trabalho, mas o perfil DISC não se alinha ao cargo. Pode ser um bom especialista, mas não necessariamente um bom gestor nessa área.',
  'Tecnicamente Alta — Comportamental Baixa':          'Técnica alta, mas comportamento baixo. O candidato tem o conhecimento técnico, mas o perfil comportamental pode gerar conflitos ou dificuldades na gestão.',
};

const GRID_CELLS: { x: string; y: string; label: string; color: string; bg: string }[] = [
  { x: 'low',  y: 'high', label: 'Tecnicamente Baixa — Comportamental Alta',    color: '#0369a1', bg: '#e0f2fe' },
  { x: 'mid',  y: 'high', label: 'Tecnicamente Média — Comportamental Alta',   color: '#7c3aed', bg: '#ede9fe' },
  { x: 'high', y: 'high', label: 'Alta Prontidao',              color: '#15803d', bg: '#dcfce7' },
  { x: 'low',  y: 'mid',  label: 'Tecnicamente Baixa — Comportamental Média', color: '#92400e', bg: '#fef3c7' },
  { x: 'mid',  y: 'mid',  label: 'Tecnicamente Média — Comportamental Média',    color: '#5B2D8E', bg: '#f3e8ff' },
  { x: 'high', y: 'mid',  label: 'Destaque Técnico',            color: '#0f766e', bg: '#ccfbf1' },
  { x: 'low',  y: 'low',  label: 'Tecnicamente Baixa — Comportamental Baixa',             color: '#9f1239', bg: '#ffe4e6' },
  { x: 'mid',  y: 'low',  label: 'Tecnicamente Média — Comportamental Baixa',  color: '#c2410c', bg: '#ffedd5' },
  { x: 'high', y: 'low',  label: 'Tecnicamente Alta — Comportamental Baixa',          color: '#b45309', bg: '#fef9c3' },
];

function getCell(quadrantLabel: string) {
  const map: Record<string, { x: string; y: string }> = {
    'Tecnicamente Baixa — Comportamental Baixa': { x: 'low', y: 'low' },
    'Especialista Técnico sem Perfil de Liderança': { x: 'mid', y: 'low' },
    'Tecnicamente Média — Comportamental Baixa': { x: 'mid', y: 'low' },
    'Tecnicamente Alta — Comportamental Baixa': { x: 'high', y: 'low' },
    'Tecnicamente Baixa — Comportamental Média': { x: 'low', y: 'mid' },
    'Tecnicamente Média — Comportamental Média': { x: 'mid', y: 'mid' },
    'Tecnicamente Alta — Comportamental Média': { x: 'high', y: 'mid' },
    'Destaque Técnico': { x: 'high', y: 'mid' },
    'Potencial de Curto Prazo (gap técnico)': { x: 'low', y: 'high' },
    'Tecnicamente Baixa — Comportamental Alta': { x: 'low', y: 'high' },
    'Tecnicamente Média — Comportamental Alta': { x: 'mid', y: 'high' },
    'Tecnicamente Alta — Comportamental Alta': { x: 'high', y: 'high' },
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

function AuditSection({ profile, area }: { profile: ParticipantProfile; area: string }) {
  const [open, setOpen] = useState(false);

  const proofLabel = (mode: 'ugp-knows' | 'upload' | undefined) =>
    mode === 'ugp-knows' ? 'A UGP já tem conhecimento' : mode === 'upload' ? 'Documento enviado' : '—';

  return (
    <div style={{ marginTop: 20, border: '2px solid #e5e7eb', borderRadius: 10 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: open ? '#f8f7fc' : '#fafafa', border: 'none', borderRadius: open ? '10px 10px 0 0' : 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>
          🔍 Auditoria — Dados declarados pelo participante
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {open ? '▲ Ocultar' : '▼ Expandir para auditar'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '16px 18px', borderTop: '1px solid #e5e7eb' }}>

          {/* Identificação */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>
              Identificação
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                {[
                  ['Nome completo', profile.name],
                  ['E-mail', profile.email],
                  ['Matrícula', profile.matrícula || '—'],
                  ['Unidade atual', profile.unit || '—'],
                  ['Cargo atual', profile.currentRole || '—'],
                  ['Área atual', profile.currentArea || '—'],
                  ['Áreas de interesse', profile.selectedAreas.join(', ')],
                  ['Enviado em', profile.submittedAt ? new Date(profile.submittedAt).toLocaleString('pt-BR') : '—'],
                  ['Status de validação', profile.validationStatus === 'validated' ? 'Validado pelo RH' : profile.validationStatus === 'adjusted' ? 'Ajustado' : 'Provisório'],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', width: '35%', whiteSpace: 'nowrap' }}>{label}</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formação */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>
              Formação Acadêmica
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', width: '35%' }}>Graduação 1</td>
                  <td style={{ padding: '5px 0', color: '#111827' }}>{profile.graduation || '—'}</td>
                </tr>
                {profile.graduation2 && (
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Graduação 2</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{profile.graduation2}</td>
                  </tr>
                )}
                {profile.graduationCourseName && (
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Curso (nome livre)</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{profile.graduationCourseName}</td>
                  </tr>
                )}
                {profile.postMBAs.length > 0 ? (
                  profile.postMBAs.map((title, i) => (
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
                {profile.certifications.length > 0 && (
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', verticalAlign: 'top' }}>Certificações</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{profile.certifications.join(', ')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cursos extracurriculares */}
          {profile.selectedCourses.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>
                Cursos Extracurriculares <span style={{ fontWeight: 400, color: '#9ca3af' }}>(não entram na nota)</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Curso</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Horas</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Comprovação</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.selectedCourses.map((course, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px', color: '#111827' }}>{course}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#374151' }}>{profile.courseHours?.[course] ?? '—'}h</td>
                      <td style={{ padding: '5px 8px', color: '#374151' }}>{proofLabel(profile.proofMode?.[course])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Experiência gerencial */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>
              Experiência Gerencial / Interina <span style={{ fontWeight: 400, color: '#9ca3af' }}>(entra no cálculo)</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', width: '35%' }}>Meses gerencial efetivo</td>
                  <td style={{ padding: '5px 0', color: '#111827' }}>{profile.managerialMonths ?? 0} meses ({((profile.managerialMonths ?? 0) / 12).toFixed(1)} anos)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Meses interino</td>
                  <td style={{ padding: '5px 0', color: '#111827' }}>{profile.interimMonths ?? 0} meses ({((profile.interimMonths ?? 0) / 12).toFixed(1)} anos)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280' }}>Total combinado</td>
                  <td style={{ padding: '5px 0', color: '#111827', fontWeight: 700 }}>
                    {(profile.managerialMonths ?? 0) + (profile.interimMonths ?? 0)} meses
                  </td>
                </tr>
                {profile.positionsHeld.length > 0 && (
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600, color: '#6b7280', verticalAlign: 'top' }}>Cargos exercidos</td>
                    <td style={{ padding: '5px 0', color: '#111827' }}>{profile.positionsHeld.join(', ')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Projetos estratégicos */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>
              Projetos Estratégicos Selecionados <span style={{ fontWeight: 400, color: '#9ca3af' }}>(entram no cálculo)</span>
            </div>
            {profile.selectedProjects.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Projeto</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '0.72rem' }}>Área vinculada</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.selectedProjects.map((proj, i) => {
                    const projArea = profile.projectAreaMap?.[proj];
                    const isForThisArea = projArea === area;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: isForThisArea ? '#f0fdf4' : 'white' }}>
                        <td style={{ padding: '5px 8px', color: '#111827' }}>
                          {proj}
                          {isForThisArea && (
                            <span style={{ marginLeft: 8, fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                              esta área
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#374151' }}>{projArea || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Nenhum projeto selecionado.</p>
            )}
          </div>

          {/* Exceções */}
          {profile.exceptionRequested && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, borderBottom: '1px solid #fde68a', paddingBottom: 6 }}>
                Exceções / Questionamentos
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: '0.78rem', color: '#92400e', marginBottom: 4 }}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    background: profile.exceptionStatus === 'approved' ? '#dcfce7' : profile.exceptionStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color: profile.exceptionStatus === 'approved' ? '#15803d' : profile.exceptionStatus === 'rejected' ? '#b91c1c' : '#92400e',
                    borderRadius: 4, padding: '1px 8px', fontWeight: 700, fontSize: '0.75rem',
                  }}>
                    {profile.exceptionStatus === 'approved' ? 'Aprovada' : profile.exceptionStatus === 'rejected' ? 'Rejeitada' : 'Pendente'}
                  </span>
                </div>
                {profile.exceptionJustification && (
                  <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: 6 }}>
                    <strong>Justificativa geral:</strong> {profile.exceptionJustification}
                  </div>
                )}
              </div>
              {profile.exceptionItems && profile.exceptionItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {profile.exceptionItems.map((item, i) => (
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
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '4px 8px 4px 0', fontWeight: 600, color: '#6b7280', width: '30%' }}>Item questionado</td>
                            <td style={{ padding: '4px 0', color: '#111827' }}>{item.itemName}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '4px 8px 4px 0', fontWeight: 600, color: '#6b7280' }}>Objetivo</td>
                            <td style={{ padding: '4px 0', color: '#111827' }}>{item.objective}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px 4px 0', fontWeight: 600, color: '#6b7280', verticalAlign: 'top' }}>Justificativa</td>
                            <td style={{ padding: '4px 0', color: '#111827', lineHeight: 1.5 }}>{item.justification}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nota de validação do admin */}
          {profile.validationNote && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem' }}>
              <strong style={{ color: '#0369a1' }}>Nota do RH/Admin:</strong>{' '}
              <span style={{ color: '#0c4a6e' }}>{profile.validationNote}</span>
              {profile.validatedAt && (
                <span style={{ marginLeft: 8, color: '#64748b', fontSize: '0.72rem' }}>
                  ({new Date(profile.validatedAt).toLocaleDateString('pt-BR')})
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiscDetailSection({ disc }: { disc: DISCRecord }) {
  const barStyle = (val: number, color: string) => ({
    height: 10, borderRadius: 5, background: '#e5e7eb', overflow: 'hidden' as const, marginTop: 4,
  });
  const fillStyle = (val: number, color: string) => ({
    height: '100%', width: `${Math.min(val, 100)}%`, background: color, borderRadius: 5, transition: 'width 0.4s',
  });
  const Row = ({ label, person, job }: { label: string; person: number; job: number }) => (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
      <td style={{ padding: '6px 8px 6px 0', fontWeight: 600, color: '#6b7280', fontSize: '0.78rem', width: '28%' }}>{label}</td>
      <td style={{ padding: '6px 8px', width: '36%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#374151' }}>
          <span>Pessoa</span><strong>{person}</strong>
        </div>
        <div style={barStyle(person, '#6366f1')}><div style={fillStyle(person, '#6366f1')} /></div>
      </td>
      <td style={{ padding: '6px 0', width: '36%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#374151' }}>
          <span>Cargo</span><strong>{job}</strong>
        </div>
        <div style={barStyle(job, '#0e7490')}><div style={fillStyle(job, '#0e7490')} /></div>
      </td>
    </tr>
  );
  return (
    <div style={{ marginTop: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, borderBottom: '1px solid #bae6fd', paddingBottom: 8 }}>
        🔷 Detalhamento DISC — Correlação: <strong style={{ fontSize: '0.88rem' }}>{disc.correlationPct}%</strong>
        <span style={{ marginLeft: 12, fontWeight: 400, color: '#64748b', fontSize: '0.7rem' }}>Importado em {disc.importedAt}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
        <thead>
          <tr style={{ background: '#e0f2fe' }}>
            <th style={{ padding: '5px 8px 5px 0', textAlign: 'left', fontSize: '0.72rem', color: '#0369a1', fontWeight: 700 }}>Fator</th>
            <th style={{ padding: '5px 8px', textAlign: 'left', fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }}>Perfil Pessoa</th>
            <th style={{ padding: '5px 0', textAlign: 'left', fontSize: '0.72rem', color: '#0e7490', fontWeight: 700 }}>Perfil Cargo</th>
          </tr>
        </thead>
        <tbody>
          <Row label="D — Dominância" person={disc.personD} job={disc.jobD} />
          <Row label="I — Influência" person={disc.personI} job={disc.jobI} />
          <Row label="S — eStabilidade" person={disc.personS} job={disc.jobS} />
          <Row label="C — Conformidade" person={disc.personC} job={disc.jobC} />
        </tbody>
      </table>
      {disc.strengths && disc.strengths.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', marginBottom: 4 }}>✅ Características que se Destacam</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {disc.strengths.map((s, i) => (
              <span key={i} style={{ background: '#dcfce7', color: '#15803d', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {disc.developments && disc.developments.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', marginBottom: 4 }}>⚠ Pontos de Desenvolvimento</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {disc.developments.map((d, i) => (
              <span key={i} style={{ background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem' }}>{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantModal({ p, onClose }: { p: AssessmentWithMeta; onClose: () => void }) {
  const techScore: number = p.technicalScore ?? 0;
  const behavScore: number | undefined = p.behavioralScore;

  const perfRaw = p.calculationSteps?.find((s) => s.name.includes('Performance'))?.value;
  const discRaw = p.calculationSteps?.find((s) => s.name.includes('DISC'))?.value;
  const expDetail = p.calculationSteps?.find((s) => s.name.includes('Experi'))?.detail;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 720, width: '100%',
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Detalhamento de Pontuação</div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--purple)', fontWeight: 800 }}>{p.participantName}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Área: <strong>{p.area}</strong> &nbsp;|&nbsp; Quadrante: <strong>{p.quadrant}</strong>
              {p.profile?.validationStatus === 'validated' && (
                <span style={{ marginLeft: 10, background: '#dcfce7', color: '#15803d', borderRadius: 4, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>✓ Validado</span>
              )}
              {p.profile?.validationStatus === 'provisional' && (
                <span style={{ marginLeft: 10, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>⚠ Provisório</span>
              )}
            </div>
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
                { label: 'Todos os títulos declarados', value: p.profile?.postMBAs?.join(', ') || 'Nenhum' },
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
                { label: 'Meses gerencial efetivo', value: `${p.profile?.managerialMonths ?? 0} meses` },
                { label: 'Meses interino', value: `${p.profile?.interimMonths ?? 0} meses` },
                { label: 'Total combinado', value: `${(p.profile?.managerialMonths ?? 0) + (p.profile?.interimMonths ?? 0)} meses` },
                { label: 'Cargos exercidos', value: p.profile?.positionsHeld?.join(', ') || 'Nenhum informado' },
                { label: 'Fórmula', value: '5 pts por ano, máx. 20 pts' },
                { label: 'Cálculo', value: expDetail || 'Sem dados' },
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
                  : [{ label: 'Projetos desta área', value: 'Nenhum' }]),
                { label: 'Todos os projetos declarados', value: p.profile?.selectedProjects?.join(', ') || 'Nenhum' },
                { label: 'Regra', value: 'Estruturante = 20 pts | Relevante = 15 pts | Máx. 20 pts por área' },
              ]}
            />
            <div style={{ marginTop: 10, background: '#f0f4ff', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', border: '1px solid #c7d2fe' }}>
              <span style={{ color: '#4338ca', fontWeight: 600 }}>Total bruto (0–80) → convertido para escala 0–10</span>
              <span style={{ fontWeight: 800, color: 'var(--purple)' }}>
                {(() => {
                  const raw = Number(p.calculationSteps?.find((s) => s.name.toLowerCase().includes('bruto') || s.name.toLowerCase().includes('total'))?.value ?? 0);
                  return `${raw} pts → ${techScore.toFixed(1)}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Aderência Comportamental — detalhamento */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0e7490' }}>🧠 Detalhamento Comportamental</h3>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0e7490' }}>
              {behavScore !== undefined ? behavScore.toFixed(1) : '—'}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}> / 10</span>
            </span>
          </div>
          {behavScore !== undefined && <ScoreBar value={behavScore} max={10} color="#0e7490" />}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>📈 Performance (Engajamento)</span>
                <span style={{ fontWeight: 800, color: '#0e7490', fontSize: '0.9rem' }}>
                  {perfRaw !== undefined ? `${Number(perfRaw).toFixed(1)} / 10` : '—'}
                </span>
              </div>
              {perfRaw !== undefined && <ScoreBar value={Number(perfRaw)} max={10} color="#0e7490" />}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>Score de engajamento (0–100) convertido para escala 0–10</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>🔷 Perfil DISC</span>
                <span style={{ fontWeight: 800, color: '#0e7490', fontSize: '0.9rem' }}>
                  {discRaw !== undefined ? `${Number(discRaw).toFixed(1)} / 10` : '—'}
                </span>
              </div>
              {discRaw !== undefined && <ScoreBar value={Number(discRaw)} max={10} color="#0e7490" />}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>Nota DISC fornecida pelo RH (escala 0–10)</div>
            </div>
            {behavScore !== undefined && (
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#0f766e', fontWeight: 600 }}>Fórmula: (Performance + DISC) ÷ 2</span>
                <span style={{ fontWeight: 800, color: '#0e7490' }}>{behavScore.toFixed(1)} / 10</span>
              </div>
            )}
          </div>
          {/* Detalhamento completo do DISC importado */}
          {p.discRecord ? (
            <DiscDetailSection disc={p.discRecord} />
          ) : (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              Nenhum dado DISC importado para esta área
            </div>
          )}
        </div>

        {/* Exceções aplicadas */}
        {p.exceptions && p.exceptions.length > 0 && (
          <div style={{ marginTop: 16, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠ Exceções aplicadas no cálculo</div>
            {p.exceptions.map((ex, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: 2 }}>• {ex}</div>
            ))}
          </div>
        )}

        {/* Seção de auditoria completa */}
        {p.profile && <AuditSection profile={p.profile} area={p.area} />}
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
                <span style={{ color: 'var(--purple)', fontWeight: 600 }}>Clique em um participante para ver detalhamento e auditoria completa</span>
              </p>
            </div>
          </div>

          {/* Seletor de área */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {OFFICIAL_AREAS.map((area) => (
              <button key={area.code} type="button"
                onClick={() => setSelectedArea(area.code)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  fontWeight: selectedArea === area.code ? 700 : 400,
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
                  <div style={{ display: 'flex', marginBottom: 4, marginLeft: 60 }}>
                    {['Baixo (0-3)', 'Médio (4-6)', 'Alto (7-10)'].map((l) => (
                      <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{l}</div>
                    ))}
                  </div>
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
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cellDef.color, marginBottom: 8, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{cellDef.label}</span>
                              {QUADRANT_DESC[cellDef.label] && (
                                <span
                                  title={QUADRANT_DESC[cellDef.label]}
                                  style={{ cursor: 'help', fontSize: '0.75rem', opacity: 0.65, flexShrink: 0 }}
                                >👁️</span>
                              )}
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
                                    title="Clique para ver detalhamento e auditoria completa"
                                    style={{
                                      background: 'white', borderRadius: 6, padding: '5px 8px',
                                      fontSize: '0.75rem', color: cellDef.color, fontWeight: 600,
                                      border: `1px solid ${cellDef.color}40`,
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
                                      cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
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
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--purple)', fontWeight: 700 }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaData
                        .sort((a, b) => (b.technicalScore + (b.behavioralScore ?? 0)) - (a.technicalScore + (a.behavioralScore ?? 0)))
                        .map((a, i) => (
                          <tr key={`${a.participantId}-${a.area}`} style={{ background: i % 2 === 0 ? 'white' : 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                              {a.participantName || a.participantId}
                              {a.profile?.exceptionRequested && (
                                <span style={{ marginLeft: 6, fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px' }}>
                                  {a.profile.exceptionStatus === 'approved' ? '✓ Exceção aprovada' : a.profile.exceptionStatus === 'rejected' ? '✗ Exceção rejeitada' : '⚠ Exceção pendente'}
                                </span>
                              )}
                            </td>
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
                              <span style={{
                                fontSize: '0.7rem', borderRadius: 4, padding: '2px 8px', fontWeight: 700,
                                background: a.profile?.validationStatus === 'validated' ? '#dcfce7' : '#fef3c7',
                                color: a.profile?.validationStatus === 'validated' ? '#15803d' : '#92400e',
                              }}>
                                {a.profile?.validationStatus === 'validated' ? 'Validado' : 'Provisório'}
                              </span>
                            </td>
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
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 16 }}>Como o Nine Box é calculado?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--purple)', fontSize: '0.88rem', marginBottom: 10 }}>Eixo X — Aderência Técnica (0 a 10 pts)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}><span>Pós-graduação / MBA</span><strong style={{ color: 'var(--purple)' }}>até 40 pts</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 4 }}><span>Experiência gerencial/interina</span><strong style={{ color: 'var(--purple)' }}>até 20 pts</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Projetos estratégicos da área</span><strong style={{ color: 'var(--purple)' }}>até 20 pts</strong></div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total bruto 0–80 convertido para 0–10.</div>
                </div>
              </div>
              <div style={{ background: '#f0fdfa', borderRadius: 'var(--radius-sm)', padding: '16px 20px', border: '1px solid #99f6e4' }}>
                <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '0.88rem', marginBottom: 10 }}>Eixo Y — Aderência Comportamental (0 a 10 pts)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #99f6e4', paddingBottom: 4, marginBottom: 4 }}><span>Performance / Engajamento (0–100 → 0–10)</span><strong style={{ color: '#0f766e' }}>50%</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Perfil DISC (0–10)</span><strong style={{ color: '#0f766e' }}>50%</strong></div>
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
