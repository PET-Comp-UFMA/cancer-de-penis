import { getPool } from './db';
import { hashPassword, hashToken, normalizeUsername, randomToken, verifyPassword } from './crypto';
import type { AuthRole, AuthUser, SessionUser } from '../domain/types';
import type { PoolClient } from 'pg';

const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const validRoles = (roles: AuthRole[]) => roles.length > 0 && roles.every((role) => role === 'admin' || role === 'responsavel');

async function reserveRateLimit(bucket: string, limit: number) {
  const result = await getPool().query(`insert into app_private.auth_rate_limits(bucket_key, attempts, window_started_at) values ($1, 1, now()) on conflict (bucket_key) do update set attempts = case when auth_rate_limits.window_started_at < now() - interval '15 minutes' then 1 else auth_rate_limits.attempts + 1 end, window_started_at = case when auth_rate_limits.window_started_at < now() - interval '15 minutes' then now() else auth_rate_limits.window_started_at end returning attempts`, [bucket]);
  if (Number(result.rows[0]?.attempts) > limit) throw new Error('RATE_LIMITED');
}

export async function findSession(token: string): Promise<{ user: SessionUser; sessionId: string } | null> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const identity = await client.query('select user_id from app_private.admin_sessions where token_hash=$1', [hashToken(token)]);
    if (!identity.rowCount) { await client.query('rollback'); return null; }
    // All account operations lock user first, then session, to avoid deadlocks.
    const user = await client.query(`select id, username_display as username, roles, must_change_password from app_private.admin_users where id = $1 and status = 'active' for update`, [identity.rows[0].user_id]);
    if (!user.rowCount) { await client.query('rollback'); return null; }
    const session = await client.query(`select id from app_private.admin_sessions where token_hash=$1 and revoked_at is null and expires_at>clock_timestamp() and last_seen_at>clock_timestamp()-interval '8 hours' for update`, [hashToken(token)]);
    if (!session.rowCount) { await client.query('rollback'); return null; }
    await client.query('update app_private.admin_sessions set last_seen_at = now() where id = $1 and revoked_at is null and expires_at > now()', [session.rows[0].id]);
    await client.query('commit');
    return { sessionId: session.rows[0].id, user: { id: user.rows[0].id, username: user.rows[0].username, roles: user.rows[0].roles, mustChangePassword: user.rows[0].must_change_password } };
  } catch (error) { await client.query('rollback').catch(() => undefined); throw error; } finally { client.release(); }
}

async function newSession(client: PoolClient, user: SessionUser) {
  const token = randomToken();
  const result = await client.query('insert into app_private.admin_sessions(user_id, token_hash, expires_at) values ($1, $2, $3) returning id', [user.id, hashToken(token), new Date(Date.now() + 24 * 60 * 60 * 1000)]);
  return { token, sessionId: result.rows[0].id, user };
}

export async function login(username: string, password: string, source = 'local-operation') {
  const normalized = normalizeUsername(username);
  await reserveRateLimit(`source:${hashToken(source)}`, 30);
  await reserveRateLimit(`account:${hashToken(normalized)}`, 10);
  await reserveRateLimit('global', 100);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query('select id, username_display as username, roles, status, password_hash, must_change_password, temporary_credential_expires_at, temporary_credential_used_at from app_private.admin_users where username_normalized = $1 for update', [normalized]);
    const row = result.rows[0];
    const valid = await verifyPassword(row?.password_hash || DUMMY_HASH, password);
    const tempValid = !row?.must_change_password || (!!row.temporary_credential_expires_at && !row.temporary_credential_used_at && new Date(row.temporary_credential_expires_at) > new Date());
    if (!row || !valid || row.status !== 'active' || !tempValid) { await client.query('rollback'); return null; }
    const user: SessionUser = { id: row.id, username: row.username, roles: row.roles, mustChangePassword: row.must_change_password };
    const session = await newSession(client, user);
    await client.query('update app_private.admin_users set temporary_credential_used_at = case when must_change_password then now() else temporary_credential_used_at end where id = $1', [row.id]);
    await client.query('commit');
    return session;
  } catch (error) { await client.query('rollback').catch(() => undefined); throw error; } finally { client.release(); }
}

