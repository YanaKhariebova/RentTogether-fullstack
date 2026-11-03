import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import type { PrismaClient, User } from '../src/generated/prisma/client.js';
import { createRequireAuth, requireOwner } from '../src/middleware/requireAuth.js';
import { syncUser } from '../src/modules/users/syncUser.js';

const user: User = {
  id: '20000000-0000-4000-8000-000000000001',
  clerkUserId: 'user_clerk_test',
  name: 'Vlad',
  city: 'Berlin',
  email: 'vlad@example.test',
  phone: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};
let updates = 0;
const prisma = {
  category: { findMany: async () => [{ id: 'category-1', name: 'Elektronik' }] },
  user: {
    update: async ({ where, data }: { where: { id: string }; data: object }) => {
      assert.equal(where.id, user.id);
      updates++;
      return { ...user, ...data };
    },
  },
} as unknown as Pick<
  PrismaClient,
  | 'user'
  | 'category'
  | 'item'
  | 'booking'
  | 'favorite'
  | 'notification'
  | 'conversation'
  | 'message'
  | '$transaction'
  | 'imageCleanup'
>;
let server: Server;
let base: string;
before(async () => {
  const app = createApp({
    prisma,
    authenticate: createRequireAuth({
      // Test double for verified Clerk identity, never enabled by the real server.
      getSubject: (req) => req.get('x-test-subject') ?? null,
      loadIdentity: async (clerkUserId) => ({ clerkUserId, name: 'Vlad', email: user.email }),
      syncUser: async (identity) => {
        assert.equal(identity.clerkUserId, user.clerkUserId);
        return user;
      },
    }),
  });
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);
const headers = { 'x-test-subject': user.clerkUserId, 'Content-Type': 'application/json' };

test('health and categories are public', async () => {
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { status: 'ok' });
  assert.deepEqual(await (await fetch(`${base}/api/categories`)).json(), {
    categories: [{ id: 'category-1', name: 'Elektronik' }],
  });
});
test('anonymous requests and a client-supplied user ID cannot authenticate', async () => {
  for (const method of ['GET', 'PATCH']) {
    const response = await fetch(`${base}/api/me`, {
      method,
      headers: { Authorization: 'Bearer unverified', 'Content-Type': 'application/json' },
      ...(method === 'PATCH' ? { body: JSON.stringify({ id: user.id, name: 'Attacker' }) } : {}),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      error: { code: 'UNAUTHENTICATED', message: 'Bitte melde dich an.', fields: {} },
    });
  }
});
test('current user response excludes Clerk ID and internal timestamps', async () => {
  const response = await fetch(`${base}/api/me`, { headers });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: { id: user.id, name: user.name, city: user.city, email: user.email, phone: '' },
  });
});
test('all owner item endpoints require authentication', async () => {
  for (const [method, path] of [
    ['POST', '/api/items'],
    ['PATCH', `/api/items/${user.id}`],
    ['DELETE', `/api/items/${user.id}`],
    ['DELETE', `/api/items/${user.id}/permanent`],
    ['GET', '/api/my/items'],
    ['PATCH', `/api/items/${user.id}/images/order`],
    ['PUT', `/api/items/${user.id}/images/order`],
    ['POST', `/api/items/${user.id}/images`],
    ['DELETE', `/api/items/${user.id}/images/${user.id}`],
    ['POST', '/api/bookings'],
    ['POST', `/api/bookings/${user.id}/conversation`],
    ['GET', '/api/conversations'],
    ['GET', '/api/conversations/unread-count'],
    ['GET', `/api/conversations/${user.id}/messages`],
    ['POST', `/api/conversations/${user.id}/messages`],
    ['PATCH', `/api/conversations/${user.id}/read`],
    ['GET', '/api/me/favorites'],
    ['PUT', `/api/me/favorites/${user.id}`],
    ['DELETE', `/api/me/favorites/${user.id}`],
    ['GET', '/api/me/notifications'],
    ['GET', '/api/me/notifications/unread-count'],
    ['PATCH', '/api/me/notifications/read'],
  ]) {
    const response = await fetch(`${base}${path}`, { method });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
  }
});

test('profile patch trims input and uses the authenticated local user', async () => {
  const response = await fetch(`${base}/api/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: '  Vladislav  ', city: 'Hamburg' }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.name, 'Vladislav');
  assert.equal(updates, 1);
});
test('validation rejects empty, oversized and forbidden identity fields without writes', async () => {
  const count = updates;
  for (const body of [
    {},
    { name: ' ' },
    { city: 'x'.repeat(101) },
    { clerkUserId: 'other' },
    { id: 'other' },
    { email: 'other@test.de' },
    { name: 1 },
    { phone: null },
  ]) {
    const response = await fetch(`${base}/api/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
    const json = await response.json();
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    assert.equal(typeof json.error.fields, 'object');
  }
  assert.equal(updates, count);
});
test('malformed JSON and unknown routes use the common error envelope', async () => {
  const response = await fetch(`${base}/api/me`, { method: 'PATCH', headers, body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_JSON');
  const missing = await fetch(`${base}/api/missing`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');
});
test('only the local owner can mutate an item', () => {
  assert.doesNotThrow(() => requireOwner(user.id, user.id));
  assert.throws(() => requireOwner(user.id, 'another-user'), { status: 403, code: 'FORBIDDEN' });
});
test('subsequent Clerk sync preserves local name, city and phone', async () => {
  let received: unknown;
  const repository = {
    user: {
      upsert: async (input: unknown) => {
        received = input;
        return user;
      },
    },
  } as unknown as Pick<PrismaClient, 'user'>;
  await syncUser(repository, {
    clerkUserId: user.clerkUserId,
    name: 'Clerk Name',
    email: 'new@test.de',
  });
  assert.deepEqual(received, {
    where: { clerkUserId: user.clerkUserId },
    create: { clerkUserId: user.clerkUserId, name: 'Clerk Name', email: 'new@test.de' },
    update: { email: 'new@test.de' },
  });
});
