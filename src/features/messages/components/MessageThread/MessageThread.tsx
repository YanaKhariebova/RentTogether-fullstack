import type { ChatMessage } from '../../types/message';
import styles from './MessageThread.module.css';

type MessageThreadProps = {
  currentUserId: string;
  messages: ChatMessage[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function MessageThread({ currentUserId, messages }: MessageThreadProps) {
  if (messages.length === 0) {
    return <p className={styles.empty}>Noch keine Nachrichten. Schreibe die erste Nachricht.</p>;
  }

  return (
    <ol className={styles.list} aria-label="Nachrichtenverlauf" aria-live="polite">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;

        return (
          <li key={message.id} className={isOwnMessage ? styles.own : styles.other}>
            <p>{message.body}</p>
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          </li>
        );
      })}
    </ol>
  );
}
