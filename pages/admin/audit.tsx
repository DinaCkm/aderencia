import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ParticipantProfile } from '../../lib/types';
import { CATALOG_ITEMS } from '../../lib/constants';
import { bestPostMBADetail, experienceScore } from '../../lib/business';

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
  hasLegacyFiles?: boolean;
  hasPendingDocs?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AREA_LABELS: Record<string, string> = {
  UAC: 'UAC — Unidade de Articulação e Competitividade',
  UAF: 'UAF — Unidade de Administração e Finanças',
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

// Mostra o impacto real na pontuação de um título de Pós/MBA — quanto ele contribui
// hoje (por área) e o quanto seria perdido se ele fosse rejeitado.
function PostMBAPointsBadge({ profile, index }: { profile: ParticipantProfile; index: number }) {
  const allLabels = profile.postMBAs || [];
  const withoutThis = allLabels.filter((_, i) => i !== index);
  const impacts = (profile.selectedAreas || [])
    .map((area) => {
      const full = bestPostMBADetail(allLabels, area).score;
      const without = bestPostMBADetail(withoutThis, area).score;
      return { area, delta: full - without };
    })
    .filter((x) => x.delta > 0);
  if (impacts.length === 0) {
    return (
      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 6 }}>
        📊 Este título não é o mais pontuado em nenhuma área do candidato hoje — rejeitá-lo não altera a nota.
      </div>
    );
  }
  return (
    <div style={{ fontSize: '0.7rem', color: '#7c2d12', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 5, padding: '4px 8px', marginBottom: 6, fontWeight: 600 }}>
      📊 Pontuação atual: {impacts.map((x) => `${x.delta} pts em ${x.area}`).join(' | ')} — rejeitar remove esses pontos.
    </div>
  );
}

// Mostra o impacto real da experiência gerencial/interina — vale igual em todas as áreas.
function ExperiencePointsBadge({ profile, override }: { profile: ParticipantProfile; override?: { managerialMonths?: number; interimMonths?: number } }) {
  const managerial = override?.managerialMonths ?? profile.managerialMonths ?? 0;
  const interim = override?.interimMonths ?? profile.interimMonths ?? 0;
  const score = experienceScore(managerial, interim);
  if (score <= 0) {
    return (
      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 6 }}>
        📊 Sem meses de experiência informados — não está pontuando hoje.
      </div>
    );
  }
  return (
    <div style={{ fontSize: '0.7rem', color: '#7c2d12', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 5, padding: '4px 8px', marginBottom: 6, fontWeight: 600 }}>
      📊 Pontuação atual: {Math.round(score * 10) / 10} pts em todas as áreas do candidato — rejeitar remove esses pontos.
    </div>
  );
}

