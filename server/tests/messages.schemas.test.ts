import assert from 'node:assert/strict';
import { test } from 'node:test';
import { markReadSchema, messageBodySchema } from '../src/modules/messages/schemas.js';

const messageId = '10000000-0000-4000-8000-000000000001';

test('message body is trimmed and accepts between one and 2000 characters', () => {
  assert.deepEqual(messageBodySchema.parse({ body: '  Hallo!  ' }), { body: 'Hallo!' });
  for (const body of ['', '   ', 'x'.repeat(2001), { text: 'Hallo' }]) {
    assert.equal(messageBodySchema.safeParse({ body }).success, false);
  }
});

test('read marker accepts only a message ID and no extra fields', () => {
  assert.deepEqual(markReadSchema.parse({ lastReadMessageId: messageId }), {
    lastReadMessageId: messageId,
  });
  assert.equal(markReadSchema.safeParse({ lastReadMessageId: 'not-a-uuid' }).success, false);
  assert.equal(
    markReadSchema.safeParse({ lastReadMessageId: messageId, userId: messageId }).success,
    false,
  );
});
