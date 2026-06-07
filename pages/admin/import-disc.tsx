import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const CSV_TEMPLATE = `participantId,area,score10,date\njdoe,UGE,8.5,2026-05-01`;

interface ImportResult {
  success: boolean;
  imported: number;
  notFound: number;
  errors: number;
  details: {
    imported: string[];
    notFound: string[];
    errors: string[];
  };
}

export default function AdminImportDisc() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'xlsx' | 'csv'>('xlsx');
  const [csv, setCsv] = useState('');
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

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
    link.href = url; link.download = 'import-disc-template.csv';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  };

  const handleXlsxFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setXlsxFile(f); setResult(null); setMessage(''); }
  };

  const handleCsvSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('Importando...');
    setIsError(false);
    const res = await fetch('/api/admin/import-disc', {
      method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv,
    });
    const data = await res.json();
    setIsError(!res.ok);
    setMessage(data.message || (res.ok ? 'Importação concluída.' : 'Erro na importação.'));
  };

  const handleXlsxSubmit = async () => {
    if (!xlsxFile) { setMessage('Selecione um arquivo Excel.'); setIsError(true); return; }
    setLoading(true);
    setMessage('');
    setResult(null);
    const formData = new FormData();
    formData.append('file', xlsxFile);
    try {
      const res = await fetch('/api/admin/import-disc-xlsx', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
      setResult(data);
    } catch (e: any) {
      setMessage(e.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Importar DISC | Admin</title></Head>
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
            <span className="section-icon">🧠</span>
            <div>
              <h2>Importar Dados DISC</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Correlação comportamental dos participantes com o cargo de cada área
              </p>
            </div>
          </div>

          {/* Seletor de modo */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'xlsx', label: '📊 Excel do Modelo', desc: 'Recomendado' },
              { key: 'csv',  label: '📄 CSV Manual',      desc: 'Legado' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => setMode(key as 'xlsx' | 'csv')}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: mode === key ? 700 : 400, fontSize: '0.85rem',
                  background: mode === key
                    ? 'linear-gradient(135deg, var(--teal), var(--purple))'
                    : 'var(--bg-soft)',
                  color: mode === key ? '#fff' : 'var(--text-muted)',
                  boxShadow: mode === key ? '0 2px 8px rgba(0,95,115,0.2)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {label} <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({desc})</span>
              </button>
            ))}
          </div>

          {/* Modo Excel */}
          {mode === 'xlsx' && (
            <div>
              {/* Instruções */}
              <div style={{
                background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)',
                padding: '14px 18px', marginBottom: 22,
                border: '1px solid var(--teal-light)', fontSize: '0.82rem', color: 'var(--text)',
              }}>
                <strong style={{ color: 'var(--teal)' }}>📋 Como preencher o modelo:</strong>
                <ol style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.9 }}>
                  <li>Baixe o modelo Excel abaixo</li>
                  <li>Consulte os arquivos DOCX recebidos do fornecedor (ex: UAC.docx)</li>
                  <li>Preencha uma linha por participante por área com os dados do card DISC</li>
                  <li>Salve e faça upload aqui — o sistema cruza os nomes automaticamente</li>
                </ol>
              </div>

              {/* Download do modelo */}
              <div style={{ marginBottom: 22 }}>
                <a
                  href="/modelo-disc-aderencia.xlsx"
                  download
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(135deg, var(--teal), var(--purple))',
                    color: '#fff', padding: '9px 20px', borderRadius: 8,
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem',
                    boxShadow: '0 2px 8px rgba(0,95,115,0.2)',
                  }}
                >
                  ⬇ Baixar Modelo Excel DISC
                </a>
                <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Inclui instruções, exemplos e lista de áreas válidas
                </span>
              </div>

              {/* Upload */}
              <div className="form-group">
                <label className="form-label">ARQUIVO EXCEL (.XLSX)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${xlsxFile ? 'var(--teal)' : '#CBD5E0'}`,
                    borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: xlsxFile ? 'var(--gradient-soft)' : '#f8fafc',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{xlsxFile ? '✅' : '📂'}</div>
                  {xlsxFile ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--teal)', fontSize: '0.9rem' }}>{xlsxFile.name}</p>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {(xlsxFile.size / 1024).toFixed(1)} KB — clique para trocar
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clique para selecionar o arquivo</p>
                      <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>Apenas .xlsx</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleXlsxFileChange} />
              </div>

              {/* Resultado */}
              {result && (
                <div style={{
                  borderRadius: 10, padding: '14px 18px', marginBottom: 20,
                  background: result.imported > 0 ? '#f0fdf4' : '#fefce8',
                  border: `1px solid ${result.imported > 0 ? '#86efac' : '#fde047'}`,
                  fontSize: '0.82rem',
                }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: result.imported > 0 ? '#166534' : '#854d0e' }}>
                    {result.imported > 0 ? '✅ DISC importado com sucesso.' : '⚠️ Importação concluída com avisos.'}
                  </p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ color: '#166534', fontWeight: 600 }}>✓ {result.imported} importados</span>
                    {result.notFound > 0 && <span style={{ color: '#92400e', fontWeight: 600 }}>⚠ {result.notFound} não encontrados</span>}
                    {result.errors > 0 && <span style={{ color: '#991b1b', fontWeight: 600 }}>✗ {result.errors} erros</span>}
                  </div>
                  <button
                    onClick={() => setShowDetails(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: '0.8rem', padding: '6px 0 0', fontWeight: 600 }}
                  >
                    {showDetails ? '▲ Ocultar detalhes' : '▼ Ver detalhes'}
                  </button>
                  {showDetails && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem' }}>
                      {result.details.imported.length > 0 && (
                        <>
                          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#166534' }}>Importados ({result.details.imported.length}):</p>
                          <ul style={{ margin: '0 0 8px', paddingLeft: 18, color: '#166534' }}>
                            {result.details.imported.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}
                      {result.details.notFound.length > 0 && (
                        <>
                          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e' }}>Não encontrados ({result.details.notFound.length}):</p>
                          <ul style={{ margin: '0 0 8px', paddingLeft: 18, color: '#92400e' }}>
                            {result.details.notFound.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}
                      {result.details.errors.length > 0 && (
                        <>
                          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#991b1b' }}>Erros ({result.details.errors.length}):</p>
                          <ul style={{ margin: '0 0 8px', paddingLeft: 18, color: '#991b1b' }}>
                            {result.details.errors.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {message && isError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: '0.82rem', marginBottom: 16 }}>
                  ✗ {message}
                </div>
              )}

              <button
                onClick={handleXlsxSubmit}
                disabled={loading || !xlsxFile}
                className="btn-primary"
                style={{ width: '100%', opacity: loading || !xlsxFile ? 0.5 : 1 }}
              >
                {loading ? '⏳ Importando...' : '🧠 Importar DISC'}
              </button>
            </div>
          )}

          {/* Modo CSV legado */}
          {mode === 'csv' && (
            <form onSubmit={handleCsvSubmit}>
              <div style={{
                background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)',
                padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--purple)',
              }}>
                <strong>Formato:</strong> <code>participantId,area,score10,date</code><br />
                <strong>Exemplo:</strong> <code>joao.silva@sebraeto.com.br,UGE,8.5,2026-05-01</code>
              </div>
              <button type="button" className="btn-outline" style={{ marginBottom: 20, fontSize: '0.8rem' }} onClick={downloadCsvTemplate}>
                Baixar modelo CSV
              </button>
              <div className="form-group">
                <label className="form-label">Arquivo CSV</label>
                <input type="file" accept=".csv" className="form-input" onChange={handleCsvFileChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Conteúdo CSV (cole ou edite)</label>
                <textarea className="form-input" rows={8} value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  placeholder="participantId,area,score10,date&#10;joao.silva@sebraeto.com.br,UGE,8.5,2026-05-01"
                  style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }} />
              </div>
              {message && (
                <div style={{
                  background: isError ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${isError ? '#fecaca' : '#86efac'}`,
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  color: isError ? '#dc2626' : '#15803d', fontSize: '0.82rem', marginBottom: 16,
                }}>
                  {message}
                </div>
              )}
              <button type="submit" className="btn-primary">Importar DISC</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
