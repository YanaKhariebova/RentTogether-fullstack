import { useAuth } from '@clerk/react';
import { useEffect, useRef } from 'react';
import messageNotificationSound from '@/shared/assets/sounds/message-notification.mp3';
import { shouldPlayMessageTone } from '../model/conversationPresentation';
import { useMessageRealtimeState } from './realtimeContext';

export function useMessageNotificationSound(unreadCount: number | undefined) {
  const { userId } = useAuth();
  const { connected, lastIncomingMessageId } = useMessageRealtimeState();
  const messageAudio = useRef<HTMLAudioElement | null>(null);
  const previousMessageCount = useRef<{ userId: string | null | undefined; count: number } | null>(
    null,
  );

  useEffect(() => {
    const audio = new Audio(messageNotificationSound);
    audio.preload = 'auto';
    audio.volume = 0.4;
    messageAudio.current = audio;
    const unlockMessageAudio = () => {
      audio.muted = true;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => undefined)
        .finally(() => {
          audio.muted = false;
        });
      window.removeEventListener('pointerdown', unlockMessageAudio);
      window.removeEventListener('keydown', unlockMessageAudio);
    };
    window.addEventListener('pointerdown', unlockMessageAudio, { once: true });
    window.addEventListener('keydown', unlockMessageAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockMessageAudio);
      window.removeEventListener('keydown', unlockMessageAudio);
      audio.pause();
      messageAudio.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof unreadCount !== 'number') return;
    const previous = previousMessageCount.current;
    const previousCount = previous && previous.userId === userId ? previous.count : null;
    previousMessageCount.current = { userId, count: unreadCount };
    if (
      connected ||
      !shouldPlayMessageTone({
        previousCount,
        unreadCount,
        isPageVisible: document.visibilityState === 'visible',
      })
    )
      return;
    const tone = messageAudio.current;
    if (!tone) return;
    tone.currentTime = 0;
    void tone.play().catch(() => undefined);
  }, [unreadCount, connected, userId]);

  useEffect(() => {
    if (!lastIncomingMessageId || document.visibilityState !== 'visible') return;
    // The stream has already applied the message to the cache. Play after the
    // browser has had a chance to paint it, not when only a badge count arrives.
    const frame = requestAnimationFrame(() => {
      const tone = messageAudio.current;
      if (!tone) return;
      tone.currentTime = 0;
      void tone.play().catch(() => undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, [lastIncomingMessageId]);
}
