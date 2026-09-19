import type { PoolClient } from 'pg';
import { getPool } from '@/modules/auth/infrastructure/db';
import type {
  FormListItem,
  FormStatus,
  ListFormsResult,
  ListPublishedFormsResult,
  PublicFormListItem,
} from '../domain/types';

type FormRow = {
  id: string;
  catalog_key: string;
  title: string;
  description: string;
  status: FormListItem['status'];
  definition_state: FormListItem['definitionState'];
  created_at: Date;
  updated_at: Date;
};

type PublishedFormRow = {
  id: string;
  catalog_key: string;
  title: string;
  description: string;
  updated_at: Date;
};

function toListItem(row: FormRow): FormListItem {
  return {
    id: row.id,
    catalogKey: row.catalog_key,
    title: row.title,
    description: row.description,
    status: row.status,
    definitionState: row.definition_state,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toPublicListItem(row: PublishedFormRow): PublicFormListItem {
  return {
    id: row.id,
    catalogKey: row.catalog_key,
    title: row.title,
    description: row.description,
    updatedAt: row.updated_at.toISOString(),
  };
}

function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, '\\$&')}%`;
}

export async function listForms(ownerId: string, search: string, page: number, pageSize: number): Promise<ListFormsResult> {
  const client = await getPool().connect();
  const offset = (page - 1) * pageSize;
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const pattern = `%${search}%`;
    const count = await client.query<{ total: string }>(
      `select count(*)::text as total
         from app_private.admin_forms
        where owner_id = $1
          and ($2 = '' or title ilike $3 or description ilike $3 or catalog_key ilike $3)`,
      [ownerId, search, pattern],
    );
    const rows = await client.query<FormRow>(
      `select id, catalog_key, title, description, status, definition_state, created_at, updated_at
         from app_private.admin_forms
        where owner_id = $1
          and ($2 = '' or title ilike $3 or description ilike $3 or catalog_key ilike $3)
        order by updated_at desc, id desc
        limit $4 offset $5`,
      [ownerId, search, pattern, pageSize, offset],
    );
    await client.query('commit');
    return { items: rows.rows.map(toListItem), total: Number(count.rows[0]?.total || 0), page, pageSize };
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listPublishedForms(
  search: string,
  page: number,
  pageSize: number,
): Promise<ListPublishedFormsResult> {
  const client = await getPool().connect();
  const offset = (BigInt(page - 1) * BigInt(pageSize)).toString();
  try {
    await client.query('begin');
    const pattern = likePattern(search);
    const publishedCount = await client.query<{ total: string }>(
      `select count(*)::text as total
         from app_private.admin_forms
        where status = 'published'`,
    );
    const count = await client.query<{ total: string }>(
      `select count(*)::text as total
         from app_private.admin_forms
         where status = 'published'
           and ($1 = '' or title ilike $2 escape E'\\\\' or description ilike $2 escape E'\\\\' or catalog_key ilike $2 escape E'\\\\')`,
      [search, pattern],
    );
    const rows = await client.query<PublishedFormRow>(
      `select id, catalog_key, title, description, updated_at
         from app_private.admin_forms
         where status = 'published'
           and ($1 = '' or title ilike $2 escape E'\\\\' or description ilike $2 escape E'\\\\' or catalog_key ilike $2 escape E'\\\\')
        order by updated_at desc, id desc
        limit $3 offset $4`,
      [search, pattern, pageSize, offset],
    );
    await client.query('commit');
    return {
      items: rows.rows.map(toPublicListItem),
      total: Number(count.rows[0]?.total || 0),
      publishedTotal: Number(publishedCount.rows[0]?.total || 0),
      page,
      pageSize,
    };
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateFormStatus(
  ownerId: string,
  formId: string,
  status: FormStatus,
): Promise<FormListItem> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const current = await client.query<FormRow>(
      `select id, catalog_key, title, description, status, definition_state, created_at, updated_at
         from app_private.admin_forms
        where id = $1 and owner_id = $2
        for update`,
      [formId, ownerId],
    );
    const existing = current.rows[0];
    if (!existing) throw new Error('FORM_NOT_FOUND');
    if (status === 'published' && existing.definition_state !== 'complete') {
      throw new Error('FORM_NOT_READY');
    }

    if (existing.status === status) {
      await client.query('commit');
      return toListItem(existing);
    }

    const updated = await client.query<FormRow>(
      `update app_private.admin_forms
          set status = $3, updated_at = now()
        where id = $1 and owner_id = $2
        returning id, catalog_key, title, description, status, definition_state, created_at, updated_at`,
      [formId, ownerId, status],
    );
    await client.query('commit');
    const row = updated.rows[0];
    if (!row) throw new Error('FORM_NOT_FOUND');
    return toListItem(row);
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteOwnedForm(ownerId: string, formId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const current = await client.query<{ status: FormStatus }>(
      `select status
         from app_private.admin_forms
        where id = $1 and owner_id = $2
        for update`,
      [formId, ownerId],
    );
    const existing = current.rows[0];
    if (!existing) throw new Error('FORM_NOT_FOUND');
    if (existing.status === 'published') throw new Error('FORM_PUBLISHED_CANNOT_DELETE');

    await client.query(
      'delete from app_private.admin_forms where id = $1 and owner_id = $2',
      [formId, ownerId],
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export type FormRepositoryClient = PoolClient;
