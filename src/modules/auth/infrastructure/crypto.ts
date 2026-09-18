import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
export const normalizeUsername = (value: string) => value.trim().toLowerCase();
export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
export function hashPassword(password: string) {
  // 2 = Argon2id; the package's ambient const enum cannot be imported with isolatedModules.
  return hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}
export async function verifyPassword(encoded: string, password: string) {
  try { return await verify(encoded, password); } catch { return false; }
}
export function constantEqual(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function signCsrf(nonce: string, secret: string, sessionToken?: string) {
  const binding = sessionToken ? hashToken(sessionToken) : 'anonymous';
  const mac = createHmac('sha256', secret).update(binding + ':' + nonce).digest('base64url');
  return nonce + '.' + mac;
}
export function validCsrf(signed: string, secret: string, sessionToken?: string) {
  const parts = signed.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]{43}$/.test(parts[0])) return false;
  return constantEqual(signed, signCsrf(parts[0], secret, sessionToken));
}
