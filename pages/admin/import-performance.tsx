import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const CSV_TEMPLATE = `participantId,area,score100,date\njoao.silva@sebraeto.com.br,UGE,85,2026-05-31`;

type ImportMode = 'xlsx' | 'csv';

interface ImportResult {
  message: string;
  imported?: number;
  notFound?: number;
  skipped?: number;
  details?: {
    imported: string[];
    notFound: string[];
    skipped: string[];
  };
}

export default function AdminImportPerformance() {
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>('xlsx');
  const [csv, setCsv] = useState('');
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
  }, [router]);

  const downloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'import-performance-template.csv';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const handleXlsxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setXlsxFile(file);
    setResult(null);
  };

  const handleCsvFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setIsError(false);

    try {
      if (mode === 'xlsx') {
        if (!xlsxFile) { setResult({ message: 'Selecione um arquivo Excel.' }); setIsError(true); setLoading(false); return; }
        const arrayBuffer = await xlsxFile.arrayBuffer();
        const res = await fetch('/api/admin/import-engagement-xlsx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: arrayBuffer,
        });
        const data: ImportResult = await res.json();
        setIsError(!res.ok);
        setResult(data);
      } else {
        if (!csv.trim()) { setResult({ message: 'Cole ou carregue o conteúdo CSV.' }); setIsError(true); setLoading(false); return; }
        const res = await fetch('/api/admin/import-performance', {
          method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv,
        });
        const data = await res.json();
        setIsError(!res.ok);
        setResult({ message: data.message || (res.ok ? 'Importação concluída.' : 'Erro na importação.') });
      }
    } catch {
      setIsError(true);
      setResult({ message: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Importar Engajamento | Admin</title></Head>
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

      <main className="container" style={{ maxWidth: 760, paddingTop: 92 }}>
        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#128202;</span>
            <div>
              <h2>Importar Engajamento</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Importe o indicador de engajamento dos participantes do Programa de Sucessores
              </p>
            </div>
          </div>

          {/* Seletor de modo */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => { setMode('xlsx'); setResult(null); }}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: mode === 'xlsx' ? 'var(--purple)' : 'var(--bg-card)',
                color: mode === 'xlsx' ? '#fff' : 'var(--text-muted)',
                boxShadow: mode === 'xlsx' ? '0 2px 8px rgba(109,40,217,0.18)' : 'none',
              }}
            >
              📊 Excel do Ecossistema do Bem
            </button>
            <button
              type="button"
              onClick={() => { setMode('csv'); setResult(null); }}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: mode === 'csv' ? 'var(--purple)' : 'var(--bg-card)',
                color: mode === 'csv' ? '#fff' : 'var(--text-muted)',
                boxShadow: mode === 'csv' ? '0 2px 8px rgba(109,40,217,0.18)' : 'none',
              }}
            >
              📄 CSV Manual
            </button>
          </div>

          {mode === 'xlsx' ? (
            <>
              {/* Instruções Excel */}
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--purple)' }}>
                <strong>Formato aceito:</strong> Planilha Excel exportada diretamente do <strong>Ecossistema do Bem</strong> (Ranking Geral de Engajamento).<br />
                <span style={{ color: 'var(--text-muted)' }}>
                  O sistema lê automaticamente as colunas <strong>Pessoa</strong>, <strong>Turma</strong> e <strong>Ind. Média: Engajamento Final</strong>,
                  cruza pelo nome do participante e registra o score para cada área de interesse cadastrada.<br />
                  <strong>Participantes BS3 são ignorados automaticamente</strong> (fora do escopo deste ciclo).
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Arquivo Excel (.xlsx)</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="form-input"
                    onChange={handleXlsxChange}
                  />
                  {xlsxFile && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Arquivo selecionado: <strong>{xlsxFile.name}</strong> ({(xlsxFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {result && (
                  <div style={{
                    background: isError ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${isError ? '#fecaca' : '#86efac'}`,
                    borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16,
                  }}>
                    <p style={{ color: isError ? '#dc2626' : '#15803d', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                      {result.message}
                    </p>
                    {!isError && result.imported !== undefined && (
                      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>✓ {result.imported} importados</span>
                        {(result.notFound ?? 0) > 0 && <span style={{ color: '#d97706', marginLeft: 12 }}>⚠ {result.notFound} não encontrados no banco</span>}
                        {(result.skipped ?? 0) > 0 && <span style={{ color: '#6b7280', marginLeft: 12 }}>— {result.skipped} ignorados</span>}
                      </div>
                    )}
                    {result.details && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowDetails(!showDetails)}
                          style={{ fontSize: '0.75rem', color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {showDetails ? '▲ Ocultar detalhes' : '▼ Ver detalhes'}
                        </button>
                        {showDetails && (
                          <div style={{ marginTop: 8, fontSize: '0.75rem' }}>
                            {result.details.notFound.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#d97706' }}>Não encontrados no banco ({result.details.notFound.length}):</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#92400e' }}>
                                  {result.details.notFound.map((n, i) => <li key={i}>{n}</li>)}
                                </ul>
                              </div>
                            )}
                            {result.details.skipped.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <strong style={{ color: '#6b7280' }}>Ignorados ({result.details.skipped.length}):</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#6b7280' }}>
                                  {result.details.skipped.map((n, i) => <li key={i}>{n}</li>)}
                                </ul>
                              </div>
                            )}
                            {result.details.imported.length > 0 && (
                              <div>
                                <strong style={{ color: '#15803d' }}>Importados ({result.details.imported.length}):</strong>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#166534' }}>
                                  {result.details.imported.map((n, i) => <li key={i}>{n}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Importando...' : 'Importar engajamento'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Modo CSV manual */}
              <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--purple)' }}>
                <strong>Formato:</strong> <code>participantId,area,score100,date</code><br />
                <strong>Exemplo:</strong> <code>joao.silva@sebraeto.com.br,UGE,85,2026-05-31</code>
              </div>

              <button type="button" className="btn-outline" style={{ marginBottom: 20, fontSize: '0.8rem' }} onClick={downloadCsvTemplate}>
                Baixar modelo CSV
              </button>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Arquivo CSV</label>
                  <input type="file" accept=".csv" className="form-input" onChange={handleCsvFileChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Conteúdo CSV (cole ou edite)</label>
                  <textarea className="form-input" rows={8} value={csv}
                    onChange={(e) => setCsv(e.target.value)}
                    placeholder="participantId,area,score100,date&#10;joao.silva@sebraeto.com.br,UGE,85,2026-05-31"
                    style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>
                {result && (
                  <div style={{
                    background: isError ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${isError ? '#fecaca' : '#86efac'}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    color: isError ? '#dc2626' : '#15803d', fontSize: '0.82rem', marginBottom: 16,
                  }}>
                    {result.message}
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Importando...' : 'Importar performance'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
