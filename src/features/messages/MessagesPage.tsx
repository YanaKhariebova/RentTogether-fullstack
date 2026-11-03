import { Link } from '@tanstack/react-router';
import { useAuth } from '@clerk/react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button, Spinner } from '@/shared/ui/atoms';
import { useConversationsQuery, useHideConversationMutation } from './api/useConversations';
import styles from './MessagesPage.module.css';

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function MessagesPage() {
  const { userId } = useAuth();
  const conversations = useConversationsQuery();
  const hideConversation = useHideConversationMutation();
  const [conversationToHide, setConversationToHide] = useState<{
    id: string;
    itemTitle: string;
  } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (conversationToHide && !dialog.current?.open) dialog.current?.showModal();
    if (!conversationToHide && dialog.current?.open) dialog.current.close();
  }, [conversationToHide]);
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
              <li
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  conversation.unreadCount > 0 ? styles.unread : ''
                }`}
              >
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
                    <span className={styles.itemTitle}>
                      <span className={styles.itemName}>{conversation.itemTitle}</span> ·{' '}
                      {conversation.kind === 'ITEM_INQUIRY'
                        ? 'Frage zum Artikel'
                        : 'Chat zur Buchung'}
                    </span>
                    <span
                      className={`${styles.preview} ${
                        conversation.unreadCount > 0 ? styles.unreadPreview : ''
                      }`}
                    >
                      {conversation.lastMessage?.senderId === userId ? 'Du: ' : ''}
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
                <details className={styles.actionsMenu}>
                  <summary aria-label={`Aktionen für ${conversation.itemTitle}`}>⋯</summary>
                  <div className={styles.actionsPopup}>
                    <button
                      type="button"
                      disabled={hideConversation.isPending}
                      onClick={(event) => {
                        event.currentTarget.closest('details')?.removeAttribute('open');
                        setConversationToHide({
                          id: conversation.id,
                          itemTitle: conversation.itemTitle,
                        });
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 7h16M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 1 13h10l1-13" />
                      </svg>
                      Unterhaltung löschen
                    </button>
                  </div>
                </details>
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
      <dialog
        ref={dialog}
        className={styles.hideDialog}
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        onCancel={(event) => {
          event.preventDefault();
          if (!hideConversation.isPending) setConversationToHide(null);
        }}
      >
        <h2 id={`${dialogId}-title`}>Unterhaltung ausblenden?</h2>
        <p id={`${dialogId}-description`}>
          {conversationToHide
            ? `„${conversationToHide.itemTitle}“ wird nur aus deiner Liste entfernt. Die Nachrichten bleiben für die andere Person erhalten.`
            : ''}
        </p>
        <div className={styles.dialogActions}>
          <Button
            type="button"
            disabled={hideConversation.isPending}
            onClick={() => setConversationToHide(null)}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            className={styles.deleteConfirm}
            loading={hideConversation.isPending}
            onClick={() => {
              if (!conversationToHide) return;
              void hideConversation
                .mutateAsync(conversationToHide.id)
                .then(() => setConversationToHide(null));
            }}
          >
            Unterhaltung löschen
          </Button>
        </div>
      </dialog>
    </section>
  );
}
