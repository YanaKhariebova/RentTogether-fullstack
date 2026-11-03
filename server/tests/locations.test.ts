import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createLocationService } from '../src/modules/locations/service.js';
import { createLocationRoutes } from '../src/modules/locations/routes.js';
import { errorHandler } from '../src/lib/errors.js';

const berlin = {
  name: 'Berlin',
  postalCode: '10115',
  municipality: { key: '11000000' },
  federalState: { key: '11', name: 'Berlin' },
};

test('location search supports German postal codes, duplicate postcodes and concurrent query caching', async () => {
  let calls = 0;
  const service = createLocationService(async (input) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.hostname, 'openplzapi.org');
    assert.equal(url.pathname, '/de/Localities');
    assert.equal(url.searchParams.get('postalCode'), '^10115$');
    return Response.json([berlin, { ...berlin, postalCode: '10117' }]);
  });
  const [first, second] = await Promise.all([service.search('10115'), service.search('10115')]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.equal(first.length, 1);
  assert.equal(first[0].name, 'Berlin');
  await service.search('10115');
  assert.equal(calls, 1);
});

test('city normalization corrects case and accents but rejects typos and raw postal codes', async () => {
  const service = createLocationService(async (input) => {
    const q = new URL(String(input)).searchParams.get('name');
    return Response.json(
      q === '^berln$' ? [] : q === null ? [berlin] : [{ ...berlin, name: 'Köln' }],
    );
  });
  assert.equal(await service.normalize('koln'), 'Köln');
  for (const city of ['Berln', '10115']) {
    await assert.rejects(service.normalize(city), { status: 422, code: 'CITY_NOT_FOUND' });
  }
});

test('provider failures and malformed payloads are retryable errors, not an empty result', async () => {
  for (const fail of [() => new Response('', { status: 503 }), () => Response.json([{}])]) {
    let calls = 0;
    const service = createLocationService(async () => {
      calls++;
      return calls === 1 ? fail() : Response.json([berlin]);
    });
    await assert.rejects(service.search('Berlin'), {
      status: 503,
      code: 'LOCATION_SERVICE_UNAVAILABLE',
    });
    assert.equal((await service.search('Berlin')).length, 1);
  }
});

test('search endpoint validates input and limits repeated requests', async () => {
  const app = express();
  let calls = 0;
  app.use(
    '/locations',
    createLocationRoutes({
      search: async () => {
        calls++;
        return [];
      },
      normalize: async (city) => city,
    }),
  );
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  try {
    for (const query of ['', '?q=A', '?q=' + 'A'.repeat(101), '?q=Berlin&extra=1'])
      assert.equal((await fetch(base + '/locations' + query)).status, 400);
    assert.equal(calls, 0);
    for (let count = 0; count < 60; count++)
      assert.equal((await fetch(base + '/locations?q=Berlin')).status, 200);
    assert.equal((await fetch(base + '/locations?q=Berlin')).status, 429);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
