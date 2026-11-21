import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { createApiClient } from '@/shared/api/client';
import { LanguageContext } from './languageContext';
import { currentUserKey, useCurrentUser } from '@/features/profile/api/useCurrentUser';
import type { MeResponse } from '@/shared/api/types';
import { currentLanguage, i18n, isLanguage, selectLanguage, type Language } from './config';

function AccountLanguage({ children }: { children: ReactNode }) {
  useTranslation();
  const { userId, isSignedIn, getToken } = useAuth();
  const currentUser = useCurrentUser();
  const client = useQueryClient();
  const applied = useRef<string | null>(null);
  const chosen = useRef<string | null>(null);
  const latestUser = useRef(userId);
  useEffect(() => {
    latestUser.current = userId;
  }, [userId]);
  const save = useMutation({
    scope: { id: `language-${userId ?? 'guest'}` },
    mutationFn: async ({ language, accountId }: { language: Language; accountId: string }) => {
      const token = await getToken();
      if (!token || latestUser.current !== accountId) throw new Error('Account changed');
      return createApiClient(async () => token)<MeResponse>('/me', {
        method: 'PATCH',
        body: JSON.stringify({ preferredLocale: language }),
      });
    },
    onSuccess: (data, request) => {
      if (latestUser.current === request.accountId && request.language === currentLanguage())
        client.setQueryData(currentUserKey(request.accountId), data);
    },
    retry: false,
  });
  useEffect(() => {
    if (!isSignedIn || !userId) {
      applied.current = null;
      chosen.current = null;
      return;
    }
    if (!currentUser.data || applied.current === userId) return;
    applied.current = userId;
    const saved = currentUser.data.user.preferredLocale;
    if (chosen.current !== userId && isLanguage(saved)) void selectLanguage(saved);
  }, [currentUser.data, userId, isSignedIn]);
  return (
    <LanguageContext.Provider
      value={{
        choose: (language) => {
          void selectLanguage(language);
          if (isSignedIn && userId) {
            chosen.current = userId;
            save.mutate({ language, accountId: userId });
          }
        },
        saving: save.isPending && isSignedIn === true && save.variables?.accountId === userId,
        failed: save.isError && isSignedIn === true && save.variables?.accountId === userId,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <AccountLanguage>{children}</AccountLanguage>
    </I18nextProvider>
  );
}
