import { Link, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Spinner } from '@/shared/ui/atoms';
import { useCurrentUser } from '@/features/profile/api/useCurrentUser';
import { MessageComposer } from './components/MessageComposer/MessageComposer';
import { MessageThread } from './components/MessageThread/MessageThread';
import {
  useConversationMessagesQuery,
  useConversationsQuery,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useSendMessageMutation,
} from './api/useConversations';
import type { ChatMessage } from './types/message';
import styles from './ConversationPage.module.css';

export function ConversationPage() {
  const { conversationId } = useParams({ from: '/account/messages/$conversationId' });
  const currentUser = useCurrentUser();
  const conversations = useConversationsQuery();
  const messages = useConversationMessagesQuery(conversationId);
  const sendMessage = useSendMessageMutation(conversationId);
  const editMessage = useEditMessageMutation(conversationId);
  const deleteMessage = useDeleteMessageMutation(conversationId);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const conversation = conversations.data?.conversations.find(
    (entry) => entry.id === conversationId,
  );

  if (messages.isPending || currentUser.isPending) {
    return <Spinner label="Chat wird geladen …" />;
  }
  if (messages.isError || currentUser.isError || !messages.data || !currentUser.data) {
    return (
      <section className={styles.page}>
        <p role="alert">Der Chat konnte nicht geladen werden.</p>
        <Button onClick={() => void messages.refetch()}>Erneut versuchen</Button>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="conversation-title">
      <Link to="/account/messages">← Alle Nachrichten</Link>
      <header className={styles.heading}>
        <p>{conversation?.itemTitle ?? 'Nachrichten'}</p>
        <h1 id="conversation-title">
          {conversation ? `Chat mit ${conversation.otherParticipantName}` : 'Nachrichten'}
        </h1>
      </header>
      <MessageThread
        currentUserId={currentUser.data.user.id}
        currentUserName={currentUser.data.user.name}
        otherParticipantName={conversation?.otherParticipantName ?? 'Kontakt'}
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
