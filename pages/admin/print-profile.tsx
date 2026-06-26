import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import type { ParticipantProfile } from '../../lib/types';
import { CATALOG_ITEMS } from '../../lib/constants';

interface AreaAssessmentResult {
  area: string;
  technicalAdherence: number;
  behavioralAdherence?: number;
  quadrant: string;
  calculationSteps: { name: string; value: number | string; detail?: string }[];
  projectsDetail?: { label: string; points: number }[];
  discRecord?: {
    correlationPct: number;
    personD: number; personI: number; personS: number; personC: number;
    jobD: number; jobI: number; jobS: number; jobC: number;
    strengths: string[]; developments: string[];
  } | null;
}

interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

interface ProfileAuditData {
  itemValidations: ItemValidation[];
  overallStatus: 'provisional' | 'validated' | 'adjusted';
  overallNote?: string;
}

interface ProfileData {
  profile: ParticipantProfile;
  areaAssessments: AreaAssessmentResult[];
  audit?: ProfileAuditData;
}

const AREA_LABELS: Record<string, string> = {
  UAUD: 'Unidade de Auditoria Interna',
  UGE: 'Unidade de Gestão Estratégica',
  UGOC: 'Unidade de Governança e Conformidade',
  UGPD: 'Unidade de Gestão de Pessoas e Desenvolvimento',
  UADM: 'Unidade Administrativa',
  UCONT: 'Unidade de Contabilidade e Controladoria',
  UGTI: 'Unidade de Gestão de TI',
  UCAC: 'Unidade de Canais e Atendimento ao Cliente',
  UGCOM: 'Unidade de Comunicação',
  UJUR: 'Unidade Jurídica',
  UGFIN: 'Unidade de Gestão Financeira',
  UGRE: 'Unidade de Gestão Regional',
};

