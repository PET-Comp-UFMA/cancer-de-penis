import type { NextApiRequest, NextApiResponse } from 'next';
import { findSession } from '@/modules/auth/infrastructure/repository';
import { clearSession, csrfCookie, noStore, requestToken, setCsrf } from '@/modules/auth/server/cookies';
import { authError, methodNotAllowed } from '@/modules/auth/server/http';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const token = requestToken(req);
    const context = token ? await findSession(token) : null;
    if (!context) clearSession(res);
    const csrfToken = setCsrf(res, context ? token : undefined, req.cookies[csrfCookie()]);
    return res.status(200).json({
      user: context ? { id: context.user.id, username: context.user.username, roles: context.user.roles } : null,
      mustChangePassword: context?.user.mustChangePassword ?? false, csrfToken,
    });
  } catch (error) { return authError(res, error); }
}
