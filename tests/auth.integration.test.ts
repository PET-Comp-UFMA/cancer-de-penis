import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { freePort, startNext, startPostgres } from './helpers/postgres';
import { hashToken } from '../src/modules/auth/infrastructure/crypto';
import { provisionUser, resetPassword, disableUser } from '../src/modules/auth/application/service';
import { closePool } from '../src/modules/auth/infrastructure/db';
import { requireRole } from '../src/modules/auth/server/guards';
import { clientSource } from '../src/modules/auth/server/client-source';
import type { NextApiRequest } from 'next';

let db: Awaited<ReturnType<typeof startPostgres>>;
let app: Awaited<ReturnType<typeof startNext>>;
let base: string;
const password = 'Synthetic-test-password-1234';

class Browser {
  cookies = new Map<string, string>();
  csrf = '';
  async request(route: string, body?: object, extra: Record<string, string> = {}) {
    const response = await fetch(base + route, {
      method: body ? 'POST' : 'GET', redirect: 'manual',
      headers: { cookie: [...this.cookies].map(([k,v]) => `${k}=${v}`).join('; '),
        ...(body ? { origin: base, 'content-type': 'application/json', 'x-csrf-token': this.csrf } : {}), ...extra },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';'); const index = pair.indexOf('=');
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    const data = await response.json().catch(() => null);
    if (data?.csrfToken) this.csrf = data.csrfToken;
    return { status: response.status, data, headers: response.headers };
  }
  async login(username: string, secret = password) {
    await this.request('/api/auth/session');
    return this.request('/api/auth/login', { username, password: secret });
  }
  token() { return this.cookies.get('admin_session')!; }
}

async function account(name: string, temporary = false, roles: ('admin' | 'responsavel')[] = ['admin']) {
  const user = await provisionUser(name, password, roles);
  if (!temporary) await db.pool.query('UPDATE app_private.admin_users SET must_change_password=false, temporary_credential_expires_at=NULL WHERE id=$1', [user.id]);
  return user;
}

before(async () => {
  db = await startPostgres();
  // All service imports use a lazy pool; override BEFORE its first use.
  process.env.DATABASE_URL = db.url;
  process.env.DATABASE_ADMIN_URL = db.url;
  process.env.DATABASE_SSL = 'false';
  process.env.AUTH_SECRET = randomBytes(32).toString('hex');
  base = `http://127.0.0.1:${await freePort()}`;
  process.env.APP_ORIGIN = base;
  delete process.env.VERCEL;
  const migrate = () => promisify(execFile)(process.execPath, ['--import','tsx','scripts/db-migrate.ts'], { windowsHide: true, env: process.env });
  await migrate();
  await migrate(); // Applying twice must be harmless.
  app = await startNext(db.url, base);
}, { timeout: 120_000 });
after(async () => { await app?.stop(); await closePool(); await db?.stop(); });
beforeEach(async () => {
  await db.pool.query('TRUNCATE app_private.admin_sessions, app_private.admin_users, app_private.auth_rate_limits CASCADE');
});

test('SSR requires login; CSRF bootstrap is stable between tabs and never cached', async () => {
  const b = new Browser();
  const page = await b.request('/admin/formularios');
  assert.equal(page.status, 307); assert.match(page.headers.get('location')!, /admin\/login/);
  const first = await b.request('/api/auth/session');
  assert.equal(first.status, 200); assert.equal(first.data.user, null);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.equal((await b.request('/api/auth/session')).data.csrfToken, first.data.csrfToken);
});

test('login rejects missing CSRF, wrong origin, cross-site requests and malformed payload', async () => {
  await account('valid.admin');
  const b = new Browser(); await b.request('/api/auth/session');
  const payload = { username: 'valid.admin', password };
  assert.equal((await b.request('/api/auth/login', payload, { 'x-csrf-token': '' })).status, 403);
  assert.equal((await b.request('/api/auth/login', payload, { origin: 'https://attacker.invalid' })).status, 403);
  assert.equal((await b.request('/api/auth/login', payload, { 'sec-fetch-site': 'cross-site' })).status, 403);
  assert.equal((await b.request('/api/auth/login', { username: [], password })).status, 400);
  const known = await b.request('/api/auth/login', { username: 'valid.admin', password: 'wrong' });
  const unknown = await b.request('/api/auth/login', { username: 'unknown.admin', password: 'wrong' });
  assert.equal(known.status, 401); assert.deepEqual(known.data, unknown.data);
});

test('temporary credentials expire, allow one concurrent login and restrict the resulting session', async () => {
  const expired = await account('expired.admin', true);
  await db.pool.query("UPDATE app_private.admin_users SET temporary_credential_expires_at=now()-interval '1 second' WHERE id=$1", [expired.id]);
  assert.equal((await new Browser().login('expired.admin')).status, 401);
  await account('temporary.admin', true);
  const a = new Browser(), b = new Browser();
  const attempts = await Promise.all([a.login('temporary.admin'), b.login('temporary.admin')]);
  assert.deepEqual(attempts.map(r => r.status).sort(), [200,401]);
  const winner = attempts[0].status === 200 ? a : b;
  const page = await winner.request('/admin/formularios');
  assert.equal(page.status, 307); assert.equal(page.headers.get('location'), '/admin/alterar-senha');
  await assert.rejects(requireRole({ cookies: { admin_session: winner.token() } }, 'admin'), /PASSWORD_CHANGE_REQUIRED/);
});

test('password change checks current password, rotates the token and revokes all previous sessions', async () => {
  await account('change.admin'); const a = new Browser(), other = new Browser();
  assert.equal((await a.login('change.admin')).status, 200);
  assert.equal((await other.login('change.admin')).status, 200);
  const old = a.token(), oldCsrf = a.csrf;
  assert.equal((await a.request('/api/auth/change-password', { currentPassword: 'wrong', newPassword: 'New-test-password-1234' })).status, 400);
  const changed = await a.request('/api/auth/change-password', { currentPassword: password, newPassword: 'New-test-password-1234' });
  assert.equal(changed.status, 200); assert.notEqual(a.token(), old); assert.notEqual(a.csrf, oldCsrf);
  assert.equal((await a.request('/api/auth/session')).data.user.username, 'change.admin');
  assert.equal((await other.request('/api/auth/session')).data.user, null);
  const stolen = new Browser(); stolen.cookies.set('admin_session', old);
  assert.equal((await stolen.request('/api/auth/session')).data.user, null);
  assert.equal((await a.request('/api/auth/logout', {}, { 'x-csrf-token': oldCsrf })).status, 403);
  assert.equal((await new Browser().login('change.admin', 'New-test-password-1234')).status, 200);
});

test('idle and absolute expiry and logout invalidate tokens on the server', async () => {
  await account('expiry.admin');
  for (const column of ['last_seen_at', 'expires_at']) {
    const b = new Browser(); assert.equal((await b.login('expiry.admin')).status, 200);
    const statement = column === 'last_seen_at'
      ? "UPDATE app_private.admin_sessions SET last_seen_at=now()-interval '9 hours' WHERE token_hash=$1"
      : "UPDATE app_private.admin_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1";
    await db.pool.query(statement, [hashToken(b.token())]);
    assert.equal((await b.request('/api/auth/session')).data.user, null);
  }
  const b = new Browser(); await b.login('expiry.admin'); const old = b.token();
  assert.equal((await b.request('/api/auth/logout', {})).status, 200);
  const replay = new Browser(); replay.cookies.set('admin_session', old);
  assert.equal((await replay.request('/api/auth/session')).data.user, null);
});

test('account rate limit blocks attempt eleven without consuming more global quota', async () => {
  const b = new Browser(); await b.request('/api/auth/session');
  for (let i=0; i<10; i++) assert.equal((await b.request('/api/auth/login', { username: 'rate.admin', password: 'wrong' })).status, 401);
  const blocked = await b.request('/api/auth/login', { username: 'rate.admin', password: 'wrong' });
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '900');
  assert.equal((await db.pool.query("SELECT attempts FROM app_private.auth_rate_limits WHERE bucket_key='global'")).rows[0].attempts, 10);
  await db.pool.query("UPDATE app_private.auth_rate_limits SET window_started_at=now()-interval '16 minutes'");
  assert.equal((await b.request('/api/auth/login', { username: 'rate.admin', password: 'wrong' })).status, 401);
});

