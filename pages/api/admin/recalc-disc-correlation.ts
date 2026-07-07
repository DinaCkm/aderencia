import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { DISCRecord, DiscReport } from '../../../lib/types';
import { calcDiscCorrelation } from '../../../lib/disc';

// Endpoint temporário — recalcula a correlação DISC de TODOS os candidatos já
// importados, substituindo o % antigo (que vinha pronto da planilha) pela nova
// fórmula própria (proximidade por indicador D/I/S/C, base = maior valor).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const discRecords = await readJsonAsync<DISCRecord[]>('disc_records', []);
  const discReports = await readJsonAsync<DiscReport[]>('discReports', []);

  const changes: any[] = [];
  const updatedRecords = discRecords.map((r) => {
    const newCorr = calcDiscCorrelation(
      r.personD, r.personI, r.personS, r.personC,
      r.jobD, r.jobI, r.jobS, r.jobC
    );
    if (newCorr !== r.correlationPct) {
      changes.push({
        name: r.participantName,
        area: r.area,
        correlationPctAntigo: r.correlationPct,
        correlationPctNovo: newCorr,
      });
    }
    return { ...r, correlationPct: newCorr };
  });

  const updatedReports = discReports.map((rep) => {
    const match = updatedRecords.find(
      (r) => r.participantId === rep.participantId && r.area === rep.area
    );
    if (!match) return rep;
    const newScore10 = Math.round((match.correlationPct / 10) * 10) / 10;
    return { ...rep, score10: newScore10 };
  });

  await Promise.all([
    writeJsonAsync('disc_records', updatedRecords),
    writeJsonAsync('discReports', updatedReports),
  ]);

  return res.status(200).json({
    success: true,
    totalRecords: discRecords.length,
    totalChanged: changes.length,
    changes,
  });
}
