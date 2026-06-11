import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync } from '../../../lib/db';
import type { ParticipantProfile, PerformanceRecord, DISCRecord } from '../../../lib/types';

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
    // Exportação completa: todos os dados em um único CSV
    const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
    const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
    const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);

    const submitted = participants.filter((p) => p.submittedAt);

    // Criar mapa de performance e DISC por participantId
    const perfMap: Record<string, number> = {};
    for (const r of performance) {
      if (!perfMap[r.participantId] || r.date > (performance.find(x => x.participantId === r.participantId && perfMap[x.participantId] === x.score100)?.date || '')) {
        perfMap[r.participantId] = r.score100;
      }
    }
    // Pegar score DISC mais recente por participante+área
    const discMap: Record<string, number> = {};
    for (const r of discRecords) {
      const key = `${r.participantId}__${r.area}`;
      discMap[key] = r.correlationPct;
    }

    const headers = [
      'Nome', 'E-mail', 'Matrícula', 'Áreas de Interesse', 'Data de Envio',
      'Graduação', 'Pós/MBA', 'Meses Gerenciais', 'Meses Interinos',
      'Cursos Extracurriculares', 'Projetos Estratégicos',
      'Score Performance (0-100)', 'Score DISC por Área',
      'Status de Exceção', 'Validação',
    ];

    const lines = [headers.join(',')];

    for (const p of submitted) {
      const discByArea = (p.selectedAreas || [])
        .map((a) => `${a}: ${discMap[`${p.id}__${a}`] ?? 'N/A'}`)
        .join(' | ');

      lines.push(row([
        p.name,
        p.email,
        p['matrícula'] || '',
        (p.selectedAreas || []).join(' | '),
        p.submittedAt ? new Date(p.submittedAt).toLocaleString('pt-BR') : '',
        p.graduation || '',
        (p.postMBAs || []).join(' | '),
        p.managerialMonths ?? '',
        p.interimMonths ?? '',
        (p.selectedCourses || []).join(' | '),
        (p.selectedProjects || []).join(' | '),
        perfMap[p.id] ?? '',
        discByArea,
        p.exceptionStatus || '',
        p.validationStatus || '',
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
