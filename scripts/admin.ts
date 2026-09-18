import './admin-env';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { closePool, getPool } from '../src/modules/auth/infrastructure/db';
import { normalizeUsername } from '../src/modules/auth/infrastructure/crypto';
import { provisionUser, resetPassword, disableUser } from '../src/modules/auth/application/service';
import type { AuthRole } from '../src/modules/auth/domain/types';

async function main() {
  const action = process.argv[2];
  if (!['create', 'reset', 'disable'].includes(action) || process.argv.length !== 3) {
    throw new Error('USE_COMMAND');
  }
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('INTERACTIVE_REQUIRED');
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const username = (await prompt.question('Nome de usuário (3–64 letras, números, ponto, hífen ou sublinhado): ')).trim();
    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username)) throw new Error('INVALID_USERNAME');
    if (action === 'create') {
      const choice = (await prompt.question('Papel: admin, responsavel ou ambos [admin]: ')).trim() || 'admin';
      if (!['admin', 'responsavel', 'ambos'].includes(choice)) throw new Error('INVALID_ROLE');
      const roles: AuthRole[] = choice === 'ambos' ? ['admin', 'responsavel'] : [choice as AuthRole];
      const password = randomBytes(24).toString('base64url');
      await provisionUser(username, password, roles);
      console.log(`Conta criada: ${username}`);
      console.log(`Senha temporária (exibida somente agora): ${password}`);
      console.log('Entregue pessoalmente. Expira em 24 horas, aceita um login e exige troca imediata.');
      return;
    }
    const result = await getPool().query<{id: string}>('SELECT id FROM app_private.admin_users WHERE username_normalized=$1', [normalizeUsername(username)]);
    if (!result.rowCount) throw new Error('USER_NOT_FOUND');
    const confirmation = await prompt.question(`Confirma ${action === 'reset' ? 'redefinir a senha e encerrar as sessões' : 'desativar a conta e encerrar as sessões'} de ${username}? Digite SIM: `);
    if (confirmation !== 'SIM') { console.log('Operação cancelada.'); return; }
    if (action === 'reset') {
      const password = randomBytes(24).toString('base64url');
      if (!await resetPassword(result.rows[0].id, password)) throw new Error('USER_NOT_FOUND');
      console.log(`Senha temporária (exibida somente agora): ${password}`);
      console.log('Entregue pessoalmente. Expira em 24 horas. Redefinir não reativa contas desativadas.');
    } else {
      if (!await disableUser(result.rows[0].id)) throw new Error('USER_NOT_FOUND');
      console.log('Conta desativada e sessões encerradas.');
    }
  } finally {
    prompt.close();
  }
}

main().catch((error: unknown) => {
  const messages: Record<string, string> = {
    USE_COMMAND: 'Use npm run admin:create, admin:reset ou admin:disable, sem argumentos adicionais.',
    INTERACTIVE_REQUIRED: 'Execute em um terminal pessoal interativo. A saída com credenciais não pode ser redirecionada.',
    INVALID_USERNAME: 'Nome inválido. Use de 3 a 64 letras sem acento, números, ponto, hífen ou sublinhado.',
    INVALID_ROLE: 'Papel inválido. Use admin, responsavel ou ambos.',
    USER_NOT_FOUND: 'Conta não encontrada.',
  };
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  console.error(code === '23505' ? 'Este nome de usuário já está em uso.' : messages[error instanceof Error ? error.message : ''] || 'Operação não concluída. Confira a conexão, as migrações e as permissões do banco.');
  process.exitCode = 1;
}).finally(async () => {
  await closePool().catch(() => {});
});
