import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParticipantProfile } from '../../lib/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ItemValidation {
  itemKey: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  validatedAt?: string;
}

interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
  overallStatus: 'provisional' | 'validated' | 'adjusted';
  overallNote?: string;
  auditedAt?: string;
}

interface ParticipantSummary {
  userId: string;
  name: string;
  email: string;
  formStatus: string;
  selectedAreas: string[];
  exceptionRequested: boolean;
  exceptionStatus: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AREA_LABELS: Record<string, string> = {
  UAC: 'UAC — Unidade de Articulação e Competitividade',
  UAS: 'UAS — Unidade de Administração e Suprimentos',
  UAUD: 'UAUD — Unidade de Auditoria Interna',
  UGE: 'UGE — Unidade de Gestão Estratégica e Integridade',
  UGOC: 'UGOC — Unidade de Gestão Orç. Contabilidade e Finanças',
  UGP: 'UGP — Unidade de Gestão de Pessoas',
  UMC: 'UMC — Unidade de Marketing e Comunicação',
  URC: 'URC — Unidade de Relacionamento com o Cliente',
  URI: 'URI — Unidade de Relacionamento Institucional',
  UTIC: 'UTIC — Unidade de Tecnologia da Informação',
  REGIONAIS: 'Unidades Regionais',
};

const STATUS_COLORS = {
  pending:  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', label: '⏳ Pendente' },
  approved: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', label: '✓ Validado' },
  rejected: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', label: '✗ Rejeitado' },
};

function Badge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const s = STATUS_COLORS[status];
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      {s.label}
    </span>
  );
}