test('source and global limits stop authentication work and ignore spoofed proxy headers locally', async () => {
  const b = new Browser(); await b.request('/api/auth/session');
  await b.request('/api/auth/login', { username: 'source.admin', password: 'wrong' });
  await db.pool.query("UPDATE app_private.auth_rate_limits SET attempts=30 WHERE bucket_key LIKE 'source:%'");
  assert.equal((await b.request('/api/auth/login', { username: 'source.admin', password: 'wrong' }, { 'x-forwarded-for':'203.0.113.9', 'x-vercel-forwarded-for':'203.0.113.10' })).status, 429);
  assert.equal((await db.pool.query("SELECT attempts FROM app_private.auth_rate_limits WHERE bucket_key='global'")).rows[0].attempts, 1);
  await db.pool.query('TRUNCATE app_private.auth_rate_limits');
  await db.pool.query("INSERT INTO app_private.auth_rate_limits(bucket_key,attempts) VALUES ('global',100)");
  assert.equal((await b.request('/api/auth/login', { username: 'global.admin', password: 'wrong' })).status, 429);
  const mock = { headers: { 'x-vercel-forwarded-for':'203.0.113.9' }, socket: { remoteAddress:'127.0.0.1' } } as unknown as NextApiRequest;
  assert.equal(clientSource(mock), '127.0.0.1');
});

