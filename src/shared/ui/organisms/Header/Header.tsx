import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton } from '../../atoms';
import logo from '../../../assets/renttogether-icon.svg';
import styles from './Header.module.css';
import { NavigationIcon } from './NavigationIcon';

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

export function HeaderView({
  auth,
  signedIn = false,
  authLoaded = true,
  avatarUrl,
  avatarName,
  onSignOut,
  bookingUnreadCount,
  messageUnreadCount,
  notificationBadge,
  themeToggle,
}: {
  auth: ReactNode;
  signedIn?: boolean;
  authLoaded?: boolean;
  avatarUrl?: string;
  avatarName?: string;
  onSignOut?: () => void;
  bookingUnreadCount?: number;
  messageUnreadCount?: number;
  notificationBadge?: (count: number) => ReactNode;
  themeToggle?: ReactNode;
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
        {notificationBadge?.(bookingCount)}
      </span>
    ) : null;
  const messageBadge = (to: string) =>
    to === '/account/messages' && hasMessageUpdates ? (
      <span className={styles.bookingBadge}>
        {notificationBadge?.(messageCount)}
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
            {themeToggle}
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
            {hasMessageUpdates && <span className={styles.messageDot} aria-hidden="true" />}
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
            {themeToggle}
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
