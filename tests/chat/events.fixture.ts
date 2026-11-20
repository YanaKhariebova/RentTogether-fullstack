// Local-only SSE transport for the production provider. This module is never
// imported by application code or the normal Vite configuration.
import type { Plugin } from 'vite';
import type { ServerResponse } from 'node:http';

export function chatEventsFixture(): Plugin {
  const streams = new Map<ServerResponse, string>();
  return {
    name: 'isolated-chat-events',
    configureServer(server) {
      server.middlewares.use('/__chat-test-api/conversations/events', (req, res) => {
        const userId = req.headers.authorization?.replace('Bearer ', '');
        if (!userId?.startsWith('chat-test-')) {
          res.writeHead(401).end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
        streams.set(res, userId);
        res.write('event: ready\ndata: {}\n\n');
        res.on('close', () => streams.delete(res));
      });
      server.middlewares.use('/__chat-emit', (req, res) => {
        let raw = '';
        req.on('data', (chunk) => {
          raw += chunk;
        });
        req.on('end', () => {
          const data = JSON.parse(raw);
          for (const [stream, userId] of streams) {
            if (!data.users.includes(userId)) continue;
            if (data.disconnect) {
              stream.end();
              continue;
            }
            const event = {
              ...data.event,
              incoming: data.event.message?.senderId !== userId.replace('chat-test-', ''),
            };
            stream.write(`data: ${JSON.stringify(event)}\n\n`);
          }
          res
            .writeHead(200, { 'Content-Type': 'application/json' })
            .end(JSON.stringify({ ok: true }));
        });
      });
    },
  };
}
