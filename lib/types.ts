export type AreaCode =
  | 'GAB'
  | 'UAUD'
  | 'URI'
  | 'UGE'
  | 'UMC'
  | 'AJUR'
  | 'UGP'
  | 'UAS'
  | 'UGOC'
  | 'UTIC'
  | 'URC'
  | 'UAC'
  | 'UNIDADES_REGIONAIS';

export type CatalogGroup = 'postMBA' | 'course' | 'project' | 'certification' | 'unit' | 'role' | 'graduation' | 'name' | 'matricula';
export type CatalogClassification = 'transversal' | 'area-specific' | 'non-related';

export interface CatalogItem {
  id: string;
  label: string;
  group: CatalogGroup;
  classification: CatalogClassification;
  area?: AreaCode;
}

export interface ParticipantProfile {
  id: string;
  name: string;
  email: string;
  matricula: string;
  unit: string;
  currentRole: string;
  currentArea: AreaCode | '';
  selectedAreas: AreaCode[];
  graduation: string;
  postMBAs: string[];
  certifications: string[];
  experienceMonths: number;       // legado — soma de gerencial + interino
  managerialMonths: number;        // meses em cargo gerencial efetivo
  interimMonths: number;           // meses em cargo interino
  positionsHeld: string[];
  selectedCourses: string[];
  selectedProjects: string[];
  exceptionRequested: boolean;
  exceptionJustification: string;
  attachments: string[];
  exceptionStatus: 'pending' | 'approved' | 'rejected';
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

export interface AreaAssessment {
  participantId: string;
  area: AreaCode;
  discScore?: number;
  performanceScore?: number;
  performanceConverted?: number;
  behavioralAdherence?: number;
  technicalAdherence: number;
  quadrant: string;
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