// ─── Ajuste manual de experiência gerencial/interina pelo administrador ────────
// Sobrepõe o valor autodeclarado pelo candidato no cálculo de pontuação (todas as áreas).
function ExperienceOverrideEditor({
  profile,
  override,
  onSave,
  onClear,
  saving,
}: {
  profile: ParticipantProfile;
  override?: { managerialMonths?: number; interimMonths?: number; note?: string; adjustedAt?: string };
  onSave: (managerialMonths: number, interimMonths: number, note: string) => Promise<boolean | void>;
  onClear: () => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [managerial, setManagerial] = useState<number>(override?.managerialMonths ?? profile.managerialMonths ?? 0);
  const [interim, setInterim] = useState<number>(override?.interimMonths ?? profile.interimMonths ?? 0);
  const [note, setNote] = useState(override?.note ?? '');

  const hasOverride = override && (override.managerialMonths !== undefined || override.interimMonths !== undefined);

  if (!editing) {
    return (
      <div style={{ marginBottom: 10 }}>
        {hasOverride && (
          <div style={{ fontSize: '0.72rem', color: '#7c2d12', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '6px 10px', marginBottom: 6 }}>
            ✏️ <strong>Ajustado pelo administrador:</strong> {override!.managerialMonths ?? profile.managerialMonths ?? 0}m gerencial + {override!.interimMonths ?? profile.interimMonths ?? 0}m interino
            {override?.note ? ` — ${override.note}` : ''}
            <span style={{ display: 'block', color: '#92400e', marginTop: 2 }}>Valor declarado originalmente pelo candidato: {profile.managerialMonths ?? 0}m + {profile.interimMonths ?? 0}m.</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setEditing(true)}
            style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer' }}>
            ✏️ {hasOverride ? 'Editar ajuste' : 'Ajustar tempo de experiência'}
          </button>
          {hasOverride && (
            <button type="button" onClick={onClear} disabled={saving}
              style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              ↩️ Restaurar valor do candidato
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10, padding: '10px 12px', background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 8 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>✏️ Ajustar tempo de experiência (sobrepõe o valor declarado pelo candidato em todas as áreas)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: '0.7rem', color: '#475569' }}>
          Meses gerencial efetivo
          <input type="number" min={0} value={managerial} onChange={(e) => setManagerial(Number(e.target.value) || 0)}
            style={{ display: 'block', width: '100%', marginTop: 3, fontSize: '0.8rem', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </label>
        <label style={{ fontSize: '0.7rem', color: '#475569' }}>
          Meses interino
          <input type="number" min={0} value={interim} onChange={(e) => setInterim(Number(e.target.value) || 0)}
            style={{ display: 'block', width: '100%', marginTop: 3, fontSize: '0.8rem', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </label>
      </div>
      <textarea rows={2} placeholder="Motivo do ajuste (ex: candidato declarou período incorreto, confirmado com RH...)"
        value={note} onChange={(e) => setNote(e.target.value)}
        style={{ width: '100%', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', resize: 'vertical', fontFamily: 'inherit', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={saving} onClick={async () => { const ok = await onSave(managerial, interim, note); if (ok !== false) setEditing(false); }}
          style={{ fontSize: '0.75rem', fontWeight: 700, padding: '5px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? '⏳ Salvando...' : '💾 Salvar ajuste'}
        </button>
        <button type="button" onClick={() => setEditing(false)}
          style={{ fontSize: '0.75rem', fontWeight: 600, padding: '5px 14px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
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
  const [showNote, setShowNote] = useState(!!validation?.note);
  const [saved, setSaved] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Salva automaticamente assim que o admin clica em Pendente/Validado/Rejeitado — sem precisar de botão separado
  const selectStatus = (s: ItemValidation['status']) => {
    setStatus(s);
    onSave({ itemKey, status: s, note });
    flashSaved();
  };

  // Salva a observação automaticamente quando o admin sai do campo (sem precisar de botão)
  const saveNote = () => {
    onSave({ itemKey, status, note });
    flashSaved();
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
              onChange={() => selectStatus(s)} style={{ display: 'none' }} />
            {STATUS_COLORS[s].label}
          </label>
        ))}
        <button type="button" onClick={() => setShowNote(!showNote)}
          style={{ fontSize: '0.68rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: '#64748b' }}>
          {showNote ? '▲ Ocultar obs.' : '✏️ Adicionar obs.'}
        </button>
        {saved && (
          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginLeft: 'auto' }}>
            ✓ Salvo automaticamente
          </span>
        )}
      </div>
      {showNote && (
        <textarea
          rows={2}
          placeholder="Observação para este item (ex: documento inválido, precisa reenviar...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
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

// ─── Seletor de reclassificação de projeto ─────────────────────────────────
// Mostrado quando o título escolhido pelo candidato não bate com o catálogo da área
// vinculada — permite ao admin escolher o item correto do catálogo para essa área,
// sem alterar o texto original informado pelo candidato.
function ProjectRelabelPicker({ area, onPick, saving }: {
  area: string;
  onPick: (newLabel: string) => void;
  saving: boolean;
}) {
  const options = CATALOG_ITEMS.filter((ci) => ci.group === 'project' && (ci as any).area === area);
  if (options.length === 0) return null;
  return (
    <div style={{ marginBottom: 8, padding: '8px 10px', background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 6 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
        🔄 Título não reconhecido para esta área — se o comprovante corresponder a outro item do catálogo, reclassifique aqui:
      </div>
      <select
        defaultValue=""
        disabled={saving}
        onChange={(e) => { if (e.target.value) onPick(e.target.value); }}
        style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1.5px solid #93c5fd', background: 'white', color: '#1e293b', cursor: 'pointer', width: '100%' }}
      >
        <option value="">Selecione o item correto do catálogo...</option>
        {options.map((o) => (
          <option key={o.id} value={o.label}>{o.label} — {(o as any).points} pts</option>
        ))}
      </select>
    </div>
  );
}

function ExceptionAssignmentPicker({
  candidateAreas, assignment, onSave, onClear, saving,
}: {
  candidateAreas: string[];
  assignment?: { area: string; label: string; type: 'projeto' | 'pos-mba' };
  onSave: (area: string, label: string, type: 'projeto' | 'pos-mba') => void;
  onClear: () => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(!assignment);
  const [area, setArea] = useState(assignment?.area || '');
  const [type, setType] = useState<'projeto' | 'pos-mba'>(assignment?.type || 'projeto');
  const [label, setLabel] = useState(assignment?.label || '');

  const options = area
    ? CATALOG_ITEMS.filter((ci) => ci.group === (type === 'projeto' ? 'project' : 'postMBA') && (ci as any).area === area)
    : [];

  if (!editing && assignment) {
    const catalogItem = CATALOG_ITEMS.find((ci) => ci.label === assignment.label && (ci as any).area === assignment.area && ci.group === (assignment.type === 'projeto' ? 'project' : 'postMBA'));
    const pts = (catalogItem as any)?.points;
    return (
      <div style={{ marginBottom: 8, padding: '8px 10px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 6 }}>
        <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>
          ✅ Vinculado ao catálogo: "{assignment.label}" — {AREA_LABELS[assignment.area] || assignment.area} — {assignment.type === 'projeto' ? 'Projeto' : 'Pós/MBA'}{pts !== undefined ? ` — ${pts} pts` : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" onClick={() => setEditing(true)} disabled={saving}
            style={{ fontSize: '0.68rem', color: '#1d4ed8', background: 'white', border: '1px solid #93c5fd', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
            ✏️ Alterar
          </button>
          <button type="button" onClick={onClear} disabled={saving}
            style={{ fontSize: '0.68rem', color: '#b91c1c', background: 'white', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
            🗑 Remover vínculo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8, padding: '8px 10px', background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 6 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
        🎯 Vincular esta exceção a um item do catálogo (área + tipo + item correspondente)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <select value={area} onChange={(e) => { setArea(e.target.value); setLabel(''); }}
          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1.5px solid #93c5fd', background: 'white' }}>
          <option value="">Área...</option>
          {candidateAreas.map((a) => <option key={a} value={a}>{AREA_LABELS[a] || a}</option>)}
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value as 'projeto' | 'pos-mba'); setLabel(''); }}
          style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1.5px solid #93c5fd', background: 'white' }}>
          <option value="projeto">Projeto</option>
          <option value="pos-mba">Pós/MBA</option>
        </select>
      </div>
      <select value={label} onChange={(e) => setLabel(e.target.value)} disabled={!area}
        style={{ width: '100%', fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1.5px solid #93c5fd', background: 'white', marginBottom: 8 }}>
        <option value="">{area ? 'Selecione o item do catálogo...' : 'Escolha a área primeiro'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.label}>{o.label} — {(o as any).points} pts</option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={saving || !area || !label} onClick={() => { onSave(area, label, type); setEditing(false); }}
          style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving || !area || !label ? 0.6 : 1 }}>
          {saving ? '⏳ Salvando...' : '💾 Salvar vínculo'}
        </button>
        {assignment && (
          <button type="button" onClick={() => setEditing(false)}
            style={{ fontSize: '0.72rem', color: '#64748b', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>
            Cancelar
          </button>
        )}
      </div>
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

  // Detecta se o valor salvo é base64 real ou apenas nome de arquivo (bug legado)
  const isValidBase64 = React.useMemo(() => {
    if (!base64) return false;
    if (base64.startsWith('data:')) return true; // data URL válida
    if (base64.length < 50) return false; // muito curto para ser base64
    // Testa se é base64 válido
    try { atob(base64.slice(0, 100)); return true; } catch { return false; }
  }, [base64]);

  const mime = fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : fileName.match(/\.(jpe?g|png|gif|webp)$/i) ? 'image/' + fileName.split('.').pop() : 'application/octet-stream');
  const dataUrl = base64.startsWith('data:') ? base64 : `data:${mime};base64,${base64}`;
  const isPdf = mime === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = mime.startsWith('image/');

  // Usa Blob URL para download — evita bloqueio do Edge/Chrome com data: URLs
  const download = () => {
    try {
      const raw = base64.startsWith('data:') ? base64.split(',')[1] : base64;
      const bytes = atob(raw);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
    } catch {
      alert('Não foi possível baixar: o arquivo não foi salvo corretamente. O participante precisa reenviar o formulário.');
    }
  };

  // Arquivo não salvo corretamente (bug legado — apenas nome foi armazenado)
  if (!isValidBase64) {
    return (
      <div style={{ marginTop: 8 }}>
        {label && <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>}
        <div style={{ fontSize: '0.72rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 10px', color: '#92400e' }}>
          ⚠️ Arquivo registrado como <strong>{base64}</strong>, mas o conteúdo não foi salvo.
          O participante precisa acessar o formulário e reenviar o documento.
        </div>
      </div>
    );
  }

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

// Normaliza chaves de comprovante: remove espaços extras e espaços após ":" no separador
function normalizeKey(key: string): string {
  // Separa prefixo (ex: "curso5_2") do nome
  const colonIdx = key.indexOf(':');
  if (colonIdx < 0) return key.trim();
  const prefix = key.slice(0, colonIdx).trim();
  const name = key.slice(colonIdx + 1).trim(); // trim do nome (remove espaço inicial)
  return `${prefix}:${name}`;
}

function hasInlineProof(value?: string): boolean {
  if (!value) return false;
  if (value.startsWith('data:')) return true;
  if (value.length < 100) return false;
  // Rejeita nomes de arquivo legados: contêm extensão comum de documento
  if (/\.(pdf|docx?|xlsx?|png|jpe?g|gif|webp)$/i.test(value.trim())) return false;
  // Testa se é base64 válido
  try { atob(value.slice(0, 100)); return true; } catch { return false; }
}

// ─── Visualizador de comprovante (inline ou banco) ──────────────────────────
// Busca o arquivo da API quando não está no proofFiles inline
function ProofFileViewer({ email, itemKey, inlineValue, fileName, label, onUploaded }: {
  email: string;
  itemKey: string;
  inlineValue?: string;
  fileName: string;
  label?: string;
  onUploaded?: (b: string) => void;
}) {
  const [base64, setBase64] = React.useState<string | null>(inlineValue && hasInlineProof(inlineValue) ? inlineValue : null);
  const [loading, setLoading] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (base64) return; // já tem inline
    setLoading(true);
    setNotFound(false);
    fetch(`/api/admin/proof-file?email=${encodeURIComponent(email)}&itemKey=${encodeURIComponent(itemKey)}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => { if (data.fileData) setBase64(data.fileData); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [email, itemKey]);

  if (loading) return <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6 }}>⏳ Carregando comprovante...</div>;
  return (
    <div>
      {notFound ? (
        // Nenhum comprovante principal ainda — mostrar uploader para o admin anexar (slot 0)
        <AdminProofUploader email={email} itemKey={itemKey} onUploaded={(b) => { setBase64(b); setNotFound(false); onUploaded?.(b); }} />
      ) : base64 ? (
        <FileViewer base64={base64} fileName={fileName} label={label} />
      ) : null}
      {/* Documentos extras — até 2, totalizando no máximo 3 por item junto com o principal acima */}
      {!notFound && base64 && <ExtraProofFiles email={email} itemKey={itemKey} baseFileName={fileName} />}
    </div>
  );
}

// ─── Documentos extras (até 2, além do comprovante principal) ──────────────
function ExtraProofFiles({ email, itemKey, baseFileName }: { email: string; itemKey: string; baseFileName: string }) {
  const [files, setFiles] = React.useState<{ slot: number; fileName: string; fileData: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/proof-extra?email=${encodeURIComponent(email)}&itemKey=${encodeURIComponent(itemKey)}`)
      .then((r) => r.json())
      .then((d) => setFiles(d.files || []))
      .catch(() => setError('Erro ao carregar documentos extras.'))
      .finally(() => setLoading(false));
  }, [email, itemKey]);

  React.useEffect(() => { load(); }, [load]);

  const remove = async (slot: number) => {
    if (!confirm('Remover este documento?')) return;
    try {
      await fetch('/api/admin/proof-extra', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, itemKey, slot }),
      });
      load();
    } catch {
      setError('Erro ao remover documento.');
    }
  };

  if (loading) return null;
  const totalDocs = 1 + files.length; // 1 = comprovante principal (slot 0)
  const canAddMore = totalDocs < 3;

  return (
    <div style={{ marginTop: 10 }}>
      {files.map((f) => (
        <div key={f.slot} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <FileViewer base64={f.fileData} fileName={f.fileName || `${baseFileName}-extra${f.slot}`} label={`Documento adicional ${f.slot + 1}`} />
          </div>
          <button
            type="button"
            onClick={() => remove(f.slot)}
            style={{ fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🗑 Remover
          </button>
        </div>
      ))}
      {error && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4 }}>⚠ {error}</div>}
      {canAddMore ? (
        <AdminExtraProofUploader
          email={email}
          itemKey={itemKey}
          nextSlot={files.length === 0 ? 1 : Math.max(...files.map((f) => f.slot)) + 1}
          onUploaded={load}
        />
      ) : (
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6 }}>Limite de 3 documentos por item atingido.</div>
      )}
    </div>
  );
}

// ─── Upload de documento extra (slot 1 ou 2) ────────────────────────────────
function AdminExtraProofUploader({ email, itemKey, nextSlot, onUploaded }: {
  email: string;
  itemKey: string;
  nextSlot: number;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputId = `admin-extra-upload-${itemKey.replace(/[^a-z0-9]/gi, '_')}-${nextSlot}`;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Arquivo muito grande (limite: 20 MB)');
      return;
    }
    setError('');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/admin/proof-extra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, itemKey, slot: nextSlot, fileData: base64, fileName: file.name }),
        });
        if (res.ok) {
          onUploaded();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error || 'Erro ao salvar. Tente novamente.');
        }
      } catch {
        setError('Erro de conexão.');
      }
      setUploading(false);
      e.target.value = '';
    };
    reader.onerror = () => { setError('Erro ao ler o arquivo.'); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginTop: 8, padding: '8px 12px', background: '#eff6ff', border: '1.5px dashed #3b82f6', borderRadius: 8 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>📤 Adicionar documento {nextSlot + 1} de 3</div>
      <input id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={uploading}
          style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? '⏳ Salvando...' : '📎 Selecionar arquivo extra'}
        </button>
        {error && <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>⚠ {error}</span>}
      </div>
    </div>
  );
}

// ─── Upload de comprovante pelo administrador ────────────────────────────────
function AdminProofUploader({ email, itemKey, onUploaded }: {
  email: string;
  itemKey: string;
  onUploaded: (base64: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [savedOk, setSavedOk] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputId = `admin-upload-${itemKey.replace(/[^a-z0-9]/gi, '_')}`;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Arquivo muito grande (limite: 20 MB)');
      return;
    }
    setError('');
    setUploading(true);
    setSavedOk(false);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/participant/proof', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, itemKey, fileData: base64, mode: 'upload' }),
        });
        if (res.ok) {
          setSavedOk(true);
          onUploaded(base64);
        } else {
          setError('Erro ao salvar. Tente novamente.');
        }
      } catch {
        setError('Erro de conexão.');
      }
      setUploading(false);
    };
    reader.onerror = () => { setError('Erro ao ler o arquivo.'); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1.5px dashed #16a34a', borderRadius: 8 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', marginBottom: 6 }}>📤 Upload pelo administrador</div>
      <input id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={uploading}
          style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? '⏳ Salvando...' : '📎 Selecionar arquivo'}
        </button>
        {savedOk && <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>✓ Arquivo salvo com sucesso!</span>}
        {error && <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>⚠ {error}</span>}
      </div>
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

// ─── Análise automática de aderência do projeto a TODAS as áreas do candidato ──
// Gerada pelo sistema para o auditor revisar o motivo antes de decidir/validar.
function ProjectAreaAdherenceAnalysis({ proj, candidateAreas, assignedArea }: {
  proj: string;
  candidateAreas: string[];
  assignedArea?: string | null;
}) {
  if (!candidateAreas || candidateAreas.length === 0) return null;

  const rows = candidateAreas.map((area) => {
    const catalogItem = CATALOG_ITEMS.find((ci) => ci.group === 'project' && ci.label === proj && (ci as any).area === area);
    const aderente = !!catalogItem;
    return {
      area,
      aderente,
      pts: catalogItem ? (catalogItem as any).points ?? 15 : 0,
      tipo: catalogItem ? ((catalogItem as any).points >= 20 ? 'Estratégico Central' : 'Complementar') : null,
      motivo: aderente
        ? `Projeto consta no catálogo oficial para a área ${AREA_LABELS[area] || area}.`
        : `Projeto não consta no catálogo oficial de projetos estratégicos para a área ${AREA_LABELS[area] || area}.`,
    };
  });

  return (
    <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 10px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6 }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5b21b6', marginBottom: 6 }}>
        🔎 Análise de aderência a todas as áreas do candidato (gerada pelo sistema)
      </div>
      {rows.map((r) => (
        <div key={r.area} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.72rem', padding: '3px 0', borderBottom: '1px solid #ede9fe' }}>
          <span style={{ flexShrink: 0, fontWeight: 700, color: r.aderente ? '#15803d' : '#94a3b8' }}>
            {r.aderente ? '✅' : '·'} {AREA_LABELS[r.area] || r.area}
            {r.area === assignedArea ? ' (vinculada)' : ''}
          </span>
          <span style={{ color: '#475569' }}>
            {r.aderente ? `${r.pts} pts — ${r.tipo}. ` : ''}{r.motivo}
          </span>
        </div>
      ))}
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
  const [loadError, setLoadError] = useState('');

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
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/audit-profile?email=${encodeURIComponent(email)}`);
      const rawText = await res.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(`Resposta inválida do servidor (status ${res.status}): ${rawText.slice(0, 300)}`);
      }
      if (!res.ok) {
        throw new Error(data?.error || `Erro ${res.status} ao carregar ficha`);
      }
      setSelected(data);
      setOverallNote(data.audit?.overallNote || '');
    } catch (err: any) {
      console.error('[audit] erro ao carregar ficha:', err);
      setLoadError(err?.message || 'Erro desconhecido ao carregar a ficha.');
    } finally {
      setLoading(false);
    }
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

  // Salva o ajuste manual de experiência gerencial/interina feito pelo administrador
  const saveExperienceOverride = async (managerialMonths: number, interimMonths: number, note: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/audit-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selected.profile.id,
          experienceOverride: { managerialMonths, interimMonths, note },
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(`❌ Erro ao salvar ajuste: ${errData.error || res.statusText}`);
        setSaving(false);
        return false;
      }
      // Recarrega os dados direto do servidor (em vez de só atualizar o estado local),
      // garantindo que a tela sempre mostre o que realmente foi persistido no banco.
      if (selected.profile.email) await loadProfile(selected.profile.email);
      setSaving(false);
      showToast('Experiência ajustada!');
      return true;
    } catch (err) {
      showToast('❌ Erro de conexão ao salvar ajuste. Tente novamente.');
      setSaving(false);
      return false;
    }
  };

  // Remove o ajuste manual, voltando ao valor autodeclarado pelo candidato
  const clearExperienceOverride = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/audit-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: selected.profile.id, clearExperienceOverride: true }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(`❌ Erro ao remover ajuste: ${errData.error || res.statusText}`);
        setSaving(false);
        return;
      }
      if (selected.profile.email) await loadProfile(selected.profile.email);
      setSaving(false);
      showToast('Ajuste removido — voltou ao valor declarado pelo candidato.');
    } catch (err) {
      showToast('❌ Erro de conexão ao remover ajuste. Tente novamente.');
      setSaving(false);
    }
  };

  // Salva a área vinculada a um projeto (quando o admin corrige manualmente)
  const saveProjectArea = async (proj: string, area: string) => {
    if (!selected) return;
    const newMap = { ...(selected.profile.projectAreaMap || {}), [proj]: area };
    await fetch('/api/admin/update-participant-field', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: selected.profile.id, field: 'projectAreaMap', value: newMap }),
    });
    setSelected((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          projectAreaMap: newMap as ParticipantProfile['projectAreaMap'],
        },
      };
    });
    showToast(`Área vinculada ao projeto salva!`);
  };

  // Reclassifica o título de um projeto (troca o item do catálogo usado no cálculo de pontos),
  // sem alterar o texto original informado pelo candidato — usado quando o título escolhido no
  // cadastro não é o item correto do catálogo para a área, mas o comprovante comprova outro tema.
  const saveProjectRelabel = async (itemKey: string, newLabel: string | null) => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/audit-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: selected.profile.id, projectRelabel: { itemKey, newLabel } }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(`❌ Erro ao reclassificar: ${errData.error || res.statusText}`);
        setSaving(false);
        return false;
      }
      if (selected.profile.email) await loadProfile(selected.profile.email);
      setSaving(false);
      showToast(newLabel ? 'Projeto reclassificado!' : 'Reclassificação removida — voltou ao título original.');
      return true;
    } catch (err) {
      showToast('❌ Erro de conexão ao reclassificar. Tente novamente.');
      setSaving(false);
      return false;
    }
  };

  // Salva a atribuição de área + item do catálogo de uma exceção — exatamente o mesmo tratamento
  // dado a um projeto (área de aplicação + reclassificação), só que para itens fora do catálogo
  // que a UGP reconheceu por equivalência.
  const saveExceptionAssignment = async (itemKey: string, area: string | null, label: string | null, type: 'projeto' | 'pos-mba' | null) => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/audit-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: selected.profile.id, exceptionAssignment: { itemKey, area, label, type } }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(`❌ Erro ao salvar atribuição: ${errData.error || res.statusText}`);
        setSaving(false);
        return false;
      }
      if (selected.profile.email) await loadProfile(selected.profile.email);
      setSaving(false);
      showToast(area && label ? 'Exceção vinculada ao catálogo!' : 'Vínculo removido.');
      return true;
    } catch (err) {
      showToast('❌ Erro de conexão ao salvar atribuição. Tente novamente.');
      setSaving(false);
      return false;
    }
  };

  // Atualiza o estado local após upload de comprovante pelo admin
  const updateProofFile = (itemKey: string, base64: string) => {
    setSelected((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          proofFiles: { ...(prev.profile.proofFiles || {}), [itemKey]: base64 },
          proofMode: { ...(prev.profile.proofMode || {}), [itemKey]: 'upload' },
        },
      };
    });
    showToast('Comprovante salvo pelo administrador!');
  };

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
                  {pt.hasLegacyFiles && (
                    <span style={{ fontSize: '0.62rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 3, padding: '1px 5px', color: '#991b1b', fontWeight: 700 }}>
                      📧 Reenviar docs
                    </span>
                  )}
                  {pt.hasPendingDocs && !pt.hasLegacyFiles && (
                    <span style={{ fontSize: '0.62rem', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 3, padding: '1px 5px', color: '#c2410c', fontWeight: 700 }}>
                      📄 Docs pendentes
                    </span>
                  )}
                  {pt.exceptionRequested && pt.exceptionStatus === 'pending' && (
                    <span style={{ fontSize: '0.62rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 3, padding: '1px 5px', color: '#92400e', fontWeight: 700 }}>
                      ⚠️ Exceção pendente
                    </span>
                  )}
                  {pt.exceptionRequested && pt.exceptionStatus === 'approved' && (
                    <span style={{ fontSize: '0.62rem', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 3, padding: '1px 5px', color: '#065f46', fontWeight: 700 }}>
                      ✓ Exceção aprovada
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

          {!loading && loadError && (
            <div style={{ textAlign: 'center', padding: 60, color: '#991b1b' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Não foi possível carregar a ficha.</p>
              <p style={{ fontSize: '0.8rem', color: '#7f1d1d', maxWidth: 500, margin: '0 auto' }}>{loadError}</p>
            </div>
          )}

          {!loading && !loadError && !selected && (
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
              {(() => {
                // Detectar arquivos legados (apenas nome salvo, sem base64 válido)
                const legacyFiles = Object.entries(p.proofFiles || {}).filter(([key, v]) => {
                  if (!v || typeof v !== 'string') return false;
                  if (hasInlineProof(v)) return false;
                  // Se proofMode é 'upload', o arquivo pode estar no banco
                  const normKey = normalizeKey(key);
                  const mode = p.proofMode?.[key] || p.proofMode?.[normKey];
                  if (mode === 'upload') return false;
                  // Se o slot (prefixo numerado) tem outro arquivo no proofMode mais recente, ignorar entrada órfã
                  const slotPrefix = key.includes(':') ? key.slice(0, key.indexOf(':')) : '';
                  if (slotPrefix && /\d+$/.test(slotPrefix)) {
                    const slotHasNewerEntry = Object.keys(p.proofMode || {}).some(
                      (mk) => mk !== key && mk !== normKey && mk.startsWith(slotPrefix + ':') && p.proofMode![mk] === 'upload'
                    );
                    if (slotHasNewerEntry) return false;
                  }
                  return true;
                });

                // Formatar lista de itens para o e-mail
                const formatKey = (key: string) => {
                  if (key.startsWith('grad:')) return `Graduação — ${key.replace('grad:', '')}`;
                  if (key.startsWith('grad2:')) return `2ª Graduação — ${key.replace('grad2:', '')}`;
                  if (key.startsWith('mba_')) return `Pós/MBA — ${key.replace(/^mba_\d+:/, '')}`;
                  if (key.startsWith('curso5_')) return `Curso — ${key.replace(/^curso5_\d+:/, '')}`;
                  if (key.startsWith('curso7:')) return `Curso — ${key.replace('curso7:', '')}`;
                  if (key.startsWith('proj:')) return `Projeto — ${key.replace('proj:', '')}`;
                  return key;
                };

                const itemList = legacyFiles.map(([key, filename]) =>
                  `  • ${formatKey(key)} (arquivo: ${filename})`
                ).join('\n');

                return (
                  <>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button"
                      onClick={() => openEmailModal(
                        `Análise da sua ficha — Banco de Sucessores — ${p.name}`,
                        `Olá, ${p.name?.split(' ')[0]}!\n\nEstamos analisando sua ficha no Banco de Sucessores e precisamos de mais informações.\n\nPor favor, responda este e-mail com os esclarecimentos necessários.\n\nAtenciosamente,\nEquipe RH/UGP — SEBRAE Tocantins`
                      )}
                      style={{ fontSize: '0.78rem', background: 'white', border: '1.5px solid #0891b2', borderRadius: 7, padding: '7px 16px', cursor: 'pointer', color: '#0891b2', fontWeight: 600 }}>
                      ✉️ Solicitar informações por e-mail
                    </button>

                    {legacyFiles.length > 0 && (
                      <button type="button"
                        onClick={() => openEmailModal(
                          `Banco de Sucessores — Reenvio de documento necessário`,
                          `Prezado(a) ${p.name?.split(' ')[0]},\n\nIdentificamos uma instabilidade técnica no sistema de envio de documentos do Banco de Sucessores que afetou o registro dos comprovantes que você anexou ao seu formulário. O arquivo foi recebido, porém o conteúdo não foi armazenado corretamente.\n\nPara garantir que sua inscrição seja analisada com todos os documentos necessários, pedimos que acesse novamente o formulário e reenvie o(s) comprovante(s) indicado(s) abaixo:\n\n${itemList}\n\nO prazo de envio permanece até 12/06/2026 às 23h59.\n\nAcesse o formulário pelo link: https://aderencia.ecodobem.com\n\nPedimos desculpas pelo transtorno e agradecemos a compreensão.\n\nAtenciosamente,\nEquipe UGP — Eco ao Bem`
                        )}
                        style={{ fontSize: '0.78rem', background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 7, padding: '7px 16px', cursor: 'pointer', color: '#92400e', fontWeight: 700 }}>
                        ⚠️ Solicitar reenvio de {legacyFiles.length} documento{legacyFiles.length > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                  {legacyFiles.length > 0 && (
                    <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>📄 Documento(s) com problema de envio:</div>
                      {legacyFiles.map(([key, filename]) => (
                        <div key={key} style={{ fontSize: '0.72rem', color: '#78350f', marginTop: 2 }}>
                          {'• '}<strong>{formatKey(key)}</strong>{' — arquivo: '}<em>{filename as string}</em>
                        </div>
                      ))}
                    </div>
                  )}
                  </>
                );
              })()}

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
                {/* Badge de comprovação da graduação — chave: grad:<area> ou grad:<nome_curso> para __outro__ */}
                {(() => {
                  // Para __outro__, a chave usa o nome do curso digitado (igual ao participant.tsx)
                  const rawGradKey = p.graduation === '__outro__'
                    ? `grad:${p.graduationCourseName?.trim() || '__outro__'}`
                    : `grad:${p.graduation}`;
                  const gradKey = normalizeKey(rawGradKey);
                  const rawGradKey2 = p.graduation2 ? `grad2:${(p as any).graduation2CourseName?.trim() || p.graduation2}` : null;
                  const gradKey2 = rawGradKey2 ? normalizeKey(rawGradKey2) : null;
                  // Tenta buscar proofMode com ambas as variações (raw e normalizada)
                  const mode = p.proofMode?.[rawGradKey] || p.proofMode?.[gradKey] || (gradKey2 && rawGradKey2 ? (p.proofMode?.[rawGradKey2] || p.proofMode?.[gradKey2]) : undefined);
                  const fileKey = mode === 'upload' ? (p.proofFiles?.[rawGradKey] || p.proofFiles?.[gradKey] ? (p.proofFiles?.[rawGradKey] ? rawGradKey : gradKey) : (gradKey2 || gradKey)) : gradKey;
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
                      {mode !== 'ugp-knows' && (
                        <ProofFileViewer email={p.email!} itemKey={gradKey} inlineValue={p.proofFiles?.[rawGradKey] || p.proofFiles?.[gradKey]} fileName="comprovante-graduacao" label="Comprovante de graduação" onUploaded={(b) => updateProofFile(gradKey, b)} />
                      )}
                      {mode === 'ugp-knows' && (
                        <AdminProofUploader email={p.email!} itemKey={gradKey} onUploaded={(b) => updateProofFile(gradKey, b)} />
                      )}
                      {mode === 'upload' && (p as any).proofLinks?.[fileKey] && (
                        <div style={{ marginTop: 6, padding: '6px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af' }}>🔗 Link externo (Google Drive / OneDrive): </span>
                          <a href={(p as any).proofLinks[fileKey]} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#1d4ed8', wordBreak: 'break-all' }}>{(p as any).proofLinks[fileKey]}</a>
                        </div>
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
                  // IMPORTANTE: usar o índice ORIGINAL do mbaBlocks (não do array filtrado)
                  // pois a chave salva pelo candidato usa o índice original (ex: mba_2:nome, não mba_1:nome)
                  const blocks: Array<{area?: string; name?: string; year?: string}> = (p as any).mbaBlocks || [];
                  // Inclui também títulos com __outro_mba__ (area não identificada) que tenham nome preenchido
                  const validBlocksWithIndex = blocks
                    .map((b, origIdx) => ({ ...b, origIdx }))
                    .filter((b) => b.area && b.name?.trim());
                  if (validBlocksWithIndex.length === 0) {
                    return <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Nenhum título declarado.</p>;
                  }
                  return (
                    <>
                      {validBlocksWithIndex.map((mba, i) => {
                        const mbaKey = normalizeKey(`mba_${mba.origIdx}:${mba.name!.trim()}`);
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
                            {mode !== 'ugp-knows' && (
                              <ProofFileViewer email={p.email!} itemKey={mbaKey} inlineValue={p.proofFiles?.[mbaKey]} fileName={`comprovante-pos-${i + 1}`} label="Comprovante enviado" onUploaded={(b) => updateProofFile(mbaKey, b)} />
                            )}
                            {mode === 'ugp-knows' && (
                              <AdminProofUploader email={p.email!} itemKey={mbaKey} onUploaded={(b) => updateProofFile(mbaKey, b)} />
                            )}
                            {mode === 'upload' && (p as any).proofLinks?.[mbaKey] && (
                              <div style={{ marginTop: 6, padding: '6px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6 }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af' }}>🔗 Link externo: </span>
                                <a href={(p as any).proofLinks[mbaKey]} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#1d4ed8', wordBreak: 'break-all' }}>{(p as any).proofLinks[mbaKey]}</a>
                              </div>
                            )}
                            <PostMBAPointsBadge profile={p} index={i} />
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
                        const rawKey = `curso5_${i}:${course.name!.trim()}`;
                        const key = normalizeKey(rawKey);
                        const mode = p.proofMode?.[rawKey] || p.proofMode?.[key];
                        return (
                          <div key={`free-${i}`} style={{ marginBottom: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{course.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Área: {course.area} • {course.hours}h</div>
                            <ProofBadge mode={mode} />
                            {mode !== 'ugp-knows' && (
                              <ProofFileViewer email={p.email!} itemKey={key} inlineValue={p.proofFiles?.[rawKey] || p.proofFiles?.[key]} fileName={`comprovante-curso-${i + 1}`} label="Comprovante enviado" onUploaded={(b) => updateProofFile(key, b)} />
                            )}
                            {mode === 'ugp-knows' && (
                              <AdminProofUploader email={p.email!} itemKey={key} onUploaded={(b) => updateProofFile(key, b)} />
                            )}
                            {mode === 'upload' && (p as any).proofLinks?.[key] && (
                              <div style={{ marginTop: 6, padding: '6px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6 }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af' }}>🔗 Link externo: </span>
                                <a href={(p as any).proofLinks[key]} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#1d4ed8', wordBreak: 'break-all' }}>{(p as any).proofLinks[key]}</a>
                              </div>
                            )}
                            <ValidationControls itemKey={`curso-free-${i}`} validation={getValidation(`curso-free-${i}`)} onSave={saveItemValidation} />
                          </div>
                        );
                      })}
                      {catCourses.map((course, i) => {
                        const rawKey = `curso7:${course}`;
                        const key = normalizeKey(rawKey);
                        const mode = p.proofMode?.[rawKey] || p.proofMode?.[key];
                        return (
                          <div key={`cat-${i}`} style={{ marginBottom: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{course}</div>
                            {p.courseHours?.[course] && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Carga horária: {p.courseHours[course]}h</div>
                            )}
                            <ProofBadge mode={mode} />
                            {/* ProofFileViewer sempre tenta carregar — mostra uploader internamente se não achar */}
                            {mode !== 'ugp-knows' && (
                              <ProofFileViewer email={p.email!} itemKey={key} inlineValue={p.proofFiles?.[rawKey] || p.proofFiles?.[key]} fileName={`comprovante-curso-cat-${i + 1}`} label="Comprovante enviado" onUploaded={(b) => updateProofFile(key, b)} />
                            )}
                            {mode === 'ugp-knows' && (
                              <AdminProofUploader email={p.email!} itemKey={key} onUploaded={(b) => updateProofFile(key, b)} />
                            )}
                            {mode === 'upload' && (p as any).proofLinks?.[key] && (
                              <div style={{ marginTop: 6, padding: '6px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6 }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af' }}>🔗 Link externo: </span>
                                <a href={(p as any).proofLinks[key]} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#1d4ed8', wordBreak: 'break-all' }}>{(p as any).proofLinks[key]}</a>
                              </div>
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
                <ExperienceOverrideEditor
                  profile={p}
                  override={(selected?.audit as any)?.experienceOverride}
                  onSave={saveExperienceOverride}
                  onClear={clearExperienceOverride}
                  saving={saving}
                  key={p.id}
                />
                <ExperiencePointsBadge profile={p} override={(selected?.audit as any)?.experienceOverride} />
                <ValidationControls itemKey="experiencia" validation={getValidation('experiencia')} onSave={saveItemValidation} />
              </SectionCard>

              {/* ── 7. Projetos Estratégicos ── */}
              <SectionCard title="7. Projetos Estratégicos" icon="📋">
                {(p.selectedProjects || []).length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Nenhum projeto selecionado.</p>
                ) : (
                  (p.selectedProjects || []).map((proj, i) => {
                    // Chave correta: proj:<nome do projeto> — tenta ambas as variações (raw e normalizada)
                    const rawProjKey = `proj:${proj}`;
                    const projKey = normalizeKey(rawProjKey);
                    // Busca em proofMode com ambas as variações
                    const mode = p.proofMode?.[rawProjKey] || p.proofMode?.[projKey];
                    // Busca em proofFiles com ambas as variações
                    const projProof = p.proofFiles?.[rawProjKey] || p.proofFiles?.[projKey];
                    // Busca em proofLinks com ambas as variações
                    const projProofLink = (p as any).proofLinks?.[rawProjKey] || (p as any).proofLinks?.[projKey];
                    const assignedArea2 = p.projectAreaMap?.[proj];
                    const projItemKey = `projeto-${i}`;
                    const relabels: Record<string, string> = (selected?.audit as any)?.projectRelabels || {};
                    const relabeledTitle = relabels[projItemKey];
                    const effectiveTitle = relabeledTitle || proj;
                    const catalogMatch2 = assignedArea2
                      ? CATALOG_ITEMS.find((ci) => ci.group === 'project' && ci.label === effectiveTitle && (ci as any).area === assignedArea2)
                      : null;
                    // Verifica se a área já atingiu o teto de 20 pts com OUTROS projetos vinculados antes deste,
                    // mesmo que este projeto esteja corretamente reconhecido no catálogo.
                    let capReached = false;
                    let effectivePts = (catalogMatch2 as any)?.points ?? 0;
                    if (catalogMatch2 && assignedArea2) {
                      const allProjectsList = p.selectedProjects || [];
                      const projsInSameArea = allProjectsList.filter((pp) => p.projectAreaMap?.[pp] === assignedArea2);
                      const itemsInArea = CATALOG_ITEMS.filter((ci) => ci.group === 'project' && projsInSameArea.includes(ci.label) && (ci as any).area === assignedArea2);
                      const totalBefore = itemsInArea
                        .filter((ci) => projsInSameArea.indexOf(ci.label) < projsInSameArea.indexOf(proj))
                        .reduce((acc, ci) => acc + ((ci as any).points ?? 0), 0);
                      effectivePts = Math.max(0, Math.min((catalogMatch2 as any).points ?? 0, 20 - totalBefore));
                      capReached = effectivePts <= 0;
                    }
                    const projScore = capReached
                      ? { pts: 0, type: `Reconhecido no catálogo, mas o teto de 20 pts da área já foi atingido por outro(s) projeto(s) — não adiciona pontos`, pontua: false, capOnly: true }
                      : catalogMatch2
                      ? { pts: effectivePts, type: (catalogMatch2 as any).points >= 20 ? 'Estratégico Central' : 'Complementar', pontua: true, capOnly: false }
                      : assignedArea2
                      ? { pts: 0, type: 'Não reconhecido no catálogo para esta área', pontua: false, capOnly: false }
                      : { pts: null, type: 'Área não vinculada', pontua: false, capOnly: false };
                    return (
                      <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', border: `1px solid ${!assignedArea2 ? '#fcd34d' : projScore.capOnly ? '#fcd34d' : projScore.pontua ? '#86efac' : '#fca5a5'}`, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{proj}</div>
                          <div style={{ flexShrink: 0, marginLeft: 8, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                            background: !assignedArea2 ? '#fef3c7' : projScore.capOnly ? '#fffbeb' : projScore.pontua ? '#f0fdf4' : '#fef2f2',
                            color: !assignedArea2 ? '#92400e' : projScore.capOnly ? '#b45309' : projScore.pontua ? '#15803d' : '#dc2626',
                            border: `1px solid ${!assignedArea2 ? '#fcd34d' : projScore.capOnly ? '#fcd34d' : projScore.pontua ? '#86efac' : '#fca5a5'}` }}>
                            {!assignedArea2 ? '⚠️ Sem área' : projScore.capOnly ? `⚠️ Reconhecido — teto de 20 pts atingido` : projScore.pontua ? `✅ ${projScore.pts} pts — ${projScore.type}` : `❌ 0 pts — ${projScore.type}`}
                          </div>
                        </div>
                        {projScore.capOnly && (
                          <div style={{ fontSize: '0.7rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>
                            ℹ️ Este projeto é reconhecido corretamente no catálogo para a área vinculada, mas <strong>não soma pontos</strong> porque a área já atingiu o limite de 20 pts com outro(s) projeto(s). Validar é adequado (o comprovante é legítimo), mas não altera a nota final desta área.
                          </div>
                        )}
                        {relabeledTitle && (
                          <div style={{ fontSize: '0.72rem', color: '#5b21b6', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>
                            🔄 <strong>Reclassificado pelo administrador para:</strong> "{relabeledTitle}" (título original do candidato: "{proj}")
                            <button type="button" onClick={() => saveProjectRelabel(projItemKey, null)} disabled={saving}
                              style={{ marginLeft: 8, fontSize: '0.65rem', color: '#7c3aed', background: 'none', border: '1px solid #ddd6fe', borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}>
                              ↩️ Desfazer
                            </button>
                          </div>
                        )}
                        {!relabeledTitle && !catalogMatch2 && assignedArea2 && (
                          <ProjectRelabelPicker area={assignedArea2} onPick={(newLabel) => saveProjectRelabel(projItemKey, newLabel)} saving={saving} />
                        )}
                        {p.projectAreaMap?.[proj] ? (
                          <div style={{ fontSize: '0.72rem', color: '#5b21b6', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            🎯 Área de aplicação: {AREA_LABELS[p.projectAreaMap[proj]] || p.projectAreaMap[proj]}
                            <button
                              type="button"
                              onClick={() => {
                                const newMap = { ...(p.projectAreaMap || {}) };
                                delete newMap[proj];
                                saveProjectArea(proj, '');
                              }}
                              style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}
                              title="Alterar área"
                            >
                              ✏️ Alterar
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginBottom: 8, padding: '8px 10px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 6 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                              ⚠️ Sem área vinculada — este projeto não entrará no cálculo. Vincule uma área abaixo:
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <select
                                defaultValue=""
                                onChange={(e) => { if (e.target.value) saveProjectArea(proj, e.target.value); }}
                                style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, border: '1.5px solid #fcd34d', background: 'white', color: '#1e293b', cursor: 'pointer' }}
                              >
                                <option value="">Selecione a área...</option>
                                {Object.entries(AREA_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                              <span style={{ fontSize: '0.68rem', color: '#92400e' }}>Somente áreas de interesse do candidato serão consideradas no cálculo.</span>
                            </div>
                          </div>
                        )}
                        <ProjectAreaAdherenceAnalysis proj={proj} candidateAreas={p.selectedAreas || []} assignedArea={assignedArea2} />
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
                        {mode !== 'ugp-knows' && (
                          <ProofFileViewer email={p.email!} itemKey={projKey} inlineValue={projProof} fileName={`comprovante-projeto-${i + 1}`} label="Comprovante enviado" onUploaded={(b) => updateProofFile(projKey, b)} />
                        )}
                        {mode === 'ugp-knows' && (
                          <AdminProofUploader email={p.email!} itemKey={projKey} onUploaded={(b) => updateProofFile(projKey, b)} />
                        )}
                        {mode === 'upload' && projProofLink && (
                          <div style={{ marginTop: 6, padding: '6px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e40af' }}>🔗 Link externo: </span>
                            <a href={projProofLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#1d4ed8', wordBreak: 'break-all' }}>{projProofLink}</a>
                          </div>
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

                  {/* Decisão histórica/legada da exceção (formato antigo, um único registro por candidato) —
                      NÃO é mais o que determina a pontuação. Hoje cada exceção abaixo tem seu próprio
                      vínculo de catálogo (ver "🎯 Vincular esta exceção..." em cada card). Mantido aqui
                      apenas como registro histórico da decisão anterior. */}
                  {p.exceptionStatus && p.exceptionStatus !== 'pending' && (
                    <div style={{
                      marginBottom: 14, padding: '12px 14px', borderRadius: 8,
                      background: '#f8fafc',
                      border: '1.5px dashed #cbd5e1',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#64748b', marginBottom: 6 }}>
                        📜 Registro histórico: {p.exceptionStatus === 'approved' ? 'exceção aprovada pela UGP (formato antigo)' : 'exceção rejeitada pela UGP (formato antigo)'}
                        {p.exceptionResolvedAt && (
                          <span style={{ fontWeight: 400, fontSize: '0.7rem', color: '#94a3b8', marginLeft: 8 }}>
                            em {new Date(p.exceptionResolvedAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '4px 8px', marginBottom: 6 }}>
                        ⚠️ Este registro é só histórico e <strong>não determina mais a pontuação</strong>. Use o vínculo de catálogo em cada exceção individual abaixo.
                      </div>
                      {p.exceptionCatalogLabel && (
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: 6 }}>
                          🔗 Estava vinculado a: <strong>{p.exceptionCatalogLabel}</strong>
                          {p.exceptionCatalogType === 'projeto' ? ' (Projeto)' : p.exceptionCatalogType === 'pos-mba' ? ' (Pós/MBA)' : ''}
                          {p.exceptionCatalogArea ? ` — ${p.exceptionCatalogArea}` : ''}
                        </div>
                      )}
                      {p.exceptionApprovalJustification && (
                        <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6, background: 'white', borderRadius: 6, padding: '8px 10px' }}>
                          {p.exceptionApprovalJustification}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exceções estruturadas (novo formato) — mesmo tratamento de um card de projeto */}
                  {(p.exceptionItems || []).map((item, i) => {
                    const itemKey = `excecao-${i}`;
                    const assignments: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }> = (selected?.audit as any)?.exceptionAssignments || {};
                    const assignment = assignments[itemKey];
                    const catalogItem = assignment
                      ? CATALOG_ITEMS.find((ci) => ci.label === assignment.label && (ci as any).area === assignment.area && ci.group === (assignment.type === 'projeto' ? 'project' : 'postMBA'))
                      : null;
                    const pts = (catalogItem as any)?.points ?? 0;
                    const badgeLabel = !assignment
                      ? '⚠️ Sem vínculo com o catálogo'
                      : !catalogItem
                      ? '❌ Item do catálogo não encontrado'
                      : `✅ ${pts} pts — ${assignment.type === 'projeto' ? 'Projeto' : 'Pós/MBA'} (${AREA_LABELS[assignment.area] || assignment.area})`;
                    return (
                    <div key={i} style={{ marginBottom: 14, padding: '12px 14px', background: '#fffbf5', border: `1.5px solid ${assignment && catalogItem ? '#86efac' : '#fde68a'}`, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e' }}>
                          ⚠️ Exceção {i + 1}: {item.itemName}
                        </div>
                        <div style={{ flexShrink: 0, marginLeft: 8, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                          background: assignment && catalogItem ? '#f0fdf4' : '#fef3c7',
                          color: assignment && catalogItem ? '#15803d' : '#92400e',
                          border: `1px solid ${assignment && catalogItem ? '#86efac' : '#fcd34d'}` }}>
                          {badgeLabel}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <InfoField label="Área solicitada pelo candidato" value={item.targetArea} />
                        <InfoField label="Tipo declarado" value={item.type} />
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
                      <ExceptionAssignmentPicker
                        candidateAreas={p.selectedAreas || []}
                        assignment={assignment}
                        onSave={(area, label, type) => saveExceptionAssignment(itemKey, area, label, type)}
                        onClear={() => saveExceptionAssignment(itemKey, null, null, null)}
                        saving={saving}
                      />
                      <ValidationControls itemKey={itemKey} validation={getValidation(itemKey)} onSave={saveItemValidation} />
                    </div>
                    );
                  })}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <h3 style={{ color: 'var(--purple)', margin: 0, fontSize: '0.95rem' }}>📝 Conclusão da Auditoria</h3>
                  {selected.audit.overallStatus === 'validated' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#d1fae5', color: '#065f46', border: '1.5px solid #6ee7b7', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>✓ Status atual: Validada</span>
                  )}
                  {selected.audit.overallStatus === 'adjusted' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#92400e', border: '1.5px solid #fcd34d', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Status atual: Ajustada</span>
                  )}
                  {selected.audit.overallStatus === 'provisional' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>⏳ Status atual: Provisória</span>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
                    Observação geral (opcional)
                  </label>
                  <textarea rows={3} value={overallNote} onChange={(e) => setOverallNote(e.target.value)}
                    placeholder="Registre aqui qualquer observação geral sobre a ficha deste participante..."
                    style={{ width: '100%', fontSize: '0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Botão Validada */}
                  <div style={{ flex: 1, minWidth: 140, position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button"
                      onClick={() => saveOverallStatus('validated')}
                      disabled={saving}
                      style={{ flex: 1, padding: '10px 16px', background: selected.audit.overallStatus === 'validated' ? 'linear-gradient(135deg, #14532d, #15803d)' : 'linear-gradient(135deg, #15803d, #16a34a)', color: 'white', border: selected.audit.overallStatus === 'validated' ? '3px solid #14532d' : 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: selected.audit.overallStatus === 'validated' ? '0 0 0 3px #6ee7b7' : 'none' }}>
                      {selected.audit.overallStatus === 'validated' ? '✓ Validada (ativo)' : '✓ Marcar como Validada'}
                    </button>
                    <span title="A ficha foi auditada e está aprovada sem ressalvas — todos os comprovantes foram aceitos e a pontuação está correta."
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: '#15803d', color: 'white', fontSize: '0.7rem', fontWeight: 700, cursor: 'help', flexShrink: 0, userSelect: 'none' }}>?</span>
                  </div>
                  {/* Botão Ajustada */}
                  <div style={{ flex: 1, minWidth: 140, position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button"
                      onClick={() => saveOverallStatus('adjusted')}
                      disabled={saving}
                      style={{ flex: 1, padding: '10px 16px', background: selected.audit.overallStatus === 'adjusted' ? 'linear-gradient(135deg, #92400e, #d97706)' : 'linear-gradient(135deg, #d97706, #f59e0b)', color: 'white', border: selected.audit.overallStatus === 'adjusted' ? '3px solid #92400e' : 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: selected.audit.overallStatus === 'adjusted' ? '0 0 0 3px #fcd34d' : 'none' }}>
                      {selected.audit.overallStatus === 'adjusted' ? '⚠️ Ajustada (ativo)' : '⚠️ Marcar como Ajustada'}
                    </button>
                    <span title="A ficha foi auditada mas precisou de alguma correção ou ajuste — por exemplo, um item foi rejeitado, a pontuação foi alterada ou há uma observação relevante. Indica que houve intervenção do auditor."
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: '#d97706', color: 'white', fontSize: '0.7rem', fontWeight: 700, cursor: 'help', flexShrink: 0, userSelect: 'none' }}>?</span>
                  </div>
                  {/* Botão Provisória */}
                  <div style={{ flex: 1, minWidth: 140, position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button"
                      onClick={() => saveOverallStatus('provisional')}
                      disabled={saving}
                      style={{ flex: 1, padding: '10px 16px', background: selected.audit.overallStatus === 'provisional' ? '#e2e8f0' : '#f1f5f9', color: '#64748b', border: selected.audit.overallStatus === 'provisional' ? '3px solid #94a3b8' : '1.5px solid #e2e8f0', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: selected.audit.overallStatus === 'provisional' ? '0 0 0 3px #cbd5e1' : 'none' }}>
                      {selected.audit.overallStatus === 'provisional' ? '⏳ Provisória (ativo)' : '⏳ Manter Provisória'}
                    </button>
                    <span title="A auditoria ainda não foi concluída — a ficha fica no estado provisório, aguardando análise posterior. É o estado padrão enquanto a auditoria está em andamento."
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: '#94a3b8', color: 'white', fontSize: '0.7rem', fontWeight: 700, cursor: 'help', flexShrink: 0, userSelect: 'none' }}>?</span>
                  </div>
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
