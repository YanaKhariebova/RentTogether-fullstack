import { useAuth } from '@clerk/react';
import { Link, useLocation } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Spinner } from '../../shared/ui/atoms/Spinner/Spinner';
import styles from './RequireAuth.module.css';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { pathname } = useLocation();
  const section = getSection(pathname);
  if (!isLoaded) return <Spinner />;
  if (!isSignedIn)
    return (
      <section className={styles.page} aria-labelledby="sign-in-required-title">
        <div className={styles.card}>
          <div className={styles.icon} aria-hidden="true">
            <SectionIcon icon={section.icon} />
          </div>
          <p className={styles.eyebrow}>Schön, dass du da bist</p>
          <h1 id="sign-in-required-title">{section.title}</h1>
          <p className={styles.description}>{section.description}</p>
          <div className={styles.actions}>
            <Link className={styles.signInLink} to="/sign-in">
              Jetzt anmelden
              <span aria-hidden="true">→</span>
            </Link>
            <p className={styles.signUpHint}>
              Noch kein Konto? <Link to="/sign-up">Jetzt registrieren</Link>
            </p>
          </div>
        </div>
      </section>
    );
  return children;
}

type Section = {
  icon: 'heart' | 'chat' | 'calendar';
  title: string;
  description: string;
};

function getSection(pathname: string): Section {
  if (pathname.startsWith('/account/favorites')) {
    return {
      icon: 'heart',
      title: 'Deine Favoriten warten auf dich',
      description: 'Melde dich an, um deine gespeicherten Dinge wiederzufinden.',
    };
  }
  if (pathname.startsWith('/account/messages')) {
    return {
      icon: 'chat',
      title: 'Bleib mit deiner Nachbarschaft in Kontakt',
      description: 'Melde dich an, um Nachrichten zu Anfragen und Ausleihen zu sehen.',
    };
  }
  if (pathname.startsWith('/account/bookings')) {
    return {
      icon: 'calendar',
      title: 'Deine Anfragen warten auf dich',
      description: 'Melde dich an, um deine Mieten und eingehenden Anfragen zu verwalten.',
    };
  }
  return {
    icon: 'heart',
    title: 'Melde dich an, um weiterzumachen',
    description: 'Melde dich an, um deine Nachbarschaft zu entdecken.',
  };
}

function SectionIcon({ icon }: Pick<Section, 'icon'>) {
  if (icon === 'chat') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.7-.85L4 19l.9-3.2A7.2 7.2 0 0 1 4 12a7.5 7.5 0 0 1 8-7.5 7.5 7.5 0 0 1 8 7Z" />
        <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
        <path
          d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 8.9c0 5-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.9A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.8 2.9Z" />
    </svg>
  );
}
