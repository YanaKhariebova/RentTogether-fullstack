import type { Response } from 'express';

type PublicMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  editedAt: string | null;
  replyTo: { id: string; senderId: string; body: string } | null;
};
export type ChatEvent =
  | { type: 'message.created'; conversationId: string; message: PublicMessage; incoming: boolean }
  | { type: 'conversation.changed'; conversationId: string };

// One hub per API instance. Horizontal scaling needs a shared pub/sub transport.
export function createMessageEvents() {
  const connections = new Set<Response>();
  const listeners = new Map<string, Set<(event: ChatEvent) => void>>();
  function publish(userId: string, event: ChatEvent) {
    for (const listener of listeners.get(userId) ?? []) listener(event);
  }
  return {
    connect(userId: string, res: Response) {
      const callbacks = listeners.get(userId) ?? new Set();
      listeners.set(userId, callbacks);
      res.status(200).set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      });
      res.flushHeaders();
      const receive = (event: ChatEvent) => {
        if (res.writableLength > 65_536) {
          res.end();
          return;
        }
        if (!res.destroyed && !res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      callbacks.add(receive);
      connections.add(res);
      res.write('event: ready\ndata: {}\n\n');
      const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15_000);
      // Reconnect with a fresh Clerk token instead of keeping an authenticated
      // stream open indefinitely after logout/session expiry.
      const expiresIn = Math.max(
        0,
        Math.min(45_000, (res.locals.authExpiresAt ?? Date.now() + 45_000) - Date.now()),
      );
      const expiry = setTimeout(() => res.end(), expiresIn);
      res.on('close', () => {
        clearInterval(heartbeat);
        clearTimeout(expiry);
        callbacks.delete(receive);
        connections.delete(res);
        if (callbacks.size === 0) listeners.delete(userId);
      });
    },
    closeAll() {
      for (const connection of connections) connection.end();
    },
    created(userIds: string[], conversationId: string, message: PublicMessage) {
      for (const userId of new Set(userIds)) {
        publish(userId, {
          type: 'message.created',
          conversationId,
          message,
          incoming: userId !== message.senderId,
        });
      }
    },
    changed(userIds: string[], conversationId: string) {
      for (const userId of new Set(userIds))
        publish(userId, { type: 'conversation.changed', conversationId });
    },
  };
}
export type MessageEvents = ReturnType<typeof createMessageEvents>;
