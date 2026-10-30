import { useSyncExternalStore } from 'react';

const storageKey = 'renttogether-theme';
const changeEvent = 'renttogether:theme-change';
type Theme = 'light' | 'dark';

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return;
    document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
    onChange();
  }
  window.addEventListener(changeEvent, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light' as const);
  function toggleTheme() {
    const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Switching still works for this page when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
  }
  return { theme, toggleTheme };
}
