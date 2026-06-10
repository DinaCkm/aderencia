export type AreaCode =
  // Diretoria e Assessorias (mantidos no tipo para compatibilidade com catálogos internos)
  | 'DIREX'
  | 'DITEC'
  | 'DAF'
  | 'CDE'
  // Unidades
  | 'UAC'
  | 'UAS'
  | 'UAUD'
  | 'UGE'
  | 'UGOC'
  | 'UGP'
  | 'UMC'
  | 'URC'
  | 'URI'
  | 'UTIC'
  // Regionais (agrupadas no seletor)
  | 'REGIONAIS'
  // Regionais individuais (usadas em contextos específicos)
  | 'RBP'
  | 'RME'
  | 'RMN'
  | 'RNO'
  | 'RPJ'
  | 'RSG'
  | 'RSU'
  | 'RVA';

export type CatalogGroup = 'postMBA' | 'course' | 'project' | 'certification' | 'unit' | 'role' | 'graduation' | 'name' | 'matrícula';
export type CatalogClassification = 'transversal' | 'area-specific' | 'non-related';

export interface CatalogItem {
  id: string;
  label: string;
  group: CatalogGroup;
  classification: CatalogClassification;
  area?: AreaCode;
  points?: number;      // pontuação do item (definida no catálogo oficial)
  aliases?: string[];   // termos equivalentes para matching
}

export interface ParticipantProfile {
  id: string;
  name: string;
  email: string;
  matrícula: string;
  unit: string;
  currentRole: string;
  currentArea: AreaCode | '';
  selectedAreas: AreaCode[];
  // Graduação — até 2 formações (registradas, não entram na nota)
  graduation: string;              // primeira graduação (label do catálogo)
  graduation2?: string;            // segunda graduação (label do catálogo)
  graduationCourseName?: string;   // nome livre quando não encontrado no catálogo
  graduationException?: string;    // justificativa de exceção
  // Pós/MBA — até 3 títulos (entram no cálculo)
  postMBAs: string[];              // labels dos títulos selecionados (máx. 3)
  certifications: string[];
  experienceMonths: number;        // legado — soma de gerencial + interino
  managerialMonths: number;        // meses em cargo gerencial efetivo
  interimMonths: number;           // meses em cargo interino
  positionsHeld: string[];
  // Cursos extracurriculares — dados complementares (não entram na nota)
  selectedCourses: string[];
  courseHours: Record<string, number>;
  proofMode: Record<string, 'ugp-knows' | 'upload'>;
  proofFiles: Record<string, string>;
  proofLinks?: Record<string, string>;  // links externos (Google Drive / OneDrive) por itemLabel
  // Projetos estratégicos — entram no cálculo (máx. 3 selecionados)
  selectedProjects: string[];
  projectAreaMap: Record<string, AreaCode>; // projeto → área de interesse escolhida
  exceptionRequested: boolean;
  exceptionJustification: string;  // legado — campo livre geral
  exceptionItems?: ExceptionItem[]; // novo — lista estruturada de questionamentos
  attachments: string[];
  exceptionStatus: 'pending' | 'approved' | 'rejected';
  validationStatus: 'provisional' | 'validated' | 'adjusted'; // provisório até RH/UGP confirmar documentos
  validationNote?: string;   // observação do admin ao validar
  validatedAt?: string;      // data da validação
  submittedAt?: string;
}

export interface PerformanceRecord {
  id: string;
  participantId: string;
  area: AreaCode;
  score100: number;
  date: string;
}

export interface DiscReport {
  id: string;
  participantId: string;
  area: AreaCode;
  score10: number;
  date: string;
}

// Dados completos de correlação DISC importados via Excel
export interface DISCRecord {
  id: string;
  participantId: string;        // e-mail do participante
  participantName: string;      // nome para cruzamento
  area: AreaCode;
  correlationPct: number;       // índice de correlação (0-100)
  // Perfil da pessoa (D/I/S/C)
  personD: number;
  personI: number;
  personS: number;
  personC: number;
  // Perfil do cargo (D/I/S/C)
  jobD: number;
  jobI: number;
  jobS: number;
  jobC: number;
  // Análise qualitativa
  strengths: string[];          // características que se destacam
  developments: string[];       // pontos de desenvolvimento
  importedAt: string;
}

export interface AssessmentCalculation {
  name: string;
  value: number | string;
  detail?: string;
}

export interface PostMBADetail {
  titleUsed: string | null;
  classification: string;
  score: number;
}

export interface ProjectDetail {
  label: string;
  points: number;
}

export interface AreaAssessment {
  participantId: string;
  area: AreaCode;
  discScore?: number;
  performanceScore?: number;
  performanceConverted?: number;
  behavioralAdherence?: number;
  technicalAdherence: number;
  quadrant: string;
  postMBADetail?: PostMBADetail;       // detalhes do título de Pós/MBA considerado
  projectsDetail?: ProjectDetail[];    // projetos considerados com pontuação
  calculationSteps: AssessmentCalculation[];
  exceptions: string[];
}

export type ExceptionItemType =
  | 'projeto'       // Projeto estratégico fora do catálogo
  | 'pos-mba'       // Título de Pós/MBA fora do catálogo
  | 'curso'         // Curso extracurricular fora do catálogo
  | 'experiencia'   // Experiência gerencial/interina não reconhecida
  | 'outro';        // Outro questionamento

export interface ExceptionItem {
  type: ExceptionItemType;
  itemName: string;       // nome do item questionado (ex: "Gestão da Secretaria DIREX")
  targetArea?: string;    // área de interesse para a qual quer aplicar
  objective: string;      // objetivo: o que o participante quer que seja reconhecido
  justification: string;  // justificativa detalhada
  fileBase64?: string;    // arquivo comprobatório em base64
  fileName?: string;      // nome original do arquivo
  fileType?: string;      // mime type do arquivo
}

export interface AuditReport {
  id: string;
  participantId: string;
  createdAt: string;
  areaAssessments: AreaAssessment[];
  inputSnapshot: ParticipantProfile;
  filesUsed: string[];
  rulesApplied: string[];
}
