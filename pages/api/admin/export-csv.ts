import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import { dedupeItemValidations, getScorableItemsState, buildAreaAssessment, getLatestPerformance } from '../../../lib/business';
import { getEffectiveCatalogItems } from '../../../lib/catalog';
import type { ParticipantProfile, PerformanceRecord, DISCRecord } from '../../../lib/types';
import type { ProfileAudit } from './audit-profile';

function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Encapsular em aspas se contiver vírgula, aspas ou quebra de linha
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function row(fields: unknown[]): string {
  return fields.map(esc).join(',');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const type = (req.query.type as string) || 'participants';

  if (type === 'participants') {
    const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const submitted = participants.filter((p) => p.submittedAt);

    const headers = [
      'Nome',
      'E-mail',
      'Matrícula',
      'Áreas de Interesse',
      'Data de Envio',
      'Graduação',
      'Graduação 2',
      'Nome do Curso de Graduação',
      'Pós/MBA',
      'Meses Gerenciais',
      'Meses Interinos',
      'Cursos Extracurriculares',
      'Projetos Estratégicos',
      'Modo de Comprovação (Graduação)',
      'Modo de Comprovação (Pós/MBA)',
      'Status de Exceção',
      'Validação',
      'Observação de Validação',
      'Data de Validação',
    ];

    const lines = [headers.join(',')];

    for (const p of submitted) {
      const proofGrad = p.proofFiles?.['grad'] || p.proofFiles?.['grad2'] || '';
      const proofMBA = Object.entries(p.proofFiles || {})
        .filter(([k]) => k.startsWith('mba_'))
        .map(([, v]) => (v.startsWith('data:') || v.length > 100 ? '[arquivo]' : v))
        .join(' | ');

      lines.push(row([
        p.name,
        p.email,
        p['matrícula'] || '',
        (p.selectedAreas || []).join(' | '),
        p.submittedAt ? new Date(p.submittedAt).toLocaleString('pt-BR') : '',
        p.graduation || '',
        p.graduation2 || '',
        p.graduationCourseName || '',
        (p.postMBAs || []).join(' | '),
        p.managerialMonths ?? '',
        p.interimMonths ?? '',
        (p.selectedCourses || []).join(' | '),
        (p.selectedProjects || []).join(' | '),
        proofGrad.startsWith('data:') || proofGrad.length > 100 ? 'arquivo enviado' : proofGrad || 'não informado',
        proofMBA || 'não informado',
        p.exceptionStatus || '',
        p.validationStatus || '',
        p.validationNote || '',
        p.validatedAt ? new Date(p.validatedAt).toLocaleString('pt-BR') : '',
      ]));
    }

    const csv = '\uFEFF' + lines.join('\r\n'); // BOM para Excel reconhecer UTF-8
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participantes_${date}.csv"`);
    return res.status(200).send(csv);
  }

  if (type === 'performance') {
    const records = await readJsonAsync<PerformanceRecord[]>('performance', []);
    const headers = ['Participante ID', 'Área', 'Score (0-100)', 'Data de Importação'];
    const lines = [headers.join(',')];
    for (const r of records) {
      lines.push(row([r.participantId, r.area, r.score100, r.date]));
    }
    const csv = '\uFEFF' + lines.join('\r\n');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="performance_${date}.csv"`);
    return res.status(200).send(csv);
  }

  if (type === 'disc') {
    const records = await readJsonAsync<DISCRecord[]>('disc_records', []);
    const headers = ['Participante ID', 'Nome', 'Área', 'Correlação DISC (%)', 'D (pessoa)', 'I (pessoa)', 'S (pessoa)', 'C (pessoa)', 'D (cargo)', 'I (cargo)', 'S (cargo)', 'C (cargo)', 'Data de Importação'];
    const lines = [headers.join(',')];
    for (const r of records) {
      lines.push(row([r.participantId, r.participantName, r.area, r.correlationPct, r.personD, r.personI, r.personS, r.personC, r.jobD, r.jobI, r.jobS, r.jobC, r.importedAt]));
    }
    const csv = '\uFEFF' + lines.join('\r\n');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="disc_${date}.csv"`);
    return res.status(200).send(csv);
  }

  if (type === 'completo') {
    // Exportação completa: TODAS as colunas dos outros exports + status item a item + nota
    // calculada por área. Antes desta correção, este export nem carregava a tabela de
    // auditoria (profile_audits) — por isso não tinha nenhum status item a item, só o status
    // geral da ficha. Também faltavam colunas já presentes no export "participants"
    // (Graduação 2, Modo de Comprovação, Observação/Data de Validação).
    const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
    const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);
    const discReports = await readJsonAsync<any[]>('discReports', []);
    const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
    const catalogItems = await getEffectiveCatalogItems();

    const submitted = participants.filter((p) => p.submittedAt);

    // Score DISC (correlação %) mais recente por participante+área — só para exibição
    const discMap: Record<string, number> = {};
    for (const r of discRecords) {
      const key = `${r.participantId}__${r.area}`;
      discMap[key] = r.correlationPct;
    }

    const TYPE_LABEL: Record<string, string> = {
      postMBA: 'Pós/MBA', projeto: 'Projeto', experiencia: 'Experiência', excecao: 'Exceção',
    };

    const headers = [
      'Nome', 'E-mail', 'Matrícula', 'Áreas de Interesse', 'Data de Envio',
      'Graduação', 'Graduação 2', 'Nome do Curso de Graduação', 'Pós/MBA',
      'Meses Gerenciais', 'Meses Interinos',
      'Cursos Extracurriculares', 'Projetos Estratégicos',
      'Modo de Comprovação (Graduação)', 'Modo de Comprovação (Pós/MBA)',
      'Score Performance (0-100)', 'Score DISC por Área (correlação %)',
      'Status de Exceção (legado)',
      'Status Geral da Ficha', 'Observação de Validação', 'Data de Validação',
      // Novas colunas — status item a item, deduplicado (só o registro mais recente por item)
      'Itens Pendentes (item: motivo)',
      'Itens Aprovados (item)',
      'Itens Rejeitados (item: motivo)',
      'Total de Itens Pontuáveis Pendentes',
      // Novas colunas — nota calculada por área (usa o mesmo motor central de todas as telas)
      'Nota Técnica Confirmada por Área',
      'Nota Técnica Potencial por Área (se pendentes fossem aprovados)',
      'Nota Comportamental por Área',
      'Nota Total (Técnica+Comportamental) por Área',
      'Quadrante Nine Box por Área',
    ];

    const lines = [headers.join(',')];

    for (const p of submitted) {
      const proofGrad = p.proofFiles?.['grad'] || p.proofFiles?.['grad2'] || '';
      const proofMBA = Object.entries(p.proofFiles || {})
        .filter(([k]) => k.startsWith('mba_'))
        .map(([, v]) => (v.startsWith('data:') || v.length > 100 ? '[arquivo]' : v))
        .join(' | ');

      const discByArea = (p.selectedAreas || [])
        .map((a) => `${a}: ${discMap[`${p.id}__${a}`] ?? 'N/A'}`)
        .join(' | ');

      const audit = audits.find((a) => a.participantId === p.id);
      const dedupedValidations = dedupeItemValidations(audit?.itemValidations || []);
      const exceptionAssignments = (audit as any)?.exceptionAssignments || {};
      const scorableItems = getScorableItemsState(p, dedupedValidations, exceptionAssignments);

      const label = (itemKey: string, fallback: string) => {
        const found = scorableItems.find((s) => s.itemKey === itemKey);
        return found ? `${TYPE_LABEL[found.type]}: ${found.label}` : fallback;
      };
      const notaFor = (itemKey: string) => dedupedValidations.find((v) => v.itemKey === itemKey)?.note || '';

      const pendingList = scorableItems.filter((s) => s.status === 'pending')
        .map((s) => `${TYPE_LABEL[s.type]}: ${s.label}${notaFor(s.itemKey) ? ` (${notaFor(s.itemKey)})` : ''}`)
        .join(' | ');
      const approvedList = scorableItems.filter((s) => s.status === 'approved')
        .map((s) => `${TYPE_LABEL[s.type]}: ${s.label}`)
        .join(' | ');
      const rejectedList = scorableItems.filter((s) => s.status === 'rejected')
        .map((s) => `${TYPE_LABEL[s.type]}: ${s.label}${notaFor(s.itemKey) ? ` (${notaFor(s.itemKey)})` : ''}`)
        .join(' | ');
      const pendingCount = scorableItems.filter((s) => s.status === 'pending').length;

      // Nota calculada por área — mesmo motor central usado em todas as telas do sistema
      const rejectedItems = dedupedValidations.filter((v) => v.status === 'rejected').map((v) => ({ itemKey: v.itemKey, note: v.note }));
      const experienceOverride = (audit as any)?.experienceOverride;
      const projectRelabels = (audit as any)?.projectRelabels || {};
      const areaAssessments = (p.selectedAreas || []).map((area) =>
        buildAreaAssessment(p, area, performance, discReports, exceptionAssignments, rejectedItems, {}, experienceOverride, projectRelabels, catalogItems, dedupedValidations)
      );
      const confirmadaPorArea = areaAssessments.map((a) => `${a.area}: ${a.technicalAdherence}`).join(' | ');
      const potencialPorArea = areaAssessments.map((a) => `${a.area}: ${a.technicalAdherencePotential ?? a.technicalAdherence}`).join(' | ');
      const comportamentalPorArea = areaAssessments.map((a) => `${a.area}: ${a.behavioralAdherence ?? 'N/A'}`).join(' | ');
      const totalPorArea = areaAssessments.map((a) => `${a.area}: ${((a.technicalAdherence || 0) + (a.behavioralAdherence || 0)).toFixed(1)}`).join(' | ');
      const quadrantePorArea = areaAssessments.map((a) => `${a.area}: ${a.quadrant}`).join(' | ');

      lines.push(row([
        p.name,
        p.email,
        p['matrícula'] || '',
        (p.selectedAreas || []).join(' | '),
        p.submittedAt ? new Date(p.submittedAt).toLocaleString('pt-BR') : '',
        p.graduation || '',
        p.graduation2 || '',
        p.graduationCourseName || '',
        (p.postMBAs || []).join(' | '),
        p.managerialMonths ?? '',
        p.interimMonths ?? '',
        (p.selectedCourses || []).join(' | '),
        (p.selectedProjects || []).join(' | '),
        proofGrad.startsWith('data:') || proofGrad.length > 100 ? 'arquivo enviado' : proofGrad || 'não informado',
        proofMBA || 'não informado',
        getLatestPerformance(performance, p.id, '')?.score100 ?? '',
        discByArea,
        p.exceptionStatus || '',
        audit?.overallStatus || p.validationStatus || 'provisional',
        audit?.overallNote || p.validationNote || '',
        audit?.auditedAt ? new Date(audit.auditedAt).toLocaleString('pt-BR') : (p.validatedAt ? new Date(p.validatedAt).toLocaleString('pt-BR') : ''),
        pendingList,
        approvedList,
        rejectedList,
        pendingCount,
        confirmadaPorArea,
        potencialPorArea,
        comportamentalPorArea,
        totalPorArea,
        quadrantePorArea,
      ]));
    }

    const csv = '\uFEFF' + lines.join('\r\n');
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="exportacao_completa_${date}.csv"`);
    return res.status(200).send(csv);
  }

  return res.status(400).json({ error: 'Tipo inválido. Use: participants, performance, disc, completo' });
}
