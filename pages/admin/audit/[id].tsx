import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { AuditReport } from '../../../lib/types';

export default function AuditReportPage() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState<AuditReport | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/audit/${id}`)
      .then((res) => res.json())
      .then((data) => setReport(data.report || null));
  }, [id]);

  if (!report) {
    return (
      <main className="container">
        <h1>Relatório de auditoria</h1>
        <p>Carregando relatório...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Relatório de auditoria</h1>
      <p>Participante: {report.participantId}</p>
      <p>Gerado em: {report.createdAt}</p>
      <section className="form-card">
        <h2>Dados de entrada</h2>
        <pre>{JSON.stringify(report.inputSnapshot, null, 2)}</pre>
      </section>
      <section className="form-card">
        <h2>Arquivos usados</h2>
        <ul>{report.filesUsed.map((file) => <li key={file}>{file}</li>)}</ul>
      </section>
      <section className="form-card">
        <h2>Regras aplicadas</h2>
        <ul>{report.rulesApplied.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      </section>
      <section className="form-card">
        <h2>Avaliações por área</h2>
        {report.areaAssessments.map((area) => (
          <article key={`${area.participantId}-${area.area}`} className="card">
            <h3>{area.area}</h3>
            <p>Quadrante: {area.quadrant}</p>
            <p>Aderência Técnica: {area.technicalAdherence}</p>
            <p>Aderência Comportamental: {area.behavioralAdherence ?? 'não calculada'}</p>
            <p>Exceções: {area.exceptions.join(', ') || 'Nenhuma'}</p>
            <details>
              <summary>Cálculos</summary>
              <pre>{JSON.stringify(area.calculationSteps, null, 2)}</pre>
            </details>
          </article>
        ))}
      </section>
    </main>
  );
}
