import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { apiKeys } from '@/shared/api/keys';
import { MessageRealtimeContext } from './realtimeContext';
import { readMessageEvents, reconnectDelay } from './messageEvents';
import type { ChatMessage } from '../types/message';

type Messages = { messages: ChatMessage[]; canSend: boolean; nextCursor: string | null };
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function MessageRealtimeProvider({ children }: { children: ReactNode }) {
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const client = useQueryClient();
  const [state, setState] = useState({
    userId: '',
    connected: false,
    lastIncomingMessageId: null as string | null,
  });
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    const controller = new AbortController();
    const signal = controller.signal;
    const received = new Set<string>();
    const updateConnection = (connected: boolean) => {
      if (!signal.aborted)
        setState((old) => ({
          userId,
          connected,
          lastIncomingMessageId: old.userId === userId ? old.lastIncomingMessageId : null,
        }));
    };
    async function connect() {
      let delay = 1000;
      while (!signal.aborted) {
        try {
          const token = await getToken();
          if (signal.aborted) return;
          const response = await fetch(`${baseUrl}/conversations/events`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              Accept: 'text/event-stream',
            },
            signal,
          });
          if ([401, 403, 404].includes(response.status)) {
            updateConnection(false);
            return;
          }
          if (
            !response.ok ||
            !response.body ||
            !response.headers.get('content-type')?.includes('text/event-stream')
          )
            throw new Error('Chat stream unavailable');
          await readMessageEvents(
            response.body,
            signal,
            async () => {
              updateConnection(true);
              delay = 1000;
              // Reload after reconnect to recover events missed while offline.
              void client.invalidateQueries({ queryKey: apiKeys.conversations(userId!) });
            },
            async (event) => {
              if (signal.aborted) return;
              const key = apiKeys.conversationMessages(userId!, event.conversationId);
              if (event.type === 'message.created') {
                if (received.has(event.message.id)) return;
                received.add(event.message.id);
                if (received.size > 200) received.delete(received.values().next().value!);
                // Prevent an older in-flight response from overwriting the event.
                await client.cancelQueries({ queryKey: key, exact: true });
                if (signal.aborted) return;
                const hadHistory = !!client.getQueryData<Messages>(key);
                client.setQueryData<Messages>(key, (current) =>
                  current
                    ? {
                        ...current,
                        messages: [
                          event.message,
                          ...current.messages.filter((m) => m.id !== event.message.id),
                        ].sort(
                          (a, b) =>
                            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
                        ),
                      }
                    : current,
                );
                if (!hadHistory) await client.invalidateQueries({ queryKey: key, exact: true });
                if (!signal.aborted && event.incoming)
                  setState({
                    userId: userId!,
                    connected: true,
                    lastIncomingMessageId: event.message.id,
                  });
                void client.invalidateQueries({
                  queryKey: apiKeys.conversations(userId!),
                  exact: true,
                });
                void client.invalidateQueries({
                  queryKey: apiKeys.conversationUnread(userId!),
                  exact: true,
                });
              } else {
                void Promise.all([
                  client.invalidateQueries({ queryKey: key, exact: true }),
                  client.invalidateQueries({
                    queryKey: apiKeys.conversations(userId!),
                    exact: true,
                  }),
                  client.invalidateQueries({
                    queryKey: apiKeys.conversationUnread(userId!),
                    exact: true,
                  }),
                ]);
              }
            },
          );
        } catch {
          // Keep cached messages and reconnect with a fresh token. Polling is a
          // fallback while the stream is unavailable, not the normal transport.
        }
        if (signal.aborted) return;
        updateConnection(false);
        await reconnectDelay(signal, delay);
        delay = Math.min(delay * 2, 15_000);
      }
    }
    void connect();
    return () => controller.abort();
  }, [userId, isLoaded, isSignedIn, getToken, client]);
  const value =
    state.userId === userId && isSignedIn
      ? state
      : { connected: false, lastIncomingMessageId: null };
  return (
    <MessageRealtimeContext.Provider value={value}>{children}</MessageRealtimeContext.Provider>
  );
}
