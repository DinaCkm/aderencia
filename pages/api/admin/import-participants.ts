import type { NextApiRequest, NextApiResponse } from 'next';
import { readJson, writeJson } from '../../../lib/db';
import { OFFICIAL_AREAS } from '../../../lib/constants';
import type { ParticipantProfile } from '../../../lib/types';

export const config = {
  api: {
    bodyParser: false
  }
};

function parseCsv(csv: string) {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

function parseList(cell: string | undefined) {
  return cell
    ? cell
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

async function readRawBody(request: NextApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const text = await readRawBody(req);
  if (!text) {
    return res.status(400).json({ error: 'Request body must be CSV text.' });
  }

  const rows = parseCsv(text);
  const participants = readJson<ParticipantProfile[]>('participants', []);
  let imported = 0;

  for (const row of rows) {
    const [
      id,
      name,
      email,
      matricula,
      unit,
      currentRole,
      selectedAreas,
      graduation,
      postMBAs,
      certifications,
      experienceMonths,
      positionsHeld,
      selectedCourses,
      selectedProjects,
      exceptionRequested,
      exceptionJustification,
      attachments,
      exceptionStatus
    ] = row;

    if (!id || !name || !email || !matricula || !unit || !currentRole || !selectedAreas || !graduation) {
      continue;
    }

    const areaValues = parseList(selectedAreas).filter((area) => OFFICIAL_AREAS.includes(area as any)) as ParticipantProfile['selectedAreas'];
    const participant: ParticipantProfile = {
      id,
      name,
      email,
      matricula,
      unit,
      currentRole,
      selectedAreas: areaValues,
      graduation,
      postMBAs: parseList(postMBAs),
      certifications: parseList(certifications),
      experienceMonths: Number(experienceMonths) || 0,
      positionsHeld: parseList(positionsHeld),
      selectedCourses: parseList(selectedCourses),
      selectedProjects: parseList(selectedProjects),
      exceptionRequested: exceptionRequested?.toLowerCase() === 'true',
      exceptionJustification: exceptionJustification || '',
      attachments: parseList(attachments),
      exceptionStatus: exceptionStatus === 'approved' || exceptionStatus === 'rejected' ? exceptionStatus : 'pending'
    };

    const existingIndex = participants.findIndex((item) => item.id === participant.id);
    if (existingIndex >= 0) {
      participants[existingIndex] = participant;
    } else {
      participants.push(participant);
    }
    imported += 1;
  }

  writeJson('participants', participants);
  return res.status(200).json({ message: `Importados ${imported} participantes.` });
}
