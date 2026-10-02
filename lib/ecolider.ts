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
    pool = mysql.createPool({
      uri: process.env.ECOLIDER_MYSQL_URL,
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
  return out;
}
