import { Link } from '@tanstack/react-router';
import { Button, Spinner } from '@/shared/ui/atoms';
import { useConversationsQuery } from './api/useConversations';
import styles from './MessagesPage.module.css';

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function MessagesPage() {
  const conversations = useConversationsQuery();
  return (
    <section className={styles.page} aria-labelledby="messages-title">
      <div className={styles.content}>
        <h1 id="messages-title">Nachrichten</h1>
        <p className={styles.intro}>Deine Unterhaltungen zu Anfragen und Ausleihen.</p>

        {conversations.isPending ? (
          <div className={styles.empty}>
            <Spinner label="Nachrichten werden geladen …" />
          </div>
        ) : conversations.isError ? (
          <div className={styles.empty}>
            <p role="alert">Nachrichten konnten nicht geladen werden.</p>
            <Button onClick={() => void conversations.refetch()}>Erneut versuchen</Button>
          </div>
        ) : conversations.data?.conversations.length ? (
          <ul className={styles.list} aria-label="Unterhaltungen">
            {conversations.data.conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  className={styles.conversation}
                  to="/account/messages/$conversationId"
                  params={{ conversationId: conversation.id }}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {conversation.otherParticipantName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className={styles.messageContent}>
                    <span className={styles.conversationHeader}>
                      <strong>{conversation.otherParticipantName}</strong>
                      <time dateTime={conversation.updatedAt}>
                        {formatUpdatedAt(conversation.updatedAt)}
                      </time>
                    </span>
                    <span className={styles.itemTitle}>{conversation.itemTitle}</span>
                    <span className={styles.preview}>
                      {conversation.lastMessage?.body ?? 'Noch keine Nachrichten'}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span
                      className={styles.badge}
                      aria-label={`${conversation.unreadCount} ungelesen`}
                    >
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <h2>Noch keine Nachrichten</h2>
            <p>Sobald es zu einer Anfrage etwas zu besprechen gibt, erscheint der Chat hier.</p>
            <Link to="/account/bookings/my-rentals">Meine Anfragen ansehen</Link>
          </div>
        )}
      </div>
    </section>
  );
}
