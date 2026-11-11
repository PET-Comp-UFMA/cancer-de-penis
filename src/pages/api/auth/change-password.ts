import type { NextApiRequest, NextApiResponse } from 'next';
import { changePassword } from '@/modules/auth/server/service';
import { noStore, setCsrf, setSession } from '@/modules/auth/server/cookies';
import { requireMutation, requireSession } from '@/modules/auth/server/guards';
import { authError, methodNotAllowed } from '@/modules/auth/server/http';
export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    requireMutation(req);
    const context = await requireSession(req, { allowPasswordChange: true });
    const { currentPassword, newPassword } = req.body;
    const result = await changePassword(context, currentPassword, newPassword);
    if (!result) {
      await requireSession(req, { allowPasswordChange: true });
      throw new Error('INVALID_CURRENT_PASSWORD');
    }
    setSession(res, result.token);
    const csrfToken = setCsrf(res, result.token);
    return res.status(200).json({
      user: { id: result.user.id, username: result.user.username, roles: result.user.roles },
      mustChangePassword: false, redirectTo: '/admin', csrfToken,
    });
  } catch (error) { return authError(res, error); }
}
