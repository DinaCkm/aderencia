import type { NextApiRequest, NextApiResponse } from 'next';
import { loadExtraProofFiles, saveExtraProofFile, deleteExtraProofFile } from '../../../lib/db';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

// GET    /api/admin/proof-extra?email=xxx&itemKey=yyy
//        -> lista os documentos extras (slot 1 e 2) desse item
// POST   /api/admin/proof-extra   { email, itemKey, slot, fileData, fileName }
//        -> salva/substitui o documento extra em um slot (1 ou 2)
// DELETE /api/admin/proof-extra   { email, itemKey, slot }
//        -> remove o documento extra de um slot
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { email, itemKey } = req.query;
    if (!email || typeof email !== 'string' || !itemKey || typeof itemKey !== 'string') {
      return res.status(400).json({ error: 'email e itemKey são obrigatórios.' });
    }
    const files = await loadExtraProofFiles(email, itemKey);
    return res.status(200).json({ files });
  }

  if (req.method === 'POST') {
    const { email, itemKey, slot, fileData, fileName } = req.body as {
      email: string;
      itemKey: string;
      slot: number;
      fileData: string;
      fileName?: string;
    };
    if (!email || !itemKey || !fileData) {
      return res.status(400).json({ error: 'email, itemKey e fileData são obrigatórios.' });
    }
    const slotNum = Number(slot);
    if (![1, 2].includes(slotNum)) {
      return res.status(400).json({ error: 'slot deve ser 1 ou 2 (máximo de 3 documentos por item, incluindo o principal).' });
    }
    try {
      await saveExtraProofFile(email, itemKey, slotNum, fileData, fileName || '');
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Erro ao salvar documento extra.' });
    }
  }

  if (req.method === 'DELETE') {
    const { email, itemKey, slot } = req.body as { email: string; itemKey: string; slot: number };
    if (!email || !itemKey || !slot) {
      return res.status(400).json({ error: 'email, itemKey e slot são obrigatórios.' });
    }
    try {
      await deleteExtraProofFile(email, itemKey, Number(slot));
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Erro ao remover documento extra.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
