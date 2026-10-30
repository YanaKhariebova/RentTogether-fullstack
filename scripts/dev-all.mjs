import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createConnection } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = path.join(root, 'server');
const children = [];
let stopping = false;

function start(name, args, cwd = root) {
  console.log(`[dev:all] ${name}`);
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
  });
  child.on('error', () => {
    child.failed = true;
  });
  child.service = true;
  children.push(child);
  return child;
}
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of [...children].reverse()) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) continue;
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* Child already stopped. */
    }
  }
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void stop().then(() => process.exit(0));
  });
}
async function run(name, args) {
  const child = start(name, args, server);
  child.service = false;
  await new Promise((resolve, reject) => {
    child.once('error', () => reject(new Error(`${name}: could not start.`)));
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${name}: failed (${code}).`)),
    );
  });
}
function listening(host, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    socket.setTimeout(700);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}
async function waitFor(name, ready) {
  const deadline = Date.now() + 30_000;
  do {
    if (stopping) throw new Error('Stopped.');
    if (
      children.some(
        (child) =>
          child.failed ||
          child.signalCode ||
          (child.exitCode !== null && (child.service || child.exitCode !== 0)),
      )
    ) {
      throw new Error(`${name}: a startup process stopped. See its output above.`);
    }
    if (await ready()) return;
    await delay(300);
  } while (Date.now() < deadline);
  throw new Error(`${name}: not ready after 30 seconds.`);
}
async function httpReady(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
}

try {
  if (!existsSync(path.join(server, '.env'))) {
    throw new Error('Create server/.env using docs/foundation-setup.md first.');
  }
  process.loadEnvFile(path.join(server, '.env'));
  if (process.env.NODE_ENV === 'production')
    throw new Error('dev:all is only for local development.');
  const database = new URL(process.env.DATABASE_URL ?? '');
  const frontend = new URL(process.env.CLIENT_URL ?? 'http://localhost:5173');
  const apiPort = Number(process.env.PORT ?? 3000);
  const local = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
  if (!local(database.hostname) || !local(frontend.hostname)) {
    throw new Error('dev:all requires local DATABASE_URL and CLIENT_URL.');
  }
  if (await listening('localhost', apiPort)) {
    throw new Error(
      `API port ${apiPort} is already occupied. Stop the old backend terminal before dev:all so it loads the regenerated Prisma Client.`,
    );
  }
  const dbHost = database.hostname.replace(/^\[|\]$/g, '');
  const dbPort = Number(database.port || 5432);
  if (!(await listening(dbHost, dbPort))) {
    if (dbHost !== '127.0.0.1' || dbPort !== 55432) {
      throw new Error('Start the PostgreSQL configured in DATABASE_URL first.');
    }
    start('Starting local PostgreSQL', [path.join(server, 'scripts/local-db.mjs')]);
  }
  const require = createRequire(path.join(server, 'package.json'));
  const { Client } = require('pg');
  await waitFor('PostgreSQL', async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 1500,
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return true;
    } catch {
      return false;
    } finally {
      await client.end().catch(() => {});
    }
  });
  const prisma = path.join(server, 'node_modules/prisma/build/index.js');
  await run('Applying migrations', [prisma, 'migrate', 'deploy']);
  await run('Generating Prisma Client', [prisma, 'generate']);
  const health = `http://localhost:${apiPort}/api/health`;
  start(
    'Starting API',
    [
      path.join(server, 'node_modules/tsx/dist/cli.mjs'),
      'watch',
      '--include',
      'src/**/*.ts',
      '--include',
      '.env',
      '--exclude',
      'src/generated/**',
      '--clear-screen=false',
      'src/index.ts',
    ],
    server,
  );
  await waitFor('API', () => httpReady(health));
  const frontendHost = frontend.hostname.replace(/^\[|\]$/g, '');
  if (await listening(frontendHost, Number(frontend.port || 80))) {
    console.log('[dev:all] Reusing frontend already running at CLIENT_URL.');
  } else {
    // Keep backend secrets out of the Vite process environment.
    const child = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js')], {
      cwd: root,
      stdio: 'inherit',
      detached: process.platform !== 'win32',
      env: Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) =>
            ![
              'CLERK_SECRET_KEY',
              'CLOUDINARY_API_SECRET',
              'CLOUDINARY_API_KEY',
              'DATABASE_URL',
            ].includes(key),
        ),
      ),
    });
    child.on('error', () => {
      child.failed = true;
    });
    child.service = true;
    children.push(child);
  }
  await waitFor('Frontend', () => httpReady(frontend.origin));
  await waitFor('Categories / database', () =>
    httpReady(`http://localhost:${apiPort}/api/categories`),
  );
  console.log(
    `[dev:all] Ready: ${frontend.origin} — keep this terminal open. Ctrl+C stops only processes started here.`,
  );
  while (!stopping) {
    if (
      children.some(
        (child) =>
          child.failed ||
          child.signalCode ||
          (child.exitCode !== null && (child.service || child.exitCode !== 0)),
      )
    ) {
      throw new Error('A development service stopped. See its output above.');
    }
    await delay(1000);
  }
} catch (error) {
  if (!stopping) {
    // Do not print provider/connection errors that may contain credentials.
    console.error(
      `[dev:all] ${error instanceof Error && !error.message.includes('://') ? error.message : 'Invalid local configuration. See docs/foundation-setup.md.'}`,
    );
    process.exitCode = 1;
  }
  await stop();
}
