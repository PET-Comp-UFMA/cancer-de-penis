import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const BIN = process.env.PG_BIN || process.env.PG18local || 'C:\\Program Files\\PostgreSQL\\18\\bin';
const root = path.resolve(process.cwd());

export function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
  });
}

function run(file: string, args: string[], env?: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    // pg_ctl starts a daemon. Inherited pipes can keep execFile callbacks pending on Windows.
    const child = spawn(file, args, { windowsHide: true, env, stdio: 'ignore' });
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${path.basename(file)} failed (${code})`)));
    child.on('error', reject);
  });
}

export type PostgresFixture = {
  url: string;
  pool: Pool;
  query: Pool['query'];
  stop: () => Promise<void>;
};

export async function startPostgres(): Promise<PostgresFixture> {
  const id = randomUUID();
  const dataDir = path.join(root, '.auth-test', id);
  await fs.mkdir(dataDir, { recursive: true });
  const password = randomBytes(32).toString('base64url');
  // initdb exige que o diretório de dados esteja vazio; mantenha o pwfile ao lado.
  const pwFile = path.join(root, '.auth-test', `${id}.pw`);
  const logFile = path.join(dataDir, 'postgres.log');
  await fs.writeFile(pwFile, password, { mode: 0o600 });
  const port = await freePort();
  const env = { ...process.env, PGCLIENTENCODING: 'UTF8' };
  try {
    await run(path.join(BIN, 'initdb.exe'), ['-D', dataDir, '-U', 'postgres', '--pwfile', pwFile, '--auth=scram-sha-256', '--no-locale'], env);
  } finally { await fs.unlink(pwFile).catch(() => undefined); }
  const options = `-h 127.0.0.1 -p ${port}`;
  let pool: Pool | undefined;
  try {
    await run(path.join(BIN, 'pg_ctl.exe'), ['-D', dataDir, '-o', options, '-w', 'start', '-l', logFile], env);
    const url = `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/postgres?sslmode=disable`;
    pool = new Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 5000 });
    await pool.query('select 1');
    return {
      url, pool, query: pool.query.bind(pool) as Pool['query'],
      stop: async () => {
        await pool?.end().catch(() => undefined);
        await run(path.join(BIN, 'pg_ctl.exe'), ['-D', dataDir, '-m', 'fast', '-w', 'stop'], env).catch(() => undefined);
      },
    };
  } catch (error) {
    await pool?.end().catch(() => undefined);
    await run(path.join(BIN, 'pg_ctl.exe'), ['-D', dataDir, '-m', 'fast', '-w', 'stop'], env).catch(() => undefined);
    throw error;
  }
}

export async function waitForHttp(url: string, child?: ChildProcess) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return;
    } catch { /* process is still starting */ }
    if (child?.exitCode !== null && child?.exitCode !== undefined) throw new Error(`Next exited with ${child.exitCode}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export async function startNext(databaseUrl: string, origin: string) {
  const port = Number(new URL(origin).port);
  if (!port) throw new Error('startNext requires an origin with an allocated port');
  const child = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '--webpack', '-p', String(port)], {
    cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_SSL: 'false', APP_ORIGIN: origin, AUTH_SECRET: randomBytes(32).toString('base64url') },
  });
  // Consume output without exposing process environment, connection strings or credentials.
  child.stdout?.resume(); child.stderr?.resume();
  try { await waitForHttp(`${origin}/api/auth/session`, child); } catch (error) {
    if (child.exitCode !== null || child.pid === undefined) throw error;
    const closed = once(child, 'close');
    if (child.pid !== undefined) await run('taskkill.exe', ['/PID', String(child.pid), '/T', '/F']).catch(() => child.kill());
    await closed.catch(() => undefined);
    throw error;
  }
  return {
    baseUrl: origin,
      stop: async () => {
        if (child.exitCode !== null || child.pid === undefined) return;
        if (process.platform === 'win32') {
          const closed = once(child, 'close');
          await run('taskkill.exe', ['/PID', String(child.pid), '/T', '/F']).catch(() => undefined);
          await closed.catch(() => undefined);
        } else {
          const closed = once(child, 'close');
          child.kill('SIGTERM');
          await closed.catch(() => undefined);
        }
      },
  };
}
