import { z } from 'zod';

const message = z.object({
  id: z.string(),
  senderId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  editedAt: z.string().nullable(),
  replyTo: z.object({ id: z.string(), senderId: z.string(), body: z.string() }).nullable(),
});
const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message.created'),
    conversationId: z.string(),
    message,
    incoming: z.boolean(),
  }),
  z.object({ type: z.literal('conversation.changed'), conversationId: z.string() }),
]);
export type MessageEvent = z.infer<typeof eventSchema>;

export async function readMessageEvents(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onReady: () => Promise<void>,
  onEvent: (event: MessageEvent) => Promise<void>,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true }).replace(/\r/g, '');
      if (buffer.length > 256_000) throw new Error('Chat event buffer exceeded');
      let end: number;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (frame.split('\n').includes('event: ready')) {
          await onReady();
        } else {
          const data = frame
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n');
          if (data) await onEvent(eventSchema.parse(JSON.parse(data)));
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export function reconnectDelay(signal: AbortSignal, ms: number) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
}
