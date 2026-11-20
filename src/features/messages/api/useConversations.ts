import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/features/auth/api/useApi';
import { apiKeys } from '@/shared/api/keys';
import type { ChatMessage, Conversation, ConversationPreview } from '../types/message';

type ConversationsResponse = { conversations: ConversationPreview[]; nextCursor: string | null };
type MessagesResponse = { messages: ChatMessage[]; nextCursor: string | null; canSend: boolean };

export function useMessageUnreadCount() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: apiKeys.conversationUnread(userId ?? ''),
    queryFn: () => api<{ count: number }>('/conversations/unread-count'),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useConversationsQuery() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: apiKeys.conversations(userId ?? ''),
    queryFn: () => api<ConversationsResponse>('/conversations'),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
  });
}

export function useConversationMessagesQuery(conversationId: string) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const api = useApi();
  return useQuery({
    queryKey: apiKeys.conversationMessages(userId ?? '', conversationId),
    queryFn: ({ signal }) =>
      api<MessagesResponse>(`/conversations/${conversationId}/messages`, { signal }),
    enabled: isLoaded && !!isSignedIn && !!conversationId,
    retry: false,
  });
}

export function useCreateConversationMutation() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      api<{ conversation: Conversation }>(`/bookings/${bookingId}/conversation`, {
        method: 'POST',
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') }),
  });
}

export function useSendItemInquiryMutation(itemId: string) {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<{ conversation: Conversation; message: ChatMessage }>(
        `/items/${itemId}/conversation/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') }),
  });
}

export function useSendMessageMutation(conversationId: string) {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ body, replyToMessageId }: { body: string; replyToMessageId?: string }) =>
      api<{ message: ChatMessage }>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, ...(replyToMessageId ? { replyToMessageId } : {}) }),
      }),
    onSuccess: ({ message }) => {
      // The write already succeeded. Keep its result even if the subsequent
      // refresh fails, so the sender can see that the message was delivered.
      client.setQueryData<MessagesResponse>(
        apiKeys.conversationMessages(userId ?? '', conversationId),
        (current) =>
          current
            ? {
                ...current,
                messages: [message, ...current.messages.filter((entry) => entry.id !== message.id)],
              }
            : current,
      );
      client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') });
      client.invalidateQueries({
        queryKey: apiKeys.conversationMessages(userId ?? '', conversationId),
      });
    },
  });
}

export function useEditMessageMutation(conversationId: string) {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api<{ message: ChatMessage }>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') });
      client.invalidateQueries({
        queryKey: apiKeys.conversationMessages(userId ?? '', conversationId),
      });
    },
  });
}

export function useDeleteMessageMutation(conversationId: string) {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api<{ message: { id: string } }>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') });
      client.invalidateQueries({
        queryKey: apiKeys.conversationMessages(userId ?? '', conversationId),
      });
    },
  });
}

export function useHideConversationMutation() {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api<void>(`/conversations/${conversationId}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') }),
  });
}

export function useMarkConversationReadMutation(conversationId: string) {
  const { userId } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (lastReadMessageId: string) =>
      api<void>(`/conversations/${conversationId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ lastReadMessageId }),
      }),
    onSuccess: (_data, lastReadMessageId) => {
      client.setQueryData<MessagesResponse>(
        apiKeys.conversationMessages(userId ?? '', conversationId),
        (current) => {
          if (!current) return current;
          const lastReadIndex = current.messages.findIndex(
            (message) => message.id === lastReadMessageId,
          );
          if (lastReadIndex === -1) return current;
          const senderId = current.messages[lastReadIndex].senderId;
          const readAt = new Date().toISOString();
          return {
            ...current,
            messages: current.messages.map((message, index) =>
              index >= lastReadIndex && message.senderId === senderId && !message.readAt
                ? { ...message, readAt }
                : message,
            ),
          };
        },
      );
      client.invalidateQueries({ queryKey: apiKeys.conversations(userId ?? '') });
      client.invalidateQueries({ queryKey: apiKeys.conversationUnread(userId ?? '') });
    },
  });
}
