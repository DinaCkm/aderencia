// ─────────────────────────────────────────────────────────────────────────────
// Integração SOMENTE LEITURA com o banco do EcoLíder (repo DinaCkm/gestao-dashboards)
// ─────────────────────────────────────────────────────────────────────────────
// Usada pelos clientes que têm `CLIENT.ecolider` configurado (hoje: Sebrae/AC).
// O participante entra no Aderência com o MESMO e-mail e a MESMA credencial do
// EcoLíder: CPF (quando o aluno tem CPF cadastrado lá) ou o ID de acesso
// (`alunos.externalId`). Regras copiadas de `authenticateByEmailCpf` do EcoLíder:
//   • credencial normalizada = sem "." e "-"
//   • aluno com CPF → só entra pelo CPF; aluno sem CPF → entra pelo externalId
//   • só alunos ativos e com login liberado (isActive = 1 e canLogin = 1)
//   • também aceita o cadastro de usuário (users: e-mail + cpf), como o passo 1 do EcoLíder
//
// Este módulo NUNCA escreve no banco do EcoLíder.
// Variável de ambiente: ECOLIDER_MYSQL_URL
// ─────────────────────────────────────────────────────────────────────────────

import { CLIENT } from './client-config';

export interface EcoliderAluno {
  name: string;
  email: string;
  /** Credencial que o participante digita: CPF (dígitos) ou ID de acesso */
  credential: string;
}

let pool: any = null;

export function ecoliderEnabled(): boolean {
  return Boolean(CLIENT.ecolider && process.env.ECOLIDER_MYSQL_URL);
}

function getPool(): any {
  if (!pool) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mysql = require('mysql2/promise');
    // ECOLIDER_MYSQL_HOST / ECOLIDER_MYSQL_PORT (opcionais) substituem host e porta da URL —
    // permite trocar o endpoint público do EcoLíder sem reescrever a senha.
    const url = new URL(String(process.env.ECOLIDER_MYSQL_URL));
    if (process.env.ECOLIDER_MYSQL_HOST) url.hostname = process.env.ECOLIDER_MYSQL_HOST;
    if (process.env.ECOLIDER_MYSQL_PORT) url.port = process.env.ECOLIDER_MYSQL_PORT;
    pool = mysql.createPool({
      uri: url.toString(),
      connectionLimit: 2,
      connectTimeout: 10000,
    });
  }
  return pool;
}

export function normalizeCredential(raw: string): string {
  return String(raw || '').trim().replace(/[.\-]/g, '');
}

const BASE_SQL =
  'SELECT a.name, a.email, a.cpf, a.externalId FROM alunos a ' +
  'JOIN programs p ON p.id = a.programId ' +
  'WHERE a.isActive = 1 AND a.canLogin = 1 AND a.email IS NOT NULL AND p.name LIKE ?';

// O EcoLíder também aceita login pela tabela `users` (passo 1 de authenticateByEmailCpf):
// e-mail + users.cpf (que guarda o CPF ou o ID de acesso já normalizado).
const USERS_SQL =
  'SELECT u.name, u.email, u.cpf FROM users u ' +
  'JOIN programs p ON p.id = u.programId ' +
  "WHERE u.isActive = 1 AND u.role <> 'admin' AND u.email IS NOT NULL AND u.cpf IS NOT NULL AND u.cpf <> '' AND p.name LIKE ?";

function userToAluno(row: any): EcoliderAluno | null {
  const credential = normalizeCredential(String(row.cpf || ''));
  if (!row.email || !credential) return null;
  return { name: String(row.name || '').trim(), email: String(row.email).trim().toLowerCase(), credential };
}

function toAluno(row: any): EcoliderAluno | null {
  const cpf = String(row.cpf || '').replace(/\D/g, '');
  const ext = String(row.externalId || '').trim();
  const credential = cpf || ext;
  if (!row.email || !credential) return null;
  return { name: String(row.name || '').trim(), email: String(row.email).trim().toLowerCase(), credential };
}