test('password-change attempts are limited independently', async () => {
  await account('limited.admin'); const b = new Browser(); await b.login('limited.admin');
  for (let i=0; i<10; i++) assert.equal((await b.request('/api/auth/change-password', { currentPassword:'wrong', newPassword:'New-test-password-1234' })).status, 400);
  assert.equal((await b.request('/api/auth/change-password', { currentPassword:password, newPassword:'New-test-password-1234' })).status, 429);
});

test('reset and disable operations revoke existing sessions and reset does not reactivate accounts', async () => {
  const user = await account('managed.admin'); const a = new Browser(), b = new Browser();
  await a.login('managed.admin'); await b.login('managed.admin');
  assert.equal(await resetPassword(user.id, 'Reset-test-password-1234'), true);
  assert.equal((await a.request('/api/auth/session')).data.user, null);
  assert.equal((await b.request('/api/auth/session')).data.user, null);
  const fresh = new Browser(); assert.equal((await fresh.login('managed.admin','Reset-test-password-1234')).data.mustChangePassword, true);
  assert.equal(await disableUser(user.id), true);
  assert.equal((await fresh.request('/api/auth/session')).data.user, null);
  await resetPassword(user.id, 'Disabled-test-password-1234');
  assert.equal((await new Browser().login('managed.admin','Disabled-test-password-1234')).status, 401);
});

test('role guard denies responsible-only account and database stores only credential hashes', async () => {
  const user = await account('responsible.user', false, ['responsavel']);
  const b = new Browser(); assert.equal((await b.login('responsible.user')).status, 200);
  await assert.rejects(requireRole({cookies:{admin_session:b.token()}}, 'admin'), /FORBIDDEN/);
  assert.equal((await requireRole({cookies:{admin_session:b.token()}}, 'responsavel')).user.id, user.id);
  const row = (await db.pool.query('SELECT password_hash, token_hash FROM app_private.admin_users u JOIN app_private.admin_sessions s ON s.user_id=u.id WHERE u.id=$1', [user.id])).rows[0];
  assert.match(row.password_hash, /^\$argon2id\$/); assert.equal(row.token_hash, hashToken(b.token())); assert.notEqual(row.token_hash, b.token());
});

test('runtime setup creates a limited login without changing the real local configuration', async () => {
  const directory = await mkdtemp(path.join(process.cwd(), '.auth-test', 'runtime-'));
  await writeFile(path.join(directory, '.env.local'), 'DATABASE_URL=' + db.url + '\nDATABASE_SSL=false\n');
  const execution = await promisify(execFile)(process.execPath,
    [path.join(process.cwd(), 'node_modules/tsx/dist/cli.mjs'), path.join(process.cwd(), 'scripts/db-runtime.ts')],
    { cwd: directory, windowsHide: true, env: { ...process.env, DATABASE_URL: db.url, DATABASE_ADMIN_URL: db.url } });
  const config = await readFile(path.join(directory, '.env.local'), 'utf8');
  const url = config.split(/\r?\n/).find(line => line.startsWith('DATABASE_URL='))!.slice('DATABASE_URL='.length);
  assert.equal(new URL(url).username, 'avaliapen_runtime');
  assert.ok(!execution.stdout.includes(new URL(url).password));
  const limited = new Pool({ connectionString: url });
  try {
    await limited.query('SELECT id FROM app_private.admin_users');
    await limited.query("INSERT INTO app_private.auth_rate_limits(bucket_key) VALUES ('permission-test')");
    await assert.rejects(limited.query('TRUNCATE app_private.admin_users CASCADE'), /permission denied/);
    await assert.rejects(limited.query("CREATE TABLE app_private.not_allowed(id int)"), /permission denied/);
    const permissions = await limited.query("SELECT rolcreatedb,rolcreaterole,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user");
    assert.deepEqual(permissions.rows[0], { rolcreatedb: false, rolcreaterole: false, rolsuper: false, rolbypassrls: false });
  } finally { await limited.end(); }
});
