import { Link, useParams } from '@tanstack/react-router';
import { useAuth } from '@clerk/react';
import { Button, Spinner } from '@/shared/ui/atoms';
import { MessageComposer } from './components/MessageComposer/MessageComposer';
import { MessageThread } from './components/MessageThread/MessageThread';
import { useConversationMessagesQuery, useSendMessageMutation } from './api/useConversations';
import styles from './ConversationPage.module.css';

export function ConversationPage() {
  const { conversationId } = useParams({ from: '/account/messages/$conversationId' });
  const { userId } = useAuth();
  const messages = useConversationMessagesQuery(conversationId);
  const sendMessage = useSendMessageMutation(conversationId);

  if (messages.isPending) {
    return <Spinner label="Chat wird geladen …" />;
  }
  if (messages.isError || !messages.data || !userId) {
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
      <h1 id="conversation-title">Nachrichten</h1>
      <MessageThread currentUserId={userId} messages={[...messages.data.messages].reverse()} />
      <MessageComposer
        disabled={!messages.data.canSend}
        isSending={sendMessage.isPending}
        onSend={async (body) => {
          await sendMessage.mutateAsync(body);
        }}
      />
    </section>
  );
}
