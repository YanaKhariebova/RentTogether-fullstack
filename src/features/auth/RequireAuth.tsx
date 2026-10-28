import { useAuth } from '@clerk/react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Spinner } from '../../shared/ui/atoms/Spinner/Spinner';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Spinner />;
  if (!isSignedIn)
    return (
      <section>
        <h1>Bitte melde dich an</h1>
        <p>Dieser Bereich ist nur für angemeldete Mitglieder verfügbar.</p>
        <Link to="/sign-in">Anmelden</Link>
      </section>
    );
  return children;
}
