import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createItemSchema,
  itemParamsSchema,
  updateItemSchema,
  reorderImagesSchema,
} from '../src/modules/items/schemas.js';

const valid = {
  title: '  Beamer für einen Filmabend  ',
  description: 'Ein Beamer mit HDMI-Anschluss.',
  city: 'Berlin',
  categoryId: '10000000-0000-4000-8000-000000000001',
  pricePerDay: '15.50',
};

test('item body trims text and accepts the agreed price string', () => {
  assert.equal(createItemSchema.parse(valid).title, 'Beamer für einen Filmabend');
  assert.equal(createItemSchema.parse({ ...valid, pricePerDay: '0.01' }).pricePerDay, '0.01');
});

test('item creation rejects identity, images and publication fields supplied by a client', () => {
  for (const extra of [
    { ownerId: valid.categoryId },
    { id: valid.categoryId },
    { isPublished: true },
    { images: [] },
  ]) {
    assert.equal(createItemSchema.safeParse({ ...valid, ...extra }).success, false);
  }
});

test('item price must be positive, bounded and use two decimal places in API', () => {
  for (const pricePerDay of [0, 15.5, '0.00', '-1.00', '15,50', '15.5', '15.500', '1000000.00']) {
    assert.equal(createItemSchema.safeParse({ ...valid, pricePerDay }).success, false);
  }
});

test('item patch needs an allowed change; real API IDs must be UUIDs', () => {
  assert.equal(updateItemSchema.safeParse({}).success, false);
  assert.equal(updateItemSchema.safeParse({ ownerId: valid.categoryId }).success, false);
  assert.equal(updateItemSchema.safeParse({ isPublished: false }).success, true);
  assert.equal(
    createItemSchema.safeParse({ ...valid, categoryId: 'mock-electronics' }).success,
    false,
  );
  assert.equal(itemParamsSchema.safeParse({ id: 'mock-projector' }).success, false);
});

test('photo order accepts only a complete nonempty list of unique UUIDs', () => {
  const id = valid.categoryId;
  assert.deepEqual(reorderImagesSchema.parse({ imageIds: [id] }), { imageIds: [id] });
  for (const imageIds of [[], [id, id], ['mock-photo'], Array(9).fill(id)]) {
    assert.equal(reorderImagesSchema.safeParse({ imageIds }).success, false);
  }
});

test('photo order rejects extra fields and wrong payload types', () => {
  for (const body of [
    {},
    { imageIds: null },
    { imageIds: 'photo' },
    { imageIds: [valid.categoryId], ownerId: valid.categoryId },
  ]) {
    assert.equal(reorderImagesSchema.safeParse(body).success, false);
  }
});
