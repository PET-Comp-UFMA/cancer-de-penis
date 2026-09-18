import type { NextApiRequest, NextApiResponse } from 'next';
import { login } from '@/modules/auth/application/service';
import { noStore, setCsrf, setSession } from '@/modules/auth/server/cookies';
import { requireMutation } from '@/modules/auth/server/guards';
import { authError, methodNotAllowed } from '@/modules/auth/server/http';
import { clientSource } from '@/modules/auth/server/client-source';
export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    requireMutation(req);
    const { username, password } = req.body;
    if (typeof username !== 'string' || !/^[a-zA-Z0-9._-]{3,64}$/.test(username.trim())
      || typeof password !== 'string' || password.length < 1 || password.length > 128) throw new Error('INVALID_REQUEST');
    const result = await login(username, password, clientSource(req));
    if (!result) throw new Error('INVALID_CREDENTIALS');
    setSession(res, result.token);
    const csrfToken = setCsrf(res, result.token);
    return res.status(200).json({
      user: { id: result.user.id, username: result.user.username, roles: result.user.roles },
      mustChangePassword: result.user.mustChangePassword,
      redirectTo: result.user.mustChangePassword ? '/admin/alterar-senha' : '/admin/formularios', csrfToken,
    });
  } catch (error) { return authError(res, error); }
}
