import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import { useState } from 'react';
import { Button, Textarea } from '@/shared/ui/atoms';
import styles from './MessageComposer.module.css';
import type { ChatMessage } from '../../types/message';

type MessageComposerProps = {
  disabled?: boolean;
  isSending?: boolean;
  onSend: (body: string) => Promise<void>;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
};

export function MessageComposer({
  disabled = false,
  isSending = false,
  onSend,
  replyTo = null,
  onCancelReply,
}: MessageComposerProps) {
  useTranslation();
  const [body, setBody] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const trimmedBody = body.trim();

  async function submitMessage() {
    if (!trimmedBody || disabled || isSending) return;

    setErrorMessage(null);

    try {
      await onSend(trimmedBody);
      setBody('');
    } catch {
      setErrorMessage(t('Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.'));
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void submitMessage();
      }}
    >
      {replyTo && (
        <div className={styles.replyPreview}>
          <span>
            {t('Antwort auf:')} {replyTo.body}
          </span>
          <button type="button" onClick={onCancelReply} aria-label={t('Antwort entfernen')}>
            ×
          </button>
        </div>
      )}
      <Textarea
        label={t('Nachricht schreiben')}
        maxLength={2000}
        placeholder={t('Schreibe eine Nachricht …')}
        value={body}
        disabled={disabled || isSending}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submitMessage();
          }
        }}
      />
      <div className={styles.actions}>
        <span aria-live="polite">{body.length}/2000</span>
        <Button type="submit" loading={isSending} disabled={disabled || !trimmedBody}>
          {t('Senden')}
        </Button>
      </div>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </form>
  );
}
