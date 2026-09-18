import { isIP } from 'node:net';
import type { NextApiRequest } from 'next';

export function clientSource(req: NextApiRequest) {
  // Trust this header only inside the Vercel runtime, where the edge sets it.
  // On other hosts, arbitrary X-Forwarded-For headers never identify a client.
  const forwarded = req.headers['x-vercel-forwarded-for'];
  if (process.env.VERCEL === '1' && typeof forwarded === 'string' && isIP(forwarded.trim())) {
    return forwarded.trim();
  }
  return req.socket.remoteAddress || 'unknown-connection';
}
