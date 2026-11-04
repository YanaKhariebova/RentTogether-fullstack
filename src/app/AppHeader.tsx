import { useAuth, useClerk, useUser, UserButton } from '@clerk/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import messageNotificationSound from '@/shared/assets/sounds/message-notification.mp3';
import { HeaderView } from '@/shared/ui/organisms/Header/Header';
import { NavigationIcon } from '@/shared/ui/organisms/Header/NavigationIcon';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { useBookingNotificationCount } from '@/features/notifications/api/useBookingNotifications';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { useMessageUnreadCount } from '@/features/messages/api/useConversations';
import { shouldPlayMessageTone } from '@/features/messages/model/conversationPresentation';
import styles from '@/shared/ui/organisms/Header/Header.module.css';

export function AppHeader() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const bookingNotifications = useBookingNotificationCount();
  const messageNotifications = useMessageUnreadCount();
  const messageAudio = useRef<HTMLAudioElement | null>(null);
  const previousMessageCount = useRef<number | null>(null);

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
    const unreadCount = messageNotifications.data?.count;
    if (typeof unreadCount !== 'number') return;
    const previousCount = previousMessageCount.current;
    previousMessageCount.current = unreadCount;
    if (
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
  }, [messageNotifications.data?.count]);

  return (
    <HeaderView
      auth={
        isLoaded &&
        (isSignedIn ? (
          <UserButton />
        ) : (
          <Link to="/sign-in" className={styles.signInLink}>
            <NavigationIcon name="user" />
            <span>Anmelden</span>
          </Link>
        ))
      }
      bookingUnreadCount={
        bookingNotifications.isError ? undefined : bookingNotifications.data?.unreadCount
      }
      messageUnreadCount={
        messageNotifications.isError ? undefined : messageNotifications.data?.count
      }
      notificationBadge={(count) => <NotificationBadge count={count} />}
      themeToggle={<ThemeToggle />}
      avatarUrl={user?.imageUrl}
      avatarName={user?.fullName ?? user?.username ?? undefined}
      signedIn={Boolean(isSignedIn)}
      authLoaded={isLoaded}
      onSignOut={() => void signOut({ redirectUrl: '/' })}
    />
  );
}
