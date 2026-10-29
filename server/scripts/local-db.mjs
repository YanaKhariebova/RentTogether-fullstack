import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import EmbeddedPostgres from 'embedded-postgres';

const serverDir = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
// Test runs must never reuse the running development cluster or its data directory.
const stateDir = check
  ? mkdtempSync(path.join(tmpdir(), 'renttogether-db-check-'))
  : path.join(serverDir, '.local-postgres');
mkdirSync(stateDir, { recursive: true });
const credentialsPath = path.join(stateDir, 'credentials.json');
if (!existsSync(credentialsPath)) {
  writeFileSync(credentialsPath, JSON.stringify({ password: randomBytes(24).toString('hex') }), {
    mode: 0o600,
  });
}
const { password } = JSON.parse(readFileSync(credentialsPath, 'utf8'));
const port = check ? await findFreePort() : 55432;
const user = 'rent_together';
const databaseDir = path.join(stateDir, 'data');
const cluster = new EmbeddedPostgres({
  databaseDir,
  port,
  user,
  password,
  persistent: true,
  authMethod: 'scram-sha-256',
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {},
});
const database = check ? `foundation_check_${Date.now()}` : 'rent_together';
const databaseUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const listener = createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const address = listener.address();
      if (!address || typeof address === 'string') {
        listener.close(() => reject(new Error('Could not select a test database port.')));
        return;
      }
      listener.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function run(args, extraEnv = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: serverDir,
      stdio: 'inherit',
      windowsHide: true,
      env: { ...process.env, DATABASE_URL: databaseUrl, ...extraEnv },
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Database command failed (exit ${code})`)),
    );
  });
}

let started = false;
async function stop() {
  if (started) {
    started = false;
    await cluster.stop();
  }
}
try {
  if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) await cluster.initialise();
  await cluster.start();
  started = true;
  const admin = cluster.getPgClient('postgres', '127.0.0.1');
  await admin.connect();
  try {
    const result = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (!result.rowCount) await cluster.createDatabase(database);
  } finally {
    await admin.end();
  }

  if (check) {
    for (let attempt = 0; attempt < 2; attempt++) {
      await run(['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
      await run(['node_modules/prisma/build/index.js', 'db', 'seed'], {
        // Explicit fixtures belong only to this temporary test database.
        SEED_OWNER_CLERK_ID: 'test_seed_owner',
        SEED_RENTER_CLERK_ID: 'test_seed_renter',
      });
    }
    await run([
      '--import',
      'tsx',
      '--test',
      '--test-concurrency=1',
      'tests/database.integration.ts',
      'tests/items.database.integration.ts',
    ]);
    console.log('Clean PostgreSQL migration, repeated seed and profile persistence checks passed.');
  } else {
    const envPath = path.join(serverDir, '.env');
    if (!existsSync(envPath)) {
      const template = readFileSync(path.join(serverDir, '.env.example'), 'utf8');
      writeFileSync(
        envPath,
        template.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`),
        { mode: 0o600 },
      );
      console.log(
        'Created ignored server/.env with the local database configuration. Clerk keys are still required.',
      );
    } else {
      console.log(
        'Kept existing server/.env. Local database credentials are in server/.local-postgres/credentials.json.',
      );
    }
    console.log(
      `PostgreSQL is ready on 127.0.0.1:${port}. Database: ${database}. Keep this terminal open.`,
    );
    await new Promise((resolve) => {
      process.once('SIGINT', resolve);
      process.once('SIGTERM', resolve);
    });
  }
} finally {
  await stop();
  if (check) rmSync(stateDir, { recursive: true, force: true });
}
