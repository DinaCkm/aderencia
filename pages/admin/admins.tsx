import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface AdminUser {
  email: string;
  name: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/participants', label: 'Participantes', icon: '👥' },
  { href: '/admin/import-participants', label: 'Importar Colaboradores', icon: '📥' },
  { href: '/admin/import-performance', label: 'Importar Performance', icon: '📈' },
  { href: '/admin/import-disc', label: 'Importar DISC', icon: '🔷' },
  { href: '/admin/catalogs', label: 'Catálogos', icon: '📚' },
  { href: '/admin/exceptions', label: 'Exceções', icon: '⚠' },
  { href: '/admin/ninebox', label: 'Nine Box', icon: '🎯' },
  { href: '/admin/employees', label: 'Empregados', icon: '👤' },
  { href: '/admin/audit', label: 'Auditoria de Fichas', icon: '🔎' },
  { href: '/admin/admins', label: 'Administradores', icon: '🛡️' },
  { href: '/admin/backups', label: 'Backups', icon: '💾' },
];

export default function ManageAdmins() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);

  // Formulário de novo administrador
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Edição inline
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editNewEmail, setEditNewEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('aderenciaRole');
    if (role !== 'admin') { router.push('/login'); return; }
    loadAdmins();
  }, [router]);

  const loadAdmins = () => {
    setLoading(true);
    fetch('/api/admin/admins')
      .then((r) => r.json())
      .then((d) => { setAdmins(d.admins || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      notify('Preencha nome, e-mail e senha.', 'error'); return;
    }
    if (newPassword.length < 8) {
      notify('A senha precisa ter no mínimo 8 caracteres.', 'error'); return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, email: newEmail, password: newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Administrador criado com sucesso!');
      setNewName(''); setNewEmail(''); setNewPassword(''); setShowForm(false);
      loadAdmins();
    } else {
      notify(data.error || 'Erro ao criar administrador.', 'error');
    }
  };

  const startEdit = (a: AdminUser) => {
    setEditEmail(a.email);
    setEditName(a.name);
    setEditNewEmail(a.email);
    setEditNewPassword('');
  };

  const cancelEdit = () => {
    setEditEmail(''); setEditName(''); setEditNewEmail(''); setEditNewPassword('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editNewEmail.trim()) {
      notify('Nome e e-mail não podem ficar vazios.', 'error'); return;
    }
    if (editNewPassword && editNewPassword.length < 8) {
      notify('A nova senha precisa ter no mínimo 8 caracteres.', 'error'); return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/admins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: editEmail,
        name: editName,
        newEmail: editNewEmail !== editEmail ? editNewEmail : undefined,
        newPassword: editNewPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Administrador atualizado com sucesso!');
      cancelEdit();
      loadAdmins();
    } else {
      notify(data.error || 'Erro ao atualizar administrador.', 'error');
    }
  };

  const handleDelete = async (a: AdminUser) => {
    if (!window.confirm(`Confirma a exclusão do administrador ${a.name} (${a.email})?\n\nEle perderá o acesso ao painel imediatamente.`)) return;
    setSaving(true);
    const res = await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: a.email }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      notify('Administrador excluído.');
      loadAdmins();
    } else {
      notify(data.error || 'Erro ao excluir administrador.', 'error');
    }
  };

  return (
    <>
      <Head><title>Administradores | Banco de Sucessores Aderência</title></Head>
      <style>{`
        .admin-topbar { background: linear-gradient(90deg, #5B2D8E, #00C9C8); padding: 16px 28px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .admin-topbar-title { font-weight: 800; font-size: 1.15rem; }
        .admin-topbar-subtitle { font-size: 0.8rem; opacity: 0.9; }
        .admin-nav { display: flex; gap: 4px; flex-wrap: wrap; padding: 10px 28px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .admin-nav-item { padding: 7px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; color: #475569; text-decoration: none; }
        .admin-nav-item.active { background: #ede9fe; color: #5B2D8E; }
        .page-wrap { max-width: 860px; margin: 32px auto; padding: 0 20px; font-family: system-ui, sans-serif; }
      `}</style>
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Banco de Sucessores Aderência</div>
          <div className="admin-topbar-subtitle">Painel Administrativo · SEBRAE Tocantins</div>
        </div>
      </div>
      <div className="admin-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={`admin-nav-item ${router.pathname === item.href ? 'active' : ''}`}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      <div className="page-wrap">
        <h1 style={{ fontSize: '1.3rem', marginBottom: 4, color: '#334155' }}>🛡️ Administrar usuários administradores</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
          Crie, edite ou remova contas com acesso ao painel administrativo.
        </p>

        {msg && (
          <div style={{
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1.5px solid ${msgType === 'success' ? '#86efac' : '#fca5a5'}`,
            color: msgType === 'success' ? '#15803d' : '#991b1b',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem',
          }}>
            {msg}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{ padding: '10px 18px', background: '#5B2D8E', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: 20 }}
        >
          {showForm ? 'Cancelar' : '+ Novo administrador'}
        </button>

        {showForm && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
              <input placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)}
                style={{ padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem' }} />
              <input placeholder="E-mail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                style={{ padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem' }} />
              <input placeholder="Senha (mín. 8 caracteres)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                style={{ padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem' }} />
            </div>
            <button type="button" disabled={saving} onClick={handleCreate}
              style={{ padding: '9px 18px', background: saving ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Salvando...' : 'Criar administrador'}
            </button>
          </div>
        )}

        {loading && <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Carregando...</div>}
        {!loading && admins.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum administrador encontrado.</div>}

        {!loading && admins.map((a) => (
          <div key={a.email} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
            {editEmail === a.email ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <input placeholder="Nome" value={editName} onChange={(e) => setEditName(e.target.value)}
                  style={{ padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }} />
                <input placeholder="E-mail" value={editNewEmail} onChange={(e) => setEditNewEmail(e.target.value)}
                  style={{ padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }} />
                <input placeholder="Nova senha (opcional, mín. 8 caracteres)" type="password" value={editNewPassword} onChange={(e) => setEditNewPassword(e.target.value)}
                  style={{ padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={saving} onClick={handleSaveEdit}
                    style={{ padding: '8px 16px', background: saving ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: saving ? 'default' : 'pointer' }}>
                    Salvar
                  </button>
                  <button type="button" onClick={cancelEdit}
                    style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{a.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => startEdit(a)}
                    style={{ padding: '8px 14px', background: '#eef2ff', color: '#4338ca', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button type="button" disabled={saving} onClick={() => handleDelete(a)}
                    style={{ padding: '8px 14px', background: saving ? '#fecaca' : '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: saving ? 'default' : 'pointer' }}>
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
