export function authEnv() {
  const production = process.env.NODE_ENV === 'production';
  const origin = process.env.APP_ORIGIN || (production ? '' : 'http://localhost:3000');
  const url = new URL(origin);
  if (url.origin !== origin || url.username || url.password) throw new Error('INVALID_APP_ORIGIN');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local && !production)) throw new Error('HTTPS_REQUIRED');
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('AUTH_SECRET_REQUIRED');
  return { origin, secret, production, secure: url.protocol === 'https:',
    idleMs: 8 * 60 * 60 * 1000, absoluteMs: 24 * 60 * 60 * 1000 };
}
