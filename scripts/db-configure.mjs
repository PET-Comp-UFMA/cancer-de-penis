import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';

async function main() {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('INTERACTIVE');
  const file = '.env.local';
  const text = await readFile(file, 'utf8');
  const match = text.match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error('URL');
  const raw = match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  let url;
  try { url = new URL(raw); } catch { throw new Error('URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname === 'HOST') throw new Error('URL');
  // The terminal handles input in raw mode; the output stream never echoes the password.
  const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const input = createInterface({ input: stdin, output: muted, terminal: true });
  stdout.write('Senha do banco definida ao criar o projeto Supabase (oculta): ');
  let password;
  try { password = await input.question(''); } finally { input.close(); stdout.write('\n'); }
  if (!password) throw new Error('EMPTY');
  url.password = encodeURIComponent(password);
  await writeFile(file, text.replace(/^DATABASE_URL=.*$/m, 'DATABASE_URL=' + url.toString()), 'utf8');
  console.log('Senha aplicada à conexão em .env.local. Caracteres especiais foram codificados.');
  console.log('Confira a conexão com npm run db:check.');
}

main().catch(error => {
  const messages = {
    INTERACTIVE: 'Execute pessoalmente em um terminal interativo, sem redirecionar a saída.',
    URL: 'Primeiro copie a conexão PostgreSQL de Connect / Session pooler para DATABASE_URL em .env.local.',
    EMPTY: 'Senha vazia: o arquivo foi preservado.',
  };
  console.error(messages[error.message] || 'Não foi possível configurar o arquivo. Nenhuma credencial foi exibida.');
  process.exitCode = 1;
});