/** Confere e-mail + credencial no EcoLíder. Retorna o aluno se bater, senão null. */
export async function findEcoliderAluno(email: string, rawCredential: string): Promise<EcoliderAluno | null> {
  if (!ecoliderEnabled()) return null;
  const norm = normalizeCredential(rawCredential);
  const raw = String(rawCredential || '').trim();
  if (!norm) return null;
  const [rows]: any[] = await getPool().query(
    BASE_SQL + ' AND LOWER(a.email) = ? LIMIT 5',
    [`%${CLIENT.ecolider!.programNameLike}%`, String(email).trim().toLowerCase()]
  );
  for (const row of rows || []) {
    const cpf = String(row.cpf || '').replace(/\D/g, '');
    const ext = String(row.externalId || '').trim();
    const ok = cpf ? cpf === norm.replace(/\D/g, '') && /^\d+$/.test(norm) : ext !== '' && (ext === norm || ext === raw);
    if (ok) return toAluno(row);
  }
  const [urows]: any[] = await getPool().query(
    USERS_SQL + ' AND LOWER(u.email) = ? LIMIT 5',
    [`%${CLIENT.ecolider!.programNameLike}%`, String(email).trim().toLowerCase()]
  );
  for (const row of urows || []) {
    if (normalizeCredential(String(row.cpf || '')) === norm) return userToAluno(row);
  }
  return null;
}

/** Lista todos os participantes ativos do programa do cliente no EcoLíder. */
export async function listEcoliderAlunos(): Promise<EcoliderAluno[]> {
  if (!ecoliderEnabled()) return [];
  const [rows]: any[] = await getPool().query(BASE_SQL + ' ORDER BY a.name', [`%${CLIENT.ecolider!.programNameLike}%`]);
  const seen = new Set<string>();
  const out: EcoliderAluno[] = [];
  for (const row of rows || []) {
    const a = toAluno(row);
    if (!a || seen.has(a.email)) continue;
    seen.add(a.email);
    out.push(a);
  }
  // A sincronização traz só os ALUNOS do programa. Cadastros que existem apenas na tabela
  // users (ex.: e-mail alternativo da mesma pessoa) não entram na lista — mas continuam
  // conseguindo fazer login, que confere as duas tabelas (findEcoliderAluno).
  out.sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
  return out;
}

/**
 * Diagnóstico (sem credenciais): situação de e-mails no EcoLíder — ativo, login liberado,
 * programa, e se tem CPF/ID cadastrado. Usado para entender quem não aparece na sincronização.
 */
export async function diagnoseEmails(emails: string[]): Promise<any[]> {
  if (!ecoliderEnabled() || emails.length === 0) return [];
  const list = emails.map((e) => e.trim().toLowerCase()).filter(Boolean).slice(0, 50);
  const [arows]: any[] = await getPool().query(
    'SELECT LOWER(a.email) AS email, a.isActive, a.canLogin, p.name AS program, ' +
    "(a.cpf IS NOT NULL AND a.cpf <> '') AS temCpf, (a.externalId IS NOT NULL AND a.externalId <> '') AS temId " +
    'FROM alunos a LEFT JOIN programs p ON p.id = a.programId WHERE LOWER(a.email) IN (?)',
    [list]
  );
  const [urows]: any[] = await getPool().query(
    'SELECT LOWER(u.email) AS email, u.isActive, u.role, p.name AS program, ' +
    "(u.cpf IS NOT NULL AND u.cpf <> '') AS temCredencial " +
    'FROM users u LEFT JOIN programs p ON p.id = u.programId WHERE LOWER(u.email) IN (?)',
    [list]
  );
  return list.map((email) => ({
    email,
    alunos: (arows || []).filter((r: any) => r.email === email),
    users: (urows || []).filter((r: any) => r.email === email),
  }));
}

/** Lista (sem credenciais) de quem a sincronização traria e de qual tabela vem: alunos ou users. */
export async function listEcoliderSources(): Promise<any[]> {
  if (!ecoliderEnabled()) return [];
  const like = `%${CLIENT.ecolider!.programNameLike}%`;
  const [a]: any[] = await getPool().query(BASE_SQL + ' ORDER BY a.name', [like]);
  const [u]: any[] = await getPool().query(
    "SELECT u.name, LOWER(u.email) AS email, u.role, u.alunoId, u.consultorId FROM users u JOIN programs p ON p.id = u.programId " +
    "WHERE u.isActive = 1 AND u.role <> 'admin' AND u.email IS NOT NULL AND u.cpf IS NOT NULL AND u.cpf <> '' AND p.name LIKE ? ORDER BY u.name",
    [like]
  );
  const alunoEmails = new Set((a || []).map((r: any) => String(r.email || '').toLowerCase()));
  return (u || []).filter((r: any) => !alunoEmails.has(r.email)).map((r: any) => ({ name: r.name, email: r.email, role: r.role, alunoId: r.alunoId, consultorId: r.consultorId }));
}
