import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../types/message';
import styles from './MessageThread.module.css';

type MessageThreadProps = {
  currentUserId: string;
  currentUserName: string;
  otherParticipantName: string;
  otherParticipantAvatarUrl: string | null;
  messages: ChatMessage[];
  onReply: (message: ChatMessage) => void;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  readOnly?: boolean;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

function dateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Heute';
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern';

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function MessageThread({
  currentUserId,
  currentUserName,
  otherParticipantName,
  otherParticipantAvatarUrl,
  messages,
  onReply,
  onEdit,
  onDelete,
  readOnly = false,
}: MessageThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [lastMessageId]);

  function clearPressTimer() {
    if (pressTimer) clearTimeout(pressTimer);
    setPressTimer(null);
  }
  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M12 14h29a7 7 0 0 1 7 7v15a7 7 0 0 1-7 7H27l-9 8v-8h-6a7 7 0 0 1-7-7V21a7 7 0 0 1 7-7Z" />
          <path d="M22 28h1m9 0h1m9 0h1" />
          <path d="M43 27h9a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7h-3v6l-7-6h-9a7 7 0 0 1-6.7-5" />
        </svg>
        <strong>Noch keine Nachrichten</strong>
        <span>Schreibe die erste Nachricht.</span>
      </div>
    );
  }

  return (
    <ol ref={listRef} className={styles.list} aria-label="Nachrichtenverlauf" aria-live="polite">
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUserId;
        const isEditing = editingId === message.id;
        const previousMessage = messages[index - 1];
        const showDate =
          !previousMessage ||
          new Date(previousMessage.createdAt).toDateString() !==
            new Date(message.createdAt).toDateString();

        return (
          <li key={message.id} className={styles.messageGroup}>
            {showDate && <span className={styles.dateDivider}>{dateLabel(message.createdAt)}</span>}
            <div className={isOwnMessage ? styles.ownRow : styles.otherRow}>
              {!isOwnMessage && (
                <span className={styles.avatar} aria-hidden="true">
                  {otherParticipantAvatarUrl ? (
                    <img src={otherParticipantAvatarUrl} alt="" />
                  ) : (
                    otherParticipantName.slice(0, 1).toUpperCase()
                  )}
                </span>
              )}
              <article
                className={isOwnMessage ? styles.own : styles.other}
                onContextMenu={(event) => {
                  if (readOnly) return;
                  event.preventDefault();
                  setMenuMessageId(message.id);
                }}
                onPointerDown={(event) => {
                  if (readOnly || event.pointerType !== 'touch') return;
                  setPressTimer(setTimeout(() => setMenuMessageId(message.id), 550));
                }}
                onPointerUp={clearPressTimer}
                onPointerCancel={clearPressTimer}
                onPointerLeave={clearPressTimer}
              >
                <span className={styles.author}>
                  {isOwnMessage ? currentUserName || 'Du' : otherParticipantName}
                </span>
                {message.replyTo && (
                  <blockquote className={styles.reply}>{message.replyTo.body}</blockquote>
                )}
                {isEditing ? (
                  <form
                    className={styles.editForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void onEdit(message.id, editBody.trim())
                        .then(() => {
                          setEditingId(null);
                          setActionError(null);
                        })
                        .catch(() => {
                          setActionError(
                            'Die Nachricht konnte nicht bearbeitet werden. Sie muss deine eigene, höchstens 15 Minuten alte Nachricht in einer aktiven Anfrage sein.',
                          );
                        });
                    }}
                  >
                    <textarea
                      value={editBody}
                      onChange={(event) => setEditBody(event.target.value)}
                    />
                    <button type="submit" disabled={!editBody.trim()}>
                      Speichern
                    </button>
                  </form>
                ) : (
                  <p>{message.body}</p>
                )}
                <span className={styles.messageMeta}>
                  <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                  {isOwnMessage && (
                    <span
                      className={message.readAt ? styles.readReceipt : styles.sentReceipt}
                      aria-label={message.readAt ? 'Gelesen' : 'Gesendet'}
                      title={message.readAt ? 'Gelesen' : 'Gesendet'}
                    >
                      {message.readAt ? '✓✓' : '✓'}
                    </span>
                  )}
                </span>
                {message.editedAt && <span className={styles.edited}>Bearbeitet</span>}
                {menuMessageId === message.id && !readOnly && !isEditing && (
                  <div className={styles.contextMenu} role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onReply(message);
                        setMenuMessageId(null);
                      }}
                    >
                      Antworten
                    </button>
                    {isOwnMessage && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setEditingId(message.id);
                            setEditBody(message.body);
                            setMenuMessageId(null);
                          }}
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            void onDelete(message.id)
                              .then(() => setActionError(null))
                              .catch(() => {
                                setActionError(
                                  'Die Nachricht konnte nicht gelöscht werden. Sie muss deine eigene Nachricht in einer aktiven Anfrage sein.',
                                );
                              });
                            setMenuMessageId(null);
                          }}
                        >
                          Löschen
                        </button>
                      </>
                    )}
                  </div>
                )}
              </article>
            </div>
          </li>
        );
      })}
      {actionError && (
        <li className={styles.actionError} role="alert">
          {actionError}
        </li>
      )}
    </ol>
  );
}
