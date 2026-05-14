import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { CatalogItem } from '../../lib/types';

const GROUPS = ['postMBA', 'course', 'project', 'certification', 'unit', 'role', 'graduation', 'name', 'matrícula'];
const CLASSIFICATIONS = ['transversal', 'area-specific', 'non-related'];
const GROUP_LABELS: Record<string, string> = {
  postMBA: 'Pós/MBA', course: 'Curso', project: 'Projeto', certification: 'Certificação',
  unit: 'Unidade', role: 'Cargo', graduation: 'Graduação', name: 'Nome', 'matrícula': 'Matrícula',
};
const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/participants', label: 'Participantes', icon: '👥' },
  { href: '/admin/import-participants', label: 'Importar Colaboradores', icon: '📥' },
  { href: '/admin/import-performance', label: 'Importar Performance', icon: '📈' },
  { href: '/admin/import-disc', label: 'Importar DISC', icon: '🔷' },
  { href: '/admin/catalogs', label: 'Catálogos', icon: '📚' },
  { href: '/admin/exceptions', label: 'Exceções', icon: '⚠' },
  { href: '/admin/ninebox', label: 'Nine Box', icon: '🎯' },
];

const EMPTY_ITEM = { id: '', label: '', group: 'course', classification: 'transversal', area: '' };

