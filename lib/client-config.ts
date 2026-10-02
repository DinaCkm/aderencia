// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO POR CLIENTE
// ─────────────────────────────────────────────────────────────────────────────
// O mesmo código atende vários clientes. Cada instância no Railway define qual
// cliente ela atende pela variável de ambiente:
//
//   NEXT_PUBLIC_CLIENT_ID = sebrae-to   (padrão, se a variável não existir)
//   NEXT_PUBLIC_CLIENT_ID = sebrae-ac
//
// Cada instância tem o SEU PRÓPRIO banco MySQL — os dados de um cliente nunca
// ficam no mesmo banco de outro.
//
// O que muda por cliente: nome, áreas, regionais, catálogo (em lib/constants.ts),
// textos de apresentação e parâmetros de importação. As REGRAS DE PONTUAÇÃO são
// as mesmas para todos (lib/business.ts).
//
// ⚠️ Variável NEXT_PUBLIC_*: o Next.js embute o valor no momento do BUILD. Se a
// variável for alterada no Railway, é preciso fazer um novo deploy.
// ─────────────────────────────────────────────────────────────────────────────

export type ClientId = 'sebrae-to' | 'sebrae-ac';

export interface AreaDef {
  code: string;
  label: string;
}

export interface ClientConfig {
  id: ClientId;
  /** Nome exibido nas telas e no PDF — ex.: "SEBRAE Tocantins" */
  orgName: string;
  /** Forma curta — ex.: "Sebrae/TO" */
  orgShort: string;
  /** Usado em nomes de arquivos exportados — ex.: "sebrae-to" */
  fileSlug: string;
  /** Domínio usado nos exemplos de e-mail das telas de importação */
  emailDomain: string;
  /** Assinatura "Realização" no card de boas-vindas do candidato */
  programOwner: string;
  /** Todas as áreas oficiais (inclui diretorias — usadas como "área atual") */
  officialAreas: AreaDef[];
  /** Códigos que NÃO podem ser escolhidos como área de interesse (diretorias) */
  nonInterestCodes: string[];
  /** Regionais individuais */
  regionalAreas: AreaDef[];
  /** Assinatura dos e-mails enviados aos candidatos */
  emailSignature: string;
  /** Códigos de área usados nos exemplos das telas de importação */
  exampleAreas: [string, string];
  /** Exemplo de Pós/MBA mostrado no formulário do candidato */
  postMBAExample: string;
  /**
   * Turmas e datas de fechamento exibidas no card de boas-vindas.
   * Lista vazia = o bloco "Cronograma de Fechamento" não aparece.
   */
  cohorts: [string, string][];
  /**
   * Login do participante pelo acesso do EcoLíder (mesmo e-mail + CPF ou ID de acesso).
   * null = login próprio do Aderência (e-mail + CPF cadastrado aqui).
   * Requer a variável ECOLIDER_MYSQL_URL (somente leitura no banco do EcoLíder).
   */
  ecolider: {
    /** Filtro do programa no EcoLíder: programs.name LIKE '%<valor>%' */
    programNameLike: string;
    /** Endereço da plataforma, mostrado na tela de login */
    platformUrl: string;
  } | null;
  /** Importação de engajamento (Ecossistema do Bem) */
  engagementImport: {
    /** Só importa linhas cuja Turma começa com este prefixo (null = todas as turmas) */
    turmaPrefix: string | null;
    /** Data de referência gravada no registro (null = data do dia da importação) */
    date: string | null;
  };
}

const SEBRAE_TO: ClientConfig = {
  id: 'sebrae-to',
  orgName: 'SEBRAE Tocantins',
  orgShort: 'Sebrae/TO',
  fileSlug: 'sebrae-to',
  emailDomain: 'sebraeto.com.br',
  programOwner: 'UGP — SEBRAE Tocantins',
  officialAreas: [
    // ── Diretoria e Assessorias ──
    { code: 'DIREX', label: 'Diretoria Superintendente' },
    { code: 'DITEC', label: 'DITEC — Diretoria Técnica' },
    { code: 'DAF', label: 'DAF — Diretoria de Administração e Finanças' },
    { code: 'CDE', label: 'CDE — Assessoria' },
    // ── Unidades ──
    { code: 'UAC', label: 'UAC — Unidade de Articulação e Competitividade' },
    { code: 'UAF', label: 'UAF — Unidade de Administração e Finanças' },
    { code: 'UAUD', label: 'UAUD — Unidade de Auditoria Interna' },
    { code: 'UGE', label: 'UGE — Unidade de Gestão Estratégica e Integridade' },
    { code: 'UGOC', label: 'UGOC — Unidade de Gestão Orç. Contabilidade e Finanças' },
    { code: 'UGP', label: 'UGP — Unidade de Gestão de Pessoas' },
    { code: 'UMC', label: 'UMC — Unidade de Marketing e Comunicação' },
    { code: 'URC', label: 'URC — Unidade de Relacionamento com o Cliente' },
    { code: 'URI', label: 'URI — Unidade de Relacionamento Institucional' },
    { code: 'UTIC', label: 'UTIC — Unidade de Tecnologia da Inform. e Comunicação de Dados' },
    // ── Regionais (agrupadas) ──
    { code: 'REGIONAIS', label: 'Unidades Regionais' },
  ],
  nonInterestCodes: ['DIREX', 'DITEC', 'DAF', 'CDE'],
  regionalAreas: [
    { code: 'RBP', label: 'RBP — Regional Bico do Papagaio' },
    { code: 'RME', label: 'RME — Regional Metropolitana' },
    { code: 'RMN', label: 'RMN — Regional Médio Norte Colinas' },
    { code: 'RNO', label: 'RNO — Regional Norte' },
    { code: 'RPJ', label: 'RPJ — Regional Portal do Jalapão' },
    { code: 'RSG', label: 'RSG — Regional Serras Gerais' },
    { code: 'RSU', label: 'RSU — Regional Sul' },
    { code: 'RVA', label: 'RVA — Regional Vale do Araguaia' },
  ],
  emailSignature: 'Equipe RH/UGP — SEBRAE Tocantins',
  exampleAreas: ['UGE', 'UAF'],
  postMBAExample: 'Ex.: MBA em Auditoria (UAUD), Direito Público.',
  cohorts: [['BS1', '30/06/2026'], ['BS2', '30/05/2026'], ['BS3', '30/07/2026']],
  ecolider: null,
  engagementImport: { turmaPrefix: 'BS3', date: '2026-07-31' },
};

