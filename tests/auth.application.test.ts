import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AuthContext, AuthRole, SessionUser } from '../src/modules/auth/domain/types';
import { changePassword } from '../src/modules/auth/application/use-cases/change-password';
import { disableUser } from '../src/modules/auth/application/use-cases/disable-user';
import { findUserId } from '../src/modules/auth/application/use-cases/find-user';
import { login } from '../src/modules/auth/application/use-cases/login';
import { provisionUser } from '../src/modules/auth/application/use-cases/provision-user';
import { resetPassword } from '../src/modules/auth/application/use-cases/reset-password';
import type { ChangePasswordPort } from '../src/modules/auth/application/ports/change-password';
import type { DisableUserPort } from '../src/modules/auth/application/ports/disable-user';
import type { FindUserPort } from '../src/modules/auth/application/ports/find-user';
import type { LoginPort } from '../src/modules/auth/application/ports/login';
import type { ProvisionUserPort } from '../src/modules/auth/application/ports/provision-user';
import type { ResetPasswordPort } from '../src/modules/auth/application/ports/reset-password';
import type { CreatedSession } from '../src/modules/auth/application/dto/results';

const user: SessionUser = { id: 'u1', username: 'admin', roles: ['admin'], mustChangePassword: false };
const context: AuthContext = { user, sessionId: 's1' };
const session: CreatedSession = { token: 'token', sessionId: 's2', user };

test('login validates input and maps an empty adapter result to INVALID_CREDENTIALS', async () => {
  const calls: unknown[][] = [];
  const port: LoginPort = { login: async (...args) => { calls.push(args); return session; } };
  assert.deepEqual(await login(port, { username: '  admin.user ', password: 'secret' }), session);
  assert.deepEqual(calls[0], ['admin.user', 'secret', undefined]);
  for (const command of [
    { username: 'ab', password: 'secret' }, { username: 'admin', password: '' },
    { username: 'admin', password: 'x'.repeat(129) }, { username: [], password: 'secret' },
  ]) await assert.rejects(() => login(port, command), /INVALID_REQUEST/);
  await assert.rejects(() => login({ login: async () => null }, { username: 'admin', password: 'secret' }), /INVALID_CREDENTIALS/);
});

test('change password validates policy and preserves a null adapter result', async () => {
  let received: [AuthContext, string, string] | undefined;
  const port: ChangePasswordPort = { changePassword: async (...args) => { received = args; return null; } };
  assert.equal(await changePassword(port, { context, currentPassword: 'current', newPassword: 'New-password-123' }), null);
  assert.deepEqual(received, [context, 'current', 'New-password-123']);
  for (const command of [
    { currentPassword: '', newPassword: 'New-password-123' },
    { currentPassword: 'current', newPassword: 'short' },
    { currentPassword: 'same-password', newPassword: 'same-password' },
    { currentPassword: 'current', newPassword: 'x'.repeat(129) },
  ]) await assert.rejects(() => changePassword(port, { context, ...command }), /INVALID_PASSWORD/);
});

test('provisioning validates username, roles and password, then returns the adapter account', async () => {
  let received: [string, string, AuthRole[]] | undefined;
  const account = { id: 'u2', username: 'new.user', roles: ['responsavel'] as AuthRole[] };
  const port: ProvisionUserPort = { provisionUser: async (...args) => { received = args; return account; } };
  assert.deepEqual(await provisionUser(port, { username: ' new.user ', password: 'Long-password-123' }), account);
  assert.deepEqual(received, ['new.user', 'Long-password-123', ['admin']]);
  for (const command of [
    { username: 'no', password: 'Long-password-123' },
    { username: 'new.user', password: 'short' },
    { username: 'new.user', password: 'Long-password-123', roles: [] },
    { username: 'new.user', password: 'Long-password-123', roles: ['owner'] },
  ]) await assert.rejects(() => provisionUser(port, command), /INVALID_REQUEST/);
});

test('reset validates temporary password policy and preserves the adapter boolean', async () => {
  let received: [string, string] | undefined;
  const port: ResetPasswordPort = { resetPassword: async (...args) => { received = args; return false; } };
  assert.equal(await resetPassword(port, { id: 'u1', password: 'Reset-password-123' }), false);
  assert.deepEqual(received, ['u1', 'Reset-password-123']);
  await assert.rejects(() => resetPassword(port, { id: 'u1', password: 'short' }), /INVALID_REQUEST/);
  await assert.rejects(() => resetPassword(port, { id: 'u1', password: 'x'.repeat(129) }), /INVALID_REQUEST/);
});

test('disable delegates the id and preserves the adapter boolean', async () => {
  let received = '';
  const port: DisableUserPort = { disableUser: async (id) => { received = id; return true; } };
  assert.equal(await disableUser(port, { id: 'u1' }), true);
  assert.equal(received, 'u1');
});

test('find user validates the username and preserves a missing account', async () => {
  let received = '';
  const port: FindUserPort = { findUserId: async (username) => { received = username; return null; } };
  assert.equal(await findUserId(port, { username: ' admin.user ' }), null);
  assert.equal(received, 'admin.user');
  await assert.rejects(() => findUserId(port, { username: 'bad user' }), /INVALID_REQUEST/);
});
