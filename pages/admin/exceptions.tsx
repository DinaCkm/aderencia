import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParticipantProfile } from '../../lib/types';
import { CATALOG_ITEMS } from '../../lib/constants';

const AREA_LABELS: Record<string, string> = {
  UAC: 'UAC — Articulação e Competitividade',
  UAF: 'UAF — Administração e Finanças',
  UAUD: 'UAUD — Auditoria Interna',
  UGE: 'UGE — Gestão Estratégica e Integridade',
  UGOC: 'UGOC — Gestão Orç. Contabilidade e Finanças',
  UGP: 'UGP — Gestão de Pessoas',
  UMC: 'UMC — Marketing e Comunicação',
  URC: 'URC — Relacionamento com o Cliente',
  URI: 'URI — Relacionamento Institucional',
  UTIC: 'UTIC — Tecnologia da Informação',
  REGIONAIS: 'Unidades Regionais',
};

const TYPE_LABELS: Record<string, string> = {
  projeto: 'Projeto Estratégico fora do catálogo',
  'pos-mba': 'Título de Pós/MBA fora do catálogo',
  curso: 'Curso Extracurricular fora do catálogo',
  experiencia: 'Experiência Gerencial/Interina não reconhecida',
  outro: 'Outro questionamento',
};

const TYPE_ICONS: Record<string, string> = {
  projeto: '📋',
  'pos-mba': '🎓',
  curso: '📚',
  experiencia: '💼',
  outro: '❓',
};

