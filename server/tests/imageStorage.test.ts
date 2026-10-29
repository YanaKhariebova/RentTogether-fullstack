import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import sharp from 'sharp';
import {
  createLocalImageStorage,
  defaultUploadsDirectory,
} from '../src/modules/items/storage/localImageStorage.js';
import { MAX_IMAGE_BYTES, validateImage } from '../src/modules/items/imageValidation.js';

const makeImage = (format: 'jpeg' | 'png' | 'webp') =>
  sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: '#16715b',
    },
  })
    .toFormat(format)
    .toBuffer();

test('local adapter stores bytes, provides configured URL and deletes idempotently', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'renttogether-storage-'));
  try {
    const storage = createLocalImageStorage({
      directory,
      publicBaseUrl: 'https://images.example.test/uploads',
    });
    const content = await makeImage('png');
    const first = await storage.upload({ content, contentType: 'image/png' });
    const second = await storage.upload({ content, contentType: 'image/png' });
    assert.notEqual(first.key, second.key);
    assert.deepEqual(await readFile(path.join(directory, first.key)), content);
    assert.equal(
      storage.getPublicUrl(first.key),
      `https://images.example.test/uploads/${first.key}`,
    );
    await storage.delete(first.key);
    await storage.delete(first.key);
    assert.deepEqual(await readdir(directory), [second.key]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('local adapter rejects path traversal, arbitrary keys and unsafe base URLs', async () => {
  const storage = createLocalImageStorage({ publicBaseUrl: 'http://localhost:3000/uploads/' });
  for (const key of [
    '../.env',
    '/tmp/file.png',
    '..\\secret.png',
    'photo.svg',
    'https://example.test/a.jpg',
  ]) {
    assert.throws(() => storage.getPublicUrl(key));
    await assert.rejects(storage.delete(key));
  }
  for (const publicBaseUrl of [
    'file:///uploads/',
    'javascript:alert(1)',
    'https://user:secret@example.test/',
  ]) {
    assert.throws(() => createLocalImageStorage({ publicBaseUrl }));
  }
  assert.ok(defaultUploadsDirectory.endsWith(path.join('server', 'uploads', path.sep)));
});

test('server decodes each supported format and keeps matching MIME', async () => {
  for (const format of ['jpeg', 'png', 'webp'] as const) {
    const validated = await validateImage(await makeImage(format), `image/${format}`);
    assert.equal(validated.contentType, `image/${format}`);
    assert.equal((await sharp(validated.content).metadata()).format, format);
  }
});

test('server rejects spoofed MIME, SVG, corrupt data and empty files', async () => {
  const png = await makeImage('png');
  for (const [body, type] of [
    [png, 'image/jpeg'],
    [Buffer.from('<svg></svg>'), 'image/png'],
    [Buffer.from('not an image'), 'image/webp'],
    [png.subarray(0, 16), 'image/png'],
    [Buffer.alloc(0), 'image/png'],
    [png, 'image/svg+xml'],
    [png, undefined],
  ] as const) {
    await assert.rejects(validateImage(body, type), { status: 400, code: 'INVALID_IMAGE' });
  }
});

test('server rejects oversized files and excessive pixel dimensions', async () => {
  await assert.rejects(validateImage(Buffer.alloc(MAX_IMAGE_BYTES + 1), 'image/png'), {
    status: 413,
    code: 'IMAGE_TOO_LARGE',
  });
  const large = await sharp({
    create: { width: 5001, height: 5000, channels: 3, background: 'white' },
  })
    .png()
    .toBuffer();
  await assert.rejects(validateImage(large, 'image/png'), { status: 400, code: 'INVALID_IMAGE' });
});

test('normalization strips EXIF rather than publishing original metadata', async () => {
  const source = await sharp(await makeImage('jpeg'))
    .withExif({ IFD0: { Copyright: 'Private test metadata' } })
    .toBuffer();
  assert.ok((await sharp(source).metadata()).exif);
  const clean = await validateImage(source, 'image/jpeg');
  assert.equal((await sharp(clean.content).metadata()).exif, undefined);
});
