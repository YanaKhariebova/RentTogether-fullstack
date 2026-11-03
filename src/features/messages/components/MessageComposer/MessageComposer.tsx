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
      setErrorMessage('Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
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
          <span>Antwort auf: {replyTo.body}</span>
          <button type="button" onClick={onCancelReply} aria-label="Antwort entfernen">
            ×
          </button>
        </div>
      )}
      <Textarea
        label="Nachricht schreiben"
        maxLength={2000}
        placeholder="Schreibe eine Nachricht …"
        value={body}
        disabled={disabled || isSending}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className={styles.actions}>
        <span aria-live="polite">{body.length}/2000</span>
        <Button type="submit" loading={isSending} disabled={disabled || !trimmedBody}>
          Senden
        </Button>
      </div>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </form>
  );
}
