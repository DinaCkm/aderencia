import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { CatalogItem } from '../../lib/types';

const GROUPS = ['postMBA', 'course', 'project', 'certification', 'unit', 'role', 'graduation', 'name', 'matrícula'];
const CLASSIFICATIONS = ['transversal', 'area-specific', 'non-related'];

export default function AdminCatalogs() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [csv, setCsv] = useState('');
  const [item, setItem] = useState({ id: '', label: '', group: 'course', classification: 'transversal', area: '' });
  const [message, setMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [filter, setFilter] = useState('');

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const fetchCatalogs = async () => {
    const res = await fetch('/api/admin/catalogs');
    const data = await res.json();
    setCatalogs(data.catalogs || []);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    fetchCatalogs();
  }, [router]);

  const downloadTemplate = () => {
    const template = `id,label,group,classification,area\nmba-strategic,MBA Estratégia Corporativa,postMBA,transversal,\ncurso-líderança,Cursó de Líderança Estratégica,course,transversal,\nprojeto-transformação,Projeto de Transformação Digital,project,transversal,\n`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'import-catalogs-template.csv';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/catalogs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
    });
    const data = await res.json();
    if (res.ok) {
      setCatalogs(data.catalogs);
      setMessage('Item adicionado com sucesso.');
      setItem({ id: '', label: '', group: 'course', classification: 'transversal', area: '' });
    } else {
      setMessage(data.message || 'Erro ao adicionar item.');
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/import-catalogs', {
      method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: csv,
    });
    const data = await res.json();
    setImportMessage(data.message || (res.ok ? 'Importação concluída.' : 'Erro na importação.'));
    if (res.ok) fetchCatalogs();
  };

  const filtered = catalogs.filter((c) =>
    !filter || c.group === filter
  );

  return (
    <>
      <Head><title>Catálogos | Admin</title></Head>
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

      <main className="container" style={{ maxWidth: 900, paddingTop: 92 }}>

        {/* Add item */}
        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#43;</span>
            <div>
              <h2>Adicionar Item ao Catálogo</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cadastre cursos, projetos e pos/MBA nas listas fechadas</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">ID único *</label>
                <input className="form-input" value={item.id} onChange={(e) => setItem({ ...item, id: e.target.value })} required placeholder="ex: curso-líderança" />
              </div>
              <div className="form-group">
                <label className="form-label">Rotulo *</label>
                <input className="form-input" value={item.label} onChange={(e) => setItem({ ...item, label: e.target.value })} required placeholder="ex: Cursó de Líderança" />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Grupo *</label>
                <select className="form-input" value={item.group} onChange={(e) => setItem({ ...item, group: e.target.value })}>
                  {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Classificação *</label>
                <select className="form-input" value={item.classification} onChange={(e) => setItem({ ...item, classification: e.target.value })}>
                  {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Area (apenas para itens específicos)</label>
              <select className="form-input" value={item.area} onChange={(e) => setItem({ ...item, area: e.target.value })}>
                <option value="">Nenhuma (transversal)</option>
                {OFFICIAL_AREAS.map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}
              </select>
            </div>
            {message && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#15803d', fontSize: '0.8rem', marginBottom: 12 }}>{message}</div>}
            <button type="submit" className="btn-primary">Adicionar item</button>
          </form>
        </div>

        {/* Import CSV */}
        <div className="section-card">
          <div className="section-title">
            <span className="section-icon">&#128196;</span>
            <div>
              <h2>Importar Catálogo via CSV</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Formato: id,label,group,classification,area</p>
            </div>
          </div>
          <button type="button" className="btn-outline" style={{ marginBottom: 16, fontSize: '0.78rem' }} onClick={downloadTemplate}>Baixar modelo CSV</button>
          <form onSubmit={handleImport}>
            <div className="form-group">
              <label className="form-label">Arquivo CSV</label>
              <input type="file" accept=".csv" className="form-input" onChange={handleFileChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Conteudo CSV</label>
              <textarea className="form-input" rows={6} value={csv} onChange={(e) => setCsv(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
            </div>
            {importMessage && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#15803d', fontSize: '0.8rem', marginBottom: 12 }}>{importMessage}</div>}
            <button type="submit" className="btn-primary">Importar catálogo</button>
          </form>
        </div>

        {/* Current catalog */}
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--purple)' }}>Catálogo Atual ({catalogs.length} itens)</h2>
            <select className="form-input" style={{ maxWidth: 180, fontSize: '0.78rem' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Todos os grupos</option>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--gradient-soft)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>ID</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Rotulo</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Grupo</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Classificação</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--purple)', fontWeight: 700 }}>Area</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.id}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 500 }}>{c.label}</td>
                    <td style={{ padding: '7px 12px' }}><span style={{ background: 'var(--gradient-soft)', color: 'var(--purple)', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600 }}>{c.group}</span></td>
                    <td style={{ padding: '7px 12px', color: 'var(--text-muted)' }}>{c.classification}</td>
                    <td style={{ padding: '7px 12px', color: 'var(--text-muted)' }}>{c.area || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
