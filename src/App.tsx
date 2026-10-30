import { ClerkProvider } from '@clerk/react';
import { deDE } from '@clerk/localizations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ConfigurationNotice } from './app/ConfigurationNotice';
import { router } from './app/router';
import { clerkAppearance } from './features/auth/clerkAppearance';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  if (!publishableKey) return <ConfigurationNotice />;
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={deDE}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
