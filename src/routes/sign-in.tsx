import { SignIn } from '@clerk/react';
import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/sign-in')({
  component: () => (
    <SignIn routing="hash" fallbackRedirectUrl="/account/profile" signUpUrl="/sign-up" />
  ),
});
