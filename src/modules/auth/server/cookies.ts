import type { NextApiRequest, NextApiResponse } from 'next';
import { authEnv } from '../infrastructure/env';
import { constantEqual, randomToken, signCsrf, validCsrf } from '../infrastructure/crypto';
export const sessionCookie = () => authEnv().secure ? '__Host-admin_session' : 'admin_session';
export const csrfCookie = () => authEnv().secure ? '__Host-admin_csrf' : 'admin_csrf';
function appendCookie(res: NextApiResponse, cookie: string) {
  const current = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [...(Array.isArray(current) ? current.map(String) : current ? [String(current)] : []), cookie]);
}
function attributes() {
  return '; Path=/; HttpOnly; SameSite=Strict' + (authEnv().secure ? '; Secure' : '');
}
export function setCsrf(res: NextApiResponse, token?: string, existing?: string) {
  const secret = authEnv().secret;
  const signed = existing && existing.length < 200 && validCsrf(existing, secret, token)
    ? existing : signCsrf(randomToken(), secret, token);
  appendCookie(res, csrfCookie() + '=' + signed + attributes());
  return signed;
}
export function checkCsrf(req: NextApiRequest) {
  const header = req.headers['x-csrf-token'], cookie = req.cookies[csrfCookie()];
  return typeof header === 'string' && header.length < 200 && typeof cookie === 'string'
    && constantEqual(header, cookie) && validCsrf(header, authEnv().secret, requestToken(req));
}
export function setSession(res: NextApiResponse, token: string) {
  appendCookie(res, sessionCookie() + '=' + token + attributes() + '; Max-Age=86400');
}
export function clearSession(res: NextApiResponse) {
  appendCookie(res, sessionCookie() + '=' + attributes() + '; Max-Age=0');
}
export function noStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('Vary', 'Cookie');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
export function requestToken(req: Pick<NextApiRequest, 'cookies'>) {
  const token = req.cookies[sessionCookie()];
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : undefined;
}
