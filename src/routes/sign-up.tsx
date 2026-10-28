import { SignUp } from '@clerk/react';
import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/sign-up')({
  component: () => (
    <SignUp routing="hash" fallbackRedirectUrl="/account/profile" signInUrl="/sign-in" />
  ),
});
