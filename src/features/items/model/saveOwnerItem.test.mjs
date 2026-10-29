import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOwnerItemSaveSession } from './saveOwnerItem.ts';

const local = (id) => ({
  kind: 'local',
  id,
  file: new File(['image'], `${id}.png`, { type: 'image/png' }),
});
const form = (images) => ({
  title: 'Test Beamer',
  description: 'Ein Beamer mit Zubehör.',
  city: 'Berlin',
  categoryId: 'category-uuid',
  pricePerDay: 1550,
  images,
});
const original = (images = [], isPublished = false) => ({
  id: 'item-uuid',
  title: 'Old title',
  description: 'Original description.',
  city: 'Berlin',
  pricePerDay: '10.00',
  category: { id: 'category-uuid', name: 'Elektronik' },
  owner: { id: 'owner-uuid', name: 'Olga', city: 'Berlin' },
  createdAt: '2026-10-29',
  updatedAt: '2026-10-29',
  isPublished,
  images,
});
function backend(initial) {
  let item = initial ? structuredClone(initial) : null;
  let uploads = 0;
  let fail;
  const calls = [];
  const request = async (path, options = {}) => {
    const method = options.method ?? 'GET';
    const data = typeof options.body === 'string' ? JSON.parse(options.body) : undefined;
    calls.push({ method, path, data });
    if (fail?.(path, options)) throw new Error('Temporary failure');
    if (path === '/my/items') return { items: item ? [structuredClone(item)] : [] };
    if (path === '/items' && method === 'POST') {
      item = { ...original(), ...data };
      return { item: structuredClone(item) };
    }
    if (method === 'PATCH') {
      Object.assign(item, data);
      return { item: structuredClone(item) };
    }
    if (method === 'DELETE') {
      if (item.isPublished && item.images.length === 1) throw new Error('Last published photo');
      item.images = item.images.filter((image) => !path.endsWith(`/${image.id}`));
      return null;
    }
    if (path.endsWith('/images') && method === 'POST') {
      if (item.images.length >= 8) throw new Error('Limit reached');
      const image = {
        id: `stored-${++uploads}`,
        url: `https://cdn.test/${uploads}`,
        order: item.images.length,
      };
      item.images.push(image);
      return { image };
    }
    if (path.endsWith('/order')) {
      item.images = data.imageIds.map((id, order) => ({
        ...item.images.find((image) => image.id === id),
        order,
      }));
      return null;
    }
    throw new Error('Unexpected request');
  };
  return {
    request,
    calls,
    get item() {
      return item;
    },
    failWhen(callback) {
      fail = callback;
    },
  };
}

test('real save creates draft, uploads binary files and preserves form photo order', async () => {
  const api = backend();
  const session = createOwnerItemSaveSession(api.request);
  const result = await session.save(form([local('first'), local('second')]));
  assert.equal(result.pricePerDay, '15.50');
  assert.equal(result.isPublished, false);
  assert.deepEqual(
    result.images.map((image) => image.id),
    ['stored-1', 'stored-2'],
  );
  const body = api.calls.find((call) => call.path === '/items').data;
  assert.deepEqual(Object.keys(body).sort(), [
    'categoryId',
    'city',
    'description',
    'pricePerDay',
    'title',
  ]);
});

test('retry after partial upload keeps known draft and reuses successful photo uploads', async () => {
  const api = backend();
  let uploadRequests = 0;
  api.failWhen(
    (path, options) =>
      path.endsWith('/images') && options.method === 'POST' && ++uploadRequests === 2,
  );
  const session = createOwnerItemSaveSession(api.request);
  const values = form([local('first'), local('second')]);
  await assert.rejects(session.save(values), /Temporary failure/);
  assert.equal(session.itemId, 'item-uuid');
  assert.equal(api.item.images.length, 1);
  await session.save(values);
  assert.equal(
    api.calls.filter((call) => call.path === '/items' && call.method === 'POST').length,
    1,
  );
  assert.equal(api.item.images.length, 2);
  assert.deepEqual(
    api.item.images.map((image) => image.id),
    ['stored-1', 'stored-2'],
  );
});

test('all eight photos of a published item can be replaced without hitting server limit', async () => {
  const images = Array.from({ length: 8 }, (_, order) => ({
    id: `old-${order}`,
    url: `https://cdn.test/old-${order}`,
    order,
  }));
  const api = backend(original(images, true));
  const result = await createOwnerItemSaveSession(api.request, 'item-uuid').save(
    form(Array.from({ length: 8 }, (_, index) => local(`new-${index}`))),
  );
  assert.equal(result.isPublished, true);
  assert.equal(result.images.length, 8);
  assert.ok(result.images.every((image) => image.id.startsWith('stored-')));
  const firstWrite = api.calls.find((call) => call.method !== 'GET');
  assert.deepEqual(firstWrite.data, { isPublished: false });
});

test('failed photo replacement stays unpublished and retry restores original publication status', async () => {
  const api = backend(original([{ id: 'old', url: 'https://cdn.test/old', order: 0 }], true));
  api.failWhen((path) => path.endsWith('/order'));
  const session = createOwnerItemSaveSession(api.request, 'item-uuid');
  const values = form([local('replacement')]);
  await assert.rejects(session.save(values));
  assert.equal(api.item.isPublished, false);
  assert.equal(api.item.images.length, 1);
  api.failWhen(() => false);
  const saved = await session.save(values);
  assert.equal(saved.isPublished, true);
  assert.equal(saved.images.length, 1);
  assert.equal(
    api.calls.filter((call) => call.path.endsWith('/images') && call.method === 'POST').length,
    1,
  );
});

test('missing item or stale stored photo fails before modifying server data', async () => {
  for (const initial of [undefined, original()]) {
    const api = backend(initial);
    const session = createOwnerItemSaveSession(api.request, 'item-uuid');
    await assert.rejects(
      session.save(form([{ kind: 'stored', id: 'deleted', url: 'https://cdn.test/deleted' }])),
    );
    assert.ok(api.calls.every((call) => call.method === 'GET'));
  }
});
