import { SignIn } from '@clerk/react';
import { createFileRoute } from '@tanstack/react-router';
import styles from '../features/auth/clerkAppearance.module.css';
export const Route = createFileRoute('/sign-in')({
  component: () => (
    <div className={styles.authPage}>
      <SignIn routing="hash" fallbackRedirectUrl="/account/profile" signUpUrl="/sign-up" />
    </div>
  ),
});
