import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BackupEntry {
  id: number;
  label: string;
  sizeKB: number;
  createdAt: string;
}

const SYSTEM_LABELS: Record<string, string> = {
  aderencia: 'Aderência (este sistema)',
  'gestao-dashboards': 'Gestão Dashboards',
  pdi_system: 'PDI System',
  financeiro: 'Financeiro',
};

export default function AdminBackups() {
  const router = useRouter();
  const [backups, setBackups] = useState<Record<string, BackupEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/backup', { headers: { 'x-user-role': 'admin' } });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch {
        throw new Error(`Resposta inválida (status ${res.status}): ${text.slice(0, 300)}`);
      }
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
      setBackups(data.backups || {});
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido ao carregar backups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    load();
  }, [router, load]);

  const runBackupNow = async () => {
    setRunning(true);
    setRunMessage('');
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'x-user-role': 'admin' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
      setRunMessage('✅ ' + (data.message || 'Backup iniciado.'));
      setTimeout(load, 15000);
    } catch (err: any) {
      setRunMessage('❌ ' + (err?.message || 'Erro ao iniciar backup.'));
    } finally {
      setRunning(false);
    }
  };

  const downloadBackup = async (id: number, system: string, label: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/admin/backup?download=${id}`, { headers: { 'x-user-role': 'admin' } });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${system}-${label}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Erro ao baixar backup: ' + (err?.message || 'desconhecido'));
    } finally {
      setDownloadingId(null);
    }
  };

  const systems = Object.keys(backups);
  const mostRecentPerSystem = systems.map((s) => ({ system: s, latest: backups[s]?.[0]?.createdAt }));

  return (
    <>
      <Head><title>Backups | Admin</title></Head>
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

      <main className="container" style={{ maxWidth: 900, paddingTop: 92, paddingBottom: 60 }}>
        <div className="section-card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ marginBottom: 4 }}>💾 Backups</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Backups salvos no banco MySQL do sistema (tabela <code>backups</code>), independentes do espelho no GitHub.
              </p>
            </div>
            <button type="button" className="btn-primary" style={{ width: 'auto', padding: '8px 18px' }}
              onClick={runBackupNow} disabled={running}>
              {running ? 'Iniciando...' : '▶ Rodar backup agora'}
            </button>
          </div>
          {runMessage && (
            <div style={{ marginTop: 12, fontSize: '0.82rem', padding: '8px 12px', borderRadius: 8, background: runMessage.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: runMessage.startsWith('✅') ? '#15803d' : '#dc2626' }}>
              {runMessage}
            </div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            <p>Carregando backups...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: 60, color: '#991b1b' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Não foi possível carregar os backups.</p>
            <p style={{ fontSize: '0.8rem', color: '#7f1d1d', maxWidth: 500, margin: '0 auto' }}>{error}</p>
          </div>
        )}

        {!loading && !error && systems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <p>Nenhum backup encontrado na tabela do banco ainda.</p>
          </div>
        )}

        {!loading && !error && systems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {systems.map((system) => (
              <div key={system} className="section-card">
                <h3 style={{ marginBottom: 10 }}>{SYSTEM_LABELS[system] || system}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {backups[system].slice(0, 15).map((b) => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.8rem' }}>
                      <span>{new Date(b.createdAt).toLocaleString('pt-BR')}</span>
                      <span style={{ color: '#6b7280' }}>{b.sizeKB} KB</span>
                      <button type="button" onClick={() => downloadBackup(b.id, system, b.label)}
                        disabled={downloadingId === b.id}
                        style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                        {downloadingId === b.id ? 'Baixando...' : '⬇ Baixar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
