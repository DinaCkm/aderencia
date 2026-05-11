import { useEffect, useState } from 'react';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { AreaAssessment } from '../../lib/types';

export default function AdminNineBox() {
  const [report, setReport] = useState<Record<string, AreaAssessment[]>>({});

  useEffect(() => {
    fetch('/api/admin/ninebox')
      .then((res) => res.json())
      .then((data) => setReport(data.report || {}));
  }, []);

  return (
    <main className="container">
      <h1>Nine Box por área</h1>
      <p>Resultado final por área, calculado a partir de aderência técnica e comportamental.</p>
      {OFFICIAL_AREAS.map((area) => (
        <section key={area} className="form-card">
          <h2>{area}</h2>
          {report[area] && report[area].length > 0 ? (
            <div>
              {report[area].map((assessment) => (
                <div key={`${assessment.participantId}-${assessment.area}`} className="card">
                  <p>Participante: {assessment.participantId}</p>
                  <p>Quadrante: {assessment.quadrant}</p>
                  <p>Aderência Técnica: {assessment.technicalAdherence}</p>
                  <p>Aderência Comportamental: {assessment.behavioralAdherence ?? 'sem dados'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhuma avaliação processada para esta área.</p>
          )}
        </section>
      ))}
    </main>
  );
}
