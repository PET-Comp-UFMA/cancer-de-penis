import type { NextApiRequest } from 'next';
import { authEnv } from '../infrastructure/env';
import { findSession } from '../infrastructure/repository';
import { checkCsrf, requestToken } from './cookies';
import type { AuthContext, AuthRole } from '../domain/types';
export async function requireSession(req: Pick<NextApiRequest, 'cookies'>, options: { allowPasswordChange?: boolean } = {}): Promise<AuthContext> {
  const token = requestToken(req);
  const found = token ? await findSession(token) : null;
  if (!found) throw new Error('UNAUTHENTICATED');
  if (found.user.mustChangePassword && !options.allowPasswordChange) throw new Error('PASSWORD_CHANGE_REQUIRED');
  return found;
}
export async function requireRole(req: Pick<NextApiRequest, 'cookies'>, role: AuthRole): Promise<AuthContext> {
  const context = await requireSession(req);
  if (!context.user.roles.includes(role)) throw new Error('FORBIDDEN');
  return context;
}
export function checkRequestSecurity(req: NextApiRequest) {
  if (req.headers.origin !== authEnv().origin) return false;
  const site = req.headers['sec-fetch-site'];
  return !site || site === 'same-origin';
}
export function requireMutation(req: NextApiRequest) {
  if (!checkRequestSecurity(req) || !checkCsrf(req)) throw new Error('FORBIDDEN');
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new Error('INVALID_REQUEST');
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new Error('INVALID_REQUEST');
}
