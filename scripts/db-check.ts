import './load-env';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';

async function main() {
  await getPool().query('SELECT 1');
  const schema = await getPool().query("SELECT to_regclass('app_private.admin_users') IS NOT NULL AS ready");
  console.log('Conexão PostgreSQL confirmada.');
  console.log(schema.rows[0].ready ? 'Tabelas de autenticação encontradas.' : 'Próximo passo: npm run db:migrate.');
}

main().catch((error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code === '28P01') console.error('O banco recusou o usuário ou a senha. Confira DATABASE_URL no arquivo local.');
  else if (['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED'].includes(code)) {
    console.error('Certificado não validado. Configure DATABASE_CA com o certificado raiz do Supabase. Não desative SSL.');
  } else console.error('Conexão não confirmada. Confira host, porta, senha, certificado e acesso à rede.');
  process.exitCode = 1;
}).finally(() => closePool().catch(() => {}));