export async function revoke(token: string) { await getPool().query('update app_private.admin_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null', [hashToken(token)]); }

export async function changePassword(ctx: { sessionId: string; userId: string }, current: string, next: string) {
  if (next.length < 12 || next.length > 128 || current === next) return null;
  await reserveRateLimit(`change:${ctx.userId}`, 10);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await client.query(`select id, username_display as username, roles, password_hash from app_private.admin_users where id=$1 and status='active' for update`, [ctx.userId]);
    const sessionCheck = await client.query(`select id from app_private.admin_sessions where user_id=$1 and id=$2 and revoked_at is null and expires_at>clock_timestamp() and last_seen_at>clock_timestamp()-interval '8 hours' for update`, [ctx.userId, ctx.sessionId]);
    if (!result.rowCount || !sessionCheck.rowCount || !(await verifyPassword(result.rows[0].password_hash, current))) { await client.query('rollback'); return null; }
    const row = result.rows[0];
    await client.query('update app_private.admin_users set password_hash = $1, must_change_password = false, password_changed_at = now(), temporary_credential_expires_at = null where id = $2', [await hashPassword(next), ctx.userId]);
    await client.query('update app_private.admin_sessions set revoked_at = now() where user_id = $1 and revoked_at is null', [ctx.userId]);
    const session = await newSession(client, { id: row.id, username: row.username, roles: row.roles, mustChangePassword: false });
    await client.query('commit');
    return session;
  } catch (error) { await client.query('rollback').catch(() => undefined); throw error; } finally { client.release(); }
}

export async function provisionUser(username: string, password: string, roles: AuthRole[] = ['admin']) {
  const display = username.trim();
  if (!/^[a-zA-Z0-9._-]{3,64}$/.test(display) || !validRoles(roles) || password.length < 12 || password.length > 128) throw new Error('INVALID_USER');
  const result = await getPool().query(`insert into app_private.admin_users(username_display, username_normalized, roles, password_hash, temporary_credential_expires_at) values ($1, $2, $3, $4, now() + interval '24 hours') returning id, username_display as username, roles`, [display, normalizeUsername(display), roles, await hashPassword(password)]);
  const row = result.rows[0];
  return { id: row.id, username: row.username, roles: row.roles } as Pick<AuthUser, 'id' | 'username' | 'roles'>;
}

export async function resetPassword(id: string, password: string) {
  const client = await getPool().connect();
  try { await client.query('begin'); const user = await client.query('select id from app_private.admin_users where id = $1 for update', [id]); if (!user.rowCount) { await client.query('rollback'); return false; } await client.query(`update app_private.admin_users set password_hash = $1, must_change_password = true, temporary_credential_used_at = null, temporary_credential_expires_at = now() + interval '24 hours' where id = $2`, [await hashPassword(password), id]); await client.query('update app_private.admin_sessions set revoked_at = now() where user_id = $1 and revoked_at is null', [id]); await client.query('commit'); return true; } catch (error) { await client.query('rollback').catch(() => undefined); throw error; } finally { client.release(); }
}

export async function disableUser(id: string) {
  const client = await getPool().connect();
  try { await client.query('begin'); const user = await client.query('select id from app_private.admin_users where id = $1 for update', [id]); if (!user.rowCount) { await client.query('rollback'); return false; } await client.query("update app_private.admin_users set status = 'disabled' where id = $1", [id]); await client.query('update app_private.admin_sessions set revoked_at = now() where user_id = $1 and revoked_at is null', [id]); await client.query('commit'); return true; } catch (error) { await client.query('rollback').catch(() => undefined); throw error; } finally { client.release(); }
}
