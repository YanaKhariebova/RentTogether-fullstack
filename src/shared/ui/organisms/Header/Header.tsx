import { useAuth, useClerk, useUser, UserButton } from '@clerk/react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton } from '../../atoms';
import { ThemeToggle } from '../../../../features/theme/ThemeToggle';
import logo from '../../../assets/renttogether-icon.svg';
import styles from './Header.module.css';
import { NavigationIcon } from './NavigationIcon';
import { useBookingNotificationCount } from '@/features/notifications/api/useBookingNotifications';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';
import { useMessageUnreadCount } from '@/features/messages/api/useConversations';

const navigation = [
  { to: '/catalog', label: 'Entdecken', icon: 'search' },
  { to: '/account/items', label: 'Meine Anzeigen', icon: 'grid' },
  { to: '/account/favorites', label: 'Favoriten', icon: 'heart' },
  { to: '/account/bookings', label: 'Anfragen', icon: 'calendar' },
  { to: '/account/messages', label: 'Nachrichten', icon: 'chat' },
  { to: '/account/profile', label: 'Profil', icon: 'user' },
] as const;

const information = [
  { to: '/so-funktionierts', label: 'So funktioniert’s' },
  { to: '/ueber-uns', label: 'Über uns' },
  { to: '/hilfe', label: 'Hilfe' },
  { to: '/sicherheit', label: 'Sicherheit' },
  { to: '/datenschutz', label: 'Datenschutz' },
  { to: '/impressum', label: 'Impressum' },
] as const;

export function Header() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const bookingNotifications = useBookingNotificationCount();
  const messageNotifications = useMessageUnreadCount();
  const messageAudio = useRef<AudioContext | null>(null);
  const previousMessageCount = useRef<number | null>(null);

  useEffect(() => {
    const enableMessageAudio = () => {
      if (!messageAudio.current) messageAudio.current = new AudioContext();
      void messageAudio.current.resume();
      window.removeEventListener('pointerdown', enableMessageAudio);
      window.removeEventListener('keydown', enableMessageAudio);
    };

    window.addEventListener('pointerdown', enableMessageAudio, { once: true });
    window.addEventListener('keydown', enableMessageAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enableMessageAudio);
      window.removeEventListener('keydown', enableMessageAudio);
      void messageAudio.current?.close();
    };
  }, []);

  useEffect(() => {
    const unreadCount = messageNotifications.data?.count;
    if (typeof unreadCount !== 'number') return;

    const previousCount = previousMessageCount.current;
    previousMessageCount.current = unreadCount;
    if (
      previousCount === null ||
      unreadCount <= previousCount ||
      document.visibilityState !== 'visible' ||
      messageAudio.current?.state !== 'running'
    )
      return;

    const tone = messageAudio.current;
    const oscillator = tone.createOscillator();
    const gain = tone.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, tone.currentTime);
    gain.gain.setValueAtTime(0.0001, tone.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, tone.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, tone.currentTime + 0.22);
    oscillator.connect(gain).connect(tone.destination);
    oscillator.start();
    oscillator.stop(tone.currentTime + 0.23);
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
      avatarUrl={user?.imageUrl}
      avatarName={user?.fullName ?? user?.username ?? undefined}
      signedIn={Boolean(isSignedIn)}
      authLoaded={isLoaded}
      onSignOut={() => {
        void signOut({ redirectUrl: '/' });
      }}
    />
  );
}

