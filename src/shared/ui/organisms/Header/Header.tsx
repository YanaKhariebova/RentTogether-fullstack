import { useAuth, useClerk, UserButton } from '@clerk/react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton } from '../../atoms';
import { ThemeToggle } from '../../../../features/theme/ThemeToggle';
import logo from '../../../assets/renttogether-icon.svg';
import styles from './Header.module.css';
import { NavigationIcon } from './NavigationIcon';

const navigation = [
  { to: '/catalog', label: 'Entdecken', icon: 'search' },
  { to: '/account/items', label: 'Meine Anzeigen', icon: 'grid' },
  { to: '/account/favorites', label: 'Favoriten', icon: 'heart' },
  { to: '/account/bookings', label: 'Anfragen', icon: 'chat' },
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
  onSignOut,
}: {
  auth: ReactNode;
  signedIn?: boolean;
  authLoaded?: boolean;
  onSignOut?: () => void;
}) {
  const panel = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
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
          <Link to="/" className={styles.brand}>
            <img src={logo} alt="" width={40} height={34} />
            <span>
              RentTogether<span className={styles.tagline}>Weniger kaufen. Mehr teilen.</span>
            </span>
          </Link>
          <nav aria-label="Hauptnavigation" className={styles.desktop}>
            {navigation.map(({ to, label, icon }) => (
              <Link key={to} to={to} title={label} activeProps={{ 'aria-current': 'page' }}>
                <NavigationIcon name={icon} />
                <span className={styles.navLabel}>{label}</span>
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
            <Link key={to} to={to} activeProps={{ 'aria-current': 'page' }}>
              <NavigationIcon name={icon} />
              <span>{label}</span>
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
          <span>Darstellung</span>
          <ThemeToggle />
          {authLoaded ? (
            <Link to={signedIn ? '/account/profile' : '/sign-in'} onClick={close}>
              {signedIn ? 'Mein Profil' : 'Anmelden'}
            </Link>
          ) : (
            <span role="status">Konto wird geladen …</span>
          )}
          {signedIn && onSignOut && (
            <Button
              variant="secondary"
              onClick={() => {
                close();
                onSignOut();
              }}
            >
              Abmelden
            </Button>
          )}
        </div>
      </dialog>
      <nav aria-label="Mobile Navigation" className={styles.mobile}>
        {navigation
          .filter(({ to }) => ['/catalog', '/account/items', '/account/bookings'].includes(to))
          .map(({ to, label, icon }) => (
            <Link key={to} to={to} activeProps={{ 'aria-current': 'page' }}>
              <NavigationIcon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
      </nav>
    </>
  );
}