function ValidationControls({
  itemKey, validation, onSave,
}: {
  itemKey: string;
  validation?: ItemValidation;
  onSave: (v: ItemValidation) => void;
}) {
  const [status, setStatus] = useState<ItemValidation['status']>(validation?.status || 'pending');
  const [note, setNote] = useState(validation?.note || '');
  const [showNote, setShowNote] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    onSave({ itemKey, status, note });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>Validação:</span>
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <label key={s} style={{
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            padding: '3px 10px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600,
            border: `1.5px solid ${status === s ? STATUS_COLORS[s].border : '#e2e8f0'}`,
            background: status === s ? STATUS_COLORS[s].bg : 'white',
            color: status === s ? STATUS_COLORS[s].text : '#64748b',
          }}>
            <input type="radio" name={`status-${itemKey}`} value={s} checked={status === s}
              onChange={() => setStatus(s)} style={{ display: 'none' }} />
            {STATUS_COLORS[s].label}
          </label>
        ))}
        <button type="button" onClick={() => setShowNote(!showNote)}
          style={{ fontSize: '0.68rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: '#64748b' }}>
          {showNote ? '▲ Ocultar obs.' : '✏️ Adicionar obs.'}
        </button>
        <button type="button" onClick={save}
          style={{ fontSize: '0.72rem', background: saved ? '#16a34a' : 'var(--purple)', color: 'white', border: 'none', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, marginLeft: 'auto' }}>
          {saved ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>
      {showNote && (
        <textarea
          rows={2}
          placeholder="Observação para este item (ex: documento inválido, precisa reenviar...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', marginTop: 8, fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px', resize: 'vertical', fontFamily: 'inherit' }}
        />
      )}
      {validation?.validatedAt && (
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>
          Última validação: {new Date(validation.validatedAt).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, marginBottom: 18, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{title}</span>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

// ─── Visualizador de arquivo inline ──────────────────────────────────────────
function FileViewer({ base64, fileName, fileType, label }: { base64: string; fileName: string; fileType?: string; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const mime = fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : fileName.match(/\.(jpe?g|png|gif|webp)$/i) ? 'image/' + fileName.split('.').pop() : 'application/octet-stream');
  const dataUrl = base64.startsWith('data:') ? base64 : `data:${mime};base64,${base64}`;
  const isPdf = mime === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = mime.startsWith('image/');

  const download = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
  };

  return (
    <div style={{ marginTop: 8 }}>
      {label && <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setOpen(!open)}
          style={{ fontSize: '0.72rem', background: open ? '#5b21b6' : '#0891b2', color: 'white', border: 'none', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>
          {open ? '▲ Fechar visualizador' : (isPdf ? '📄 Visualizar PDF' : isImage ? '🖼 Visualizar imagem' : '📎 Ver arquivo')}
        </button>
        <button type="button" onClick={download}
          style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>
          ⬇ Baixar: {fileName}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 8, border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#f8fafc' }}>
          {isImage && (
            <img src={dataUrl} alt={fileName}
              style={{ maxWidth: '100%', maxHeight: 500, display: 'block', margin: '0 auto', padding: 8 }} />
          )}
          {isPdf && (
            <iframe src={dataUrl} title={fileName}
              style={{ width: '100%', height: 520, border: 'none', display: 'block' }} />
          )}
          {!isImage && !isPdf && (
            <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
              Pré-visualização não disponível para este tipo de arquivo.<br />
              <button type="button" onClick={download}
                style={{ marginTop: 8, fontSize: '0.78rem', background: '#0891b2', color: 'white', border: 'none', borderRadius: 5, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}>
                ⬇ Baixar arquivo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function AdminAudit() {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ profile: ParticipantProfile; audit: ProfileAudit } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overallNote, setOverallNote] = useState('');
  const [emailModal, setEmailModal] = useState<{ subject: string; body: string } | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetch('/api/admin/participants')
      .then((r) => r.json())
      .then((d) => setParticipants(d.participants || []));
  }, [router]);

  const loadProfile = useCallback(async (email: string) => {
    setLoading(true);
    setSelected(null);
    const res = await fetch(`/api/admin/audit-profile?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data);
      setOverallNote(data.audit?.overallNote || '');
    }
    setLoading(false);
  }, []);

  const saveItemValidation = async (v: ItemValidation) => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/admin/audit-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: selected.profile.id, itemValidation: v }),
    });
    // Atualizar estado local
    setSelected((prev) => {
      if (!prev) return prev;
      const existing = prev.audit.itemValidations.findIndex((x) => x.itemKey === v.itemKey);
      const updated = [...prev.audit.itemValidations];
      if (existing >= 0) updated[existing] = { ...v, validatedAt: new Date().toISOString() };
      else updated.push({ ...v, validatedAt: new Date().toISOString() });
      return { ...prev, audit: { ...prev.audit, itemValidations: updated } };
    });
    setSaving(false);
    showToast('Item salvo!');
  };

  const saveOverallStatus = async (status: string) => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/admin/audit-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: selected.profile.id, overallStatus: status, overallNote }),
    });
    setSelected((prev) => prev ? { ...prev, audit: { ...prev.audit, overallStatus: status as any, overallNote, auditedAt: new Date().toISOString() } } : prev);
    setSaving(false);
    showToast(`Ficha marcada como "${status}"!`);
  };

  const getValidation = (key: string) =>
    selected?.audit.itemValidations.find((v) => v.itemKey === key);

  const openEmailModal = (subject: string, body: string) => setEmailModal({ subject, body });

  const sendEmail = () => {
    if (!emailModal || !selected) return;
    const s = encodeURIComponent(emailModal.subject);
    const b = encodeURIComponent(emailModal.body);
    window.open(`mailto:${selected.profile.email}?subject=${s}&body=${b}`, '_blank');
    setEmailModal(null);
  };

  const downloadFile = (base64: string, fileName: string, fileType: string) => {
    const link = document.createElement('a');
    link.href = `data:${fileType};base64,${base64}`;
    link.download = fileName;
    link.click();
  };

  const filtered = participants.filter(
    (p) => p.formStatus === 'preenchido' &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
       p.email.toLowerCase().includes(search.toLowerCase()))
  );

  const p = selected?.profile;

  return (
    <>
      <Head><title>Auditoria de Fichas | Admin</title></Head>
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

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      <main style={{ paddingTop: 80, display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Painel esquerdo: lista de candidatos ── */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', position: 'sticky', top: 80, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
              🔍 Auditoria de Fichas
            </h2>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', fontSize: '0.78rem', border: '1.5px solid #e2e8f0', borderRadius: 7, outline: 'none' }}
            />
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6 }}>
              {filtered.length} candidato(s) com ficha preenchida
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((pt) => (
              <button
                key={pt.email}
                type="button"
                onClick={() => loadProfile(pt.email)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: selected?.profile.email === pt.email ? '#ede9fe' : 'white',
                  border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{pt.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{pt.email}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  {pt.exceptionRequested && (
                    <span style={{ fontSize: '0.62rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 3, padding: '1px 5px', color: '#92400e', fontWeight: 700 }}>
                      ⚠️ Exceção
                    </span>
                  )}
                  {(pt.selectedAreas || []).map((a) => (
                    <span key={a} style={{ fontSize: '0.62rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 3, padding: '1px 5px', color: '#5b21b6', fontWeight: 600 }}>
                      {a}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                Nenhum candidato encontrado
              </div>
            )}
          </div>
        </div>

        {/* ── Painel direito: ficha completa ── */}
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', maxWidth: 900 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <p>Carregando ficha...</p>
            </div>
          )}

          {!loading && !selected && (
            <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>👈</div>
              <p style={{ fontSize: '0.9rem' }}>Selecione um candidato na lista ao lado para visualizar e auditar a ficha completa.</p>
            </div>
          )}

          {!loading && selected && p && (
            <>
              {/* Cabeçalho da ficha */}
              <div style={{ background: 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)', borderRadius: 12, padding: '20px 24px', color: 'white', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{p.name}</h1>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{p.email}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{p.currentRole} — {p.unit}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(p.selectedAreas || []).map((a) => (
                        <span key={a} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                          {AREA_LABELS[a] || a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 4 }}>Status da ficha</div>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                      background: selected.audit.overallStatus === 'validated' ? '#d1fae5' : selected.audit.overallStatus === 'adjusted' ? '#fef3c7' : 'rgba(255,255,255,0.2)',
                      color: selected.audit.overallStatus === 'validated' ? '#065f46' : selected.audit.overallStatus === 'adjusted' ? '#92400e' : 'white',
                    }}>
                      {selected.audit.overallStatus === 'validated' ? '✓ Validada' : selected.audit.overallStatus === 'adjusted' ? '⚠️ Ajustada' : '⏳ Provisória'}
                    </span>
                    {p.submittedAt && (
                      <div style={{ fontSize: '0.68rem', opacity: 0.75, marginTop: 6 }}>
                        Enviada em {new Date(p.submittedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de e-mail geral */}
              <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button"
                  onClick={() => openEmailModal(
                    `Análise da sua ficha — Banco de Sucessores — ${p.name}`,
                    `Olá, ${p.name?.split(' ')[0]}!\n\nEstamos analisando sua ficha no Banco de Sucessores e precisamos de mais informações.\n\nPor favor, responda este e-mail com os esclarecimentos necessários.\n\nAtenciosamente,\nEquipe RH/UGP — SEBRAE Tocantins`
                  )}
                  style={{ fontSize: '0.78rem', background: 'white', border: '1.5px solid #0891b2', borderRadius: 7, padding: '7px 16px', cursor: 'pointer', color: '#0891b2', fontWeight: 600 }}>
                  ✉️ Solicitar informações por e-mail
                </button>
              </div>

              {/* ── 1. Dados Básicos ── */}
              <SectionCard title="1. Dados Básicos" icon="👤">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InfoField label="Nome completo" value={p.name} />
                  <InfoField label="E-mail" value={p.email} />
                  <InfoField label="Matrícula" value={p.matrícula} />
                  <InfoField label="Unidade atual" value={p.unit} />
                  <InfoField label="Cargo atual" value={p.currentRole} />
                  <InfoField label="Área atual" value={AREA_LABELS[p.currentArea] || p.currentArea} />
                </div>
                <ValidationControls itemKey="dados-basicos" validation={getValidation('dados-basicos')} onSave={saveItemValidation} />
              </SectionCard>

              {/* ── 2. Áreas de Interesse ── */}
              <SectionCard title="2. Áreas de Interesse" icon="🎯">
                {(p.selectedAreas || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Nenhuma área selecionada.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(p.selectedAreas || []).map((a) => (
                      <span key={a} style={{ fontSize: '0.78rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 6, padding: '4px 12px', color: '#5b21b6', fontWeight: 600 }}>
                        {AREA_LABELS[a] || a}
                      </span>
                    ))}
                  </div>
                )}
                <ValidationControls itemKey="areas-interesse" validation={getValidation('areas-interesse')} onSave={saveItemValidation} />
              </SectionCard>

              {/* ── 3. Graduação ── */}
              <SectionCard title="3. Graduação" icon="🎓">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InfoField label="Graduação principal" value={p.graduation === '__outro__' ? `Outro: ${p.graduationCourseName}` : p.graduation} />
                  {p.graduation2 && <InfoField label="Segunda graduação" value={p.graduation2} />}
                  {p.graduationCourseName && p.graduation !== '__outro__' && <InfoField label="Nome do curso (livre)" value={p.graduationCourseName} />}
                  {p.graduationException && <InfoField label="Justificativa de exceção" value={p.graduationException} />}
                </div>
                {/* Badge de comprovação da graduação — chave: grad:<area> */}
                {(() => {
                  const gradKey = `grad:${p.graduation}`;
                  const gradKey2 = p.graduation2 ? `grad2:${(p as any).graduation2CourseName?.trim() || p.graduation2}` : null;
                  const mode = p.proofMode?.[gradKey] || (gradKey2 ? p.proofMode?.[gradKey2] : undefined);
                  const fileKey = mode === 'upload' ? (p.proofFiles?.[gradKey] ? gradKey : gradKey2 || gradKey) : gradKey;
                  return (
                    <>
                      {!mode ? (
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '3px 8px', display: 'inline-block', margin: '8px 0 4px' }}>
                          ⚠ Sem comprovação informada — solicite esclarecimentos antes de rejeitar
                        </div>
                      ) : mode === 'ugp-knows' ? (
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 4, padding: '3px 8px', display: 'inline-block', margin: '8px 0 4px' }}>
                          ✓ A UGP já tem conhecimento — aguarda validação interna pela UGP
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 4, padding: '3px 8px', display: 'inline-block', margin: '8px 0 4px' }}>
                          📎 Enviou documento para comprovação
                        </div>
                      )}
                      {mode === 'upload' && p.proofFiles?.[fileKey] && (
                        <FileViewer base64={p.proofFiles[fileKey]} fileName="comprovante-graduacao" label="Comprovante de graduação" />
                      )}
                    </>
                  );
                })()}
                <ValidationControls itemKey="graduacao" validation={getValidation('graduacao')} onSave={saveItemValidation} />
              </SectionCard>

              {/* ── 4. Pós/MBA ── */}
              <SectionCard title="4. Pós-Graduação / MBA" icon="📚">
                {(() => {
                  // Usar mbaBlocks (com nome completo) para construir a chave correta: mba_i:nome
                  const blocks: Array<{area?: string; name?: string; year?: string}> = (p as any).mbaBlocks || [];
                  const validBlocks = blocks.filter((b) => b.area && b.area !== '__outro_mba__' && b.name?.trim());
                  if (validBlocks.length === 0) {
                    return <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Nenhum título declarado.</p>;
                  }
                  return (
                    <>
                      {validBlocks.map((mba, i) => {
                        const mbaKey = `mba_${i}:${mba.name!.trim()}`;
                        const mode = p.proofMode?.[mbaKey];
                        return (
                          <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b', marginBottom: 2 }}>{mba.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>Área: {mba.area}{mba.year ? ` • ${mba.year}` : ''}</div>
                            {/* Comprovante — chave: mba_i:nome */}
                            {!mode ? (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                                ⚠ Sem comprovação informada — solicite esclarecimentos antes de rejeitar
                              </div>
                            ) : mode === 'ugp-knows' ? (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                                ✓ A UGP já tem conhecimento — aguarda validação interna pela UGP
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                                📎 Enviou documento para comprovação
                              </div>
                            )}
                            {mode === 'upload' && p.proofFiles?.[mbaKey] && (
                              <FileViewer
                                base64={p.proofFiles[mbaKey]}
                                fileName={`comprovante-pos-${i + 1}`}
                                label="Comprovante enviado"
                              />
                            )}
                            <ValidationControls itemKey={`postmba-${i}`} validation={getValidation(`postmba-${i}`)} onSave={saveItemValidation} />
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </SectionCard>

              {/* ── 5. Cursos Extracurriculares ── */}
              <SectionCard title="5. Cursos Extracurriculares" icon="📖">
                {(() => {
                  // Cursos livres (entrada manual) — chave: curso5_i:nome
                  const freeCourses: Array<{name?: string; area?: string; hours?: number}> = (p as any).freeCourses || [];
                  const validFree = freeCourses.filter((c) => c.name?.trim() && c.area && (c.hours || 0) >= 16);
                  // Cursos do catálogo — chave: curso7:nome
                  const catCourses: string[] = p.selectedCourses || [];
                  if (validFree.length === 0 && catCourses.length === 0) {
                    return <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Nenhum curso declarado.</p>;
                  }
                  const ProofBadge = ({ mode }: { mode: string | undefined }) => {
                    if (!mode) return (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginTop: 4 }}>
                        ⚠ Sem comprovação informada — solicite esclarecimentos antes de rejeitar
                      </div>
                    );
                    if (mode === 'ugp-knows') return (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginTop: 4 }}>
                        ✓ A UGP já tem conhecimento — aguarda validação interna pela UGP
                      </div>
                    );
                    return (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginTop: 4 }}>
                        📎 Enviou documento para comprovação
                      </div>
                    );
                  };
                  return (
                    <>
                      {validFree.map((course, i) => {
                        const key = `curso5_${i}:${course.name!.trim()}`;
                        const mode = p.proofMode?.[key];
                        return (
                          <div key={`free-${i}`} style={{ marginBottom: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{course.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Área: {course.area} • {course.hours}h</div>
                            <ProofBadge mode={mode} />
                            {mode === 'upload' && p.proofFiles?.[key] && (
                              <FileViewer base64={p.proofFiles[key]} fileName={`comprovante-curso-${i + 1}`} label="Comprovante enviado" />
                            )}
                            <ValidationControls itemKey={`curso-free-${i}`} validation={getValidation(`curso-free-${i}`)} onSave={saveItemValidation} />
                          </div>
                        );
                      })}
                      {catCourses.map((course, i) => {
                        const key = `curso7:${course}`;
                        const mode = p.proofMode?.[key];
                        return (
                          <div key={`cat-${i}`} style={{ marginBottom: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{course}</div>
                            {p.courseHours?.[course] && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Carga horária: {p.courseHours[course]}h</div>
                            )}
                            <ProofBadge mode={mode} />
                            {mode === 'upload' && p.proofFiles?.[key] && (
                              <FileViewer base64={p.proofFiles[key]} fileName={`comprovante-curso-cat-${i + 1}`} label="Comprovante enviado" />
                            )}
                            <ValidationControls itemKey={`curso-cat-${i}`} validation={getValidation(`curso-cat-${i}`)} onSave={saveItemValidation} />
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </SectionCard>

              {/* ── 6. Experiência ── */}
              <SectionCard title="6. Experiência Gerencial / Interina" icon="💼">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <InfoField label="Meses em cargo gerencial efetivo" value={p.managerialMonths ? `${p.managerialMonths} meses` : null} />
                  <InfoField label="Meses em cargo interino" value={p.interimMonths ? `${p.interimMonths} meses` : null} />
                  <InfoField label="Total (legado)" value={p.experienceMonths ? `${p.experienceMonths} meses` : null} />
                </div>
                {(p.positionsHeld || []).length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Cargos declarados</div>
                    {(p.positionsHeld || []).map((pos, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: '#1e293b', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>• {pos}</div>
                    ))}
                  </div>
                )}
                <ValidationControls itemKey="experiencia" validation={getValidation('experiencia')} onSave={saveItemValidation} />
              </SectionCard>

              {/* ── 7. Projetos Estratégicos ── */}
              <SectionCard title="7. Projetos Estratégicos" icon="📋">
                {(p.selectedProjects || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Nenhum projeto selecionado.</p>
                ) : (
                  (p.selectedProjects || []).map((proj, i) => {
                    // Chave correta: proj:<nome do projeto>
                    const projKey = `proj:${proj}`;
                    const mode = p.proofMode?.[projKey];
                    return (
                      <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b', marginBottom: 4 }}>{proj}</div>
                        {p.projectAreaMap?.[proj] && (
                          <div style={{ fontSize: '0.72rem', color: '#5b21b6', marginBottom: 4 }}>
                            🎯 Área de aplicação: {AREA_LABELS[p.projectAreaMap[proj]] || p.projectAreaMap[proj]}
                          </div>
                        )}
                        {!mode ? (
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                            ⚠ Sem comprovação informada — solicite esclarecimentos antes de rejeitar
                          </div>
                        ) : mode === 'ugp-knows' ? (
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                            ✓ A UGP já tem conhecimento — aguarda validação interna pela UGP
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 4, padding: '3px 8px', display: 'inline-block', marginBottom: 4 }}>
                            📎 Enviou documento para comprovação
                          </div>
                        )}
                        {mode === 'upload' && p.proofFiles?.[projKey] && (
                          <FileViewer
                            base64={p.proofFiles[projKey]}
                            fileName={`comprovante-projeto-${i + 1}`}
                            label="Comprovante enviado"
                          />
                        )}
                        <ValidationControls itemKey={`projeto-${i}`} validation={getValidation(`projeto-${i}`)} onSave={saveItemValidation} />
                      </div>
                    );
                  })
                )}
              </SectionCard>

              {/* ── 8. Exceções ── */}
              {(p.exceptionRequested || (p as any).exceptionJustification || (p.exceptionItems || []).length > 0) && (
                <SectionCard title="8. Exceções Solicitadas" icon="⚠️">
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                    <p style={{ fontSize: '0.78rem', color: '#92400e', margin: 0 }}>
                      Este participante solicitou reconhecimento de itens fora do catálogo oficial. Analise cada item abaixo e valide ou rejeite individualmente.
                    </p>
                  </div>

                  {/* Exceções estruturadas (novo formato) */}
                  {(p.exceptionItems || []).map((item, i) => (
                    <div key={i} style={{ marginBottom: 14, padding: '12px 14px', background: '#fffbf5', border: '1.5px solid #fde68a', borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 8 }}>
                        ⚠️ Exceção {i + 1}: {item.itemName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <InfoField label="Área solicitada" value={item.targetArea} />
                        <InfoField label="Tipo" value={item.type} />
                        <InfoField label="Objetivo" value={item.objective} />
                      </div>
                      <InfoField label="Justificativa" value={item.justification} />
                      {item.fileBase64 && item.fileName && (
                        <FileViewer
                          base64={item.fileBase64}
                          fileName={item.fileName}
                          fileType={item.fileType}
                          label="Comprovante da exceção"
                        />
                      )}
                      <ValidationControls itemKey={`excecao-${i}`} validation={getValidation(`excecao-${i}`)} onSave={saveItemValidation} />
                    </div>
                  ))}

                  {/* Exceção legado (campo livre) */}
                  {p.exceptionJustification && (p.exceptionItems || []).length === 0 && (
                    <div style={{ padding: '12px 14px', background: '#fffbf5', border: '1.5px solid #fde68a', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Justificativa (campo livre)</div>
                      <p style={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.6 }}>{p.exceptionJustification}</p>
                      <ValidationControls itemKey="excecao-legado" validation={getValidation('excecao-legado')} onSave={saveItemValidation} />
                    </div>
                  )}
                </SectionCard>
              )}

              {/* ── Conclusão da Auditoria ── */}
              <div style={{ background: 'white', border: '2px solid var(--purple)', borderRadius: 12, padding: '20px 24px', marginTop: 8 }}>
                <h3 style={{ color: 'var(--purple)', marginBottom: 14, fontSize: '0.95rem' }}>📝 Conclusão da Auditoria</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                    Observação geral (opcional)
                  </label>
                  <textarea rows={3} value={overallNote} onChange={(e) => setOverallNote(e.target.value)}
                    placeholder="Registre aqui qualquer observação geral sobre a ficha deste participante..."
                    style={{ width: '100%', fontSize: '0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button"
                    onClick={() => saveOverallStatus('validated')}
                    disabled={saving}
                    style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    ✓ Marcar como Validada
                  </button>
                  <button type="button"
                    onClick={() => saveOverallStatus('adjusted')}
                    disabled={saving}
                    style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    ⚠️ Marcar como Ajustada
                  </button>
                  <button type="button"
                    onClick={() => saveOverallStatus('provisional')}
                    disabled={saving}
                    style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    ⏳ Manter Provisória
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de e-mail */}
      {emailModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '28px 32px', maxWidth: 580, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: 'var(--purple)', marginBottom: 6, fontSize: '1rem' }}>✉️ Solicitar informações</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Para: <strong>{selected.profile.name}</strong> ({selected.profile.email}). Edite o texto antes de enviar.
            </p>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Assunto</label>
              <input type="text" value={emailModal.subject}
                onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                style={{ width: '100%', fontSize: '0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 7, padding: '7px 10px' }} />
            </div>
            <textarea rows={10} value={emailModal.body}
              onChange={(e) => setEmailModal({ ...emailModal, body: e.target.value })}
              style={{ width: '100%', fontSize: '0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="btn-outline" onClick={() => setEmailModal(null)}>Cancelar</button>
              <button type="button" className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={sendEmail}>
                ✉️ Abrir e-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
