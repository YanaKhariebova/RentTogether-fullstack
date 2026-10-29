import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moveImage, validateImageSelection } from './imageSelection.ts';
import { toCreateItemInput, toItemFormValues } from './itemFormAdapters.ts';
import { itemFormSchema } from './itemFormSchema.ts';

test('новые фото не превышают общий лимит вместе с сохранёнными', () => {
  const files = [
    new File(['a'], 'a.png', { type: 'image/png' }),
    new File(['b'], 'b.png', { type: 'image/png' }),
  ];
  const result = validateImageSelection(files, 7);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.errors.length, 1);
});

test('неподходящий файл не мешает добавить подходящий', () => {
  const files = [
    new File(['a'], 'bad.txt', { type: 'text/plain' }),
    new File(['b'], 'good.png', { type: 'image/png' }),
  ];
  const result = validateImageSelection(files, 0);
  assert.equal(result.accepted[0].name, 'good.png');
  assert.equal(result.errors.length, 1);
});

test('перестановка сохраняет все фото и не изменяет исходный массив', () => {
  const images = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(
    moveImage(images, 'b', -1).map((image) => image.id),
    ['b', 'a', 'c'],
  );
  assert.deepEqual(
    moveImage(images, 'b', 1).map((image) => image.id),
    ['a', 'c', 'b'],
  );
  assert.deepEqual(
    images.map((image) => image.id),
    ['a', 'b', 'c'],
  );
  assert.equal(moveImage(images, 'a', -1), images);
  assert.equal(moveImage(images, 'c', 1), images);
  assert.equal(moveImage(images, 'missing', 1), images);
});

test('форма отправляет цену строкой EUR и не отправляет owner или локальные файлы в JSON', () => {
  for (const [input, expected] of [
    ['0,01', '0.01'],
    ['15,50', '15.50'],
    ['15', '15.00'],
  ]) {
    const form = itemFormSchema.parse({
      title: 'Test Beamer',
      description: 'Ein Beamer für einen Filmabend.',
      city: 'Berlin',
      categoryId: 'category-1',
      pricePerDay: input,
      images: [{ kind: 'stored', id: 'photo', url: '/photo.png' }],
    });
    const payload = toCreateItemInput(form);
    assert.equal(payload.pricePerDay, expected);
    assert.deepEqual(Object.keys(payload).sort(), [
      'categoryId',
      'city',
      'description',
      'pricePerDay',
      'title',
    ]);
  }
});

test('редактирование восстанавливает порядок фото и цену для немецкой формы', () => {
  const item = {
    title: 'Beamer',
    description: 'Ein Beamer mit Kabel.',
    city: 'Berlin',
    category: { id: 'category-1', name: 'Elektronik' },
    pricePerDay: '15.50',
    images: [
      { id: 'b', url: '/b.png', order: 1 },
      { id: 'a', url: '/a.png', order: 0 },
    ],
  };
  const form = toItemFormValues(item);
  assert.equal(form.pricePerDay, '15,50');
  assert.deepEqual(
    form.images.map((image) => image.id),
    ['a', 'b'],
  );
  assert.equal(item.images[0].id, 'b');
});
