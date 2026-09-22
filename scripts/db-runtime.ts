import './load-env';
import { randomBytes } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';

const role = 'avaliapen_runtime';

async function main() {
  const file = '.env.local';
  const text = await readFile(file, 'utf8');
  const current = process.env.DATABASE_URL;
  if (!current) throw new Error('CONNECTION_REQUIRED');
  const runtimeUrl = new URL(current);
  if (decodeURIComponent(runtimeUrl.username).split('.')[0] === role) {
    console.log('A conexão do site já utiliza o usuário limitado.');
    return;
  }
  const administrativeUrl = process.env.DATABASE_ADMIN_URL || current;
  const administrativeTarget = new URL(administrativeUrl);
  if (runtimeUrl.host !== administrativeTarget.host || runtimeUrl.pathname !== administrativeTarget.pathname) {
    throw new Error('DIFFERENT_DATABASES');
  }
  if (runtimeUrl.hostname.endsWith('.pooler.supabase.com')
    && decodeURIComponent(runtimeUrl.username).split('.').slice(1).join('.')
      !== decodeURIComponent(administrativeTarget.username).split('.').slice(1).join('.')) {
    throw new Error('DIFFERENT_DATABASES');
  }
  process.env.DATABASE_URL = administrativeUrl;
  const client = await getPool().connect();
  let committed = false;
  let commitAttempted = false;
  let pendingWritten = false;
  const pendingFile = '.env.local.runtime-pending';
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(735911, 2)');
    if ((await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role])).rowCount) {
      throw new Error('ROLE_EXISTS');
    }
    const password = randomBytes(32).toString('hex');
    // The role name is fixed and the password is locally generated hex, never user SQL.
    await client.query(`CREATE ROLE avaliapen_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 10 PASSWORD '${password}'`);
    await client.query('GRANT USAGE ON SCHEMA app_private TO avaliapen_runtime');
    await client.query('GRANT SELECT, UPDATE ON app_private.admin_users TO avaliapen_runtime');
    await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON app_private.admin_forms TO avaliapen_runtime');
    await client.query('GRANT SELECT, INSERT, UPDATE ON app_private.admin_sessions, app_private.auth_rate_limits TO avaliapen_runtime');
    const dbName = (await client.query('SELECT current_database() AS name')).rows[0].name as string;
    await client.query('GRANT CONNECT ON DATABASE "' + dbName.replaceAll('"', '""') + '" TO avaliapen_runtime');
    const originalUsername = decodeURIComponent(runtimeUrl.username);
    const separator = originalUsername.indexOf('.');
    // Supabase pooler usernames have the form role.project-reference.
    runtimeUrl.username = role + (separator >= 0 ? originalUsername.slice(separator) : '');
    runtimeUrl.password = password;
    let updated = text.replace(/^DATABASE_URL=.*$/m, () => 'DATABASE_URL=' + runtimeUrl.toString());
    const adminLine = 'DATABASE_ADMIN_URL=' + administrativeUrl;
    updated = /^DATABASE_ADMIN_URL=.*$/m.test(updated)
      ? updated.replace(/^DATABASE_ADMIN_URL=.*$/m, () => adminLine)
      : updated.trimEnd() + '\n\n# Apenas comandos administrativos locais. Nunca configurar na Vercel.\n' + adminLine + '\n';
    // Preserve the generated credential before committing the database change.
    // If commit/rename fails, this ignored local file permits manual recovery.
    await writeFile(pendingFile, updated, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    pendingWritten = true;
    commitAttempted = true;
    await client.query('COMMIT'); committed = true;
    await rename(pendingFile, file);
    console.log('Usuário limitado criado. Conexões do site e de administração separadas em .env.local.');
    console.log('Não copie DATABASE_ADMIN_URL para a Vercel. Verifique com npm run db:check.');
  } catch (error) {
    if (!committed) await client.query('ROLLBACK').catch(() => {});
    if (pendingWritten && !commitAttempted) await unlink(pendingFile).catch(() => {});
    if (pendingWritten && commitAttempted) throw new Error('PENDING_CONFIGURATION');
    throw error;
  } finally { client.release(); }
}

main().catch((error: unknown) => {
  const messages: Record<string, string> = {
    ROLE_EXISTS: 'O usuário limitado já existe. Nenhuma senha foi alterada. Confira a configuração anterior antes de continuar.',
    DIFFERENT_DATABASES: 'As duas conexões apontam para bancos diferentes. Nenhuma alteração foi feita.',
    PENDING_CONFIGURATION: 'A configuração foi preservada em .env.local.runtime-pending. Confira a conclusão no banco antes de usar esse arquivo como .env.local; não o envie ao chat.',
  };
  console.error(messages[error instanceof Error ? error.message : ''] || 'Configuração não concluída. Confira a conexão administrativa, as migrações e as permissões. Nenhuma credencial foi exibida.');
  process.exitCode = 1;
}).finally(() => closePool().catch(() => {}));