export function HeaderView({
  auth,
  signedIn = false,
  authLoaded = true,
  avatarUrl,
  avatarName,
  onSignOut,
  bookingUnreadCount,
  messageUnreadCount,
}: {
  auth: ReactNode;
  signedIn?: boolean;
  authLoaded?: boolean;
  avatarUrl?: string;
  avatarName?: string;
  onSignOut?: () => void;
  bookingUnreadCount?: number;
  messageUnreadCount?: number;
}) {
  const panel = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  const bookingCount = signedIn ? bookingUnreadCount : undefined;
  const hasBookingUpdates = typeof bookingCount === 'number' && bookingCount > 0;
  const messageCount = signedIn ? messageUnreadCount : undefined;
  const hasMessageUpdates = typeof messageCount === 'number' && messageCount > 0;
  const bookingDescription = `${id}-booking-updates`;
  const bookingBadge = (to: string) =>
    to === '/account/bookings' && hasBookingUpdates ? (
      <span className={styles.bookingBadge}>
        <NotificationBadge count={bookingCount} />
      </span>
    ) : null;
  const messageBadge = (to: string) =>
    to === '/account/messages' && hasMessageUpdates ? (
      <span className={styles.bookingBadge}>
        <NotificationBadge count={messageCount} />
      </span>
    ) : null;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const close = () => panel.current?.close();

  useEffect(() => {
    panel.current?.close();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => {
      if (desktop.matches) panel.current?.close();
    };
    desktop.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener('change', onResize);
    };
  }, [open]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link
            to="/"
            className={styles.brand}
            aria-label="RentTogether Weniger kaufen. Mehr teilen."
          >
            <span
              className={styles.brandMark}
              aria-hidden="true"
              style={{ maskImage: 'url(' + logo + ')', WebkitMaskImage: 'url(' + logo + ')' }}
            />
            <span>
              <span className={styles.rent}>Rent</span>
              <span className={styles.together}>Together</span>
              <span className={styles.tagline}>Weniger kaufen. Mehr teilen.</span>
            </span>
          </Link>
          <nav aria-label="Hauptnavigation" className={styles.desktop}>
            {navigation.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                title={label}
                aria-describedby={
                  to === '/account/bookings' && hasBookingUpdates ? bookingDescription : undefined
                }
                activeProps={{ 'aria-current': 'page' }}
              >
                <NavigationIcon name={icon} />
                <span className={styles.navLabel}>{label}</span>
                {bookingBadge(to)}
                {messageBadge(to)}
              </Link>
            ))}
          </nav>
          <div className={styles.auth}>
            {auth}
            <ThemeToggle />
          </div>
          <button
            ref={trigger}
            type="button"
            className={styles.menuButton}
            aria-label="Menü öffnen"
            aria-expanded={open}
            aria-controls={id}
            aria-haspopup="dialog"
            aria-describedby={hasBookingUpdates ? bookingDescription : undefined}
            onClick={() => {
              panel.current?.showModal();
              setOpen(true);
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {hasBookingUpdates && (
              <span className={styles.menuBadge}>
                <NotificationBadge count={bookingCount} />
              </span>
            )}
            {hasMessageUpdates && <span className={styles.messageDot} />}
          </button>
        </div>
      </header>
      <dialog
        ref={panel}
        id={id}
        className={styles.panel}
        aria-labelledby={`${id}-title`}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled)',
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          if (!window.matchMedia('(min-width: 1024px)').matches) trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              close();
          }
        }}
      >
        <div className={styles.panelHeading}>
          <h2 id={`${id}-title`}>Dein RentTogether</h2>
          <IconButton label="Menü schließen" onClick={close} autoFocus>
            ×
          </IconButton>
        </div>
        <nav
          aria-label="Menü"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) close();
          }}
        >
          <Link to="/">Startseite</Link>
          {navigation.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              aria-describedby={
                to === '/account/bookings' && hasBookingUpdates ? bookingDescription : undefined
              }
              activeProps={{ 'aria-current': 'page' }}
            >
              <NavigationIcon name={icon} />
              <span>{label}</span>
              {bookingBadge(to)}
              {messageBadge(to)}
            </Link>
          ))}
          <Link to="/account/items/new">Etwas verleihen</Link>
          <div className={styles.information}>
            {information.map(({ to, label }) => (
              <Link key={to} to={to} activeProps={{ 'aria-current': 'page' }}>
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className={styles.panelSettings}>
          {authLoaded && signedIn && (
            <Link
              to="/account/profile"
              className={styles.panelAvatar}
              aria-label="Profil öffnen"
              title={avatarName ? 'Profil von ' + avatarName : 'Profil öffnen'}
              onClick={close}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={36} height={36} referrerPolicy="no-referrer" />
              ) : (
                <NavigationIcon name="user" />
              )}
            </Link>
          )}
          <div className={styles.accountActions}>
            {!authLoaded ? (
              <span role="status">Konto wird geladen …</span>
            ) : signedIn ? (
              <Button
                variant="secondary"
                className={styles.accountButton}
                onClick={() => {
                  close();
                  onSignOut?.();
                }}
              >
                Abmelden
              </Button>
            ) : (
              <Link to="/sign-in" className={styles.accountButton} onClick={close}>
                Anmelden
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </dialog>
      <nav aria-label="Mobile Navigation" className={styles.mobile}>
        {navigation
          .filter(({ to }) => ['/catalog', '/account/items', '/account/bookings'].includes(to))
          .map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              aria-describedby={
                to === '/account/bookings' && hasBookingUpdates ? bookingDescription : undefined
              }
              activeProps={{ 'aria-current': 'page' }}
            >
              <NavigationIcon name={icon} />
              <span>{label}</span>
              {bookingBadge(to)}
            </Link>
          ))}
      </nav>
      <span
        id={bookingDescription}
        className={styles.srOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {hasBookingUpdates
          ? `${bookingCount} ungelesene ${bookingCount === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'} zu deinen Anfragen.`
          : ''}
      </span>
    </>
  );
}
