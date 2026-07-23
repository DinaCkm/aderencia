import { useState } from 'react';
import Head from 'next/head';

interface AdminItem { email: string; name: string }

export default function ManageAdminsTool() {
  const [secret, setSecret] = useState('');
  const [admins, setAdmins] = useState<AdminItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  const call = async (body: any) => {
    const res = await fetch('/api/admin/manage-admins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
  };

  const listAdmins = async () => {
    if (!secret.trim()) { setErrorMsg('Preencha a senha (ADMIN_MGMT_SECRET) antes.'); return; }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await call({ action: 'list' });
      setAdmins(data.admins);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão.');
      setAdmins(null);
    } finally {
      setLoading(false);
    }
  };

  const setPassword = async (email: string) => {
    const pwd = newPasswords[email];
    if (!pwd || pwd.length < 8) {
      setErrorMsg(`A nova senha para ${email} precisa ter no mínimo 8 caracteres.`);
      return;
    }
    if (!window.confirm(`Confirma a troca de senha de ${email}?\n\nA senha antiga deixará de funcionar imediatamente.`)) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await call({ action: 'setPassword', email, newPassword: pwd });
      setSuccessMsg(`✅ Senha de ${email} atualizada com sucesso.`);
      setNewPasswords((prev) => ({ ...prev, [email]: '' }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Gerenciar senhas de administrador — Ferramenta administrativa</title></Head>
      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>🔑 Gerenciar senhas de administrador</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 8 }}>
          Ferramenta de uso único. Lista os administradores cadastrados (nunca mostra a senha atual)
          e permite definir uma senha nova para cada um.
        </p>
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: '0.82rem', color: '#991b1b' }}>
          ⚠️ O usuário de seed <strong>admin@sebraeto.com.br</strong> tem a senha original gravada em texto puro
          no histórico do código-fonte (<code>lib/seed.ts</code>). Se ele ainda usa essa senha, troque agora.
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
            Senha da ferramenta (o mesmo valor que você colocou em ADMIN_MGMT_SECRET no Railway)
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Cole aqui a senha..."
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: 12 }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={listAdmins}
            style={{ padding: '10px 20px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'Carregando...' : 'Listar administradores'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem' }}>
            ❌ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.85rem' }}>
            {successMsg}
          </div>
        )}

        {admins && admins.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum administrador encontrado.</div>
        )}

        {admins && admins.map((a) => (
          <div key={a.email} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{a.name}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 10 }}>{a.email}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                placeholder="Nova senha (mín. 8 caracteres)"
                value={newPasswords[a.email] || ''}
                onChange={(e) => setNewPasswords((prev) => ({ ...prev, [a.email]: e.target.value }))}
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setPassword(a.email)}
                style={{ padding: '8px 16px', background: loading ? '#94a3b8' : '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: loading ? 'default' : 'pointer' }}
              >
                Trocar senha
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
