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

export default function NormalizeTool() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasRunDryRun, setHasRunDryRun] = useState(false);

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
      </div>
    </>
  );
}
