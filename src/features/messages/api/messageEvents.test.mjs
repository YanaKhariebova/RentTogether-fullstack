import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readMessageEvents, reconnectDelay } from './messageEvents.ts';

test('SSE parser preserves split UTF-8 messages, CRLF frames, order and heartbeat handling', async () => {
  const event = {
    type: 'message.created',
    conversationId: 'conversation',
    incoming: true,
    message: {
      id: 'message',
      senderId: 'sender',
      body: 'Grüße 👋',
      createdAt: '2026-11-20T12:00:00Z',
      readAt: null,
      editedAt: null,
      replyTo: null,
    },
  };
  const changed = { type: 'conversation.changed', conversationId: 'conversation' };
  const bytes = new TextEncoder().encode(
    `event: ready\r\ndata: {}\r\n\r\n: heartbeat\r\n\r\ndata: ${JSON.stringify(event)}\r\n\r\ndata: ${JSON.stringify(changed)}\r\n\r\n`,
  );
  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 5) controller.enqueue(bytes.slice(i, i + 5));
      controller.close();
    },
  });
  const received = [];
  await readMessageEvents(
    stream,
    new AbortController().signal,
    async () => {
      received.push('ready');
    },
    async (value) => {
      received.push(value);
    },
  );
  assert.deepEqual(received, ['ready', event, changed]);
  assert.equal(stream.locked, false);
});

test('malformed server events close the reader instead of being applied to a chat', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('data: {"type":"message.created"}\n\n'));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readMessageEvents(
      stream,
      new AbortController().signal,
      async () => {},
      async () => assert.fail('Invalid message was applied'),
    ),
  );
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});

test('sign-out aborts a pending reconnect immediately', async () => {
  const controller = new AbortController();
  const pending = reconnectDelay(controller.signal, 60_000);
  controller.abort();
  await pending;
});
