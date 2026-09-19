import './admin-env';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';

const catalog = [
  {
    catalogKey: 'PENRISK',
    title: 'PENRISK',
    description: 'Esta avaliação ajuda a identificar seu risco de desenvolver câncer de pênis. Quanto mais cedo for detectado, maiores são as chances de um tratamento bem sucedido.',
  },
  {
    catalogKey: 'QUALIPEN',
    title: 'QUALIPEN',
    description: 'Esta avaliação tem o objetivo de entender como o câncer de pênis afeta a sua vida. Suas respostas nos ajudarão a entender o impacto da doença no seu dia a dia.',
  },
] as const;

async function main() {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const owner = await client.query<{ id: string }>(
      'select id from app_private.admin_users where username_normalized = $1',
      ['admin01'],
    );
    if (!owner.rowCount) throw new Error('ADMIN_NOT_FOUND');
    for (const form of catalog) {
      await client.query(
        `insert into app_private.admin_forms (owner_id, catalog_key, title, description, status, definition_state)
         values ($1, $2, $3, $4, 'published', 'complete')
         on conflict (owner_id, catalog_key) do nothing`,
        [owner.rows[0].id, form.catalogKey, form.title, form.description],
      );
    }
    await client.query('commit');
    console.log('Formulários iniciais verificados para admin01.');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    if (error instanceof Error && error.message === 'ADMIN_NOT_FOUND') {
      console.error('Não foi possível semear formulários: o usuário admin01 não existe. Nenhuma alteração foi feita.');
    } else {
      console.error('Não foi possível semear formulários. Nenhuma alteração foi confirmada.');
    }
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().finally(() => closePool().catch(() => undefined));
