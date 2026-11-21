import { useTranslation } from 'react-i18next';
import { LanguageProvider } from './i18n/LanguageProvider';
import { currentLanguage, translate as t } from './i18n/config';
import { ClerkProvider } from '@clerk/react';
import { deDE, enGB, ukUA, ruRU } from '@clerk/localizations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ConfigurationNotice } from './app/ConfigurationNotice';
import { router } from './app/router';
import { clerkAppearance } from './features/auth/clerkAppearance';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
function localizationForLanguage() {
  const base = { de: deDE, en: enGB, uk: ukUA, ru: ruRU }[currentLanguage()];
  return {
    ...base,
    formFieldInputPlaceholder__emailAddress: t('E-Mail-Adresse'),
    formFieldInputPlaceholder__emailAddress_username: t('E-Mail-Adresse oder Benutzername'),
    formFieldInputPlaceholder__password: t('Passwort'),
    formFieldInputPlaceholder__signUpPassword: t('Passwort'),
    formFieldInputPlaceholder__firstName: t('Vorname'),
    formFieldInputPlaceholder__lastName: t('Nachname'),
    formFieldInputPlaceholder__username: t('Benutzername'),
    signIn: {
      ...base.signIn,
      start: {
        ...base.signIn?.start,
        title: t('Willkommen bei RentTogether!'),
        subtitle: '',
      },
    },
    signUp: {
      ...base.signUp,
      start: {
        ...base.signUp?.start,
        subtitle: '',
      },
    },
  };
}

export default function App() {
  useTranslation();
  if (!publishableKey) return <ConfigurationNotice />;
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={localizationForLanguage()}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