const ROLE_LABELS: Record<string, string> = {
  lider: 'Líder do projeto',
  membro: 'Membro da equipe',
  colaborador: 'Colaborador pontual',
  coordenador: 'Coordenador',
  outro: 'Outro',
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: '#1f2937', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 10px', lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

export default function AdminExceptions() {
  const router = useRouter();
  const [pending, setPending] = useState<ParticipantProfile[]>([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [emailModal, setEmailModal] = useState<{ participant: ParticipantProfile } | null>(null);
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ParticipantProfile[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [expandedResolvedId, setExpandedResolvedId] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<{ participant: ParticipantProfile } | null>(null);
  const [selectedCatalogLabel, setSelectedCatalogLabel] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'mba' | 'proj' | ''>('');
  const [approvalJustification, setApprovalJustification] = useState('');

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/exceptions')
      .then((res) => res.json())
      .then((data) => {
        setPending(data.pending || []);
        setResolved(data.resolved || []);
      });
  }, [router]);

  const updateStatus = async (id: string, action: 'approve' | 'reject', catalogLabel?: string, catalogType?: string, catalogArea?: string, approvalJustification?: string) => {
    const res = await fetch('/api/admin/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, catalogLabel, catalogType, catalogArea, approvalJustification }),
    });
    if (res.ok) {
      const moved = pending.find((p) => p.id === id);
      if (moved) {
        const updatedMoved = {
          ...moved,
          exceptionStatus: action === 'approve' ? 'approved' : 'rejected',
          exceptionResolvedAt: new Date().toISOString(),
          ...(catalogLabel ? { exceptionCatalogLabel: catalogLabel } : {}),
          ...(catalogType ? { exceptionCatalogType: catalogType } : {}),
          ...(catalogArea ? { exceptionCatalogArea: catalogArea } : {}),
          ...(approvalJustification ? { exceptionApprovalJustification: approvalJustification } : {}),
        } as any;
        setResolved((cur) => [updatedMoved, ...cur]);
      }
      setPending((cur) => cur.filter((p) => p.id !== id));
      setIsError(false);
      setMessage(`Exceção ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso.${catalogLabel ? ` Vinculado: "${catalogLabel}".` : ''}`);
    } else {
      setIsError(true);
      setMessage('Erro ao processar exceção.');
    }
  };

  const openApproveModal = (participant: ParticipantProfile) => {
    setSelectedCatalogLabel('');
    setSelectedArea('');
    setApprovalJustification('');
    setCatalogTypeFilter('');
    setApproveModal({ participant });
  };

  const confirmApprove = async () => {
    if (!approveModal) return;
    setApprovingId(approveModal.participant.id);
    // selectedCatalogLabel formato: "mba:Label" ou "proj:Label"
    const catalogType = selectedCatalogLabel.startsWith('mba:') ? 'pos-mba'
      : selectedCatalogLabel.startsWith('proj:') ? 'projeto' : undefined;
    const catalogLabel = selectedCatalogLabel.includes(':')
      ? selectedCatalogLabel.slice(selectedCatalogLabel.indexOf(':') + 1)
      : undefined;
    await updateStatus(approveModal.participant.id, 'approve', catalogLabel, catalogType, selectedArea || undefined, approvalJustification || undefined);
    setApproveModal(null);
    setApprovingId(null);
  };

  const openEmailModal = (participant: ParticipantProfile) => {
    const name = participant.name?.split(' ')[0] || 'participante';
    const itemName = (participant as any).exceptionItemName || participant.exceptionJustification?.substring(0, 60) || 'item solicitado';
    setEmailBody(
      `Olá, ${name}!\n\nRecebemos sua solicitação de exceção referente ao item "${itemName}" e precisamos de mais informações para analisá-la.\n\nPor favor, responda este e-mail com:\n\n1. Documentação comprobatória (portaria, ata, certificado ou e-mail de confirmação)\n2. Descrição detalhada do seu papel e das entregas realizadas\n3. Justificativa de por que este item deve ser reconhecido na área de interesse escolhida\n\nAssim que recebermos as informações, daremos continuidade à análise.\n\nAtenciosamente,\nEquipe RH/UGP — SEBRAE Tocantins`
    );
    setEmailModal({ participant });
  };

  const sendEmail = async () => {
    if (!emailModal) return;
    setSendingEmail(true);
    const subject = encodeURIComponent(`Solicitação de Exceção — Banco de Sucessores — ${emailModal.participant.name}`);
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:${emailModal.participant.email}?subject=${subject}&body=${body}`, '_blank');
    setSendingEmail(false);
    setEmailModal(null);
  };

  const downloadFile = (base64: string, fileName: string, fileType: string) => {
    const link = document.createElement('a');
    link.href = `data:${fileType};base64,${base64}`;
    link.download = fileName;
    link.click();
  };

  const isImage = (fileType?: string) => fileType?.startsWith('image/');

  return (
    <>
      <Head><title>Exceções Pendentes | Admin</title></Head>
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

      <main className="container" style={{ maxWidth: 860, paddingTop: 92 }}>

        {/* Cabeçalho explicativo */}
        <div className="section-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1.5px solid #fcd34d' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>⚠️</div>
            <div>
              <h2 style={{ color: '#92400e', marginBottom: 6, fontSize: '1.05rem' }}>O que são Exceções Pendentes?</h2>
              <p style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.7, marginBottom: 10 }}>
                <strong>Exceções</strong> são itens declarados pelos participantes que <strong>não constam no catálogo oficial</strong> do sistema — como projetos estratégicos, títulos de pós-graduação ou cursos que não foram previamente mapeados. O sistema não consegue pontuar esses itens automaticamente, por isso eles ficam pendentes de validação manual pelo RH/UGP.
              </p>
              <div style={{ background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #fde68a' }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#92400e', marginBottom: 6 }}>O que o administrador deve fazer:</div>
                <ol style={{ paddingLeft: 18, margin: 0, fontSize: '0.78rem', color: '#78350f', lineHeight: 1.8 }}>
                  <li>Leia a justificativa e os detalhes fornecidos pelo participante</li>
                  <li>Verifique o anexo (se houver) ou consulte o gestor indicado</li>
                  <li>Se precisar de mais informações, clique em <strong>"Pedir mais informações"</strong> para enviar um e-mail ao participante</li>
                  <li>Após análise, clique em <strong>"Aprovar"</strong> (o item será reconhecido) ou <strong>"Rejeitar"</strong> (o item não será considerado)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#9888;</span>
            <div>
              <h2>Exceções Pendentes</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {pending.length} item(ns) aguardando análise
              </p>
            </div>
          </div>

          {message && (
            <div style={{ background: isError ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isError ? '#fecaca' : '#86efac'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: isError ? '#dc2626' : '#15803d', fontSize: '0.82rem', marginBottom: 16 }}>
              {message}
            </div>
          )}

          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
              <p style={{ fontSize: '0.88rem' }}>Nenhuma exceção pendente. Todas as solicitações foram analisadas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pending.map((p) => {
                const isExpanded = expandedId === p.id;
                const hasFile = !!(p as any).exceptionFileBase64;
                const fileType = (p as any).exceptionFileType || '';
                const fileName = (p as any).exceptionFileName || 'arquivo';
                const fileBase64 = (p as any).exceptionFileBase64 || '';

                return (
                  <div key={p.id} style={{
                    border: '1.5px solid #fde68a',
                    borderRadius: 10,
                    background: '#fffbf5',
                    overflow: 'hidden',
                  }}>
                    {/* Cabeçalho do card */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1f2937' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.email}</div>
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(p as any).exceptionItemName && (
                            <span style={{ fontSize: '0.72rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '2px 7px', color: '#92400e', fontWeight: 600 }}>
                              📋 {(p as any).exceptionItemName}
                            </span>
                          )}
                          {(p as any).exceptionTargetArea && (
                            <span style={{ fontSize: '0.72rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 4, padding: '2px 7px', color: '#5b21b6', fontWeight: 600 }}>
                              🎯 Área: {(p as any).exceptionTargetArea}
                            </span>
                          )}
                          {hasFile && (
                            <span style={{ fontSize: '0.72rem', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 4, padding: '2px 7px', color: '#065f46', fontWeight: 600 }}>
                              📎 Tem anexo
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        style={{ fontSize: '0.75rem', background: 'white', border: '1.5px solid #fcd34d', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#92400e', fontWeight: 600 }}>
                        {isExpanded ? '▲ Ocultar detalhes' : '▼ Ver detalhes completos'}
                      </button>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div style={{ padding: '16px 18px', borderBottom: '1px solid #fde68a' }}>

                        {/* Contexto didático */}
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e40af', marginBottom: 4 }}>ℹ️ Por que este item está pendente?</div>
                          <p style={{ fontSize: '0.77rem', color: '#1e3a8a', lineHeight: 1.6, margin: 0 }}>
                            O participante declarou um <strong>projeto estratégico que não consta no catálogo oficial</strong> do sistema.
                            Como o sistema não consegue pontuar itens fora do catálogo automaticamente, esta solicitação precisa de validação manual.
                            Analise os detalhes abaixo e decida se o item deve ser reconhecido ou não.
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <InfoRow label="Nome do projeto / iniciativa" value={(p as any).exceptionItemName} />
                          <InfoRow label="Área de interesse solicitada" value={(p as any).exceptionTargetArea} />
                          <InfoRow label="Papel no projeto" value={ROLE_LABELS[(p as any).exceptionRole] || (p as any).exceptionRole} />
                          <InfoRow label="Período de participação" value={(p as any).exceptionPeriod} />
                        </div>
                        <InfoRow label="Entregas e resultados do projeto" value={(p as any).exceptionDelivery} />
                        <InfoRow label="Justificativa — por que deve ser reconhecido" value={p.exceptionJustification} />
                        <InfoRow label="Como pode comprovar" value={(p as any).exceptionProofType} />

                        {/* Anexo */}
                        {hasFile && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Documento Comprobatório Anexado</div>
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '12px 14px' }}>
                              {isImage(fileType) ? (
                                <div>
                                  <img
                                    src={`data:${fileType};base64,${fileBase64}`}
                                    alt={fileName}
                                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 8 }}
                                  />
                                  <br />
                                </div>
                              ) : null}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>📎 {fileName}</span>
                                <button
                                  type="button"
                                  onClick={() => downloadFile(fileBase64, fileName, fileType)}
                                  style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                                  ⬇ Baixar arquivo
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Justificativa legado (campo livre antigo) */}
                        {!((p as any).exceptionItemName) && p.exceptionJustification && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Justificativa (campo livre)</div>
                            <div style={{ fontSize: '0.82rem', color: '#1f2937', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', lineHeight: 1.6 }}>
                              {p.exceptionJustification}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div style={{ padding: '12px 18px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        type="button"
                        onClick={() => openEmailModal(p)}
                        style={{ fontSize: '0.75rem', background: 'white', border: '1.5px solid #0891b2', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: '#0891b2', fontWeight: 600 }}>
                        ✉️ Pedir mais informações
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn-primary"
                          style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', padding: '7px 18px', fontSize: '0.78rem', width: 'auto' }}
                          onClick={() => openApproveModal(p)}>
                          ✓ Aprovar
                        </button>
                        <button type="button" className="btn-outline"
                          style={{ borderColor: '#dc2626', color: '#dc2626', padding: '7px 18px', fontSize: '0.78rem' }}
                          onClick={() => updateStatus(p.id, 'reject')}>
                          ✗ Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Histórico de exceções resolvidas */}
        <div style={{ maxWidth: 900, margin: '32px auto 0', padding: '0 16px 40px' }}>
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            style={{ fontSize: '0.82rem', background: 'white', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: '#374151', fontWeight: 600, marginBottom: 16 }}>
            {showResolved ? '▲' : '▼'} Histórico de exceções resolvidas ({resolved.length})
          </button>

          {showResolved && resolved.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resolved.map((p) => {
                const isApproved = p.exceptionStatus === 'approved';
                const resolvedAt = (p as any).exceptionResolvedAt
                  ? new Date((p as any).exceptionResolvedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—';
                const catalogLabel = (p as any).exceptionCatalogLabel;
                const catalogType = (p as any).exceptionCatalogType;
                const catalogArea = (p as any).exceptionCatalogArea;
                const approvalJustification = (p as any).exceptionApprovalJustification;
                const items = (p as any).exceptionItems || [];
                const itemName = items[0]?.itemName || p.exceptionJustification?.substring(0, 80) || '—';
                const exType = items[0]?.type || 'outro';
                const isExpanded = expandedResolvedId === p.id;
                const hasFile = !!(p as any).exceptionFileBase64;
                const fileType = (p as any).exceptionFileType || '';
                const fileName = (p as any).exceptionFileName || 'arquivo';
                const fileBase64 = (p as any).exceptionFileBase64 || '';

                return (
                  <div key={p.id} style={{ background: 'white', border: `1.5px solid ${isApproved ? '#86efac' : '#fca5a5'}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '1.2rem', marginTop: 2 }}>{isApproved ? '✅' : '❌'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1f2937' }}>{p.name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{p.email}</span>
                          <span style={{ fontSize: '0.7rem', background: isApproved ? '#f0fdf4' : '#fef2f2', color: isApproved ? '#15803d' : '#dc2626', border: `1px solid ${isApproved ? '#86efac' : '#fca5a5'}`, borderRadius: 4, padding: '1px 7px', fontWeight: 700 }}>
                            {isApproved ? 'Aprovada' : 'Rejeitada'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{resolvedAt}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#374151', marginBottom: catalogLabel ? 4 : 0 }}>
                          <span style={{ color: '#6b7280' }}>{TYPE_LABELS[exType] || exType}: </span>{itemName}
                        </div>
                        {catalogLabel && (
                          <div style={{ fontSize: '0.75rem', color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 5, padding: '3px 8px', display: 'inline-block', marginTop: 4 }}>
                            🔗 Vinculado: <strong>{catalogLabel}</strong>{catalogType === 'pos-mba' ? ' (Pós/MBA)' : catalogType === 'projeto' ? ' (Projeto)' : ''}{catalogArea ? ` — ${catalogArea}` : ''}
                          </div>
                        )}
                        {isApproved && !catalogLabel && (
                          <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 4 }}>
                            ⚠️ Aprovada sem vínculo ao catálogo — sem pontuação gerada
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedResolvedId(isExpanded ? null : p.id)}
                        style={{ fontSize: '0.72rem', background: 'white', border: '1.5px solid #d1d5db', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#374151', fontWeight: 600, flexShrink: 0 }}>
                        {isExpanded ? '▲ Ocultar' : '▼ Ver detalhes'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '4px 18px 16px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '10px 0 6px' }}>
                          O que o candidato solicitou
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <InfoRow label="Nome do projeto / iniciativa" value={items[0]?.itemName} />
                          <InfoRow label="Área de interesse solicitada" value={items[0]?.targetArea || (p as any).exceptionTargetArea} />
                          <InfoRow label="Papel no projeto" value={ROLE_LABELS[items[0]?.role || (p as any).exceptionRole] || items[0]?.role || (p as any).exceptionRole} />
                          <InfoRow label="Período de participação" value={items[0]?.period || (p as any).exceptionPeriod} />
                        </div>
                        <InfoRow label="Objetivo do reconhecimento" value={items[0]?.objective} />
                        <InfoRow label="Entregas e resultados do projeto" value={(p as any).exceptionDelivery} />
                        <InfoRow label="Justificativa completa do candidato" value={items[0]?.justification || p.exceptionJustification} />
                        <InfoRow label="Como pode comprovar" value={(p as any).exceptionProofType} />

                        {hasFile && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Documento Comprobatório Anexado</div>
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 8, padding: '12px 14px' }}>
                              {isImage(fileType) && (
                                <img src={`data:${fileType};base64,${fileBase64}`} alt={fileName}
                                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 8, display: 'block' }} />
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>📎 {fileName}</span>
                                <button type="button" onClick={() => downloadFile(fileBase64, fileName, fileType)}
                                  style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                                  ⬇ Baixar arquivo
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {approvalJustification && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                              {isApproved ? '✅ Justificativa da aprovação (admin)' : '❌ Justificativa da rejeição (admin)'}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#1f2937', background: isApproved ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isApproved ? '#86efac' : '#fca5a5'}`, borderRadius: 6, padding: '8px 12px', lineHeight: 1.6 }}>
                              {approvalJustification}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {showResolved && resolved.length === 0 && (
            <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Nenhuma exceção resolvida ainda.</p>
          )}
        </div>
      </main>

      {/* Modal de aprovação com vínculo ao catálogo */}
      {approveModal && (() => {
        const p = approveModal.participant;
        const items = (p as any).exceptionItems || [];
        const exType = items[0]?.type || '';
        // Tipo da exceção: inferido de exceptionItems ou exceptionJustification
        const exTypeRaw = items[0]?.type || exType || 'outro';
        const isMBAType = exTypeRaw === 'pos-mba';
        const isProjType = exTypeRaw === 'projeto';
        // Se tipo desconhecido/outro, mostra ambos os grupos
        const showBoth = !isMBAType && !isProjType;

        const mbaCatalog = CATALOG_ITEMS
          .filter((i) => i.group === 'postMBA')
          .filter((item, idx, arr) => arr.findIndex((i) => i.label === item.label) === idx)
          .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
        const projCatalog = CATALOG_ITEMS
          .filter((i) => i.group === 'project')
          .filter((item, idx, arr) => arr.findIndex((i) => i.label === item.label) === idx)
          .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

        const selLabel = selectedCatalogLabel.includes(':')
          ? selectedCatalogLabel.slice(selectedCatalogLabel.indexOf(':') + 1)
          : selectedCatalogLabel;

        const typeLabel = isMBAType ? '🎓 Pós/MBA' : isProjType ? '📋 Projeto' : '🔗 Item';

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#15803d', marginBottom: 6 }}>✓ Aprovar exceção</h3>
              <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 4 }}>
                <strong>{p.name}</strong>
              </p>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 16 }}>
                {TYPE_LABELS[exTypeRaw] || exTypeRaw} — {items[0]?.itemName || (p as any).exceptionJustification?.substring(0, 80) || 'item solicitado'}
              </p>

              {(isMBAType || isProjType || showBoth) && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                    {typeLabel} — Vincular ao item do catálogo para gerar pontuação:
                  </label>
                  {/* Filtro de tipo — só aparece quando tipo é desconhecido */}
                  {showBoth && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      {(['', 'mba', 'proj'] as const).map((f) => (
                        <button key={f} type="button"
                          onClick={() => { setCatalogTypeFilter(f); setSelectedCatalogLabel(''); }}
                          style={{ padding: '4px 14px', borderRadius: 20, border: '1.5px solid', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            borderColor: catalogTypeFilter === f ? '#6366f1' : '#d1d5db',
                            background: catalogTypeFilter === f ? '#ede9fe' : 'white',
                            color: catalogTypeFilter === f ? '#4f46e5' : '#6b7280' }}>
                          {f === '' ? 'Todos' : f === 'mba' ? '🎓 Pós/MBA' : '📋 Projetos'}
                        </button>
                      ))}
                    </div>
                  )}
                  <select
                    value={selectedCatalogLabel}
                    onChange={(e) => setSelectedCatalogLabel(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: '0.82rem', color: '#1f2937' }}>
                    <option value="">— Aprovar sem vincular ao catálogo (sem pontuação) —</option>
                    {(isMBAType || (showBoth && catalogTypeFilter !== 'proj')) && (
                      <optgroup label="🎓 Pós/MBA">
                        {mbaCatalog.map((item) => (
                          <option key={item.id} value={`mba:${item.label}`}>
                            {item.label}{(item as any).classification === 'transversal' ? ' (transversal)' : (item as any).area ? ` — ${(item as any).area}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {(isProjType || (showBoth && catalogTypeFilter !== 'mba')) && (
                      <optgroup label="📋 Projetos Estratégicos">
                        {projCatalog.map((item) => (
                          <option key={item.id} value={`proj:${item.label}`}>
                            {item.label}{(item as any).area ? ` — ${(item as any).area}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {/* Seleção de área — obrigatório para projetos */}
                  {selectedCatalogLabel.startsWith('proj:') && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                        🏢 Área para qual o participante concorre com este projeto: <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: `1.5px solid ${!selectedArea ? '#f59e0b' : '#86efac'}`, fontSize: '0.82rem', color: '#1f2937' }}>
                        <option value="">— Selecione a área —</option>
                        {(p.selectedAreas || []).map((code) => (
                          <option key={code} value={code}>{AREA_LABELS[code] || code}</option>
                        ))}
                      </select>
                      {!selectedArea && (
                        <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#b45309' }}>
                          ⚠️ Selecione a área para que o projeto pontue corretamente.
                        </div>
                      )}
                    </div>
                  )}



                  {selectedCatalogLabel && (!selectedCatalogLabel.startsWith('proj:') || selectedArea) && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, fontSize: '0.75rem', color: '#15803d' }}>
                      ✓ <strong>"{selLabel}"</strong> será adicionado ao perfil{selectedArea ? ` e pontuará na área ${selectedArea}` : ''} automaticamente.
                    </div>
                  )}
                  {!selectedCatalogLabel && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, fontSize: '0.75rem', color: '#854d0e' }}>
                      ⚠️ Sem vínculo, a exceção será aprovada mas não gerará pontuação.
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  📝 Justificativa da aprovação (será exibida ao candidato):
                </label>
                <textarea
                  value={approvalJustification}
                  onChange={(e) => setApprovalJustification(e.target.value)}
                  rows={3}
                  placeholder="Ex: O projeto apresentado é compatível com as atividades estratégicas da área REGIONAIS, sendo classificado como Projeto Estratégico Central por envolver execução direta do portfólio regional..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: '0.78rem', color: '#1f2937', resize: 'vertical', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                  Esta justificativa ficará visível no formulário do candidato após a aprovação.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button"
                  onClick={() => setApproveModal(null)}
                  style={{ padding: '8px 18px', borderRadius: 7, border: '1.5px solid #d1d5db', background: 'white', color: '#374151', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="button"
                  onClick={confirmApprove}
                  disabled={!!approvingId || (selectedCatalogLabel.startsWith('proj:') && !selectedArea)}
                  title={selectedCatalogLabel.startsWith('proj:') && !selectedArea ? 'Selecione a área antes de confirmar' : ''}
                  style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: (selectedCatalogLabel.startsWith('proj:') && !selectedArea) ? '#9ca3af' : 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white', fontSize: '0.82rem', cursor: (selectedCatalogLabel.startsWith('proj:') && !selectedArea) ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                  {approvingId ? 'Aprovando...' : '✓ Confirmar aprovação'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de e-mail */}
      {emailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '28px 32px', maxWidth: 580, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: 'var(--purple)', marginBottom: 6, fontSize: '1rem' }}>✉️ Pedir mais informações</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Um e-mail será aberto no seu cliente de e-mail para <strong>{emailModal.participant.name}</strong> ({emailModal.participant.email}).
              Edite o texto abaixo antes de enviar.
            </p>
            <textarea
              rows={12}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="btn-outline" onClick={() => setEmailModal(null)}>Cancelar</button>
              <button type="button" className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }}
                onClick={sendEmail} disabled={sendingEmail}>
                {sendingEmail ? 'Abrindo...' : '✉️ Abrir e-mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
