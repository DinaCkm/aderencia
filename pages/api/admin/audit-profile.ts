import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync } from '../../../lib/db';
import type { ParticipantProfile } from '../../../lib/types';

// Estrutura de validação por item
export interface ItemValidation {
  itemKey: string;       // chave única do item (ex: 'postMBA_0', 'project_Gestão...')
  status: 'pending' | 'approved' | 'rejected';
  note?: string;         // observação do admin
  validatedAt?: string;
  validatedBy?: string;
}

export interface ProfileAudit {
  participantId: string;
  itemValidations: ItemValidation[];
  overallStatus: 'provisional' | 'validated' | 'adjusted';
  overallNote?: string;
  auditedAt?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — buscar ficha completa de um participante
  if (req.method === 'GET') {
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
    // Buscar validações salvas
    const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
    const audit = audits.find((a) => a.participantId === profile.id) || {
      participantId: profile.id,
      itemValidations: [],
      overallStatus: profile.validationStatus || 'provisional',
      overallNote: profile.validationNote,
    };
    return res.status(200).json({ profile, audit });
  }

  // POST — salvar validação de um ou mais itens
  if (req.method === 'POST') {
    const { participantId, itemValidation, overallStatus, overallNote } = req.body as {
      participantId: string;
      itemValidation?: ItemValidation;
      overallStatus?: string;
      overallNote?: string;
    };

    if (!participantId) {
      return res.status(400).json({ error: 'participantId obrigatório' });
    }

    const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
    const idx = audits.findIndex((a) => a.participantId === participantId);

    let audit: ProfileAudit = idx >= 0 ? audits[idx] : {
      participantId,
      itemValidations: [],
      overallStatus: 'provisional',
    };

    // Atualizar validação de item específico
    if (itemValidation) {
      const existingIdx = audit.itemValidations.findIndex(
        (v) => v.itemKey === itemValidation.itemKey
      );
      const updated: ItemValidation = {
        ...itemValidation,
        validatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        audit.itemValidations[existingIdx] = updated;
      } else {
        audit.itemValidations.push(updated);
      }
    }

    // Atualizar status geral
    if (overallStatus) {
      audit.overallStatus = overallStatus as ProfileAudit['overallStatus'];
      audit.overallNote = overallNote;
      audit.auditedAt = new Date().toISOString();
    }

    if (idx >= 0) {
      audits[idx] = audit;
    } else {
      audits.push(audit);
    }

    await writeJsonAsync('profile_audits', audits);

    // Atualizar também o validationStatus no perfil do participante
    if (overallStatus) {
      const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
      const pIdx = participants.findIndex((p) => p.id === participantId);
      if (pIdx >= 0) {
        participants[pIdx].validationStatus = overallStatus as ParticipantProfile['validationStatus'];
        participants[pIdx].validationNote = overallNote;
        participants[pIdx].validatedAt = new Date().toISOString();
        await writeJsonAsync('participants', participants);
      }
    }

    return res.status(200).json({ success: true, audit });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
