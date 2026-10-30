import { SignUp } from '@clerk/react';
import { createFileRoute } from '@tanstack/react-router';
import styles from '../features/auth/clerkAppearance.module.css';
export const Route = createFileRoute('/sign-up')({
  component: () => (
    <div className={styles.authPage}>
      <SignUp routing="hash" fallbackRedirectUrl="/account/profile" signInUrl="/sign-in" />
    </div>
  ),
});
