import './admin-env';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getPool } from '../src/modules/auth/infrastructure/db';

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Transaction-scoped locking works with Supabase transaction pooling too.
    await client.query('SELECT pg_advisory_xact_lock(735911, 1)');
    await client.query('CREATE SCHEMA IF NOT EXISTS app_private');
    await client.query(`CREATE TABLE IF NOT EXISTS app_private.schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const directory = path.join(process.cwd(), 'db', 'migrations');
    const files = (await readdir(directory)).filter(name => /^\d+.*\.sql$/.test(name)).sort();
    const applied: string[] = [];
    for (const name of files) {
      const sql = await readFile(path.join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex');
      const existing = await client.query<{checksum: string}>('SELECT checksum FROM app_private.schema_migrations WHERE name=$1', [name]);
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum) throw new Error('MIGRATION_CHANGED');
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO app_private.schema_migrations (name, checksum) VALUES ($1,$2)', [name, checksum]);
      applied.push(name);
    }
    await client.query('COMMIT');
    console.log(applied.length ? `Migrações aplicadas: ${applied.join(', ')}` : 'Banco atualizado; nenhuma migração pendente.');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && error.message === 'MIGRATION_CHANGED') {
      console.error('Uma migração já aplicada foi alterada. Restaure o arquivo e crie uma nova migração.');
    } else {
      console.error('Não foi possível aplicar as migrações. Confira a conexão, o certificado e as permissões do banco.');
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(() => {
  console.error('Não foi possível conectar ao banco. Confira as variáveis de ambiente.');
  process.exitCode = 1;
});
