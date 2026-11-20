import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Button, Spinner } from '@/shared/ui/atoms';
import { ApiError } from '@/shared/api/client';
import { useCurrentUser } from '@/features/profile/api/useCurrentUser';
import { MessageComposer } from './components/MessageComposer/MessageComposer';
import { MessageThread } from './components/MessageThread/MessageThread';
import {
  useConversationMessagesQuery,
  useConversationsQuery,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useMarkConversationReadMutation,
  useSendMessageMutation,
} from './api/useConversations';
import type { ChatMessage } from './types/message';
import styles from './ConversationPage.module.css';

function isUnavailable(error: Error | null) {
  return error instanceof ApiError && [401, 403, 404].includes(error.status);
}

export function ConversationPage() {
  const { conversationId } = useParams({ from: '/account/messages/$conversationId' });
  const currentUser = useCurrentUser();
  const conversations = useConversationsQuery();
  const messages = useConversationMessagesQuery(conversationId);
  const sendMessage = useSendMessageMutation(conversationId);
  const editMessage = useEditMessageMutation(conversationId);
  const deleteMessage = useDeleteMessageMutation(conversationId);
  const markRead = useMarkConversationReadMutation(conversationId);
  const { mutate: markConversationRead, isPending: isMarkingRead } = markRead;
  const lastReadAttempt = useRef<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const conversation = conversations.data?.conversations.find(
    (entry) => entry.id === conversationId,
  );

  const currentUserId = currentUser.data?.user.id;
  const latestUnreadIncomingId = messages.data?.messages.find(
    (message) => message.senderId !== currentUserId && !message.readAt,
  )?.id;

  useEffect(() => {
    if (!currentUserId || !latestUnreadIncomingId || isMarkingRead) return;
    const attempt = `${currentUserId}:${conversationId}:${latestUnreadIncomingId}`;
    // A failed read receipt must not retry on every mutation state change.
    // A new incoming message or reopening the chat can trigger another attempt.
    if (lastReadAttempt.current === attempt) return;
    lastReadAttempt.current = attempt;
    markConversationRead(latestUnreadIncomingId);
  }, [currentUserId, conversationId, latestUnreadIncomingId, isMarkingRead, markConversationRead]);

  if ((!messages.data && messages.isPending) || (!currentUser.data && currentUser.isPending)) {
    return <Spinner label="Chat wird geladen …" />;
  }
  function retryChat() {
    void messages.refetch();
    if (currentUser.isError) void currentUser.refetch();
  }

  if (
    !messages.data ||
    !currentUser.data ||
    isUnavailable(messages.error) ||
    isUnavailable(currentUser.error)
  ) {
    return (
      <section className={styles.page}>
        <p role="alert">Der Chat konnte nicht geladen werden.</p>
        <Button onClick={retryChat}>Erneut versuchen</Button>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="conversation-title">
      <Link to="/account/messages">← Alle Nachrichten</Link>
      <header className={styles.heading}>
        <p>
          {conversation?.kind === 'ITEM_INQUIRY'
            ? 'Frage zum Artikel'
            : conversation
              ? 'Chat zur Buchung'
              : 'Nachrichten'}
        </p>
        <h1 id="conversation-title">
          {conversation
            ? `${conversation.itemTitle} · ${conversation.otherParticipantName}`
            : 'Nachrichten'}
        </h1>
      </header>
      {(messages.isError || currentUser.isError) && (
        <div role="alert">
          <p>Der Chat konnte nicht aktualisiert werden. Der bisherige Verlauf bleibt sichtbar.</p>
          <Button onClick={retryChat}>Erneut versuchen</Button>
        </div>
      )}
      <MessageThread
        currentUserId={currentUser.data.user.id}
        currentUserName={currentUser.data.user.name}
        otherParticipantName={conversation?.otherParticipantName ?? 'Kontakt'}
        otherParticipantAvatarUrl={conversation?.otherParticipantAvatarUrl ?? null}
        messages={[...messages.data.messages].reverse()}
        onReply={setReplyTo}
        onEdit={async (messageId, body) => {
          await editMessage.mutateAsync({ messageId, body });
        }}
        onDelete={async (messageId) => {
          await deleteMessage.mutateAsync(messageId);
        }}
        readOnly={!messages.data.canSend}
      />
      <MessageComposer
        disabled={!messages.data.canSend}
        isSending={sendMessage.isPending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={async (body) => {
          await sendMessage.mutateAsync({ body, replyToMessageId: replyTo?.id });
          setReplyTo(null);
        }}
      />
    </section>
  );
}
