import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson } from '../../../../lib/db';
import type { AuditReport } from '../../../../lib/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido.' });
  }
  const audits = readJson<AuditReport[]>('audits', []);
  const report = audits.find((item) => item.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Relatório não encontrado.' });
  }
  return res.status(200).json({ report });
}
