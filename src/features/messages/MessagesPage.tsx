import { formatLocale } from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@clerk/react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button, Spinner } from '@/shared/ui/atoms';
import { useConversationsQuery, useHideConversationMutation } from './api/useConversations';
import { orderConversations } from './model/conversationPresentation';
import styles from './MessagesPage.module.css';

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(formatLocale(), { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function MessagesPage() {
  useTranslation();
  const { userId } = useAuth();
  const conversations = useConversationsQuery();
  const hideConversation = useHideConversationMutation();
  const [conversationToHide, setConversationToHide] = useState<{
    id: string;
    itemTitle: string;
  } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const orderedConversations = orderConversations(conversations.data?.conversations ?? []);

  useEffect(() => {
    if (conversationToHide && !dialog.current?.open) dialog.current?.showModal();
    if (!conversationToHide && dialog.current?.open) dialog.current.close();
  }, [conversationToHide]);
  return (
    <section className={styles.page} aria-labelledby="messages-title">
      <div className={styles.content}>
        <h1 id="messages-title">{t('Nachrichten')}</h1>
        <p className={styles.intro}>{t('Deine Unterhaltungen zu Anfragen und Ausleihen.')}</p>

        {conversations.isPending ? (
          <div className={styles.empty}>
            <Spinner label={t('Nachrichten werden geladen …')} />
          </div>
        ) : conversations.isError ? (
          <div className={styles.empty}>
            <p role="alert">{t('Nachrichten konnten nicht geladen werden.')}</p>
            <Button onClick={() => void conversations.refetch()}>{t('Erneut versuchen')}</Button>
          </div>
        ) : orderedConversations.length ? (
          <ul className={styles.list} aria-label={t('Unterhaltungen')}>
            {orderedConversations.map((conversation) => (
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
                    {conversation.otherParticipantAvatarUrl ? (
                      <img src={conversation.otherParticipantAvatarUrl} alt="" />
                    ) : (
                      conversation.otherParticipantName.slice(0, 1).toUpperCase()
                    )}
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
                        ? t('Frage zum Artikel')
                        : t('Chat zur Buchung')}
                    </span>
                    <span
                      className={`${styles.preview} ${
                        conversation.unreadCount > 0 ? styles.unreadPreview : ''
                      }`}
                    >
                      {conversation.lastMessage?.senderId === userId ? t('Du: ') : ''}
                      {conversation.lastMessage?.body ?? t('Noch keine Nachrichten')}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span
                      className={styles.badge}
                      aria-label={t('unreadMessages', { count: conversation.unreadCount })}
                    >
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  className={styles.hideButton}
                  disabled={hideConversation.isPending}
                  aria-label={t('Unterhaltung zu {{value0}} löschen', {
                    value0: conversation.itemTitle,
                  })}
                  title={t('Unterhaltung löschen')}
                  onClick={() => {
                    setConversationToHide({
                      id: conversation.id,
                      itemTitle: conversation.itemTitle,
                    });
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <h2>{t('Noch keine Nachrichten')}</h2>
            <p>
              {t('Sobald es zu einer Anfrage etwas zu besprechen gibt, erscheint der Chat hier.')}
            </p>
            <Link to="/account/bookings/my-rentals">{t('Meine Anfragen ansehen')}</Link>
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
        <h2 id={`${dialogId}-title`}>{t('Unterhaltung ausblenden?')}</h2>
        <p id={`${dialogId}-description`}>
          {conversationToHide
            ? t(
                '„{{value0}}“ wird nur aus deiner Liste entfernt. Die Nachrichten bleiben für die andere Person erhalten.',
                { value0: conversationToHide.itemTitle },
              )
            : ''}
        </p>
        <div className={styles.dialogActions}>
          <Button
            type="button"
            disabled={hideConversation.isPending}
            onClick={() => setConversationToHide(null)}
          >
            {t('Abbrechen')}
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
            {t('Unterhaltung löschen')}
          </Button>
        </div>
      </dialog>
    </section>
  );
}
