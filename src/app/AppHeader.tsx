import { useAuth, useClerk, useUser, UserButton } from '@clerk/react';
import { Link } from '@tanstack/react-router';
import { HeaderView } from '@/shared/ui/organisms/Header/Header';
import { NavigationIcon } from '@/shared/ui/organisms/Header/NavigationIcon';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { useBookingNotificationCount } from '@/features/notifications/api/useBookingNotifications';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { useMessageUnreadCount } from '@/features/messages/api/useConversations';
import { useCurrentUser } from '@/features/profile/api/useCurrentUser';
import { useMessageNotificationSound } from '@/features/messages/api/useMessageNotificationSound';
import styles from '@/shared/ui/organisms/Header/Header.module.css';

export function AppHeader() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const bookingNotifications = useBookingNotificationCount();
  const messageNotifications = useMessageUnreadCount();
  const currentUser = useCurrentUser();
  useMessageNotificationSound(messageNotifications.data?.count);

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
      isModerator={
        currentUser.data?.user.role === 'MODERATOR' || currentUser.data?.user.role === 'ADMIN'
      }
      onSignOut={() => void signOut({ redirectUrl: '/' })}
    />
  );
}
