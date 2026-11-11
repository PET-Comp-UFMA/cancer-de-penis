import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closePool as facadeClosePool, getPool as facadeGetPool } from '../src/modules/auth/infrastructure/db';
import { closePool as sharedClosePool, getPool as sharedGetPool } from '../src/shared/infrastructure/postgres/pool';

test('auth pool facade reexports the shared pool references', () => {
  assert.strictEqual(facadeGetPool, sharedGetPool);
  assert.strictEqual(facadeClosePool, sharedClosePool);
});
