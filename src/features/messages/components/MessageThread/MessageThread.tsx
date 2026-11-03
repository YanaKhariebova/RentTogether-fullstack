import { useState } from 'react';
import type { ChatMessage } from '../../types/message';
import styles from './MessageThread.module.css';

type MessageThreadProps = {
  currentUserId: string;
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

export function MessageThread({
  currentUserId,
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

  function clearPressTimer() {
    if (pressTimer) clearTimeout(pressTimer);
    setPressTimer(null);
  }
  if (messages.length === 0) {
    return <p className={styles.empty}>Noch keine Nachrichten. Schreibe die erste Nachricht.</p>;
  }

  return (
    <ol className={styles.list} aria-label="Nachrichtenverlauf" aria-live="polite">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const isEditing = editingId === message.id;

        return (
          <li
            key={message.id}
            className={isOwnMessage ? styles.own : styles.other}
            onContextMenu={(event) => {
              if (readOnly || message.deletedAt) return;
              event.preventDefault();
              setMenuMessageId(message.id);
            }}
            onPointerDown={(event) => {
              if (readOnly || message.deletedAt || event.pointerType !== 'touch') return;
              setPressTimer(setTimeout(() => setMenuMessageId(message.id), 550));
            }}
            onPointerUp={clearPressTimer}
            onPointerCancel={clearPressTimer}
            onPointerLeave={clearPressTimer}
          >
            {message.replyTo && (
              <blockquote className={styles.reply}>{message.replyTo.body}</blockquote>
            )}
            {isEditing ? (
              <form
                className={styles.editForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  void onEdit(message.id, editBody.trim()).then(() => setEditingId(null));
                }}
              >
                <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} />
                <button type="submit" disabled={!editBody.trim()}>
                  Speichern
                </button>
              </form>
            ) : (
              <p>{message.body}</p>
            )}
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {message.editedAt && !message.deletedAt && (
              <span className={styles.edited}>Bearbeitet</span>
            )}
            {menuMessageId === message.id && !readOnly && !message.deletedAt && !isEditing && (
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
                        void onDelete(message.id);
                        setMenuMessageId(null);
                      }}
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