export default function PrintProfile() {
  const router = useRouter();
  const { email } = router.query;
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || typeof email !== 'string') return;
    fetch(`/api/admin/employee-profile?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(() => setError('Erro ao carregar dados.'));
  }, [email]);

  if (error) return <div style={{ padding: 40, color: '#dc2626' }}>Erro: {error}</div>;
  if (!data) return <div id="loading" style={{ padding: 40, color: '#6b7280' }}>Carregando...</div>;

  const p = data.profile;
  const areas = data.areaAssessments || [];
  const audit = data.audit;
  const overallStatus = audit?.overallStatus || p.validationStatus || 'provisional';
  const itemValidations = audit?.itemValidations || [];
  const getAuditV = (key: string) => itemValidations.find((v) => v.itemKey === key);

  function ValidationBadge({ itemKey }: { itemKey: string }) {
    const v = getAuditV(itemKey);
    if (!v) return (
      <div style={{ fontSize: 10, color: '#92400e', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 4, padding: '3px 8px' }}>
        ⏳ Aguardando validação do administrador
      </div>
    );
    if (v.status === 'approved') return (
      <div style={{ fontSize: 10, color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 4, padding: '3px 8px' }}>
        ✅ Validado pelo administrador{v.note ? <span style={{ color: '#374151' }}> — <strong>Obs:</strong> {v.note}</span> : ''}
      </div>
    );
    if (v.status === 'rejected') return (
      <div style={{ fontSize: 10, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '3px 8px' }}>
        ❌ <strong>Rejeitado — pontuação deste item excluída do cálculo final</strong>{v.note ? <span> — <strong>Motivo:</strong> {v.note}</span> : ''}
      </div>
    );
    return (
      <div style={{ fontSize: 10, color: '#92400e', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 4, padding: '3px 8px' }}>
        ⏳ Aguardando validação do administrador
      </div>
    );
  }

  const allMBAs = p.postMBAs || [];
  const allProjects = p.selectedProjects || [];
  const allCourses = p.selectedCourses || [];
  const allFreeCourses = ((p as any).freeCourses || []).filter((c: any) => c?.name?.trim() && c?.area && (c?.hours || 0) >= 16);

  // Helper: status do comprovante de um item
  function proofStatus(key: string): string {
    const mode = (p as any).proofMode?.[key];
    if (mode === 'ugp-knows') return '📁 UGP possui o documento';
    if (mode === 'upload') return '📎 Comprovante enviado pelo candidato';
    return '⚠️ Sem comprovante informado';
  }
  const totalMonths = (p.managerialMonths ?? 0) + (p.interimMonths ?? 0);
  const expPts = Math.min(20, Math.floor((totalMonths / 12) * 5 * 10) / 10);
  const expAuditV = getAuditV('experiencia-gerencial');
  const expRejected = expAuditV?.status === 'rejected';

  const mbaAnalysis = allMBAs.map((title, idx) => {
    const auditV = getAuditV(`postmba-${idx}`);
    // Chave do proofMode para este MBA
    const mbaBlock = ((p as any).mbaBlocks || [])[idx];
    const mbaKey = `mba_${idx}:${mbaBlock?.name?.trim() || title}`;
    const proof = proofStatus(mbaKey);
    if (auditV?.status === 'rejected') {
      return { title, status: 'rejeitado' as const, reason: `Comprovante rejeitado pelo auditor${auditV.note ? ` — ${auditV.note}` : ''}`, pts: 0, proof };
    }
    const matches = CATALOG_ITEMS.filter((i) => i.group === 'postMBA' && i.label === title);
    if (matches.length === 0) {
      return { title, status: 'nao-pontua' as const, reason: 'Título não encontrado no catálogo oficial — recebe pontuação mínima de 20 pts por possuir pós-graduação', pts: 20, proof };
    }
    const best = matches.reduce((a, b) => (b.points > a.points ? b : a));
    const cls = (best as any).classification === 'transversal'
      ? 'Título transversal — válido para qualquer área de interesse — pontuação máxima de 40 pts'
      : `Título específico para ${(best as any).area || 'área(s) específica(s)'} — 20 pts`;
    return { title, status: 'pontua' as const, reason: cls, pts: best.points, proof };
  });

  const projAnalysis = allProjects.map((proj, idx) => {
    const auditV = getAuditV(`projeto-${idx}`);
    const projKey = `proj:${proj}`;
    const proof = proofStatus(projKey);
    if (auditV?.status === 'rejected') {
      return { proj, status: 'rejeitado' as const, reason: `Comprovante rejeitado pelo auditor${auditV.note ? ` — ${auditV.note}` : ''}`, pts: 0, area: '', proof };
    }
    const assignedArea = (p.projectAreaMap || {})[proj];
    if (!assignedArea) {
      // Verifica se existe no catálogo para alguma das áreas do candidato
      const catalogMatch = CATALOG_ITEMS.find((i) => i.group === 'project' && i.label === proj && (p.selectedAreas || []).includes((i.area || '') as any));
      if (catalogMatch) {
        return { proj, status: 'nao-pontua' as const, reason: `Projeto reconhecido no catálogo para a área ${catalogMatch.area}, mas ainda não vinculado pelo administrador durante a auditoria`, pts: 0, area: '', proof };
      }
      const catalogAny = CATALOG_ITEMS.find((i) => i.group === 'project' && i.label === proj);
      if (catalogAny) {
        return { proj, status: 'nao-pontua' as const, reason: `Projeto reconhecido no catálogo para a área ${catalogAny.area}, que não está entre as áreas de interesse do candidato — não pontua`, pts: 0, area: catalogAny.area || '', proof };
      }
      return { proj, status: 'nao-pontua' as const, reason: 'Projeto não encontrado no catálogo oficial de projetos estratégicos — não pontua', pts: 0, area: '', proof };
    }
    const match = CATALOG_ITEMS.find((i) => i.group === 'project' && i.label === proj && i.area === assignedArea);
    if (!match) {
      return { proj, status: 'nao-pontua' as const, reason: `Projeto não reconhecido no catálogo oficial para a área ${assignedArea} — não pontua`, pts: 0, area: assignedArea, proof };
    }
    const tipo = (match as any).classification === 'area-specific' && match.points >= 20 ? 'Estratégico Central' : 'Complementar';
    return { proj, status: 'pontua' as const, reason: `Área ${assignedArea} — ${tipo} — ${match.points} pts conforme catálogo oficial`, pts: match.points, area: assignedArea, proof };
  });

  const hasRejections = mbaAnalysis.some((m) => m.status === 'rejeitado') || projAnalysis.some((m) => m.status === 'rejeitado') || expRejected;
  const hasAudit = itemValidations.length > 0;

  const auditedScoreByArea = (p.selectedAreas || []).map((area) => {
    const validMBATitles = mbaAnalysis.filter((m) => m.status !== 'rejeitado').map((m) => m.title);
    const mbaMatchesForArea = CATALOG_ITEMS.filter((i) => i.group === 'postMBA' && validMBATitles.includes(i.label) && (!i.area || i.area === area));
    let auditedMBAPts = mbaMatchesForArea.length === 0 ? (validMBATitles.length > 0 ? 20 : 0) : mbaMatchesForArea.reduce((a, b) => (b.points > a.points ? b : a)).points;
    const validProjPts = projAnalysis.filter((m) => m.status === 'pontua' && m.area === area).reduce((acc, m) => acc + m.pts, 0);
    const auditedProjPts = Math.min(20, validProjPts);
    const auditedExpPts = expRejected ? 0 : Math.min(20, Math.floor((totalMonths / 12) * 5 * 10) / 10);
    const auditedTotal80 = auditedMBAPts + auditedExpPts + auditedProjPts;
    const auditedScore10 = Math.round((auditedTotal80 / 80) * 100) / 10;
    const origAssessment = areas.find((a) => a.area === area);
    return { area, auditedScore10, declaredScore: origAssessment?.technicalAdherence ?? null };
  });

  const statusLabel = overallStatus === 'validated' ? 'Validada' : overallStatus === 'adjusted' ? 'Ajustada' : 'Provisória';
  const statusBg = overallStatus === 'validated' ? '#dcfce7' : overallStatus === 'adjusted' ? '#fef3c7' : '#fff7ed';
  const statusColor = overallStatus === 'validated' ? '#15803d' : overallStatus === 'adjusted' ? '#d97706' : '#92400e';

  return (
    <>
      <Head>
        <title>Análise — {p.name}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #111827; font-size: 13px; }
          .page { max-width: 900px; margin: 0 auto; padding: 32px 36px; }
          .section { margin-bottom: 22px; }
          .section-title { font-size: 12px; font-weight: 800; color: #5B2D8E; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }
          .row-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; gap: 8px; }
          .row-item .label { font-size: 12px; font-weight: 700; color: #1e293b; }
          .row-item .reason { font-size: 11px; margin-top: 2px; }
          .row-item .pts { font-size: 13px; font-weight: 800; flex-shrink: 0; }
          .area-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }
          .area-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px; }
          .score-badge { border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: 800; }
          .score-bar-wrap { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
          .score-bar-fill { height: 100%; border-radius: 3px; }
          .step-row { border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px; }
          .step-name { display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 2px 0; }
          .step-detail { font-size: 10.5px; color: #64748b; padding-left: 8px; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td, th { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
          th { background: #f9fafb; font-weight: 600; color: #6b7280; font-size: 11px; text-align: left; }
          .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1e293b; color: white; padding: 10px 24px; display: flex; align-items: center; gap: 12px; z-index: 9999; font-size: 13px; }
          .print-bar button { background: #5B2D8E; color: white; border: none; border-radius: 6px; padding: 7px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .print-bar button:hover { background: #4c1d95; }
          .page { margin-top: 52px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-bar { display: none !important; }
            .page { margin-top: 0; }
          }
        `}</style>
      </Head>
      <div className="print-bar no-print">
        <span style={{ flex: 1 }}>📄 Para salvar como PDF: clique em <strong>Imprimir / Salvar como PDF</strong> → escolha <strong>"Salvar como PDF"</strong> como destino</span>
        <button onClick={() => window.print()}>🖨️ Imprimir / Salvar como PDF</button>
        <button onClick={() => window.close()} style={{ background: '#475569' }}>✕ Fechar</button>
      </div>
      <div className="page" id="print-content">

        {/* ── Banner ANÁLISE PROVISÓRIA ── */}
        <div style={{ background: '#fff7ed', border: '2px solid #f97316', borderRadius: 8, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#c2410c' }}>ANÁLISE PROVISÓRIA</div>
            <div style={{ fontSize: 11, color: '#9a3412', marginTop: 2 }}>Sujeita a revisão após auditoria dos comprovantes pelo administrador.</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <span style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── Cabeçalho do candidato ── */}
        <div style={{ marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Ficha Completa do Candidato</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#5B2D8E', marginBottom: 4 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {p.email} &nbsp;|&nbsp; {p.unit || '—'} &nbsp;|&nbsp; {p.currentRole || '—'}
          </div>
          {p.submittedAt && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Enviado em {new Date(p.submittedAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        {/* ── Aderência por Área ── */}
        {areas.length > 0 && (
          <div className="section">
            <div className="section-title">📊 Aderência por Área de Interesse</div>
            {areas.map((a) => (
              <div key={a.area} className="area-card">
                <div className="area-header">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{a.area}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{AREA_LABELS[a.area] || ''}</div>
                    {a.quadrant && a.quadrant !== 'Dados incompletos para definição do quadrante' && (
                      <span style={{
                        display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: a.technicalAdherence >= 7.5 && (a.behavioralAdherence ?? 0) >= 7.5 ? '#dcfce7' : a.technicalAdherence >= 5 && (a.behavioralAdherence ?? 0) >= 5 ? '#fef3c7' : '#fee2e2',
                        color: a.technicalAdherence >= 7.5 && (a.behavioralAdherence ?? 0) >= 7.5 ? '#15803d' : a.technicalAdherence >= 5 && (a.behavioralAdherence ?? 0) >= 5 ? '#92400e' : '#b91c1c',
                      }}>◉ {a.quadrant}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="score-badge" style={{ background: '#ede9fe', border: '1px solid #5B2D8E', color: '#5B2D8E' }}>
                      Técnica: {a.technicalAdherence.toFixed(1)}
                    </span>
                    {a.behavioralAdherence !== undefined ? (
                      <span className="score-badge" style={{ background: '#f0fdfa', border: '1px solid #0e7490', color: '#0e7490' }}>
                        Comportamental: {a.behavioralAdherence.toFixed(1)}
                      </span>
                    ) : (
                      <span className="score-badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                        Comportamental: —
                      </span>
                    )}
                  </div>
                </div>

                {/* Barras */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>Aderência Técnica</div>
                    <div className="score-bar-wrap"><div className="score-bar-fill" style={{ width: `${Math.min((a.technicalAdherence / 10) * 100, 100)}%`, background: '#5B2D8E' }} /></div>
                  </div>
                  {a.behavioralAdherence !== undefined && (
                    <div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>Aderência Comportamental</div>
                      <div className="score-bar-wrap"><div className="score-bar-fill" style={{ width: `${Math.min((a.behavioralAdherence / 10) * 100, 100)}%`, background: '#0e7490' }} /></div>
                    </div>
                  )}
                </div>

                {/* Steps */}
                {a.calculationSteps?.filter(s => !s.name.toLowerCase().includes('comportamental') && !s.name.toLowerCase().includes('disc') && !s.name.toLowerCase().includes('performance')).map((step, i) => (
                  <div key={i} className="step-row">
                    <div className="step-name">
                      <span>{step.name}</span>
                      <span style={{ fontWeight: 700, color: '#5B2D8E' }}>{typeof step.value === 'number' ? step.value.toFixed(1) : step.value}</span>
                    </div>
                    {step.detail && <div className="step-detail">↳ {step.detail}</div>}
                  </div>
                ))}

                {/* Projetos da área */}
                {a.projectsDetail && a.projectsDetail.length > 0 && (
                  <div style={{ marginTop: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 10px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', marginBottom: 4 }}>Projetos desta área:</div>
                    {a.projectsDetail.map((pr, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#166534' }}>• {pr.label} ({pr.points} pts)</div>
                    ))}
                  </div>
                )}

                {/* DISC */}
                {a.discRecord && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>🔷 DISC — Correlação: {a.discRecord.correlationPct}%</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {[
                        { label: 'D', person: a.discRecord.personD, job: a.discRecord.jobD },
                        { label: 'I', person: a.discRecord.personI, job: a.discRecord.jobI },
                        { label: 'S', person: a.discRecord.personS, job: a.discRecord.jobS },
                        { label: 'C', person: a.discRecord.personC, job: a.discRecord.jobC },
                      ].map(({ label, person, job }) => (
                        <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: 6, padding: '4px 6px', border: '1px solid #e0f2fe' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>{label}</div>
                          <div style={{ fontSize: 10, color: '#6366f1' }}>P: {person}</div>
                          <div style={{ fontSize: 10, color: '#0e7490' }}>C: {job}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Análise Detalhada ── */}
        <div className="section">
          <div className="section-title">🔍 Análise Detalhada de Pontuação</div>

          {/* Nota auditada */}
          {hasAudit && hasRejections && auditedScoreByArea.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚠️ Nota Técnica Recalculada Após Auditoria</div>
              {auditedScoreByArea.map((a) => (
                <div key={a.area} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #fee2e2', fontSize: 12 }}>
                  <span style={{ fontWeight: 700 }}>{a.area}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {a.declaredScore !== null && <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: 11 }}>Declarada: {a.declaredScore.toFixed(1)}</span>}
                    <span style={{ fontWeight: 800, color: a.auditedScore10 < (a.declaredScore ?? 0) ? '#b91c1c' : '#15803d' }}>Auditada: {a.auditedScore10.toFixed(1)}</span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: '#7f1d1d', marginTop: 6 }}>Itens com comprovante rejeitado foram excluídos do cálculo. Esta é a nota que prevalece após auditoria.</div>
            </div>
          )}

          {/* Pós/MBA */}
          {/* Status de validação — Dados e Áreas */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Dados Básicos', key: 'dados-basicos' },
              { label: 'Áreas de Interesse', key: 'areas-interesse' },
            ].map(({ label, key }) => {
              const v = getAuditV(key);
              const color = !v ? '#64748b' : v.status === 'approved' ? '#15803d' : v.status === 'rejected' ? '#dc2626' : '#64748b';
              const bg = !v ? '#f8fafc' : v.status === 'approved' ? '#f0fdf4' : v.status === 'rejected' ? '#fef2f2' : '#f8fafc';
              const border = !v ? '#e2e8f0' : v.status === 'approved' ? '#86efac' : v.status === 'rejected' ? '#fca5a5' : '#e2e8f0';
              const icon = !v ? '⏳' : v.status === 'approved' ? '✅' : '❌';
              const statusText = !v ? 'Aguardando validação' : v.status === 'approved' ? 'Validado' : 'Rejeitado';
              return (
                <div key={key} style={{ fontSize: 10, padding: '4px 10px', background: bg, border: `1px solid ${border}`, borderRadius: 5, color }}>
                  {icon} <strong>{label}:</strong> {statusText}
                  {v?.note && <span style={{ color: '#374151' }}> — <strong>{v.status === 'rejected' ? 'Motivo' : 'Obs'}:</strong> {v.note}</span>}
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pós/MBA (entra no cálculo)</div>
            </div>
            {allMBAs.map((_, i) => (
              <div key={i} style={{ fontSize: 10, color: '#64748b', marginBottom: 4, padding: '3px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <ValidationBadge itemKey={`postmba-${i}`} />
              </div>
            ))}
            {mbaAnalysis.length > 0 ? mbaAnalysis.map((m, i) => {
              const isRej = m.status === 'rejeitado'; const isPon = m.status === 'pontua';
              return (
                <div key={i} className="row-item" style={{ background: isRej ? '#fef2f2' : isPon ? '#f0fdf4' : '#fff7ed', border: `1px solid ${isRej ? '#fca5a5' : isPon ? '#86efac' : '#fed7aa'}` }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{isRej ? '❌' : isPon ? '✅' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div className="label">{m.title}</div>
                    <div className="reason" style={{ color: isRej ? '#b91c1c' : isPon ? '#15803d' : '#92400e' }}>{m.reason}</div>
                    {(m as any).proof && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{(m as any).proof}</div>}
                  </div>
                  <span className="pts" style={{ color: isRej ? '#b91c1c' : isPon ? '#15803d' : '#92400e' }}>{m.pts} pts</span>
                </div>
              );
            }) : <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '6px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>❌ Nenhum título informado — 0 pts</div>}
          </div>

          {/* Experiência */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Experiência Gerencial / Interina (entra no cálculo)</div>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, padding: '3px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <ValidationBadge itemKey="experiencia-gerencial" />
            </div>
            <div className="row-item" style={{ background: expRejected ? '#fef2f2' : expPts > 0 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${expRejected ? '#fca5a5' : expPts > 0 ? '#86efac' : '#e2e8f0'}` }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{expRejected ? '❌' : expPts > 0 ? '✅' : '❌'}</span>
              <div style={{ flex: 1 }}>
                <div className="label">Gerencial: {p.managerialMonths ?? 0}m + Interino: {p.interimMonths ?? 0}m = {totalMonths}m totais</div>
                <div className="reason" style={{ color: expRejected ? '#b91c1c' : '#64748b' }}>
                  {expRejected ? `Experiência rejeitada pelo auditor` : totalMonths > 0 ? `${(totalMonths / 12).toFixed(1)} anos × 5 pts/ano = ${expPts} pts (máx. 20 pts)` : 'Nenhuma experiência informada — 0 pts'}
                </div>
              </div>
              <span className="pts" style={{ color: expRejected ? '#b91c1c' : expPts > 0 ? '#15803d' : '#94a3b8' }}>{expPts} pts</span>
            </div>
          </div>

          {/* Projetos */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Projetos Estratégicos (entram no cálculo — máx. 20 pts por área)</div>
            {allProjects.map((_, i) => (
              <div key={i} style={{ fontSize: 10, color: '#64748b', marginBottom: 4, padding: '3px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <ValidationBadge itemKey={`projeto-${i}`} />
              </div>
            ))}
            {projAnalysis.length > 0 ? projAnalysis.map((m, i) => {
              const isRej = m.status === 'rejeitado'; const isPon = m.status === 'pontua';
              return (
                <div key={i} className="row-item" style={{ background: isRej ? '#fef2f2' : isPon ? '#f0fdf4' : '#fff7ed', border: `1px solid ${isRej ? '#fca5a5' : isPon ? '#86efac' : '#fed7aa'}` }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{isRej ? '❌' : isPon ? '✅' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div className="label">{m.proj}</div>
                    <div className="reason" style={{ color: isRej ? '#b91c1c' : isPon ? '#15803d' : '#92400e' }}>{m.reason}</div>
                    {(m as any).proof && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{(m as any).proof}</div>}
                  </div>
                  <span className="pts" style={{ color: isRej ? '#b91c1c' : isPon ? '#15803d' : '#92400e' }}>{m.pts} pts</span>
                </div>
              );
            }) : <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '6px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>❌ Nenhum projeto informado — 0 pts</div>}
          </div>

          {/* Cursos Livres */}
          {allFreeCourses.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cursos Livres (registrados — não entram na nota)</div>
              {allFreeCourses.map((c: any, i: number) => (
                <div key={i}>
                  <div className="row-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>📋</span>
                    <div style={{ flex: 1 }}>
                      <div className="label">{c.name} ({c.hours}h — {c.area})</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{proofStatus(`curso5_${i}:${c.name}`)}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}><ValidationBadge itemKey={`curso-free-${i}`} /></div>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>Não pontua</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Graduação */}
          {(p.graduation || p.graduation2 || p.graduationCourseName) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Graduação (registrada — não entra na nota)</div>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, padding: '3px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <ValidationBadge itemKey="graduacao" />
              </div>
              {[p.graduation, p.graduation2, p.graduationCourseName].filter(Boolean).map((g, i) => (
                <div key={i} className="row-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>📋</span>
                  <div style={{ flex: 1 }}><div className="label">{g}</div></div>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>Não pontua</span>
                </div>
              ))}
            </div>
          )}

          {/* Cursos */}
          {allCourses.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cursos Extracurriculares (registrados — não entram na nota)</div>
              {allCourses.map((_, i) => (
                <div key={i} style={{ fontSize: 10, color: '#64748b', marginBottom: 4, padding: '3px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                  <ValidationBadge itemKey={`curso-cat-${i}`} />
                </div>
              ))}
              {allCourses.map((c, i) => (
                <div key={i} className="row-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>📋</span>
                  <div style={{ flex: 1 }}><div className="label">{c}{p.courseHours?.[c] ? ` (${p.courseHours[c]}h)` : ''}</div></div>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>Não pontua</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Identificação ── */}
        <div className="section">
          <div className="section-title">👤 Identificação</div>
          <table>
            <tbody>
              {[
                ['Matrícula', p.matrícula || '—'],
                ['Unidade atual', p.unit || '—'],
                ['Cargo atual', p.currentRole || '—'],
                ['Área atual', p.currentArea || '—'],
                ['Áreas de interesse', (p.selectedAreas || []).join(', ') || '—'],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 600, color: '#6b7280', width: '35%' }}>{label}</td>
                  <td style={{ color: '#111827' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Rodapé ── */}
        <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
          <span>Banco de Sucessores Aderência — SEBRAE Tocantins</span>
          <span>Gerado em {new Date().toLocaleString('pt-BR')}</span>
        </div>

      </div>
    </>
  );
}
