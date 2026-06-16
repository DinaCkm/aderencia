import type { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import { readJsonAsync, loadProofFiles } from '../../../lib/db';
import { buildAreaAssessment } from '../../../lib/business';
import type {
  ParticipantProfile,
  PerformanceRecord,
  DiscReport,
  DISCRecord,
} from '../../../lib/types';
import type { ProfileAudit } from './audit-profile';

export const config = { api: { responseLimit: false } };

const AREA_LABELS: Record<string, string> = {
  UAUD: 'Unidade de Auditoria Interna',
  UGE: 'Unidade de Gestão Estratégica',
  UGOC: 'Unidade de Governança e Conformidade',
  UGPD: 'Unidade de Gestão de Pessoas e Desenvolvimento',
  UADM: 'Unidade Administrativa',
  UCONT: 'Unidade de Contabilidade e Controladoria',
  UGTI: 'Unidade de Gestão de TI',
  UCAC: 'Unidade de Canais e Atendimento ao Cliente',
  UGCOM: 'Unidade de Comunicação',
  UJUR: 'Unidade Jurídica',
  UGFIN: 'Unidade de Gestão Financeira',
  UGRE: 'Unidade de Gestão Regional',
  UGFIN2: 'Unidade Finalística',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email obrigatório' });
  }

  const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
  const profile = participants.find((p) => p.email?.toLowerCase() === email.toLowerCase());
  if (!profile) return res.status(404).json({ error: 'Participante não encontrado' });

  const proofFilesFromDB = await loadProofFiles(profile.email || profile.id);
  const profileWithFiles = { ...profile, proofFiles: { ...(profile.proofFiles || {}), ...proofFilesFromDB } };

  const performance = await readJsonAsync<PerformanceRecord[]>('performance', []);
  const discs = await readJsonAsync<DiscReport[]>('discReports', []);
  const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);

  const approvedExceptions =
    profile.exceptionStatus === 'approved'
      ? profile.postMBAs.concat(profile.selectedCourses, profile.selectedProjects)
      : [];

  const areaAssessments = (profile.selectedAreas || []).map((area) => {
    const assessment = buildAreaAssessment(profileWithFiles, area, performance, discs, approvedExceptions);
    const discRecord = discRecords
      .filter((d) => d.participantId === profile.id && d.area === area)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt))[0];
    return { ...assessment, area, discRecord: discRecord || null };
  });

  const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
  const audit = audits.find((a) => a.participantId === profile.id);
  const overallStatus = audit?.overallStatus || profile.validationStatus || 'provisional';

  // ── Gerar PDF ──────────────────────────────────────────────────────────────
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const PURPLE = '#5B2D8E';
  const CYAN = '#0891b2';
  const GRAY = '#6b7280';
  const LIGHT_GRAY = '#f3f4f6';
  const RED = '#dc2626';
  const GREEN = '#16a34a';
  const ORANGE = '#d97706';

  const pageW = doc.page.width - 100; // largura útil (margens 50 cada lado)

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  // Faixa de aviso ANÁLISE PROVISÓRIA
  doc.rect(50, 40, pageW, 28).fill('#fff7ed');
  doc.rect(50, 40, pageW, 28).stroke('#f97316');
  doc.fontSize(11).fillColor('#c2410c').font('Helvetica-Bold')
    .text('⚠  ANÁLISE PROVISÓRIA — sujeita a revisão após auditoria dos comprovantes', 58, 48, { width: pageW - 16 });

  doc.moveDown(0.5);

  // Título da ficha
  doc.fontSize(9).fillColor(GRAY).font('Helvetica').text('FICHA COMPLETA DO CANDIDATO', 50, 80);
  doc.fontSize(18).fillColor(PURPLE).font('Helvetica-Bold').text(profile.name || '\u2014', 50, 93);

  const emailLine = `${profile.email || '\u2014'}  |  ${profile.unit || '\u2014'}  |  ${(profile as any).currentRole || '\u2014'}`;
  doc.fontSize(9).fillColor(GRAY).font('Helvetica').text(emailLine, 50, 116);

  // Status e data
  const statusColor = overallStatus === 'validated' ? GREEN : overallStatus === 'adjusted' ? ORANGE : '#92400e';
  const statusLabel = overallStatus === 'validated' ? 'Validada' : overallStatus === 'adjusted' ? 'Ajustada' : 'Provisória';
  doc.roundedRect(50, 132, 90, 18, 4).fill(overallStatus === 'validated' ? '#dcfce7' : overallStatus === 'adjusted' ? '#fef3c7' : '#fff7ed');
  doc.fontSize(8).fillColor(statusColor).font('Helvetica-Bold').text(statusLabel, 58, 137);

  const submittedAt = profile.submittedAt ? formatDate(profile.submittedAt) : '—';
  doc.roundedRect(148, 132, 130, 18, 4).fill(LIGHT_GRAY);
  doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(`Enviado em ${submittedAt}`, 156, 137);

  doc.moveTo(50, 158).lineTo(50 + pageW, 158).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.y = 168;

  // ── Aderência por Área ─────────────────────────────────────────────────────
  doc.fontSize(13).fillColor(PURPLE).font('Helvetica-Bold').text('Aderência por Área de Interesse', 50);
  doc.moveDown(0.4);

  for (const aa of areaAssessments) {
    const areaName = AREA_LABELS[aa.area] || aa.area;

    // Cabeçalho da área
    doc.rect(50, doc.y, pageW, 22).fill('#f5f3ff');
    doc.fontSize(11).fillColor(PURPLE).font('Helvetica-Bold').text(aa.area, 58, doc.y + 5);
    doc.fontSize(9).fillColor(GRAY).font('Helvetica').text(areaName, 58 + 60, doc.y - 11);

    // Notas
    const techLabel = `Técnica: ${aa.technicalAdherence?.toFixed(1) ?? '—'}`;
    const behLabel = `Comportamental: ${aa.behavioralAdherence?.toFixed(1) ?? '—'}`;
    doc.fontSize(9).fillColor(PURPLE).font('Helvetica-Bold').text(techLabel, 50 + pageW - 200, doc.y - 11, { width: 90, align: 'right' });
    doc.fontSize(9).fillColor(CYAN).font('Helvetica-Bold').text(behLabel, 50 + pageW - 100, doc.y - 11, { width: 100, align: 'right' });

    doc.moveDown(0.2);

    // Quadrante
    if (aa.quadrant) {
      doc.fontSize(8).fillColor(GREEN).font('Helvetica-Bold').text(`● ${aa.quadrant}`, 58);
      doc.moveDown(0.3);
    }

    // Linhas de cálculo
    if (aa.calculationSteps) {
      for (const step of aa.calculationSteps) {
        const isTotal = step.name.startsWith('Total');
        doc.fontSize(isTotal ? 9 : 8.5)
          .fillColor(isTotal ? PURPLE : '#1f2937')
          .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
          .text(step.name, 58, doc.y, { continued: true, width: pageW - 80 });
        doc.fillColor(isTotal ? PURPLE : '#1f2937').font('Helvetica-Bold')
          .text(String(step.value), { align: 'right', width: 60 });

        if (step.detail) {
          doc.fontSize(7.5).fillColor(GRAY).font('Helvetica')
            .text(`↳ ${step.detail}`, 68, doc.y, { width: pageW - 30 });
        }
        doc.moveDown(0.25);
      }
    }

    // Projetos da área
    if (aa.projectsDetail && aa.projectsDetail.length > 0) {
      doc.rect(58, doc.y, pageW - 16, 14).fill('#f0fdf4');
      doc.fontSize(7.5).fillColor('#166534').font('Helvetica-Bold')
        .text('Projetos desta área:', 64, doc.y + 3);
      doc.moveDown(0.2);
      for (const p of aa.projectsDetail) {
        doc.fontSize(7.5).fillColor('#166534').font('Helvetica')
          .text(`• ${p.label} (${p.points} pts)`, 68);
      }
      doc.moveDown(0.2);
    }

    // DISC
    if (aa.discRecord) {
      doc.fontSize(8).fillColor(CYAN).font('Helvetica-Bold')
        .text(`\u25C6 DISC \u2014 Correla\u00e7\u00e3o: ${aa.discRecord.correlationPct ?? '\u2014'}%`, 58);
      doc.moveDown(0.3);
    }

    doc.moveTo(50, doc.y).lineTo(50 + pageW, doc.y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Verificar se precisa de nova página
    if (doc.y > 720) doc.addPage();
  }

  // ── Análise Detalhada de Pontuação ─────────────────────────────────────────
  if (doc.y > 600) doc.addPage();

  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(PURPLE).font('Helvetica-Bold').text('Análise Detalhada de Pontuação');
  doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Itens declarados pelo candidato, o que pontuou e o que não pontuou com o motivo.');
  doc.moveDown(0.5);

  // Pós/MBA
  doc.fontSize(9).fillColor(PURPLE).font('Helvetica-Bold').text('PÓS/MBA');
  doc.moveDown(0.2);
  const mbaBlocks: any[] = (profile as any).mbaBlocks || [];
  if (mbaBlocks.length === 0) {
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Nenhum título informado.');
  } else {
    for (const mba of mbaBlocks) {
      if (!mba?.name?.trim() && !mba?.area) continue;
      const name = mba.name?.trim() || mba.area || '—';
      doc.fontSize(8).fillColor('#1f2937').font('Helvetica-Bold').text(`• ${name}`, 58, doc.y, { continued: true });
      doc.fillColor(GRAY).font('Helvetica').text(`  (${mba.area || 'área não informada'}, ${mba.year || '—'})`);
    }
  }
  doc.moveDown(0.4);

  // Experiência
  doc.fontSize(9).fillColor(PURPLE).font('Helvetica-Bold').text('EXPERIÊNCIA GERENCIAL / INTERINA');
  doc.moveDown(0.2);
  const manM = profile.managerialMonths ?? 0;
  const intM = profile.interimMonths ?? 0;
  const expPts = Math.min(20, Math.floor(((manM + intM) / 12) * 5 * 10) / 10);
  doc.fontSize(8).fillColor('#1f2937').font('Helvetica')
    .text(`Gerencial: ${manM}m + Interino: ${intM}m = ${manM + intM}m totais → ${expPts} pts (5 pts/ano, máx. 20)`, 58);
  doc.moveDown(0.4);

  // Projetos
  doc.fontSize(9).fillColor(PURPLE).font('Helvetica-Bold').text('PROJETOS ESTRATÉGICOS');
  doc.moveDown(0.2);
  if (!profile.selectedProjects || profile.selectedProjects.length === 0) {
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Nenhum projeto selecionado.', 58);
  } else {
    for (const proj of profile.selectedProjects) {
      const assignedArea = (profile.projectAreaMap || {})[proj];
      doc.fontSize(8).fillColor('#1f2937').font('Helvetica')
        .text(`• ${proj}`, 58, doc.y, { continued: true });
      doc.fillColor(GRAY).font('Helvetica')
        .text(assignedArea ? `  → Área: ${assignedArea}` : '  → Área não vinculada');
    }
  }
  doc.moveDown(0.4);

  // Graduação
  doc.fontSize(9).fillColor(PURPLE).font('Helvetica-Bold').text('GRADUAÇÃO (registrada — não entra na nota)');
  doc.moveDown(0.2);
  const grad = profile.graduation || (profile as any).graduationCourseName;
  if (!grad) {
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Não informada.', 58);
  } else {
    doc.fontSize(8).fillColor('#1f2937').font('Helvetica').text(`• ${grad}`, 58);
    const grad2 = (profile as any).graduation2 || (profile as any).graduation2CourseName;
    if (grad2) doc.text(`• ${grad2}`, 58);
  }
  doc.moveDown(0.4);

  // Cursos
  doc.fontSize(9).fillColor(PURPLE).font('Helvetica-Bold').text('CURSOS EXTRACURRICULARES (registrados — não entram na nota)');
  doc.moveDown(0.2);
  if (!profile.selectedCourses || profile.selectedCourses.length === 0) {
    doc.fontSize(8).fillColor(GRAY).font('Helvetica').text('Nenhum curso selecionado.', 58);
  } else {
    for (const c of profile.selectedCourses) {
      const h = (profile.courseHours || {})[c];
      doc.fontSize(8).fillColor('#1f2937').font('Helvetica')
        .text(`• ${c}${h ? ` (${h}h)` : ''}`, 58);
    }
  }

  // ── Validações de Auditoria ────────────────────────────────────────────────
  if (audit && audit.itemValidations && audit.itemValidations.length > 0) {
    if (doc.y > 600) doc.addPage();
    doc.moveDown(0.8);
    doc.fontSize(13).fillColor(PURPLE).font('Helvetica-Bold').text('Validações da Auditoria');
    doc.moveDown(0.3);

    for (const v of audit.itemValidations) {
      const color = v.status === 'approved' ? GREEN : v.status === 'rejected' ? RED : ORANGE;
      const icon = v.status === 'approved' ? '\u2713' : v.status === 'rejected' ? '\u2717' : '\u23F3';
      const label = v.status === 'approved' ? 'Aprovado' : v.status === 'rejected' ? 'Rejeitado' : 'Pendente';
      doc.fontSize(8).fillColor(color).font('Helvetica-Bold')
        .text(`${icon} ${label}`, 58, doc.y, { continued: true, width: 70 });
      doc.fillColor('#1f2937').font('Helvetica')
        .text(` — ${v.itemKey || '—'}`, { width: pageW - 80 });
      if (v.note) {
        doc.fontSize(7.5).fillColor(GRAY).font('Helvetica')
          .text(`   Obs: ${v.note}`, 68, doc.y, { width: pageW - 30 });
      }
      doc.moveDown(0.2);
    }

    if (audit.overallNote) {
      doc.moveDown(0.3);
      doc.fontSize(8).fillColor(GRAY).font('Helvetica-Bold').text('Observação geral do auditor:');
      doc.fontSize(8).fillColor('#1f2937').font('Helvetica').text(audit.overallNote, 58);
    }
  }

  // ── Rodapé em todas as páginas ─────────────────────────────────────────────
  const totalPages = (doc as any).bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).fillColor(GRAY).font('Helvetica')
      .text(
        `Banco de Sucessores Aderência — SEBRAE Tocantins  |  Gerado em ${new Date().toLocaleString('pt-BR')}  |  Pág. ${i + 1}/${totalPages}`,
        50, doc.page.height - 35, { width: pageW, align: 'center' }
      );
    doc.moveTo(50, doc.page.height - 42).lineTo(50 + pageW, doc.page.height - 42)
      .strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on('end', resolve));

  const pdfBuffer = Buffer.concat(chunks);
  const safeName = (profile.name || 'candidato').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="analise_${safeName}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.status(200).end(pdfBuffer);
}
