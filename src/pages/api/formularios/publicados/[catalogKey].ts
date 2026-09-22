import type { NextApiRequest, NextApiResponse } from 'next';
import { readPublicPublishedForm } from '@/modules/formularios/application/service';
import { authError, methodNotAllowed } from '@/modules/auth/server/http';
import { noStore } from '@/modules/auth/server/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const value = Array.isArray(req.query.catalogKey) ? req.query.catalogKey[0] : req.query.catalogKey;
    if (!value) throw new Error('INVALID_REQUEST');
    return res.status(200).json(await readPublicPublishedForm(value));
  } catch (error) {
    return authError(res, error);
  }
}
