import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, after, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { createPrisma } from '../src/lib/prisma.js';
import { createRequireAuth } from '../src/middleware/requireAuth.js';
import { syncUser } from '../src/modules/users/syncUser.js';

// Never run these writes against the shared demo database.
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(
    new URL(process.env.DATABASE_URL ?? 'http://invalid').hostname,
  )
) {
  throw new Error(
    'Chat database checks require a local PostgreSQL database. Use npm run db:check.',
  );
}
const prisma = createPrisma();
const ownerId = randomUUID();
const renterId = randomUUID();
const outsiderId = randomUUID();
const itemId = randomUUID();
const categoryId = randomUUID();
const bookingId = randomUUID();
const subjects = new Map<string, string>(
  [ownerId, renterId, outsiderId].map((id) => [id, `chat_test_${id}`]),
);
let server: Server | undefined;
let base: string;
const headers = (id: string) => ({
  'x-test-subject': subjects.get(id)!,
  'Content-Type': 'application/json',
});
const request = (id: string, path: string, method = 'GET', body?: object) =>
  fetch(base + '/api' + path, {
    method,
    headers: headers(id),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

before(async () => {
  await prisma.$transaction(async (tx) => {
    for (const [id, subject] of subjects) {
      await tx.user.create({
        data: {
          id,
          clerkUserId: subject,
          name: id === ownerId ? 'Owner' : 'Renter',
          email: 'chat@example.test',
        },
      });
    }
    await tx.category.create({ data: { id: categoryId, name: 'Chat test ' + categoryId } });
    await tx.item.create({
      data: {
        id: itemId,
        ownerId,
        categoryId,
        title: 'Chat test item',
        description: 'Isolated chat test',
        pricePerDay: '10',
        city: 'Berlin',
        isPublished: true,
      },
    });
    await tx.booking.create({
      data: {
        id: bookingId,
        itemId,
        renterId,
        pickupDate: new Date('2027-01-01'),
        returnDate: new Date('2027-01-02'),
        pricePerDaySnapshot: '10',
        totalPrice: '20',
        status: 'APPROVED',
      },
    });
  });
  const app = createApp({
    prisma,
    authenticate: createRequireAuth({
      getSubject: (req) => req.get('x-test-subject') ?? null,
      getTokenExpiresAt: (req) =>
        req.get('x-test-stream-ttl')
          ? Date.now() + Number(req.get('x-test-stream-ttl'))
          : undefined,
      loadIdentity: async (clerkUserId) => ({
        clerkUserId,
        name: 'Chat test user',
        email: 'chat@example.test',
      }),
      syncUser: (identity) => syncUser(prisma, identity),
    }),
    locationService: { search: async () => [], normalize: async (city) => city },
  });
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server!.close((error) => (error ? reject(error) : resolve())),
    );
  try {
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.item.deleteMany({ where: { id: itemId } });
    await prisma.user.deleteMany({ where: { id: { in: [...subjects.keys()] } } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
  } finally {
    await prisma.$disconnect();
  }
});

async function exchange(conversationId: string, firstMessageId: string) {
  const path = `/conversations/${conversationId}`;
  const incoming = await request(ownerId, path + '/messages');
  assert.equal(incoming.status, 200);
  assert.equal((await incoming.json()).messages[0].id, firstMessageId);
  assert.equal((await (await request(ownerId, '/conversations/unread-count')).json()).count, 1);
  for (let attempt = 0; attempt < 3; attempt++) {
    const read = await request(ownerId, path + '/read', 'PATCH', {
      lastReadMessageId: firstMessageId,
    });
    assert.equal(read.status, 204);
  }
  assert.equal((await (await request(ownerId, '/conversations/unread-count')).json()).count, 0);
  const firstReadAt = (await prisma.message.findUniqueOrThrow({ where: { id: firstMessageId } }))
    .readAt;
  assert.ok(firstReadAt);
  await request(ownerId, path + '/read', 'PATCH', { lastReadMessageId: firstMessageId });
  assert.equal(
    (
      await prisma.message.findUniqueOrThrow({ where: { id: firstMessageId } })
    ).readAt?.toISOString(),
    firstReadAt.toISOString(),
  );
  const sent = await request(ownerId, path + '/messages', 'POST', {
    body: 'Ja, 17 Uhr passt!',
    replyToMessageId: firstMessageId,
  });
  assert.equal(sent.status, 201);
  const { message: reply } = await sent.json();
  assert.equal(reply.senderId, ownerId);
  assert.equal(reply.replyTo.id, firstMessageId);
  const received = await request(renterId, path + '/messages');
  assert.equal(received.status, 200);
  const history = await received.json();
  assert.equal(history.messages.length, 2);
  assert.equal(history.messages[0].body, 'Ja, 17 Uhr passt!');
  assert.equal(history.messages[0].readAt, null);
  assert.equal(
    (await request(renterId, path + '/read', 'PATCH', { lastReadMessageId: reply.id })).status,
    204,
  );
  assert.ok((await prisma.message.findUniqueOrThrow({ where: { id: reply.id } })).readAt);
  assert.equal((await request(outsiderId, path + '/messages')).status, 403);
  assert.equal(
    (await request(outsiderId, path + '/messages', 'POST', { body: 'Not allowed' })).status,
    403,
  );
  assert.equal(await prisma.message.count({ where: { conversationId } }), 2);
}

test('item inquiry: two participants can receive, mark read and reply with a quote', async () => {
  const created = await request(renterId, `/items/${itemId}/conversation/messages`, 'POST', {
    body: 'Kann ich um 17 Uhr abholen?',
  });
  assert.equal(created.status, 201);
  const { conversation, message } = await created.json();
  await exchange(conversation.id, message.id);
});

test('booking chat: the same exchange works and a closed booking remains read-only', async () => {
  const responses = await Promise.all(
    [ownerId, renterId].map((id) => request(id, `/bookings/${bookingId}/conversation`, 'POST')),
  );
  assert.equal(responses[0].status, 201);
  assert.equal(responses[1].status, 201);
  const first = await responses[0].json();
  const second = await responses[1].json();
  assert.equal(first.conversation.id, second.conversation.id);
  const conversationId = first.conversation.id;
  const sent = await request(renterId, `/conversations/${conversationId}/messages`, 'POST', {
    body: 'Kann ich um 17 Uhr abholen?',
  });
  assert.equal(sent.status, 201);
  await exchange(conversationId, (await sent.json()).message.id);
  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
  const closed = await request(ownerId, `/conversations/${conversationId}/messages`);
  assert.equal(closed.status, 200);
  assert.equal((await closed.json()).canSend, false);
  assert.equal(
    (
      await request(ownerId, `/conversations/${conversationId}/messages`, 'POST', {
        body: 'Not allowed',
      })
    ).status,
    409,
  );
});

async function openEvents(userId: string, ttl?: number) {
  const controller = new AbortController();
  const response = await fetch(base + '/api/conversations/events', {
    headers: { ...headers(userId), ...(ttl ? { 'x-test-stream-ttl': String(ttl) } : {}) },
    signal: controller.signal,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/event-stream/);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  async function next() {
    while (true) {
      const end = buffer.indexOf('\n\n');
      if (end >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (frame.startsWith('data: ')) return JSON.parse(frame.slice(6));
        continue;
      }
      const chunk = await reader.read();
      if (chunk.done) throw new Error('Chat stream closed');
      buffer += decoder.decode(chunk.value, { stream: true });
    }
  }
  return { next, close: () => controller.abort() };
}

test('authenticated live events are sent after commit to both participants, never outsiders', async () => {
  assert.equal((await fetch(base + '/api/conversations/events')).status, 401);
  const created = await request(renterId, `/items/${itemId}/conversation/messages`, 'POST', {
    body: 'Live inquiry',
  });
  assert.equal(created.status, 201);
  const { conversation } = await created.json();
  const owner = await openEvents(ownerId);
  const renter = await openEvents(renterId);
  const outsider = await openEvents(outsiderId);
  try {
    const sent = await request(ownerId, `/conversations/${conversation.id}/messages`, 'POST', {
      body: 'Sofortige Antwort',
    });
    assert.equal(sent.status, 201);
    const { message } = await sent.json();
    const [ownerEvent, renterEvent] = await Promise.all([owner.next(), renter.next()]);
    assert.equal(ownerEvent.message.id, message.id);
    assert.equal(ownerEvent.incoming, false);
    assert.equal(renterEvent.message.id, message.id);
    assert.equal(renterEvent.incoming, true);
    assert.equal(renterEvent.message.body, 'Sofortige Antwort');
    assert.ok(await prisma.message.findUnique({ where: { id: renterEvent.message.id } }));
    const noOutsideEvent = outsider.next().then(
      () => true,
      () => false,
    );
    assert.equal(
      await Promise.race([
        noOutsideEvent,
        new Promise((resolve) => setTimeout(() => resolve(false), 150)),
      ]),
      false,
    );
    const noFailedWriteEvent = renter.next().then(
      () => true,
      () => false,
    );
    const rejected = await request(ownerId, `/conversations/${conversation.id}/messages`, 'POST', {
      body: 'Invalid reply',
      replyToMessageId: randomUUID(),
    });
    assert.equal(rejected.status, 400);
    assert.equal(
      await Promise.race([
        noFailedWriteEvent,
        new Promise((resolve) => setTimeout(() => resolve(false), 150)),
      ]),
      false,
    );
  } finally {
    owner.close();
    renter.close();
    outsider.close();
  }
});

test('a live connection closes when its verified authentication expires', async () => {
  const stream = await openEvents(ownerId, 50);
  try {
    await assert.rejects(stream.next(), /Chat stream closed/);
  } finally {
    stream.close();
  }
});
