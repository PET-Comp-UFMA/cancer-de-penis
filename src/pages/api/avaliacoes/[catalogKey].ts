import type { NextApiRequest, NextApiResponse } from 'next';
import { noStore } from '@/modules/auth/server/cookies';
import { methodNotAllowed } from '@/modules/auth/server/http';
import { evaluatePublishedForm } from '@/modules/avaliacoes/server/service';
import { evaluationError } from '@/modules/avaliacoes/server/http';
export default async function handler(req: NextApiRequest, res: NextApiResponse) { noStore(res); if (req.method !== 'POST') return methodNotAllowed(res, 'POST'); try { const value = Array.isArray(req.query.catalogKey) ? req.query.catalogKey[0] : req.query.catalogKey; const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}; return res.status(200).json(await evaluatePublishedForm({ catalogKey: value, publishedRevision: body.publishedRevision, answers: body.answers })); } catch (error) { return evaluationError(res, error); } }
