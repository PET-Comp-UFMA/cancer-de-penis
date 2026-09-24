import './admin-env';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';
import { AUTO_CATALOG_KEY } from '../src/modules/formularios/domain/slug';
import { availableSlug } from '../src/modules/formularios/infrastructure/repository';

// One-time: gives forms that were already published with an automatic
// FORM-<uuid> key the /tela-avaliacao/<nome-do-formulario> address.
// Custom keys (PENRISK, QUALIPEN, ...) and never-published drafts are untouched.
async function main() {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const forms = await client.query<{ id: string; catalog_key: string; title: string }>(
      `select id, catalog_key, title from app_private.admin_forms
        where published_at is not null order by published_at, id for update`,
    );
    let changed = 0;
    for (const form of forms.rows) {
      if (!AUTO_CATALOG_KEY.test(form.catalog_key)) continue;
      const key = await availableSlug(client, form.title, form.id);
      await client.query('update app_private.admin_forms set catalog_key = $2 where id = $1', [form.id, key]);
      console.log(`${form.title}: /tela-avaliacao/${form.catalog_key.toLowerCase()} → /tela-avaliacao/${key}`);
      changed += 1;
    }
    await client.query('commit');
    console.log(changed ? `${changed} endereço(s) atualizado(s).` : 'Nenhum formulário publicado com endereço automático.');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    console.error('Não foi possível atualizar os endereços. Nenhuma alteração foi confirmada.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().finally(() => closePool().catch(() => undefined));
