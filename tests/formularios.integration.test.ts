import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { freePort, startNext, startPostgres } from './helpers/postgres';
import { closePool } from '../src/modules/auth/infrastructure/db';
import { provisionUser } from '../src/modules/auth/application/service';
import { listOwnedForms, listPublicPublishedForms } from '../src/modules/formularios/application/service';

const exec = promisify(execFile);
const password = 'Forms-integration-password-1234';

let db: Awaited<ReturnType<typeof startPostgres>>;
let app: Awaited<ReturnType<typeof startNext>>;
let base: string;

class Browser {
  cookies = new Map<string, string>();
  csrf = '';

  async request(route: string, body?: object, method?: string) {
    const response = await fetch(base + route, {
      method: method ?? (body ? 'POST' : 'GET'),
      redirect: 'manual',
      headers: {
        cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '),
        ...(body ? { origin: base, 'content-type': 'application/json', 'x-csrf-token': this.csrf } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const index = pair.indexOf('=');
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    const data = await response.json().catch(() => null);
    if (data?.csrfToken) this.csrf = data.csrfToken;
    return { status: response.status, data, headers: response.headers };
  }

  async login(username: string) {
    await this.request('/api/auth/session');
    return this.request('/api/auth/login', { username, password });
  }
}

async function migrate() {
  await exec(process.execPath, [
    '--input-type=module',
    '-e',
    "if (!process.geteuid) process.geteuid=()=>0; await import('tsx'); await import('./scripts/db-migrate.ts');",
  ], {
    cwd: process.cwd(),
    windowsHide: true,
    env: { ...process.env, DATABASE_URL: db.url, DATABASE_ADMIN_URL: db.url, DATABASE_SSL: 'false' },
  });
}

async function account(username: string, roles: ('admin' | 'responsavel')[] = ['admin']) {
  const user = await provisionUser(username, password, roles);
  await db.pool.query(
    'update app_private.admin_users set must_change_password=false, temporary_credential_expires_at=null where id=$1',
    [user.id],
  );
  return user;
}

before(async () => {
  db = await startPostgres();
  process.env.DATABASE_URL = db.url;
  process.env.DATABASE_ADMIN_URL = db.url;
  process.env.DATABASE_SSL = 'false';
  process.env.AUTH_SECRET = randomBytes(32).toString('hex');
  base = `http://127.0.0.1:${await freePort()}`;
  process.env.APP_ORIGIN = base;
  await migrate();
  app = await startNext(db.url, base);
}, { timeout: 180_000 });

after(async () => {
  await app?.stop();
  await closePool();
  await db?.stop();
});

beforeEach(async () => {
  await db.pool.query('truncate app_private.admin_forms, app_private.admin_sessions, app_private.admin_users, app_private.auth_rate_limits cascade');
});

test('listagem filtra pelo proprietário no repositório, inclusive com busca e paginação', async () => {
  const owner = await account('forms.owner');
  const other = await account('forms.other');
  await db.pool.query(`
    insert into app_private.admin_forms (owner_id, catalog_key, title, description)
    values ($1, 'OWNER_A', 'Formulário do proprietário', 'descrição'),
           ($1, 'OWNER_B', 'Outro formulário', 'segunda descrição'),
           ($2, 'OTHER_A', 'Formulário de outra conta', 'não deve aparecer')
  `, [owner.id, other.id]);

  const firstPage = await listOwnedForms({ ownerId: owner.id, search: '', page: 1, pageSize: 1 });
  assert.equal(firstPage.total, 2);
  assert.equal(firstPage.items.length, 1);
  assert.ok(firstPage.items.every((item) => item.title !== 'Formulário de outra conta'));

  const secondPage = await listOwnedForms({ ownerId: owner.id, search: '', page: 2, pageSize: 1 });
  assert.equal(secondPage.total, 2);
  assert.equal(secondPage.items.length, 1);

  const searched = await listOwnedForms({ ownerId: owner.id, search: 'proprietário', page: 1, pageSize: 6 });
  assert.equal(searched.total, 1);
  assert.equal(searched.items[0]?.title, 'Formulário do proprietário');
});

test('API exige sessão e papel admin e retorna somente os formulários da conta', async () => {
  const anonymous = await new Browser().request('/api/formularios');
  assert.equal(anonymous.status, 401);

  const owner = await account('forms.api.owner');
  const other = await account('forms.api.other');
  const responsible = await account('forms.api.responsible', ['responsavel']);
  await db.pool.query(`
    insert into app_private.admin_forms (owner_id, catalog_key, title, description)
    values ($1, 'OWNER', 'Visível para owner', 'ok'),
           ($2, 'OTHER', 'Visível para other', 'ok')
  `, [owner.id, other.id]);

  const ownerBrowser = new Browser();
  assert.equal((await ownerBrowser.login(owner.username)).status, 200);
  const ownerResponse = await ownerBrowser.request('/api/formularios?pageSize=6');
  assert.equal(ownerResponse.status, 200);
  assert.deepEqual(ownerResponse.data.forms.map((item: { title: string }) => item.title), ['Visível para owner']);

  const responsibleBrowser = new Browser();
  assert.equal((await responsibleBrowser.login(responsible.username)).status, 200);
  assert.equal((await responsibleBrowser.request('/api/formularios')).status, 403);
  assert.equal((await responsibleBrowser.request('/admin/formularios')).status, 404);
});

test('biblioteca pública lista somente formulários publicados de qualquer conta', async () => {
  const owner = await account('forms.public.owner');
  const other = await account('forms.public.other');
  await db.pool.query(`
    insert into app_private.admin_forms (owner_id, catalog_key, title, description, status)
    values ($1, 'PUBLIC_A', 'Público A', 'primeiro publicado', 'published'),
           ($1, 'DRAFT', 'Não publicado', 'não deve aparecer', 'unpublished'),
           ($2, 'PUBLIC_B', 'Público B', 'segundo publicado', 'published')
  `, [owner.id, other.id]);

  const firstPage = await listPublicPublishedForms({ search: '', page: 1, pageSize: 1 });
  assert.equal(firstPage.total, 2);
  assert.equal(firstPage.items.length, 1);
  assert.notEqual(firstPage.items[0]?.title, 'Não publicado');

  const searched = await listPublicPublishedForms({ search: 'segundo', page: 1, pageSize: 6 });
  assert.equal(searched.total, 1);
  assert.equal(searched.publishedTotal, 2);
  assert.equal(searched.items[0]?.title, 'Público B');

  const anonymous = await new Browser().request('/api/formularios/publicados?pageSize=6');
  assert.equal(anonymous.status, 200);
  assert.equal(anonymous.data.publishedTotal, 2);
  assert.deepEqual(
    anonymous.data.forms.map((item: { title: string }) => item.title).sort(),
    ['Público A', 'Público B'],
  );
  assert.equal(anonymous.data.forms[0].status, undefined);
  assert.equal((await new Browser().request('/api/formularios/publicados?pageSize=51')).status, 400);

  const wildcard = await listPublicPublishedForms({ search: '%', page: 1, pageSize: 6 });
  assert.equal(wildcard.total, 0);
});

test('admin pode publicar, retirar da publicação e excluir formulário não publicado', async () => {
  const owner = await account('forms.status.owner');
  const other = await account('forms.status.other');
  const created = await db.pool.query<{ id: string }>(
    `insert into app_private.admin_forms (owner_id, catalog_key, title, description, status, definition_state)
     values ($1, 'STATUS_A', 'Estado A', 'formulário de estado', 'unpublished', 'complete')
     returning id`,
    [owner.id],
  );
  const formId = created.rows[0].id;

  const ownerBrowser = new Browser();
  assert.equal((await ownerBrowser.login(owner.username)).status, 200);
  const published = await ownerBrowser.request(
    `/api/formularios/${formId}`,
    { status: 'published', expectedRevision: 0 },
    'PATCH',
  );
  assert.equal(published.status, 200);
  assert.equal(published.data.status, 'published');

  const publicList = await new Browser().request('/api/formularios/publicados?pageSize=6');
  assert.equal(publicList.status, 200);
  assert.ok(publicList.data.forms.some((item: { id: string }) => item.id === formId));

  const unpublished = await ownerBrowser.request(
    `/api/formularios/${formId}`,
    { status: 'unpublished', expectedRevision: 0 },
    'PATCH',
  );
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.data.status, 'unpublished');

  const otherBrowser = new Browser();
  assert.equal((await otherBrowser.login(other.username)).status, 200);
  assert.equal((await otherBrowser.request(`/api/formularios/${formId}`, { status: 'published', expectedRevision: 0 }, 'PATCH')).status, 404);
  assert.equal((await ownerBrowser.request(`/api/formularios/${formId}`, {}, 'DELETE')).status, 204);
  assert.equal((await ownerBrowser.request(`/api/formularios/${formId}`, { status: 'published', expectedRevision: 0 }, 'PATCH')).status, 404);
});

test('API cria, recarrega e publica uma definição completa com revisão', async () => {
  const owner = await account('forms.definition.owner');
  const browser = new Browser();
  assert.equal((await browser.login(owner.username)).status, 200);
  const definition = {
    schemaVersion: 1,
    title: 'Definição completa',
    description: '',
    imageDataUrl: null,
    authors: [],
    questions: [{
      id: 'question-1',
      prompt: 'Pergunta',
      type: 'two-options',
      alternatives: [
        { id: 'alternative-1', label: 'Não', score: 0 },
        { id: 'alternative-2', label: 'Sim', score: 1 },
      ],
    }],
    resultBands: [{ id: 'band-1', minScore: 0, maxScore: 100, risk: 'Resultado', description: '' }],
  };
  const rejected = await browser.request('/api/formularios', {
    definition: { ...definition, resultBands: [{ ...definition.resultBands[0], maxScore: 150 }] },
  }, 'POST');
  assert.equal(rejected.status, 400);
  assert.equal(rejected.data.code, 'FORM_INVALID_DEFINITION');
  assert.equal(rejected.data.error, 'Na faixa 1, "Até" (150) precisa estar entre 0 e 100%.');

  const created = await browser.request('/api/formularios', { definition }, 'POST');
  assert.equal(created.status, 201);
  assert.equal(created.data.definitionState, 'complete');
  assert.equal(created.data.revision, 0);

  const loaded = await browser.request(`/api/formularios/${created.data.id}`);
  assert.equal(loaded.status, 200);
  assert.equal(loaded.data.definition.title, definition.title);

  const published = await browser.request(
    `/api/formularios/${created.data.id}`,
    { status: 'published', expectedRevision: 0 },
    'PATCH',
  );
  assert.equal(published.status, 200);
  assert.equal(published.data.status, 'published');

  const other = await account('forms.definition.other');
  const otherBrowser = new Browser();
  assert.equal((await otherBrowser.login(other.username)).status, 200);
  assert.equal((await otherBrowser.request(`/api/formularios/${created.data.id}`)).status, 404);
});

test('formulário publicado uma vez nunca mais pode ser editado, mesmo despublicado', async () => {
  const owner = await account('forms.snapshot.owner');
  const browser = new Browser();
  assert.equal((await browser.login(owner.username)).status, 200);
  const definition = {
    schemaVersion: 1, title: 'Snapshot v1', description: 'Descrição v1', imageDataUrl: null, authors: [],
    questions: [{ id: 'q1', prompt: 'Pergunta', type: 'two-options', alternatives: [
      { id: 'a1', label: 'Não', score: 0 }, { id: 'a2', label: 'Sim', score: 1 },
    ] }],
    resultBands: [{ id: 'b1', minScore: 0, maxScore: 100, risk: 'Resultado', description: '' }],
  };
  const created = await browser.request('/api/formularios', { definition }, 'POST');
  assert.equal(created.status, 201);
  const formUrl = `/api/formularios/${created.data.id}`;
  const firstPublish = await browser.request(formUrl, { status: 'published', expectedRevision: 0 }, 'PATCH');
  assert.equal(firstPublish.status, 200);
  const address = firstPublish.data.catalogKey;
  assert.equal(address, 'snapshot-v1');
  const edited = { ...definition, title: 'Versão v2', description: 'Descrição v2' };
  const blocked = await browser.request(formUrl, { definition: edited, expectedRevision: 0 }, 'PATCH');
  assert.equal(blocked.status, 409);
  assert.equal(blocked.data.code, 'FORM_PUBLISHED_CANNOT_EDIT');
  const publicV1 = await new Browser().request(`/api/formularios/publicados/${address}`);
  assert.equal(publicV1.data.definition.title, 'Snapshot v1');

  assert.equal((await browser.request(formUrl)).data.everPublished, true);

  const unpublished = await browser.request(formUrl, { status: 'unpublished', expectedRevision: 0 }, 'PATCH');
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.data.everPublished, true);
  assert.equal((await new Browser().request(`/api/formularios/publicados/${address}`)).status, 404);
  const stillBlocked = await browser.request(formUrl, { definition: edited, expectedRevision: 1 }, 'PATCH');
  assert.equal(stillBlocked.status, 409);
  assert.equal(stillBlocked.data.code, 'FORM_PUBLISHED_CANNOT_EDIT');

  const republish = await browser.request(formUrl, { status: 'published', expectedRevision: 1 }, 'PATCH');
  assert.equal(republish.status, 200);
  assert.equal(republish.data.catalogKey, address);
  const republished = await new Browser().request(`/api/formularios/publicados/${address}`);
  assert.equal(republished.data.definition.title, 'Snapshot v1');
});

test('primeira publicação define o endereço /tela-avaliacao/<nome-do-formulario>, sem repetir', async () => {
  const owner = await account('forms.slug.owner');
  const browser = new Browser();
  assert.equal((await browser.login(owner.username)).status, 200);
  const definition = (title: string) => ({
    schemaVersion: 1, title, description: '', imageDataUrl: null, authors: [],
    questions: [{ id: 'q1', prompt: 'Pergunta', type: 'two-options', alternatives: [
      { id: 'n', label: 'Não', score: 0 }, { id: 's', label: 'Sim', score: 1 },
    ] }],
    resultBands: [{ id: 'b1', minScore: 0, maxScore: 100, risk: 'Resultado', description: '' }],
  });
  const publish = async (title: string) => {
    const created = await browser.request('/api/formularios', { definition: definition(title) }, 'POST');
    assert.match(created.data.catalogKey, /^FORM-/);
    const published = await browser.request(`/api/formularios/${created.data.id}`, { status: 'published', expectedRevision: 0 }, 'PATCH');
    assert.equal(published.status, 200);
    return published.data.catalogKey as string;
  };
  assert.equal(await publish('Avaliação de Risco!'), 'avaliacao-de-risco');
  assert.equal(await publish('avaliação de risco'), 'avaliacao-de-risco-2');
  assert.equal(await publish('Tela Avaliação'), 'tela-avaliacao-2');
  const page = await fetch(`${base}/tela-avaliacao/avaliacao-de-risco`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Avaliação de Risco!/);
});

test('duplicar cria uma cópia editável e não publicada, somente para o dono', async () => {
  const owner = await account('forms.duplicate.owner');
  const browser = new Browser();
  assert.equal((await browser.login(owner.username)).status, 200);
  const definition = {
    schemaVersion: 1, title: 'Original', description: 'Descrição', imageDataUrl: null,
    authors: [{ id: 'a1', name: 'Autora', institution: 'IES' }],
    questions: [{ id: 'q1', prompt: 'Pergunta', type: 'two-options', alternatives: [
      { id: 'n', label: 'Não', score: 0 }, { id: 's', label: 'Sim', score: 1 },
    ] }],
    resultBands: [{ id: 'b1', minScore: 0, maxScore: 100, risk: 'Resultado', description: '' }],
  };
  const created = await browser.request('/api/formularios', { definition }, 'POST');
  assert.equal((await browser.request(`/api/formularios/${created.data.id}`, { status: 'published', expectedRevision: 0 }, 'PATCH')).status, 200);

  const copy = await browser.request(`/api/formularios/${created.data.id}`, {}, 'POST');
  assert.equal(copy.status, 201);
  assert.notEqual(copy.data.id, created.data.id);
  assert.notEqual(copy.data.catalogKey, created.data.catalogKey);
  assert.equal(copy.data.status, 'unpublished');
  assert.equal(copy.data.everPublished, false);
  assert.equal(copy.data.definitionState, 'complete');
  assert.equal(copy.data.definition.title, 'Original (cópia)');
  assert.deepEqual(copy.data.definition.questions, definition.questions);

  const edited = await browser.request(`/api/formularios/${copy.data.id}`, { definition: { ...copy.data.definition, title: 'Nova versão' }, expectedRevision: 0 }, 'PATCH');
  assert.equal(edited.status, 200);
  const original = await browser.request(`/api/formularios/${created.data.id}`);
  assert.equal(original.data.definition.title, 'Original');
  assert.equal(original.data.status, 'published');

  const other = await account('forms.duplicate.other');
  const otherBrowser = new Browser();
  assert.equal((await otherBrowser.login(other.username)).status, 200);
  assert.equal((await otherBrowser.request(`/api/formularios/${created.data.id}`, {}, 'POST')).status, 404);
});

test('RLS limita a conta de runtime ao contexto da transação e bloqueia gravações', async () => {
  const owner = await account('forms.rls.owner');
  const other = await account('forms.rls.other');
  await db.pool.query(`
    insert into app_private.admin_forms (owner_id, catalog_key, title, description)
    values ($1, 'RLS_OWNER', 'RLS owner', 'owner row'),
           ($2, 'RLS_OTHER', 'RLS other', 'other row')
  `, [owner.id, other.id]);

  const role = `forms_runtime_test_${randomBytes(6).toString('hex')}`;
  const client = await db.pool.connect();
  let roleCreated = false;
  try {
    await client.query(`create role "${role}" nologin nosuperuser nobypassrls`);
    roleCreated = true;
    await client.query(`grant usage on schema app_private to "${role}"`);
    await client.query(`grant select on app_private.admin_forms to "${role}"`);
    await client.query(`set role "${role}"`);

    const roleFlags = await client.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
      'select rolsuper, rolbypassrls from pg_roles where rolname = current_user',
    );
    assert.equal(roleFlags.rows[0]?.rolsuper, false);
    assert.equal(roleFlags.rows[0]?.rolbypassrls, false);

    const withoutContext = await client.query<{ count: number }>(
      'select count(*)::int as count from app_private.admin_forms',
    );
    assert.equal(withoutContext.rows[0]?.count, 0);

    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', owner.id]);
    const ownerRows = await client.query<{ title: string }>(
      'select title from app_private.admin_forms order by title',
    );
    await client.query('commit');
    assert.deepEqual(ownerRows.rows.map((row) => row.title), ['RLS owner']);

    const afterCommit = await client.query<{ count: number }>(
      'select count(*)::int as count from app_private.admin_forms',
    );
    assert.equal(afterCommit.rows[0]?.count, 0);

    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['app.current_user_id', other.id]);
    const otherRows = await client.query<{ title: string }>(
      'select title from app_private.admin_forms order by title',
    );
    await client.query('rollback');
    assert.deepEqual(otherRows.rows.map((row) => row.title), ['RLS other']);

    const afterRollback = await client.query<{ count: number }>(
      'select count(*)::int as count from app_private.admin_forms',
    );
    assert.equal(afterRollback.rows[0]?.count, 0);
    const insertPrivilege = await client.query<{ allowed: boolean }>(
      "select has_table_privilege(current_user, 'app_private.admin_forms', 'INSERT') as allowed",
    );
    assert.equal(insertPrivilege.rows[0]?.allowed, false);
    await assert.rejects(
      client.query("insert into app_private.admin_forms (owner_id, catalog_key, title) values ('00000000-0000-0000-0000-000000000000', 'RLS_WRITE', 'blocked')"),
      (error: unknown) => (error as { code?: string }).code === '42501',
    );
  } finally {
    await client.query('reset role').catch(() => undefined);
    client.release();
    if (roleCreated) {
      await db.pool.query(`revoke all on schema app_private from "${role}"`);
      await db.pool.query(`revoke all on app_private.admin_forms from "${role}"`);
      await db.pool.query(`drop role "${role}"`);
    }
  }
});
