import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createPrisma } from '../src/lib/prisma.js';
import { createApp } from '../src/app.js';
import { createRequireAuth } from '../src/middleware/requireAuth.js';
import { syncUser } from '../src/modules/users/syncUser.js';
import { seedDemoItem } from '../prisma/seedItems.js';

const prisma = createPrisma();
const ownerIds: string[] = [];
let server: Server;
let base: string;

before(async () => {
  const app = createApp({
    prisma,
    authenticate: createRequireAuth({
      // Только тестовая проверенная идентичность; production проверяет Clerk JWT.
      getSubject: (req) => req.get('x-test-subject') ?? null,
      loadIdentity: async (clerkUserId) => ({
        clerkUserId,
        name: 'Test owner',
        email: 'test@example.test',
      }),
      syncUser: (identity) => syncUser(prisma, identity),
    }),
  });
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

const headersFor = (item: { owner: { clerkUserId: string } }) => ({
  'x-test-subject': item.owner.clerkUserId,
  'Content-Type': 'application/json',
});

async function createItemFixture() {
  const owner = await prisma.user.create({
    data: {
      clerkUserId: `items_test_${randomUUID()}`,
      name: 'Test owner',
      city: 'Berlin',
      email: '',
    },
  });
  ownerIds.push(owner.id);
  const category = await prisma.category.findUniqueOrThrow({ where: { name: 'Elektronik' } });
  return prisma.item.create({
    data: {
      ownerId: owner.id,
      categoryId: category.id,
      title: 'Beamer für einen Filmabend',
      description: 'Ein Beamer mit HDMI-Anschluss und Kabel.',
      pricePerDay: '15.50',
      city: 'Berlin',
      images: {
        createMany: {
          data: [
            { url: 'https://example.test/second.webp', storageKey: 'test/second.webp', order: 1 },
            { url: 'https://example.test/cover.webp', storageKey: 'test/cover.webp', order: 0 },
          ],
        },
      },
    },
    include: { owner: true, category: true, images: { orderBy: { order: 'asc' } } },
  });
}

after(async () => {
  try {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await prisma.item.deleteMany({ where: { ownerId: { in: ownerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ownerIds } } });
  } finally {
    await prisma.$disconnect();
  }
});

test('item stores UUID relations, exact EUR price, timestamps and ordered image URLs', async () => {
  const item = await createItemFixture();
  assert.match(item.id, /^[0-9a-f-]{36}$/i);
  assert.equal(item.ownerId, item.owner.id);
  assert.equal(item.categoryId, item.category.id);
  assert.equal(item.pricePerDay.toFixed(2), '15.50');
  assert.equal(item.isPublished, false);
  assert.ok(item.createdAt instanceof Date);
  assert.ok(item.updatedAt instanceof Date);
  assert.deepEqual(
    item.images.map((image) => image.order),
    [0, 1],
  );
  assert.equal(item.images[0].url, 'https://example.test/cover.webp');
  assert.equal(item.images[0].storageKey, 'test/cover.webp');
});

test('unpublishing preserves item and images', async () => {
  const item = await createItemFixture();
  await prisma.item.update({ where: { id: item.id }, data: { isPublished: true } });
  const hidden = await prisma.item.update({
    where: { id: item.id },
    data: { isPublished: false },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  assert.equal(hidden.isPublished, false);
  assert.equal(hidden.createdAt.getTime(), item.createdAt.getTime());
  assert.deepEqual(
    hidden.images.map((image) => image.id),
    item.images.map((image) => image.id),
  );
  assert.ok(hidden.updatedAt.getTime() >= item.updatedAt.getTime());
});

test('database rejects zero and negative daily prices', async () => {
  const item = await createItemFixture();
  for (const pricePerDay of ['0.00', '-0.01']) {
    await assert.rejects(prisma.item.update({ where: { id: item.id }, data: { pricePerDay } }));
  }
  const saved = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
  assert.equal(saved.pricePerDay.toFixed(2), '15.50');
});

test('database rejects duplicate and negative image positions', async () => {
  const item = await createItemFixture();
  await assert.rejects(
    prisma.itemImage.create({
      data: { itemId: item.id, url: 'https://example.test/duplicate.webp', order: 0 },
    }),
    { code: 'P2002' },
  );
  await assert.rejects(
    prisma.itemImage.create({
      data: { itemId: item.id, url: 'https://example.test/negative.webp', order: -1 },
    }),
  );
  assert.equal(await prisma.itemImage.count({ where: { itemId: item.id } }), 2);
});

test('item cannot reference a missing owner or category', async () => {
  const item = await createItemFixture();
  const data = {
    ownerId: item.ownerId,
    categoryId: item.categoryId,
    title: 'Test Beamer',
    description: 'Ein Beamer für einen Test.',
    pricePerDay: '0.29',
    city: 'Berlin',
  };
  await assert.rejects(prisma.item.create({ data: { ...data, ownerId: randomUUID() } }), {
    code: 'P2003',
  });
  await assert.rejects(prisma.item.create({ data: { ...data, categoryId: randomUUID() } }), {
    code: 'P2003',
  });
});

test('referenced owner and category are protected; deleting an item removes only its image rows', async () => {
  const item = await createItemFixture();
  await assert.rejects(prisma.user.delete({ where: { id: item.ownerId } }), { code: 'P2003' });
  await assert.rejects(prisma.category.delete({ where: { id: item.categoryId } }), {
    code: 'P2003',
  });
  await prisma.item.delete({ where: { id: item.id } });
  assert.equal(await prisma.itemImage.count({ where: { itemId: item.id } }), 0);
  assert.ok(await prisma.user.findUnique({ where: { id: item.ownerId } }));
  assert.ok(await prisma.category.findUnique({ where: { id: item.categoryId } }));
});

test('HTTP create and my items use the authenticated owner and safe DTOs', async () => {
  const own = await createItemFixture();
  const foreign = await createItemFixture();
  const response = await fetch(`${base}/api/items`, {
    method: 'POST',
    headers: headersFor(own),
    body: JSON.stringify({
      title: '  Neuer Beamer  ',
      description: 'Ein Beamer für einen Filmabend.',
      city: 'Berlin',
      categoryId: own.categoryId,
      pricePerDay: '0.29',
    }),
  });
  assert.equal(response.status, 201);
  const { item } = await response.json();
  assert.equal(item.title, 'Neuer Beamer');
  assert.equal(item.pricePerDay, '0.29');
  assert.equal(item.owner.id, own.ownerId);
  assert.equal(item.isPublished, false);
  assert.deepEqual(item.images, []);
  assert.deepEqual(Object.keys(item.owner).sort(), ['city', 'id', 'name']);
  assert.equal(typeof item.createdAt, 'string');

  const listResponse = await fetch(`${base}/api/my/items`, { headers: headersFor(own) });
  assert.equal(listResponse.status, 200);
  const { items } = await listResponse.json();
  assert.equal(items.length, 2);
  assert.ok(items.every((entry: { owner: { id: string } }) => entry.owner.id === own.ownerId));
  assert.ok(!items.some((entry: { id: string }) => entry.id === foreign.id));
  const withImages = items.find((entry: { id: string }) => entry.id === own.id);
  assert.deepEqual(Object.keys(withImages.images[0]).sort(), ['id', 'order', 'url']);
  assert.deepEqual(
    withImages.images.map((image: { order: number }) => image.order),
    [0, 1],
  );
});

test('public catalog only exposes published items and filters with pagination', async () => {
  const published = await createItemFixture();
  const draft = await createItemFixture();
  await prisma.item.update({ where: { id: published.id }, data: { isPublished: true } });

  const list = await fetch(
    `${base}/api/items?q=HDMI&city=berlin&categoryId=${published.categoryId}&minPrice=15.00&maxPrice=16.00&page=1&limit=1`,
  );
  assert.equal(list.status, 200);
  const response = await list.json();
  assert.deepEqual(response.pagination, { page: 1, limit: 1, total: 1, totalPages: 1 });
  assert.equal(response.items.length, 1);
  assert.equal(response.items[0].id, published.id);
  assert.equal(response.items[0].pricePerDay, '15.50');
  assert.deepEqual(Object.keys(response.items[0].owner).sort(), ['city', 'id', 'name']);
  assert.equal('createdAt' in response.items[0], false);
  assert.equal(
    response.items.some((item: { id: string }) => item.id === draft.id),
    false,
  );

  const empty = await fetch(`${base}/api/items?q=nicht-vorhanden`);
  assert.equal(empty.status, 200);
  assert.deepEqual((await empty.json()).pagination, {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const invalid = await fetch(`${base}/api/items?minPrice=20.00&maxPrice=10.00`);
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'VALIDATION_ERROR');
});

test('public item detail is available without auth only after publication', async () => {
  const published = await createItemFixture();
  const draft = await createItemFixture();
  await prisma.item.update({ where: { id: published.id }, data: { isPublished: true } });

  const detail = await fetch(`${base}/api/items/${published.id}`);
  assert.equal(detail.status, 200);
  const { item } = await detail.json();
  assert.equal(item.id, published.id);
  assert.equal(item.images[0].order, 0);
  assert.equal('email' in item.owner, false);

  for (const id of [draft.id, randomUUID()]) {
    const missing = await fetch(`${base}/api/items/${id}`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'ITEM_NOT_FOUND');
  }
});

test('HTTP validation and missing categories do not create items', async () => {
  const own = await createItemFixture();
  const body = {
    title: 'Test Beamer',
    description: 'Ein Beamer mit Kabel.',
    city: 'Berlin',
    categoryId: own.categoryId,
    pricePerDay: '15.50',
  };
  const beforeCount = await prisma.item.count({ where: { ownerId: own.ownerId } });
  for (const invalid of [
    { ...body, ownerId: own.ownerId },
    { ...body, pricePerDay: '0.00' },
    { ...body, categoryId: 'mock-category' },
  ]) {
    const response = await fetch(`${base}/api/items`, {
      method: 'POST',
      headers: headersFor(own),
      body: JSON.stringify(invalid),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
  }
  const missing = await fetch(`${base}/api/items`, {
    method: 'POST',
    headers: headersFor(own),
    body: JSON.stringify({ ...body, categoryId: randomUUID() }),
  });
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).error.code, 'CATEGORY_NOT_FOUND');
  assert.equal(await prisma.item.count({ where: { ownerId: own.ownerId } }), beforeCount);

  const emptyPatch = await fetch(`${base}/api/items/${own.id}`, {
    method: 'PATCH',
    headers: headersFor(own),
    body: '{}',
  });
  assert.equal(emptyPatch.status, 400);
  for (const method of ['PATCH', 'DELETE']) {
    const absent = await fetch(`${base}/api/items/${randomUUID()}`, {
      method,
      headers: headersFor(own),
      ...(method === 'PATCH' ? { body: JSON.stringify({ title: 'Neuer Titel' }) } : {}),
    });
    assert.equal(absent.status, 404);
    assert.equal((await absent.json()).error.code, 'ITEM_NOT_FOUND');
  }
});

test('HTTP patch and delete reject another owner without changing item or photos', async () => {
  const own = await createItemFixture();
  const other = await createItemFixture();
  for (const method of ['PATCH', 'DELETE']) {
    const response = await fetch(`${base}/api/items/${own.id}`, {
      method,
      headers: headersFor(other),
      ...(method === 'PATCH' ? { body: JSON.stringify({ title: 'Fremde Änderung' }) } : {}),
    });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, 'FORBIDDEN');
  }
  const unchanged = await prisma.item.findUniqueOrThrow({
    where: { id: own.id },
    include: { images: true },
  });
  assert.equal(unchanged.title, own.title);
  assert.equal(unchanged.images.length, 2);
});

test('HTTP owner can edit and publish with photos; DELETE safely unpublishes', async () => {
  const own = await createItemFixture();
  const response = await fetch(`${base}/api/items/${own.id}`, {
    method: 'PATCH',
    headers: headersFor(own),
    body: JSON.stringify({
      title: 'Aktualisierter Beamer',
      pricePerDay: '20.00',
      isPublished: true,
    }),
  });
  assert.equal(response.status, 200);
  const updated = (await response.json()).item;
  assert.equal(updated.title, 'Aktualisierter Beamer');
  assert.equal(updated.pricePerDay, '20.00');
  assert.equal(updated.isPublished, true);
  assert.equal(updated.createdAt, own.createdAt.toISOString());
  for (let attempt = 0; attempt < 2; attempt++) {
    const hidden = await fetch(`${base}/api/items/${own.id}`, {
      method: 'DELETE',
      headers: headersFor(own),
    });
    assert.equal(hidden.status, 200);
    const item = (await hidden.json()).item;
    assert.equal(item.isPublished, false);
    assert.equal(item.images.length, 2);
  }
  assert.ok(await prisma.item.findUnique({ where: { id: own.id } }));
});

test('HTTP publishing a draft without images fails and leaves it unpublished', async () => {
  const own = await createItemFixture();
  const created = await fetch(`${base}/api/items`, {
    method: 'POST',
    headers: headersFor(own),
    body: JSON.stringify({
      title: 'Beamer ohne Foto',
      description: 'Dieser Beamer hat noch kein Foto.',
      city: 'Berlin',
      categoryId: own.categoryId,
      pricePerDay: '15.50',
    }),
  });
  assert.equal(created.status, 201);
  const { item } = await created.json();
  const response = await fetch(`${base}/api/items/${item.id}`, {
    method: 'PATCH',
    headers: headersFor(own),
    body: JSON.stringify({ isPublished: true }),
  });
  assert.equal(response.status, 409);
  const { error } = await response.json();
  assert.equal(error.code, 'ITEM_IMAGES_REQUIRED');
  assert.ok(error.fields.images.length > 0);
  assert.equal(
    (await prisma.item.findUniqueOrThrow({ where: { id: item.id } })).isPublished,
    false,
  );
});

test('HTTP photo order can be reversed repeatedly without unique position conflicts', async () => {
  const own = await createItemFixture();
  const original = own.images.map((image) => image.id);
  for (const imageIds of [[...original].reverse(), original]) {
    const response = await fetch(`${base}/api/items/${own.id}/images/order`, {
      method: 'PUT',
      headers: headersFor(own),
      body: JSON.stringify({ imageIds }),
    });
    assert.equal(response.status, 204);
    const images = await prisma.itemImage.findMany({
      where: { itemId: own.id },
      orderBy: { order: 'asc' },
    });
    assert.deepEqual(
      images.map((image) => image.id),
      imageIds,
    );
    assert.deepEqual(
      images.map((image) => image.order),
      [0, 1],
    );
    for (const image of images) {
      assert.equal(image.url, own.images.find((entry) => entry.id === image.id)!.url);
    }
  }
});

test('HTTP photo order rejects missing, duplicate and foreign IDs without changes', async () => {
  const own = await createItemFixture();
  const other = await createItemFixture();
  const original = own.images.map((image) => image.id);
  for (const imageIds of [[], [original[0], original[0]], [original[0], other.images[0].id]]) {
    const response = await fetch(`${base}/api/items/${own.id}/images/order`, {
      method: 'PUT',
      headers: headersFor(own),
      body: JSON.stringify({ imageIds }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_IMAGE_ORDER');
  }
  const forbidden = await fetch(`${base}/api/items/${own.id}/images/order`, {
    method: 'PUT',
    headers: headersFor(other),
    body: JSON.stringify({ imageIds: [...original].reverse() }),
  });
  assert.equal(forbidden.status, 403);
  const images = await prisma.itemImage.findMany({
    where: { itemId: own.id },
    orderBy: { order: 'asc' },
  });
  assert.deepEqual(
    images.map((image) => image.id),
    original,
  );
});

test('demo item seed creates a draft and repeated seed preserves edits', async () => {
  const own = await createItemFixture();
  const id = randomUUID();
  assert.equal(await seedDemoItem(prisma, own.owner.clerkUserId, id), 'ready');
  const first = await prisma.item.findUniqueOrThrow({ where: { id }, include: { images: true } });
  assert.equal(first.ownerId, own.ownerId);
  assert.equal(first.categoryId, own.categoryId);
  assert.equal(first.pricePerDay.toFixed(2), '15.50');
  assert.equal(first.isPublished, false);
  assert.deepEqual(first.images, []);

  await prisma.item.update({
    where: { id },
    data: { title: 'Mein bearbeiteter Beamer', pricePerDay: '18.00' },
  });
  assert.equal(await seedDemoItem(prisma, own.owner.clerkUserId, id), 'ready');
  const again = await prisma.item.findUniqueOrThrow({ where: { id } });
  assert.equal(again.title, 'Mein bearbeiteter Beamer');
  assert.equal(again.pricePerDay.toFixed(2), '18.00');
  assert.equal(again.createdAt.getTime(), first.createdAt.getTime());
  assert.equal(await prisma.item.count({ where: { id } }), 1);
});

test('demo item seed needs an explicit owner and never transfers another owner item', async () => {
  const own = await createItemFixture();
  const other = await createItemFixture();
  const id = randomUUID();
  assert.equal(await seedDemoItem(prisma, undefined, id), 'skipped');
  assert.equal(await prisma.item.count({ where: { id } }), 0);
  await seedDemoItem(prisma, own.owner.clerkUserId, id);
  assert.equal(await seedDemoItem(prisma, other.owner.clerkUserId, id), 'kept-other-owner');
  assert.equal((await prisma.item.findUniqueOrThrow({ where: { id } })).ownerId, own.ownerId);
});
