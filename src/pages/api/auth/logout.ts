import type { NextApiRequest, NextApiResponse } from 'next';
import { revoke } from '@/modules/auth/application/service';
import { clearSession, noStore, requestToken, setCsrf } from '@/modules/auth/server/cookies';
import { requireMutation } from '@/modules/auth/server/guards';
import { authError, methodNotAllowed } from '@/modules/auth/server/http';
export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    requireMutation(req);
    const token = requestToken(req);
    if (token) await revoke(token);
    clearSession(res);
    return res.status(200).json({ csrfToken: setCsrf(res) });
  } catch (error) { return authError(res, error); }
}
