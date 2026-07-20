import type { NextApiRequest, NextApiResponse } from 'next';
import { readJsonAsync, writeJsonAsync, loadProofFiles } from '../../../lib/db';
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
  // Ajuste manual da experiência gerencial/interina feito pelo administrador durante a
  // auditoria — sobrepõe os meses autodeclarados pelo candidato no cálculo de pontuação.
  experienceOverride?: {
    managerialMonths?: number;
    interimMonths?: number;
    note?: string;
    adjustedAt?: string;
  };
  // Reclassificação manual de projetos: quando o admin identifica que o título escolhido pelo
  // candidato não é o item correto do catálogo para a área (ex: "Programa de desenvolvimento
  // territorial" reclassificado para "Desenvolvimento regional e interiorização"), o novo título
  // é salvo aqui, chaveado por itemKey (ex: "projeto-2"), e passa a valer para o cálculo de pontos.
  projectRelabels?: Record<string, string>;
  // Atribuição de área/catálogo por exceção (chaveado por itemKey, ex: "excecao-0") — cada exceção
  // recebe exatamente o mesmo tratamento de um projeto: área de aplicação + item do catálogo ao
  // qual foi equiparada. O status (Pendente/Validado/Rejeitado) continua em itemValidations.
  exceptionAssignments?: Record<string, { area: string; label: string; type: 'projeto' | 'pos-mba' }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — buscar ficha completa de um participante
  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email obrigatório' });
    }
    try {
      const participants = await readJsonAsync<ParticipantProfile[]>('participants', []);
      const profile = participants.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase()
      );
      if (!profile) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      // Carregar arquivos de comprovante da tabela proof_files separada
      const proofFilesFromDB = await loadProofFiles(profile.email || profile.id);
      const mergedProofFiles = {
        ...(profile.proofFiles || {}), // arquivos legados (nome) do JSON
        ...proofFilesFromDB,           // arquivos base64 da tabela separada
      };
      const profileWithFiles = { ...profile, proofFiles: mergedProofFiles };
      // Buscar validações salvas
      const audits = await readJsonAsync<ProfileAudit[]>('profile_audits', []);
      const audit = audits.find((a) => a.participantId === profile.id) || {
        participantId: profile.id,
        itemValidations: [],
        overallStatus: profile.validationStatus || 'provisional',
        overallNote: profile.validationNote,
      };
      return res.status(200).json({ profile: profileWithFiles, audit });
    } catch (err: any) {
      console.error(`[audit-profile] Erro ao carregar ficha de ${email}:`, err);
      return res.status(500).json({ error: `Erro interno ao carregar ficha: ${err?.message || err}` });
    }
  }

  // POST — salvar validação de um ou mais itens
  if (req.method === 'POST') {
    const { participantId, itemValidation, overallStatus, overallNote, experienceOverride, clearExperienceOverride, projectRelabel, exceptionAssignment } = req.body as {
      participantId: string;
      itemValidation?: ItemValidation;
      overallStatus?: string;
      overallNote?: string;
      experienceOverride?: { managerialMonths?: number; interimMonths?: number; note?: string };
      clearExperienceOverride?: boolean;
      projectRelabel?: { itemKey: string; newLabel: string | null }; // newLabel null/vazio remove a reclassificação
      exceptionAssignment?: { itemKey: string; area: string | null; label: string | null; type: 'projeto' | 'pos-mba' | null }; // area/label/type null remove a atribuição
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

    // Atualizar ajuste manual de experiência gerencial/interina
    if (clearExperienceOverride) {
      delete audit.experienceOverride;
    } else if (experienceOverride) {
      audit.experienceOverride = {
        managerialMonths: experienceOverride.managerialMonths,
        interimMonths: experienceOverride.interimMonths,
        note: experienceOverride.note,
        adjustedAt: new Date().toISOString(),
      };
    }

    // Atualizar reclassificação manual de projeto (troca do título usado para o cálculo)
    if (projectRelabel) {
      const relabels = { ...(audit.projectRelabels || {}) };
      if (projectRelabel.newLabel && projectRelabel.newLabel.trim()) {
        relabels[projectRelabel.itemKey] = projectRelabel.newLabel.trim();
      } else {
        delete relabels[projectRelabel.itemKey];
      }
      audit.projectRelabels = relabels;
    }

    // Atualizar atribuição de área/catálogo de uma exceção (mesmo tratamento de um projeto)
    if (exceptionAssignment) {
      const assignments = { ...(audit.exceptionAssignments || {}) };
      if (exceptionAssignment.area && exceptionAssignment.label && exceptionAssignment.type) {
        assignments[exceptionAssignment.itemKey] = {
          area: exceptionAssignment.area,
          label: exceptionAssignment.label,
          type: exceptionAssignment.type,
        };
      } else {
        delete assignments[exceptionAssignment.itemKey];
      }
      audit.exceptionAssignments = assignments;
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
