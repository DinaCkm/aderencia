import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface Employee {
  email: string;
  name: string;
  cpf: string;
  role: string;
}

function formatCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
          .replace(/(\d{3})(\d{3})/, '$1.$2')
          .replace(/(\d{3})/, '$1');
}

export default function AdminEmployees() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  // Formulário de novo empregado
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [saving, setSaving] = useState(false);

  // Edição inline
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editNewEmail, setEditNewEmail] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    loadEmployees();
  }, [router]);

  const loadEmployees = () => {
    setLoading(true);
    fetch('/api/admin/employees')
      .then((r) => r.json())
      .then((d) => { setEmployees(d.employees || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newCpf.trim()) {
      notify('Preencha nome, e-mail e CPF.', 'error'); return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, cpf: newCpf.replace(/\D/g, '') }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Empregado criado com sucesso!');
      setNewName(''); setNewEmail(''); setNewCpf(''); setShowForm(false);
      loadEmployees();
    } else {
      notify(data.error || 'Erro ao criar empregado.', 'error');
    }
  };

  const startEdit = (emp: Employee) => {
    setEditEmail(emp.email);
    setEditName(emp.name);
    setEditCpf(formatCpf(emp.cpf));
    setEditNewEmail(emp.email);
  };

  const handleEdit = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editEmail, name: editName, cpf: editCpf.replace(/\D/g, ''), newEmail: editNewEmail }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Empregado atualizado!');
      setEditEmail('');
      loadEmployees();
    } else {
      notify(data.error || 'Erro ao atualizar.', 'error');
    }
  };

  const handleDelete = async (email: string, name: string) => {
    if (!confirm(`Excluir o empregado "${name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    const res = await fetch('/api/admin/employees', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      notify('Empregado excluído.');
      loadEmployees();
    } else {
      const data = await res.json();
      notify(data.error || 'Erro ao excluir.', 'error');
    }
  };

  const logout = () => { sessionStorage.clear(); router.push('/login'); };

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head><title>Gestão de Empregados | Admin</title></Head>
      <nav className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/eco-logo-white.png" alt="EcoLider"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="topbar-title">Banco de Sucessores Aderencia</div>
            <div className="topbar-subtitle">Painel Administrativo</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Link href="/admin"><button className="btn-outline" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Dashboard</button></Link>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 900, paddingTop: 28, paddingBottom: 60 }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple)', margin: 0 }}>
              &#128101; Gestão de Empregados
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
              {employees.length} empregado{employees.length !== 1 ? 's' : ''} cadastrado{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm((v) => !v); setMsg(''); }}
            style={{ fontSize: '0.82rem' }}>
            {showForm ? '✕ Cancelar' : '+ Novo empregado'}
          </button>
        </div>

        {/* Mensagem de feedback */}
        {msg && (
          <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
            background: msgType === 'success' ? '#d1fae5' : '#fee2e2',
            color: msgType === 'success' ? '#065f46' : '#dc2626',
            border: `1px solid ${msgType === 'success' ? '#6ee7b7' : '#fca5a5'}` }}>
            {msgType === 'success' ? '✓ ' : '⚠ '}{msg}
          </div>
        )}

        {/* Formulário de criação */}
        {showForm && (
          <div className="section-card" style={{ marginBottom: 24, border: '2px solid var(--purple)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--purple)', marginBottom: 16 }}>
              &#43; Novo Empregado
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome completo *</label>
                <input className="form-input" type="text" value={newName}
                  onChange={(e) => setNewName(e.target.value)} placeholder="Ex: João da Silva" />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail corporativo *</label>
                <input className="form-input" type="email" value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)} placeholder="joao@sebraeto.com.br" />
              </div>
              <div className="form-group">
                <label className="form-label">CPF (será a senha de acesso) *</label>
                <input className="form-input" type="text" value={newCpf}
                  onChange={(e) => setNewCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={handleCreate} disabled={saving} style={{ fontSize: '0.82rem' }}>
                {saving ? 'Salvando...' : '✓ Criar empregado'}
              </button>
              <button className="btn-outline" onClick={() => setShowForm(false)} style={{ fontSize: '0.82rem' }}>
                Cancelar
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
              &#128274; O CPF será usado como senha de acesso do colaborador. Informe o CPF correto.
            </p>
          </div>
        )}

        {/* Busca */}
        <div className="section-card" style={{ marginBottom: 0, padding: '14px 20px' }}>
          <input className="form-input" type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="&#128269; Buscar por nome ou e-mail..." style={{ marginBottom: 0 }} />
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="section-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            {search ? 'Nenhum empregado encontrado para a busca.' : 'Nenhum empregado cadastrado.'}
          </div>
        ) : (
          <div>
            {filtered.map((emp) => (
              <div key={emp.email} className="section-card" style={{ marginTop: 10, padding: '14px 20px' }}>
                {editEmail === emp.email ? (
                  /* Modo edição */
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nome</label>
                        <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">E-mail</label>
                        <input className="form-input" type="email" value={editNewEmail} onChange={(e) => setEditNewEmail(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">CPF (senha)</label>
                        <input className="form-input" value={editCpf} onChange={(e) => setEditCpf(formatCpf(e.target.value))} inputMode="numeric" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={handleEdit} disabled={saving} style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
                        {saving ? 'Salvando...' : '✓ Salvar'}
                      </button>
                      <button className="btn-outline" onClick={() => setEditEmail('')} style={{ fontSize: '0.78rem', padding: '5px 14px' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualização */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, border: '2px solid #d8b4fe' }}>
                        &#128100;
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          CPF: {formatCpf(emp.cpf)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(emp)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 600 }}>
                        ✏ Editar
                      </button>
                      <button onClick={() => handleDelete(emp.email, emp.name)}
                        style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                        ✕ Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
