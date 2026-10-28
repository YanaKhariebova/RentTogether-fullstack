import { useAuth, UserButton } from '@clerk/react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import logo from '../../../assets/renttogether-icon.svg';
import styles from './Header.module.css';

const navigation = [
  { to: '/catalog', label: 'Entdecken' },
  { to: '/account/items', label: 'Meine Anzeigen' },
  { to: '/account/requests', label: 'Anfragen' },
  { to: '/account/profile', label: 'Profil' },
] as const;

export function Header() {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <HeaderView
      auth={isLoaded && (isSignedIn ? <UserButton /> : <Link to="/sign-in">Anmelden</Link>)}
    />
  );
}

export function HeaderView({ auth }: { auth: ReactNode }) {
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
            {navigation.map(({ to, label }) => (
              <Link key={to} to={to} activeProps={{ 'aria-current': 'page' }}>
                {label}
              </Link>
            ))}
          </nav>
          <div className={styles.auth}>{auth}</div>
        </div>
      </header>
      <nav aria-label="Mobile Navigation" className={styles.mobile}>
        {navigation.map(({ to, label }) => (
          <Link key={to} to={to} activeProps={{ 'aria-current': 'page' }}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
