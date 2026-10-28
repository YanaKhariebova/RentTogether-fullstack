// Uses a real PostgreSQL database selected by scripts/local-db.mjs.
// Only the verified Clerk identity is a test double; production auth is unchanged.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { createPrisma } from '../src/lib/prisma.js';
import { createRequireAuth } from '../src/middleware/requireAuth.js';
import { syncUser } from '../src/modules/users/syncUser.js';

const prisma = createPrisma();
const ownerSubject = `integration_owner_${randomUUID()}`;
const renterSubject = `integration_renter_${randomUUID()}`;
let server: Server;
let base: string;
before(async () => {
  const app = createApp({
    prisma,
    authenticate: createRequireAuth({
      getSubject: (req) => req.get('x-test-subject') ?? null,
      loadIdentity: async (clerkUserId) => ({
        clerkUserId,
        name: 'Original name',
        email: `${clerkUserId}@example.test`,
      }),
      syncUser: (identity) => syncUser(prisma, identity),
    }),
  });
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await prisma.$disconnect();
});

test('migration and repeated seed create four categories with UUID IDs', async () => {
  const response = await fetch(`${base}/api/categories`);
  assert.equal(response.status, 200);
  const { categories } = await response.json();
  assert.equal(categories.length, 4);
  assert.equal(new Set(categories.map((category: { name: string }) => category.name)).size, 4);
  for (const category of categories) assert.match(category.id, /^[0-9a-f-]{36}$/i);
});
test('profile survives a fresh database connection and subsequent identity sync', async () => {
  const headers = { 'x-test-subject': ownerSubject, 'Content-Type': 'application/json' };
  const first = await (await fetch(`${base}/api/me`, { headers })).json();
  const response = await fetch(`${base}/api/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: 'Vlad', city: 'Berlin', phone: '+49123456' }),
  });
  assert.equal(response.status, 200);
  const separateConnection = createPrisma();
  try {
    const persisted = await separateConnection.user.findUniqueOrThrow({
      where: { id: first.user.id },
    });
    assert.equal(persisted.name, 'Vlad');
    assert.equal(persisted.city, 'Berlin');
    assert.equal(persisted.phone, '+49123456');
  } finally {
    await separateConnection.$disconnect();
  }
  const again = await (await fetch(`${base}/api/me`, { headers })).json();
  assert.equal(again.user.id, first.user.id);
  assert.equal(again.user.name, 'Vlad');
  assert.equal(again.user.phone, '+49123456');
  assert.equal('clerkUserId' in again.user, false);
  assert.equal(await prisma.user.count({ where: { clerkUserId: ownerSubject } }), 1);
});
test('two authenticated identities have separate persisted profiles', async () => {
  const renter = await (
    await fetch(`${base}/api/me`, { headers: { 'x-test-subject': renterSubject } })
  ).json();
  const owner = await (
    await fetch(`${base}/api/me`, { headers: { 'x-test-subject': ownerSubject } })
  ).json();
  assert.notEqual(renter.user.id, owner.user.id);
  assert.equal(renter.user.name, 'Original name');
  assert.equal(renter.user.city, '');
  assert.equal(owner.user.name, 'Vlad');
  assert.equal(owner.user.city, 'Berlin');
});
test('anonymous profile writes are rejected with no database changes', async () => {
  const beforeCount = await prisma.user.count();
  const response = await fetch(`${base}/api/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Attacker' }),
  });
  assert.equal(response.status, 401);
  assert.equal(await prisma.user.count(), beforeCount);
});
