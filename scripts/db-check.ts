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
  const message = error instanceof Error ? error.message : '';
  if (code === '28P01') console.error('O banco recusou o usuário ou a senha. Confira DATABASE_URL no arquivo local.');
  else if (code === 'ETIMEDOUT' || /timeout|timed out/i.test(message)) {
    console.error('Tempo limite ao conectar ao banco. A senha ainda não pôde ser validada. Confira a rede, o endereço e o estado do projeto no Supabase.');
  } else if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    console.error('Não foi possível localizar o servidor do banco. Confira o host em DATABASE_URL e a conexão de rede.');
  } else if (['ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH'].includes(code)) {
    console.error('O servidor do banco não está acessível nesta rede. Confira a porta e o estado do projeto no Supabase.');
  } else if (['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED'].includes(code)) {
    console.error('Certificado não validado. Configure DATABASE_CA com o certificado raiz do Supabase. Não desative SSL.');
  } else console.error('Conexão não confirmada. Confira host, porta, senha, certificado e acesso à rede.');
  process.exitCode = 1;
}).finally(() => closePool().catch(() => {}));
