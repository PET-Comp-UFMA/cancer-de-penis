import type { PoolClient } from 'pg';
import { getPool } from '@/modules/auth/infrastructure/db';
import type {
  FormListItem,
  FormStatus,
  ListFormsResult,
  ListPublishedFormsResult,
  PublicFormListItem,
  FormDefinition,
  FormDetail,
  PublicFormDetail,
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
  definition?: FormDefinition | Record<string, never>;
  revision?: string | number;
};

type PublishedFormRow = {
  id: string;
  catalog_key: string;
  title: string;
  description: string;
  updated_at: Date;
  published_definition: FormDefinition;
  published_revision: string | number;
  published_at: Date;
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
    revision: Number(row.revision ?? 0),
  };
}

function toDetail(row: FormRow, definition: FormDefinition, revision: string | number): FormDetail {
  return { ...toListItem(row), definition, revision: Number(revision) };
}

function toPublicListItem(row: PublishedFormRow): PublicFormListItem {
  const definition = row.published_definition;
  return {
    id: row.id,
    catalogKey: row.catalog_key,
    title: definition.title,
    description: definition.description,
    updatedAt: row.published_at.toISOString(),
  };
}

function toPublicDetail(row: PublishedFormRow): PublicFormDetail {
  return {
    ...toPublicListItem(row),
    definition: row.published_definition,
    publishedRevision: Number(row.published_revision),
    publishedAt: row.published_at.toISOString(),
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
      `select id, catalog_key, title, description, status, definition_state, created_at, updated_at, revision
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
           and ($1 = '' or coalesce(published_definition->>'title', title) ilike $2 escape E'\\\\'
             or coalesce(published_definition->>'description', description) ilike $2 escape E'\\\\' or catalog_key ilike $2 escape E'\\\\')`,
      [search, pattern],
    );
    const rows = await client.query<PublishedFormRow>(
      `select id, catalog_key, title, description, updated_at,
              coalesce(published_definition, jsonb_build_object('schemaVersion', 1,
                'title', title, 'description', description, 'imageDataUrl', null,
                'authors', '[]'::jsonb, 'questions', '[]'::jsonb, 'resultBands', '[]'::jsonb)) as published_definition,
              coalesce(published_revision, revision) as published_revision,
              coalesce(published_at, updated_at) as published_at
         from app_private.admin_forms
        where status = 'published'
           and ($1 = '' or coalesce(published_definition->>'title', title) ilike $2 escape E'\\\\'
             or coalesce(published_definition->>'description', description) ilike $2 escape E'\\\\'
             or catalog_key ilike $2 escape E'\\\\')
        order by coalesce(published_at, updated_at) desc, id desc
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

export async function getPublishedForm(catalogKey: string): Promise<PublicFormDetail> {
  const client = await getPool().connect();
  try {
    const result = await client.query<PublishedFormRow>(
      `select id, catalog_key, title, description, updated_at,
              coalesce(published_definition, jsonb_build_object('schemaVersion', 1,
                'title', title, 'description', description, 'imageDataUrl', null,
                'authors', '[]'::jsonb, 'questions', '[]'::jsonb, 'resultBands', '[]'::jsonb)) as published_definition,
              coalesce(published_revision, revision) as published_revision,
              coalesce(published_at, updated_at) as published_at
         from app_private.admin_forms
        where upper(catalog_key) = upper($1) and status = 'published'`,
      [catalogKey],
    );
    const row = result.rows[0];
    if (!row) {
      const existing = await client.query(
        `select 1 from app_private.admin_forms
          where upper(catalog_key) = upper($1)
          limit 1`,
        [catalogKey],
      );
      throw new Error(existing.rowCount ? 'FORM_NOT_PUBLISHED' : 'FORM_NOT_FOUND');
    }
    return toPublicDetail(row);
  } finally {
    client.release();
  }
}

export async function updateFormStatus(
  ownerId: string,
  formId: string,
  status: FormStatus,
  expectedRevision: number,
): Promise<FormListItem> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const current = await client.query<FormRow>(
      `select id, catalog_key, title, description, status, definition_state, created_at, updated_at, revision
         from app_private.admin_forms
        where id = $1 and owner_id = $2
        for update`,
      [formId, ownerId],
    );
    const existing = current.rows[0];
    if (!existing) throw new Error('FORM_NOT_FOUND');
    if (Number(existing.revision) !== expectedRevision) {
      throw new Error('FORM_REVISION_CONFLICT');
    }
    if (status === 'published' && existing.definition_state !== 'complete') {
      throw new Error('FORM_NOT_READY');
    }

    if (status === 'published') {
      const updated = await client.query<FormRow>(
        `update app_private.admin_forms
            set status = 'published', published_definition = case
                  when definition is not null and definition <> '{}'::jsonb then definition
                  else published_definition
                end,
                published_revision = revision, published_at = now(), updated_at = now()
          where id = $1 and owner_id = $2 and revision = $3
          returning id, catalog_key, title, description, status, definition_state, created_at, updated_at, revision`,
        [formId, ownerId, existing.revision],
      );
      await client.query('commit');
      const row = updated.rows[0];
      if (!row) throw new Error('FORM_REVISION_CONFLICT');
      return toListItem(row);
    }

    if (existing.status === status) {
      await client.query('commit');
      return toListItem(existing);
    }

    const updated = await client.query<FormRow>(
      `update app_private.admin_forms
          set status = $3, revision = revision + 1, updated_at = now()
        where id = $1 and owner_id = $2
        returning id, catalog_key, title, description, status, definition_state, created_at, updated_at, revision`,
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

export async function createForm(
  ownerId: string,
  catalogKey: string,
  definition: FormDefinition,
  state: 'incomplete' | 'complete',
): Promise<FormDetail> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const result = await client.query<FormRow>(
      `insert into app_private.admin_forms (owner_id, catalog_key, title, description, status, definition_state, definition, revision)
       values ($1, $2, $3, $4, 'unpublished', $6, $5::jsonb, 0)
       returning id, catalog_key, title, description, status, definition_state, created_at, updated_at, definition, revision`,
      [ownerId, catalogKey, definition.title, definition.description, JSON.stringify(definition), state],
    );
    await client.query('commit');
    const row = result.rows[0];
    if (!row) throw new Error('FORM_NOT_FOUND');
    return toDetail(row, definition, row.revision ?? 0);
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

export async function getOwnedForm(ownerId: string, formId: string): Promise<FormDetail> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const result = await client.query<FormRow>(
      `select id, catalog_key, title, description, status, definition_state, created_at, updated_at, definition, revision
         from app_private.admin_forms where id = $1 and owner_id = $2`, [formId, ownerId]);
    await client.query('commit');
    const row = result.rows[0];
    if (!row) throw new Error('FORM_NOT_FOUND');
    const definition = row.definition && typeof row.definition === 'object' && row.definition.schemaVersion === 1
      ? row.definition as FormDefinition : { schemaVersion: 1 as const, title: row.title, description: row.description, imageDataUrl: null, authors: [], questions: [], resultBands: [] };
    return toDetail(row, definition, row.revision ?? 0);
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

export async function updateOwnedDefinition(ownerId: string, formId: string, definition: FormDefinition, expectedRevision: number, state: 'incomplete' | 'complete'): Promise<FormDetail> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', ownerId]);
    const current = await client.query<{ status: FormStatus; revision: string }>(
      `select status, revision from app_private.admin_forms where id = $1 and owner_id = $2 for update`, [formId, ownerId]);
    const existing = current.rows[0];
    if (!existing) throw new Error('FORM_NOT_FOUND');
    if (Number(existing.revision) !== expectedRevision) throw new Error('FORM_REVISION_CONFLICT');
    const result = await client.query<FormRow>(
      `update app_private.admin_forms
          set title = $3, description = $4, definition = $5::jsonb, definition_state = $6,
              revision = revision + 1, updated_at = now()
        where id = $1 and owner_id = $2 and revision = $7
        returning id, catalog_key, title, description, status, definition_state, created_at, updated_at, definition, revision`,
      [formId, ownerId, definition.title, definition.description, JSON.stringify(definition), state, expectedRevision],
    );
    await client.query('commit');
    const row = result.rows[0];
    if (!row) throw new Error('FORM_REVISION_CONFLICT');
    return toDetail(row, definition, row.revision ?? expectedRevision + 1);
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally { client.release(); }
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
