import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, loadProofFiles } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import type {
  ParticipantProfile,
  PerformanceRecord,
  DiscReport,
  DISCRecord,
  AreaAssessment,
} from '../../../lib/types';
import type { ProfileAudit } from './audit-profile';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email obrigatório' });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const profile = participants.find(
    (p) => p.email?.toLowerCase() === email.toLowerCase()
  );

  if (!profile) {
    return res.status(404).json({ error: 'Participante não encontrado' });
  }

  // Carregar arquivos de comprovante da tabela proof_files separada
  const proofFilesFromDB = await loadProofFiles(profile.email || profile.id);
  const mergedProofFiles = {
    ...(profile.proofFiles || {}),
    ...proofFilesFromDB,
  };
  const profileWithFiles = { ...profile, proofFiles: mergedProofFiles };

  // Calcular aderência por área
  const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discs = await readJsonAsync<DiscReport[]>('discReports', []);
  const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);

  const approvedExceptions =
    profile.exceptionStatus === 'approved'
      ? profile.postMBAs.concat(profile.selectedCourses, profile.selectedProjects)
      : [];

  // Carregar validações de auditoria por item — itens rejeitados pela UGP não pontuam
  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const audit = audits.find((a) => a.participantId === profile.id) || {
    participantId: profile.id,
    itemValidations: [],
    overallStatus: profile.validationStatus || 'provisional',
    overallNote: profile.validationNote,
  };
  const rejectedItems = (audit.itemValidations || [])
    .filter((v) => v.status === 'rejected')
    .map((v) => ({ itemKey: v.itemKey, note: v.note }));

  const areaAssessments = (profile.selectedAreas || []).map((area) => {
    const assessment = buildAreaAssessment(profile, area, performance, discs, approvedExceptions, rejectedItems);
    const discRecord = discRecords
      .filter((d) => d.participantId === profile.id && d.area === area)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt))[0];
    return {
      ...assessment,
      discRecord: discRecord || null,
    };
  });

  return res.status(200).json({
    profile: profileWithFiles,
    areaAssessments,
    audit,
  });
}