// Estrutura conforme o organograma do Relatório de Gestão Sebrae/AC 2024.
const SEBRAE_AC: ClientConfig = {
  id: 'sebrae-ac',
  orgName: 'SEBRAE Acre',
  orgShort: 'Sebrae/AC',
  fileSlug: 'sebrae-ac',
  emailDomain: 'ac.sebrae.com.br',
  programOwner: 'Gestão de Pessoas — SEBRAE Acre',
  officialAreas: [
    // ── Diretorias ──
    { code: 'DIREX', label: 'DIREX — Diretoria Executiva' },
    { code: 'DITEC', label: 'DITEC — Diretoria Técnica' },
    { code: 'DIRAF', label: 'DIRAF — Diretoria de Administração e Finanças' },
    // ── Governança e Diretoria Executiva ──
    { code: 'AI', label: 'AI — Auditoria Interna' },
    { code: 'ASCOM', label: 'ASCOM — Assessoria de Comunicação' },
    // ── Diretoria Técnica ──
    { code: 'PM', label: 'PM — Produtos e Mercado' },
    { code: 'AR', label: 'AR — Atendimento e Relacionamento' },
    // ── Diretoria de Administração e Finanças ──
    { code: 'GC', label: 'GC — Gestão da Conformidade' },
    { code: 'EG', label: 'EG — Excelência da Gestão' },
    { code: 'ALIC', label: 'ALIC — Assessoria de Licitações' },
    { code: 'GP', label: 'GP — Gestão de Pessoas' },
    { code: 'DAN', label: 'DAN — Desenvolvimento do Ambiente de Negócios' },
    { code: 'ACPC', label: 'ACPC — Assessoria de Controle, Processos e Compliance' },
    { code: 'FIN', label: 'FIN — Finanças' },
    { code: 'TI', label: 'TI — Tecnologia da Informação' },
    { code: 'SN', label: 'SN — Suporte aos Negócios' },
    // ── Escritórios Regionais (agrupados) ──
    { code: 'REGIONAIS', label: 'Escritórios Regionais' },
  ],
  nonInterestCodes: ['DIREX', 'DITEC', 'DIRAF'],
  regionalAreas: [
    { code: 'ERBAP', label: 'ERBAP — Escritório Regional do Baixo Acre e Purus' },
    { code: 'ERAA', label: 'ERAA — Escritório Regional do Alto Acre' },
    { code: 'ERJT', label: 'ERJT — Escritório Regional do Juruá, Tarauacá e Envira' },
  ],
  emailSignature: 'Equipe de Gestão de Pessoas — SEBRAE Acre',
  exampleAreas: ['GP', 'FIN'],
  postMBAExample: 'Ex.: MBA em Auditoria (AI), Direito Público.',
  cohorts: [],
  ecolider: { programNameLike: 'Acre', platformUrl: 'ecolider.ecodobem.com' },
  engagementImport: { turmaPrefix: null, date: null },
};

const CLIENTS: Record<ClientId, ClientConfig> = {
  'sebrae-to': SEBRAE_TO,
  'sebrae-ac': SEBRAE_AC,
};

const rawId = (process.env.NEXT_PUBLIC_CLIENT_ID || 'sebrae-to').trim().toLowerCase() as ClientId;

export const CLIENT: ClientConfig = CLIENTS[rawId] ?? SEBRAE_TO;

/** true na instância original (Sebrae/TO) — usado para manter textos legados idênticos */
export const IS_LEGACY_CLIENT = CLIENT.id === 'sebrae-to';

/** Todos os códigos de área válidos deste cliente (oficiais + regionais individuais) */
export const ALL_AREA_CODES: string[] = [
  ...CLIENT.officialAreas.map((a) => a.code),
  ...CLIENT.regionalAreas.map((a) => a.code),
];

/**
 * Mapa código → rótulo para as telas que tinham um mapa próprio fixo no código.
 * No Sebrae/TO devolve o mapa legado da tela (comportamento idêntico ao anterior).
 * Nos demais clientes, monta a partir das áreas configuradas.
 *   style 'full' → "AI — Auditoria Interna"   |   style 'name' → "Auditoria Interna"
 */
export function areaLabelMap(legacy: Record<string, string>, style: 'full' | 'name'): Record<string, string> {
  if (IS_LEGACY_CLIENT) return legacy;
  const map: Record<string, string> = {};
  for (const a of CLIENT.officialAreas) {
    if (CLIENT.nonInterestCodes.includes(a.code)) continue;
    map[a.code] = style === 'name' ? a.label.replace(/^[A-Z]+ — /, '') : a.label;
  }
  return map;
}
