import { Pool } from 'pg';
let pool: Pool | undefined;
export function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED');
  let url: URL;
  try { url = new URL(process.env.DATABASE_URL); } catch { throw new Error('INVALID_DATABASE_URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('INVALID_DATABASE_URL');
  // Prevent pg connection-string flags from overriding certificate verification.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) url.searchParams.delete(key);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const tls = process.env.DATABASE_SSL === 'true';
  if (!tls && !local) throw new Error('DATABASE_TLS_REQUIRED');
  const ca = process.env.DATABASE_CA?.replace(/\\n/g, '\n');
  pool = new Pool({
    connectionString: url.toString(),
    ssl: tls ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : false,
    max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000, statement_timeout: 15000,
  });
  pool.on('error', () => console.error('Conexão ociosa do banco interrompida.'));
  return pool;
}

export async function closePool() {
  const current = pool;
  pool = undefined;
  if (current) await current.end();
}
