import './load-env';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';

async function main() {
  // The runtime role intentionally cannot read the migration ledger. This local,
  // read-only diagnostic uses DATABASE_ADMIN_URL when it is configured.
  if (process.env.DATABASE_ADMIN_URL) process.env.DATABASE_URL = process.env.DATABASE_ADMIN_URL;
  const pool = getPool();
  const connection = await pool.query<{ database_name: string; role_name: string }>(
    'select current_database() as database_name, current_user as role_name',
  );
  const migrations = await pool.query<{ name: string; applied_at: Date }>(
    'select name, applied_at from app_private.schema_migrations order by name',
  );
  const tables = await pool.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'app_private' order by table_name",
  );

  console.log(JSON.stringify({
    connection: connection.rows[0],
    migrations: migrations.rows,
    tables: tables.rows.map(row => row.table_name),
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error('Consulta somente leitura do schema não concluída.', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closePool().catch(() => undefined));
