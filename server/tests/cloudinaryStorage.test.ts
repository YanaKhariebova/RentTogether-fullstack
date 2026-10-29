import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createCloudinaryImageStorage } from '../src/modules/items/storage/cloudinaryImageStorage.js';
import type { CloudinaryGateway } from '../src/modules/items/storage/cloudinaryImageStorage.js';
import { configureImageStorage } from '../src/modules/items/storage/configureImageStorage.js';
import { ImageUploadError } from '../src/modules/items/storage/ImageUploadError.js';

const credentials = {
  cloudName: 'test-cloud',
  apiKey: 'test-key',
  apiSecret: 'private-test-secret',
};
const image = { content: Buffer.from('normalized image'), contentType: 'image/png' as const };
function provider() {
  const objects = new Map<string, Buffer>();
  const calls: { method: string; id: string; options: Record<string, unknown> }[] = [];
  const gateway: CloudinaryGateway = {
    async upload(content, options) {
      const id = String(options.public_id);
      calls.push({ method: 'upload', id, options });
      objects.set(id, content);
      return { public_id: id, version: 1234, format: String(options.format) };
    },
    async destroy(id, options) {
      calls.push({ method: 'delete', id, options });
      const exists = objects.delete(id);
      return { result: exists ? 'ok' : 'not found' };
    },
  };
  return { objects, calls, gateway };
}

test('Cloudinary uploads bytes with unique IDs and creates stable public HTTPS URLs without credentials', async () => {
  const mock = provider();
  const storage = createCloudinaryImageStorage(credentials, mock.gateway);
  const first = await storage.upload(image);
  const second = await storage.upload(image);
  assert.notEqual(first.key, second.key);
  assert.match(first.key, /^cloudinary:test-cloud:1234:png:renttogether\/items\/[0-9a-f-]{36}$/);
  const publicId = mock.calls[0].id;
  assert.equal(
    storage.getPublicUrl(first.key),
    `https://res.cloudinary.com/test-cloud/image/upload/v1234/${publicId}.png`,
  );
  assert.deepEqual(mock.objects.get(publicId), image.content);
  assert.equal(mock.calls[0].options.overwrite, false);
  assert.equal(mock.calls[0].options.resource_type, 'image');
  assert.equal(mock.calls[0].options.api_secret, credentials.apiSecret);
  assert.ok(!storage.getPublicUrl(first.key).includes(credentials.apiSecret));
  assert.ok(!storage.getPublicUrl(first.key).includes(credentials.apiKey));
});

test('Cloudinary delete uses public ID without extension, invalidates CDN and treats missing assets as success', async () => {
  const mock = provider();
  const storage = createCloudinaryImageStorage(credentials, mock.gateway);
  const { key } = await storage.upload(image);
  await storage.delete(key);
  await storage.delete(key);
  assert.equal(mock.objects.size, 0);
  const deletion = mock.calls.find((call) => call.method === 'delete')!;
  assert.equal(deletion.id, mock.calls[0].id);
  assert.equal(deletion.options.invalidate, true);
  assert.equal(deletion.options.resource_type, 'image');
});

test('Cloudinary rejects keys from other clouds and malformed paths before accessing provider', async () => {
  const mock = provider();
  const storage = createCloudinaryImageStorage(credentials, mock.gateway);
  for (const key of [
    `cloudinary:other-cloud:1:png:renttogether/items/${randomUUID()}`,
    `cloudinary:test-cloud:1:png:../${randomUUID()}`,
    `cloudinary:test-cloud:1:svg:renttogether/items/${randomUUID()}`,
    `cloudinary:test-cloud:99999999999999999:png:renttogether/items/${randomUUID()}`,
    '../.env',
    'cloudinary:test-cloud:1:png:sample',
  ]) {
    assert.throws(() => storage.getPublicUrl(key));
    await assert.rejects(storage.delete(key));
  }
  assert.equal(mock.calls.length, 0);
});

test('ambiguous upload failure returns a known cleanup key and hides provider details from API message', async () => {
  const mock = provider();
  mock.gateway.upload = async () => {
    throw new Error(credentials.apiSecret);
  };
  const storage = createCloudinaryImageStorage(credentials, mock.gateway);
  await assert.rejects(storage.upload(image), (error: unknown) => {
    assert.ok(error instanceof ImageUploadError);
    assert.equal(error.status, 503);
    assert.equal(error.code, 'IMAGE_STORAGE_UNAVAILABLE');
    assert.match(error.cleanupKey, /^cloudinary:test-cloud:1:png:/);
    assert.ok(!error.message.includes(credentials.apiSecret));
    return true;
  });
});

test('Cloudinary invalid upload response also supplies the requested cleanup key', async () => {
  const mock = provider();
  mock.gateway.upload = async () => ({ public_id: 'unexpected', version: 0, format: 'svg' });
  await assert.rejects(
    createCloudinaryImageStorage(credentials, mock.gateway).upload(image),
    ImageUploadError,
  );
});

test('unconfirmed Cloudinary deletion fails so the durable cleanup job can be retried', async () => {
  const mock = provider();
  const storage = createCloudinaryImageStorage(credentials, mock.gateway);
  const { key } = await storage.upload(image);
  mock.gateway.destroy = async () => ({ result: 'error' });
  await assert.rejects(storage.delete(key), { status: 503, code: 'IMAGE_STORAGE_UNAVAILABLE' });
});

test('Cloudinary credentials and folder configuration are validated without network calls', () => {
  for (const config of [
    { ...credentials, cloudName: '' },
    { ...credentials, apiSecret: '' },
    { ...credentials, folder: '../other' },
    { ...credentials, folder: '/folder' },
  ])
    assert.throws(() => createCloudinaryImageStorage(config));
  assert.throws(() => configureImageStorage({ IMAGE_STORAGE: 'cloudinary' }));
  assert.throws(() => configureImageStorage({ IMAGE_STORAGE: 'unknown' }));
  assert.throws(() => configureImageStorage({ NODE_ENV: 'production', IMAGE_STORAGE: 'local' }));
});

test('switching uploads to Cloudinary preserves access and deletion of legacy local images', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'renttogether-storage-switch-'));
  try {
    const options = { localDirectory: directory, cloudinaryGateway: provider().gateway };
    const localEnv = {
      IMAGE_STORAGE: 'local',
      IMAGE_PUBLIC_BASE_URL: 'http://localhost:3000/uploads/',
    };
    const local = configureImageStorage(localEnv, options).imageStorage;
    const legacy = await local.upload(image);
    const cloud = configureImageStorage(
      {
        ...localEnv,
        NODE_ENV: 'production',
        IMAGE_STORAGE: 'cloudinary',
        CLOUDINARY_CLOUD_NAME: credentials.cloudName,
        CLOUDINARY_API_KEY: credentials.apiKey,
        CLOUDINARY_API_SECRET: credentials.apiSecret,
      },
      options,
    ).imageStorage;
    assert.equal(cloud.getPublicUrl(legacy.key), local.getPublicUrl(legacy.key));
    const uploaded = await cloud.upload(image);
    assert.ok(cloud.getPublicUrl(uploaded.key).startsWith('https://res.cloudinary.com/'));
    await cloud.delete(legacy.key);
    await cloud.delete(uploaded.key);
    assert.deepEqual(await readdir(directory), []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
