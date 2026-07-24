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

    const lines = [row(headers)]; // escapa o cabeçalho também — evita que vírgulas dentro de nomes de coluna quebrem o alinhamento

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
    const lines = [row(headers)]; // escapa o cabeçalho também — evita que vírgulas dentro de nomes de coluna quebrem o alinhamento
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
    const lines = [row(headers)]; // escapa o cabeçalho também — evita que vírgulas dentro de nomes de coluna quebrem o alinhamento
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
    // Exportação completa: TODAS as informações de cada candidato num único CSV.
    const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
    const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);
    const discReports = await readJsonAsync<any[]>('discReports', []);
    const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
    const catalogItems = await getEffectiveCatalogItems();

    const submitted = participants.filter((p) => p.submittedAt);

    // DISC detalhado (correlação % + D/I/S/C pessoa/cargo) mais recente por participante+área
    const discDetailMap: Record<string, DISCRecord> = {};
    for (const r of discRecords) {
      const key = `${r.participantId}__${r.area}`;
      if (!discDetailMap[key] || r.importedAt > discDetailMap[key].importedAt) discDetailMap[key] = r;
    }

    const TYPE_LABEL: Record<string, string> = {
      postMBA: 'Pós/MBA', projeto: 'Projeto', experiencia: 'Experiência', excecao: 'Exceção',
    };
    // Rótulo legível pra chaves de item que NÃO entram na pontuação (dados-basicos, graduação,
    // áreas de interesse, cursos livres) — essas não aparecem em getScorableItemsState (que só
    // lista itens que pontuam), mas o usuário pediu TODAS as informações, incluindo essas.
    const nonScorableLabel = (key: string, p: ParticipantProfile): string => {
      if (key === 'dados-basicos') return 'Dados Básicos';
      if (key === 'areas-interesse') return 'Áreas de Interesse';
      if (key === 'graduacao') return 'Graduação';
      if (key === 'excecao-legado') return 'Exceção (legado)';
      // Título "Outro" de Pós/MBA (fora do catálogo) — nunca entra em postMBAs/scorableItems,
      // mas ainda pode ter sido rejeitado/aprovado pelo auditor. Busca o nome real em mbaBlocks
      // pelo índice original (mesma convenção usada em todo o resto do sistema).
      const mMba = key.match(/^postmba-(\d+)$/);
      if (mMba) {
        const block = (p as any).mbaBlocks?.[Number(mMba[1])];
        return `Pós/MBA (fora do catálogo): ${block?.name?.trim() || key}`;
      }
      const m = key.match(/^curso-free-(\d+)$/);
      if (m) {
        // IMPORTANTE: o índice em "curso-free-N" é montado a partir da lista JÁ FILTRADA
        // (nome + área + 16h ou mais — mesmo filtro usado em audit.tsx/print-profile.tsx),
        // não da lista bruta de freeCourses. Indexar direto no array bruto (como antes)
        // podia apontar pro curso errado quando havia cursos livres inválidos misturados.
        const validFree = ((p as any).freeCourses || []).filter((c: any) => c?.name?.trim() && c?.area && (c?.hours || 0) >= 16);
        return `Curso livre: ${validFree[Number(m[1])]?.name?.trim() || key}`;
      }
      const m2 = key.match(/^curso-cat-(\d+)$|^curso7-(\d+)$/);
      if (m2) return `Curso do catálogo: ${p.selectedCourses?.[Number(m2[1] ?? m2[2])] || key}`;
      return key;
    };

    const headers = [
      // Identificação
      'Nome', 'E-mail', 'Matrícula', 'Cargo Atual', 'Unidade Atual', 'Área Atual',
      'Áreas de Interesse', 'Data de Envio', 'Cargos Ocupados (histórico)',
      // Graduação
      'Graduação', 'Graduação 2', 'Nome do Curso de Graduação', 'Justificativa de Exceção (Graduação)',
      'Modo de Comprovação (Graduação)',
      // Pós/MBA
      'Pós/MBA (nome real do curso — com área do catálogo)', 'Modo de Comprovação (Pós/MBA)',
      // Experiência
      'Meses Gerenciais (declarado)', 'Meses Interinos (declarado)', 'Meses Totais (legado)',
      'Ajuste do Admin — Meses Gerenciais', 'Ajuste do Admin — Meses Interinos', 'Ajuste do Admin — Observação',
      // Cursos e certificações
      'Cursos Extracurriculares (catálogo)', 'Cursos Livres (nome | área | horas)', 'Horas por Curso (catálogo)', 'Certificações',
      // Projetos
      'Projetos Estratégicos', 'Área de Aplicação por Projeto', 'Reclassificação de Projetos (admin)',
      // Exceções
      'Solicitou Exceção?', 'Exceções Estruturadas (tipo | item | área alvo | objetivo)',
      'Status de Exceção (legado)', 'Item de Catálogo Vinculado (legado)', 'Justificativa de Aprovação (legado)',
      'Vínculos de Exceção (admin — por exceção estruturada)',
      // Comportamental
      'Score Performance (0-100)', 'Data de Importação da Performance',
      'DISC por Área (correlação % | D/I/S/C pessoa | D/I/S/C cargo)',
      // Status geral da ficha
      'Status Geral da Ficha', 'Observação de Validação (auditoria)', 'Nota Administrativa (legado)',
      'Data de Validação (auditoria)', 'Data de Validação (legado — ficha)',
      // Todos os itens auditados (inclusive os que não pontuam)
      'Todos os Itens Auditados (item: status: motivo)',
      // Itens pontuáveis — pendência/aprovação
      'Itens Pontuáveis Pendentes (item: motivo)',
      'Itens Pontuáveis Aprovados (item)',
      'Itens Pontuáveis Rejeitados (item: motivo)',
      'Total de Itens Pontuáveis Pendentes',
      // Nota calculada
      'Nota Técnica Confirmada por Área',
      'Nota Técnica Potencial por Área (se pendentes fossem aprovados)',
      'Nota Comportamental por Área',
      'Nota Total (Técnica+Comportamental) por Área',
      'Quadrante Nine Box por Área',
      // Anexos
      'Anexos (nomes de arquivo)',
    ];

    const lines = [row(headers)]; // escapa o cabeçalho também — evita que vírgulas dentro de nomes de coluna quebrem o alinhamento

    for (const p of submitted) {
      const proofGrad = p.proofFiles?.['grad'] || p.proofFiles?.['grad2'] || '';
      const proofMBA = Object.entries(p.proofFiles || {})
        .filter(([k]) => k.startsWith('mba_'))
        .map(([, v]) => (v.startsWith('data:') || v.length > 100 ? '[arquivo]' : v))
        .join(' | ');

      const audit = audits.find((a) => a.participantId === p.id);
      const dedupedValidations = dedupeItemValidations(audit?.itemValidations || []);
      const exceptionAssignments = (audit as any)?.exceptionAssignments || {};
      const scorableItems = getScorableItemsState(p, dedupedValidations, exceptionAssignments);

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

      // Todos os itens auditados, inclusive os que não pontuam (dados básicos, graduação,
      // áreas de interesse, cursos livres/catálogo) — cobre TODA validação já feita na ficha.
      const scorableKeys = new Set(scorableItems.map((s) => s.itemKey));
      const allAuditedItems = dedupedValidations.map((v) => {
        const isScorable = scorableKeys.has(v.itemKey);
        const lbl = isScorable
          ? (scorableItems.find((s) => s.itemKey === v.itemKey)?.label || v.itemKey)
          : nonScorableLabel(v.itemKey, p);
        return `${lbl}: ${v.status}${v.note ? ` (${v.note})` : ''}`;
      }).join(' | ');

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

      const discByArea = (p.selectedAreas || [])
        .map((a) => {
          const d = discDetailMap[`${p.id}__${a}`];
          if (!d) return `${a}: N/A`;
          return `${a}: ${d.correlationPct}% | pessoa D${d.personD} I${d.personI} S${d.personS} C${d.personC} | cargo D${d.jobD} I${d.jobI} S${d.jobS} C${d.jobC}`;
        })
        .join(' ‖ ');

      const perfRecord = getLatestPerformance(performance, p.id, '');

      // Pós/MBA com o NOME REAL do curso (mbaBlocks), não o rótulo de área (postMBAs) — o
      // mesmo bug de "mostrar área em vez de nome real" já corrigido em todas as outras telas,
      // aplicado aqui também. Inclui títulos "Outro" (fora do catálogo) também, marcados como tal.
      const mbaBlocksStr = ((p as any).mbaBlocks || [])
        .filter((b: any) => b?.name?.trim())
        .map((b: any) => b.area === '__outro_mba__' ? `${b.name.trim()} (fora do catálogo)` : `${b.name.trim()} [${b.area}]`)
        .join(' | ');

      // Mesmo filtro usado na ficha (print-profile.tsx/audit.tsx): só conta curso livre com
      // nome, área e 16h ou mais. Sem isso, o CSV mostrava cursos que a ficha nem exibia.
      const freeCoursesStr = ((p as any).freeCourses || [])
        .filter((c: any) => c?.name?.trim() && c?.area && (c?.hours || 0) >= 16)
        .map((c: any) => `${c.name.trim()} | ${c.area} | ${c.hours}h`)
        .join(' ‖ ');

      const courseHoursStr = Object.entries(p.courseHours || {}).map(([k, v]) => `${k}: ${v}h`).join(' | ');
      const projectAreaMapStr = Object.entries(p.projectAreaMap || {}).map(([k, v]) => `${k} → ${v}`).join(' | ');
      const projectRelabelsStr = Object.entries(projectRelabels).map(([k, v]) => `${k} → ${v}`).join(' | ');
      const exceptionAssignmentsStr = Object.entries(exceptionAssignments)
        .map(([k, v]: [string, any]) => `${k}: ${v.area} / ${v.type} / ${v.label}`)
        .join(' | ');
      const exceptionItemsStr = (p.exceptionItems || [])
        .map((e) => `${e.type} | ${e.itemName} | ${e.targetArea || '—'} | ${e.objective}`)
        .join(' ‖ ');

      lines.push(row([
        p.name,
        p.email,
        p['matrícula'] || '',
        p.currentRole || '',
        p.unit || '',
        p.currentArea || '',
        (p.selectedAreas || []).join(' | '),
        p.submittedAt ? new Date(p.submittedAt).toLocaleString('pt-BR') : '',
        (p.positionsHeld || []).join(' | '),

        p.graduation || '',
        p.graduation2 || '',
        p.graduationCourseName || '',
        p.graduationException || '',
        proofGrad.startsWith('data:') || proofGrad.length > 100 ? 'arquivo enviado' : proofGrad || 'não informado',

        mbaBlocksStr,
        proofMBA || 'não informado',

        p.managerialMonths ?? '',
        p.interimMonths ?? '',
        p.experienceMonths ?? '',
        experienceOverride?.managerialMonths ?? '',
        experienceOverride?.interimMonths ?? '',
        experienceOverride?.note || '',

        (p.selectedCourses || []).join(' | '),
        freeCoursesStr,
        courseHoursStr,
        (p.certifications || []).join(' | '),

        (p.selectedProjects || []).join(' | '),
        projectAreaMapStr,
        projectRelabelsStr,

        p.exceptionRequested ? 'Sim' : 'Não',
        exceptionItemsStr,
        p.exceptionStatus || '',
        p.exceptionCatalogLabel ? `${p.exceptionCatalogArea || ''} / ${p.exceptionCatalogType || ''} / ${p.exceptionCatalogLabel}` : '',
        p.exceptionApprovalJustification || '',
        exceptionAssignmentsStr,

        perfRecord?.score100 ?? '',
        perfRecord?.date ? new Date(perfRecord.date).toLocaleString('pt-BR') : '',
        discByArea,

        audit?.overallStatus || p.validationStatus || 'provisional',
        audit?.overallNote || p.validationNote || '',
        p.adminNote || '',
        audit?.auditedAt ? new Date(audit.auditedAt).toLocaleString('pt-BR') : '',
        p.validatedAt ? new Date(p.validatedAt).toLocaleString('pt-BR') : '',

        allAuditedItems,

        pendingList,
        approvedList,
        rejectedList,
        pendingCount,

        confirmadaPorArea,
        potencialPorArea,
        comportamentalPorArea,
        totalPorArea,
        quadrantePorArea,

        (p.attachments || []).join(' | '),
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