export default function AdminCatalogs() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [csv, setCsv] = useState('');
  const [item, setItem] = useState({ ...EMPTY_ITEM });
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

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
    const template = `id,label,group,classification,area\nmba-strategic,MBA Estratégia Corporativa,postMBA,transversal,\ncurso-lideranca,Curso de Liderança Estratégica,course,transversal,\nprojeto-transformacao,Projeto de Transformação Digital,project,transversal,\n`;
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
    const method = editingItem ? 'PUT' : 'POST';
    const payload = editingItem ? { ...editingItem, ...item } : item;
    const res = await fetch('/api/admin/catalogs', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setCatalogs(data.catalogs || catalogs);
      setMessage(data.message || 'Item salvo com sucesso.');
      setItem({ ...EMPTY_ITEM });
      setEditingItem(null);
      setShowForm(false);
      fetchCatalogs();
    } else {
      setMessage(data.error || 'Erro ao salvar item.');
    }
  };

  const handleEdit = (c: any) => {
    setEditingItem(c);
    setItem({ id: c.id, label: c.label, group: c.group, classification: c.classification, area: c.area || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, source: string) => {
    if (source === 'fixed') {
      alert('Itens fixos do sistema não podem ser excluídos. Você pode editá-los para sobrescrever.');
      return;
    }
    if (!confirm(`Remover o item "${id}" do catálogo?`)) return;
    const res = await fetch(`/api/admin/catalogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) { setMessage('Item removido.'); fetchCatalogs(); }
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

  const filtered = catalogs.filter((c) => {
    const matchGroup = !filterGroup || c.group === filterGroup;
    const matchSource = !filterSource || c.source === filterSource;
    const matchSearch = !search || c.label?.toLowerCase().includes(search.toLowerCase()) || c.id?.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSource && matchSearch;
  });

  const groupCounts: Record<string, number> = {};
  catalogs.forEach((c) => { groupCounts[c.group] = (groupCounts[c.group] || 0) + 1; });

  return (
    <>
      <Head><title>Catálogos | Banco de Sucessores</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLíder" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderência</div>
            <div className="topbar-subtitle">Painel Administrativo</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Link href="/admin"><button className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Dashboard</button></Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>
      <div className="admin-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={`admin-nav-item ${router.pathname === item.href ? 'active' : ''}`}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
      <main className="container-wide" style={{ paddingTop: 96 }}>
        <div className="page-header" style={{ marginTop: '28px' }}>
          <h1>📚 Gerenciar Catálogos</h1>
          <p>Visualize, adicione e edite todos os itens de catálogo do sistema (cursos, projetos, pós-MBA, etc.).</p>
        </div>

        {/* Cards de resumo por grupo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {Object.entries(groupCounts).sort((a,b) => b[1]-a[1]).map(([g, count]) => (
            <div key={g} onClick={() => setFilterGroup(filterGroup === g ? '' : g)}
              style={{ background: filterGroup === g ? 'var(--gradient-soft)' : 'white', border: `1.5px solid ${filterGroup === g ? 'var(--purple)' : '#e5e7eb'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--purple)' }}>{count}</div>
              <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: 2 }}>{GROUP_LABELS[g] || g}</div>
            </div>
          ))}
        </div>

        {/* Formulário de adição/edição */}
        <div className="section-card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 16 : 0 }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--purple)', margin: 0 }}>
                {editingItem ? `✏️ Editando: ${editingItem.id}` : '+ Adicionar Item ao Catálogo'}
              </h2>
              {!showForm && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '4px 0 0' }}>Cadastre cursos, projetos e pós/MBA nas listas fechadas</p>}
            </div>
            <button className="btn-outline" style={{ fontSize: '0.78rem' }} onClick={() => { setShowForm(!showForm); if (showForm) { setEditingItem(null); setItem({ ...EMPTY_ITEM }); } }}>
              {showForm ? 'Fechar' : 'Abrir formulário'}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">ID Único *</label>
                  <input className="form-input" placeholder="ex: curso-lideranca" value={item.id} onChange={(e) => setItem({ ...item, id: e.target.value })} required disabled={!!editingItem} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rótulo *</label>
                  <input className="form-input" placeholder="ex: Curso de Liderança" value={item.label} onChange={(e) => setItem({ ...item, label: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Grupo *</label>
                  <select className="form-input" value={item.group} onChange={(e) => setItem({ ...item, group: e.target.value })}>
                    {GROUPS.map((g) => <option key={g} value={g}>{GROUP_LABELS[g] || g}</option>)}
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
                <label className="form-label">Área (apenas para itens específicos)</label>
                <select className="form-input" value={item.area} onChange={(e) => setItem({ ...item, area: e.target.value })}>
                  <option value="">Nenhuma (transversal)</option>
                  {OFFICIAL_AREAS.map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}
                </select>
              </div>
              {message && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#15803d', fontSize: '0.8rem', marginBottom: 12 }}>{message}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-primary">{editingItem ? 'Salvar alterações' : 'Adicionar item'}</button>
                {editingItem && <button type="button" className="btn-outline" onClick={() => { setEditingItem(null); setItem({ ...EMPTY_ITEM }); setShowForm(false); }}>Cancelar</button>}
              </div>
            </form>
          )}
        </div>

        {/* Importar CSV */}
        <div className="section-card" style={{ marginBottom: 20 }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--purple)', fontSize: '0.95rem' }}>📄 Importar Catálogo via CSV</summary>
            <div style={{ marginTop: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>Formato: id,label,group,classification,area</p>
              <button type="button" className="btn-outline" style={{ marginBottom: 16, fontSize: '0.78rem' }} onClick={downloadTemplate}>Baixar modelo CSV</button>
              <form onSubmit={handleImport}>
                <div className="form-group">
                  <label className="form-label">Arquivo CSV</label>
                  <input type="file" accept=".csv" className="form-input" onChange={handleFileChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Conteúdo CSV</label>
                  <textarea className="form-input" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }} />
                </div>
                {importMessage && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#15803d', fontSize: '0.8rem', marginBottom: 12 }}>{importMessage}</div>}
                <button type="submit" className="btn-primary">Importar catálogo</button>
              </form>
            </div>
          </details>
        </div>

        {/* Listagem completa */}
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--purple)', margin: 0 }}>Todos os Itens do Catálogo ({catalogs.length} itens)</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="form-input" style={{ maxWidth: 220, fontSize: '0.78rem' }} type="text" placeholder="🔍 Buscar por nome ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="form-input" style={{ maxWidth: 160, fontSize: '0.78rem' }} value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
                <option value="">Todos os grupos</option>
                {GROUPS.map((g) => <option key={g} value={g}>{GROUP_LABELS[g] || g}</option>)}
              </select>
              <select className="form-input" style={{ maxWidth: 160, fontSize: '0.78rem' }} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                <option value="">Todos (fixos + custom)</option>
                <option value="fixed">Apenas fixos</option>
                <option value="custom">Apenas customizados</option>
              </select>
              <span className="badge badge-purple">{filtered.length} item(s)</span>
            </div>
          </div>
          <div className="table-wrapper">
            <table style={{ fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rótulo</th>
                  <th>Grupo</th>
                  <th>Classificação</th>
                  <th>Área</th>
                  <th>Origem</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Nenhum item encontrado.</td></tr>
                ) : filtered.map((c: any, i: number) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : 'var(--surface)' }}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{c.id}</td>
                    <td style={{ fontWeight: 500 }}>{c.label}</td>
                    <td><span style={{ background: 'var(--gradient-soft)', color: 'var(--purple)', borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>{GROUP_LABELS[c.group] || c.group}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.classification}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.area || '—'}</td>
                    <td>
                      <span className={`badge ${c.source === 'custom' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                        {c.source === 'custom' ? 'Custom' : 'Fixo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-outline" style={{ fontSize: '0.7rem', padding: '3px 10px' }} onClick={() => handleEdit(c)}>✏️ Editar</button>
                        {c.source === 'custom' && (
                          <button style={{ fontSize: '0.7rem', padding: '3px 10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => handleDelete(c.id, c.source)}>🗑 Excluir</button>
                        )}
                      </div>
                    </td>
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
