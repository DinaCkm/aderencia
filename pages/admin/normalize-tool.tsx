import { useState } from 'react';
import Head from 'next/head';

interface PendingItem { itemKey: string; type: string; label: string }
interface CandidateSummary {
  participantId: string;
  participantName: string;
  overallStatus: string;
  backfilledItems: PendingItem[];
}
interface ApiResult {
  mode: string;
  aviso?: string;
  totalFichasConclusivasVerificadas: number;
  fichasComItensNormalizados: number;
  detalhe: CandidateSummary[];
  error?: string;
}

const TYPE_LABEL: Record<string, string> = {
  postMBA: 'Pós/MBA',
  projeto: 'Projeto',
  experiencia: 'Experiência',
  excecao: 'Exceção',
};

interface AuditDebugResult {
  profileId: string;
  profileEmail: string;
  totalRegistrosDeAuditoriaEncontrados: number;
  registros: any[];
  error?: string;
}

export default function NormalizeTool() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasRunDryRun, setHasRunDryRun] = useState(false);
  const [debugEmail, setDebugEmail] = useState('');
  const [debugResult, setDebugResult] = useState<AuditDebugResult | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState('');

  const runDebug = async () => {
    if (!secret.trim()) { setDebugError('Preencha a senha antes.'); return; }
    if (!debugEmail.trim()) { setDebugError('Preencha o e-mail do candidato.'); return; }
    setDebugLoading(true);
    setDebugError('');
    setDebugResult(null);
    try {
      const res = await fetch('/api/admin/normalize-legacy-approvals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secret.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ debugEmail: debugEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDebugError(data.error || `Erro ${res.status}`);
      } else {
        setDebugResult(data);
      }
    } catch {
      setDebugError('Erro de conexão.');
    } finally {
      setDebugLoading(false);
    }
  };

  const run = async (apply: boolean) => {
    if (!secret.trim()) {
      setErrorMsg('Preencha a senha (NORMALIZE_SECRET) antes de continuar.');
      return;
    }
    if (apply && !window.confirm(
      'Isso vai GRAVAR de verdade no banco de dados: vai marcar como "aprovado" todo item pendente encontrado em fichas já concluídas.\n\nSó continue se você já rodou a "Prévia" antes e revisou o resultado.\n\nConfirma que quer aplicar agora?'
    )) {
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/normalize-legacy-approvals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret.trim()}`,
          ...(apply ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(apply ? { body: JSON.stringify({ apply: true }) } : {}),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setErrorMsg(data.error || `Erro ${res.status} — verifique se a senha está correta e se a variável NORMALIZE_SECRET foi configurada no Railway.`);
        setResult(null);
      } else {
        setResult(data);
        setErrorMsg('');
        if (!apply) setHasRunDryRun(true);
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Normalização de dados legados — Ferramenta administrativa</title></Head>
      <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>🔧 Normalização de dados legados</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
          Ferramenta de uso único, pré-requisito da Fase 1. Identifica fichas já concluídas (Validada/Ajustada)
          que têm item pontuável sem decisão explícita, e permite normalizá-las — preservando a nota que já tinham
          — antes de a nova regra de pontuação entrar em vigor.
        </p>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
            Senha (o mesmo valor que você colocou em NORMALIZE_SECRET no Railway)
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Cole aqui a senha..."
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => run(false)}
            style={{ flex: 1, minWidth: 200, padding: '12px 20px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'Rodando...' : '1️⃣ Rodar Prévia (não grava nada)'}
          </button>
          <button
            type="button"
            disabled={loading || !hasRunDryRun}
            onClick={() => run(true)}
            title={!hasRunDryRun ? 'Rode a Prévia primeiro' : ''}
            style={{ flex: 1, minWidth: 200, padding: '12px 20px', background: (loading || !hasRunDryRun) ? '#94a3b8' : '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: (loading || !hasRunDryRun) ? 'default' : 'pointer' }}
          >
            {loading ? 'Rodando...' : '2️⃣ Aplicar de verdade'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem' }}>
            ❌ {errorMsg}
          </div>
        )}

        {result && (
          <div style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
            {result.aviso && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>
                ⚠️ {result.aviso}
              </div>
            )}
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, marginBottom: 14,
              background: result.mode.startsWith('applied') ? '#d1fae5' : '#fef9c3',
              color: result.mode.startsWith('applied') ? '#065f46' : '#92400e',
            }}>
              {result.mode.startsWith('applied') ? '✅ APLICADO' : '👁️ PRÉVIA (nada foi gravado)'}
            </div>
            <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: 4 }}>
              Fichas conclusivas verificadas (Validada/Ajustada): <strong>{result.totalFichasConclusivasVerificadas}</strong>
            </p>
            <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: 16 }}>
              Fichas com itens {result.mode.startsWith('applied') ? 'normalizados' : 'que seriam normalizados'}: <strong>{result.fichasComItensNormalizados}</strong>
            </p>

            {result.detalhe.length === 0 ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: '#15803d' }}>
                ✅ Nenhuma ficha concluída tem item pendente sem decisão. Nada a normalizar.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Detalhe por candidato:</p>
                {result.detalhe.map((c) => (
                  <div key={c.participantId} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>
                      {c.participantName} <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem' }}>({c.overallStatus})</span>
                    </div>
                    <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: '0.8rem', color: '#475569' }}>
                      {c.backfilledItems.map((it) => (
                        <li key={it.itemKey}>
                          <strong>{TYPE_LABEL[it.type] || it.type}:</strong> {it.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px dashed #cbd5e1' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: 8 }}>🔍 Diagnóstico — ver auditoria bruta de um candidato</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 14 }}>
            Use isto quando um candidato aparece na Prévia mesmo depois de "Aplicar de verdade" — mostra o que
            realmente está gravado no banco para ele (itemValidations completo, e quantos registros de auditoria
            existem para esse participante, que ajuda a detectar duplicatas).
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={debugEmail}
              onChange={(e) => setDebugEmail(e.target.value)}
              placeholder="email do candidato..."
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.85rem' }}
            />
            <button
              type="button"
              disabled={debugLoading}
              onClick={runDebug}
              style={{ padding: '10px 20px', background: debugLoading ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: debugLoading ? 'default' : 'pointer' }}
            >
              {debugLoading ? 'Buscando...' : 'Ver auditoria bruta'}
            </button>
          </div>
          {debugError && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.82rem' }}>
              ❌ {debugError}
            </div>
          )}
          {debugResult && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: '0.82rem', marginBottom: 6 }}>
                <strong>Participante:</strong> {debugResult.profileEmail} (id: {debugResult.profileId})
              </p>
              <p style={{ fontSize: '0.82rem', marginBottom: 10 }}>
                <strong>Registros de auditoria encontrados para este participante:</strong>{' '}
                <span style={{ fontWeight: 700, color: debugResult.totalRegistrosDeAuditoriaEncontrados > 1 ? '#dc2626' : '#15803d' }}>
                  {debugResult.totalRegistrosDeAuditoriaEncontrados}
                </span>
                {debugResult.totalRegistrosDeAuditoriaEncontrados > 1 && ' ⚠️ Mais de um registro para o mesmo participante — provável causa da gravação parecer sumir.'}
              </p>
              <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: 14, borderRadius: 8, fontSize: '0.72rem', overflowX: 'auto', maxHeight: 400 }}>
                {JSON.stringify(debugResult.registros, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
