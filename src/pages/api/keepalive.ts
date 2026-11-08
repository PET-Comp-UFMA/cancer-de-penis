import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/modules/auth/infrastructure/db';
import { methodNotAllowed } from '@/modules/auth/server/http';
import { noStore } from '@/modules/auth/server/cookies';

// Called daily by Vercel Cron (vercel.json) so the free Supabase project
// is not paused after 7 days without database activity.

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function authorized(req: NextApiRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization ?? '';
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  if (!authorized(req)) return res.status(401).json({ error: 'Não autorizado.' });
  try {
    await getPool().query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch {
    console.error('Keepalive: falha ao consultar o banco.');
    return res.status(503).json({ ok: false });
  }
}
