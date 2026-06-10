import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParticipantProfile } from '../../lib/types';

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

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/exceptions')
      .then((res) => res.json())
      .then((data) => setPending(data.pending || []));
  }, [router]);

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      setPending((cur) => cur.filter((p) => p.id !== id));
      setIsError(false);
      setMessage(`Exceção ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso.`);
    } else {
      setIsError(true);
      setMessage('Erro ao processar exceção.');
    }
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
                          onClick={() => updateStatus(p.id, 'approve')}>
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
      </main>

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
