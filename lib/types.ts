export type AreaCode =
  // Diretoria e Assessorias
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
  // Projetos estratégicos — entram no cálculo (máx. 3 selecionados)
  selectedProjects: string[];
  exceptionRequested: boolean;
  exceptionJustification: string;
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

export interface AuditReport {
  id: string;
  participantId: string;
  createdAt: string;
  areaAssessments: AreaAssessment[];
  inputSnapshot: ParticipantProfile;
  filesUsed: string[];
  rulesApplied: string[];
}
