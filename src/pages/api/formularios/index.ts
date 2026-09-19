import type { NextApiRequest, NextApiResponse } from 'next';
import { listOwnedForms } from '@/modules/formularios/application/service';
import { authError, methodNotAllowed } from '@/modules/auth/server/http';
import { requireRole } from '@/modules/auth/server/guards';
import { noStore } from '@/modules/auth/server/cookies';

const DEFAULT_PAGE_SIZE = 6;

function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) throw new Error('INVALID_REQUEST');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error('INVALID_REQUEST');
  return parsed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const context = await requireRole(req, 'admin');
    const search = (queryValue(req.query.search) ?? queryValue(req.query.q) ?? '').trim();
    if (search.length > 100) throw new Error('INVALID_REQUEST');
    const page = positiveInteger(queryValue(req.query.page), 1);
    const pageSize = positiveInteger(queryValue(req.query.pageSize), DEFAULT_PAGE_SIZE);
    const result = await listOwnedForms({ ownerId: context.user.id, search, page, pageSize });
    return res.status(200).json({
      forms: result.items,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
    });
  } catch (error) {
    return authError(res, error);
  }
}
