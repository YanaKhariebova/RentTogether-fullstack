// This alias is used only by the isolated i18n test server, never production.
import { useSyncExternalStore } from 'react';
const account = () =>
  (window as unknown as { languageTestAccount?: string }).languageTestAccount ??
  new URLSearchParams(location.search).get('account') ??
  'guest';
const subscribe = (listener: () => void) => {
  window.addEventListener('language-test-account', listener);
  return () => window.removeEventListener('language-test-account', listener);
};
const getToken = async () => (account() === 'guest' ? null : account());
export const useAuth = () => {
  const user = useSyncExternalStore(subscribe, account);
  return {
    isLoaded: true,
    isSignedIn: user !== 'guest',
    userId: user === 'guest' ? null : user,
    getToken,
  };
};
