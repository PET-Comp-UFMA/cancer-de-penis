import './admin-env';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';
import { applyOfficialInstruments } from './instrumentos-oficiais';

async function main() {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const owner = await client.query<{ id: string }>(
      'select id from app_private.admin_users where username_normalized = $1',
      ['admin01'],
    );
    if (!owner.rowCount) throw new Error('ADMIN_NOT_FOUND');
    const report = await applyOfficialInstruments(client, owner.rows[0].id);
    await client.query('commit');
    for (const line of report) console.log(line);
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    console.error(error instanceof Error && error.message === 'ADMIN_NOT_FOUND'
      ? 'O usuário admin01 não existe. Nenhuma alteração foi feita.'
      : 'Não foi possível cadastrar os instrumentos. Nenhuma alteração foi confirmada.');
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().finally(() => closePool().catch(() => undefined));
