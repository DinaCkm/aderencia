import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const TEMPLATE = `participantId,area,score100,date\njdoe,UGE,85,2026-05-01`;

export default function AdminImportPerformance() {
  const router = useRouter();
  const [csv, setCsv] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
  }, [router]);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'import-performance-template.csv';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('Importando...');
    const res = await fetch('/api/admin/import-performance', {
      method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv,
    });
    const data = await res.json();
    setIsError(!res.ok);
    setMessage(data.message || (res.ok ? 'Importação concluída.' : 'Erro na importação.'));
  };

  return (
    <>
      <Head><title>Importar Performance | Admin</title></Head>
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

      <main className="container" style={{ maxWidth: 720, paddingTop: 92 }}>
        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#128202;</span>
            <div>
              <h2>Importar Performance</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                CSV com indicador de engajamento por colaborador e area (escala 0-100)
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--gradient-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--purple)' }}>
            <strong>Formato:</strong> <code>participantId,area,score100,date</code><br />
            <strong>Exemplo:</strong> <code>joao.silva@sebraeto.com.br,UGE,85,2026-05-01</code>
          </div>

          <button type="button" className="btn-outline" style={{ marginBottom: 20, fontSize: '0.8rem' }} onClick={downloadTemplate}>
            Baixar modelo CSV
          </button>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Arquivo CSV</label>
              <input type="file" accept=".csv" className="form-input" onChange={handleFileChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Conteudo CSV (cole ou edite)</label>
              <textarea className="form-input" rows={8} value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="participantId,area,score100,date&#10;joao.silva@sebraeto.com.br,UGE,85,2026-05-01"
                style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }} />
            </div>
            {message && (
              <div style={{ background: isError ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isError ? '#fecaca' : '#86efac'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: isError ? '#dc2626' : '#15803d', fontSize: '0.82rem', marginBottom: 16 }}>
                {message}
              </div>
            )}
            <button type="submit" className="btn-primary">Importar performance</button>
          </form>
        </div>
      </main>
    </>
  );
}
