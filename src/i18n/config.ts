import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const languages = [
  { code: 'de', name: 'Deutsch', locale: 'de-DE' },
  { code: 'en', name: 'English', locale: 'en-GB' },
  { code: 'uk', name: 'Українська', locale: 'uk-UA' },
  { code: 'ru', name: 'Русский', locale: 'ru-RU' },
] as const;
export type Language = (typeof languages)[number]['code'];
export const languageStorageKey = 'renttogether-language';
export function isLanguage(value: unknown): value is Language {
  return languages.some((language) => language.code === value);
}
export function resolveLanguage(candidates: readonly string[]): Language {
  for (const candidate of candidates) {
    const code = candidate.toLowerCase().split('-')[0];
    if (isLanguage(code)) return code;
  }
  return 'de';
}
export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    uk: { translation: uk },
    ru: { translation: ru },
  },
  lng: 'de',
  fallbackLng: 'de',
  supportedLngs: languages.map((language) => language.code),
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});
export function currentLanguage(): Language {
  return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'de';
}
export function formatLocale() {
  return languages.find((language) => language.code === currentLanguage())!.locale;
}
// Resolve previously displayed interface feedback after a language change.
// User descriptions and messages never pass through this function.
const sourceKeys = new Map<string, string>();
for (const dictionary of [de, en, ru, uk])
  for (const [key, value] of Object.entries(dictionary)) {
    if (!sourceKeys.has(value)) sourceKeys.set(value, key);
  }
export function translate(key: string, values?: Record<string, unknown>): string {
  const source = Object.hasOwn(de, key) ? key : (sourceKeys.get(key) ?? key);
  return String(i18n.t(source, { defaultValue: key, ...values }));
}
export async function selectLanguage(language: Language) {
  await i18n.changeLanguage(language);
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    /* Storage may be disabled. */
  }
}
export async function initializeLanguage() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(languageStorageKey);
  } catch {
    /* Use browser language. */
  }
  await selectLanguage(isLanguage(saved) ? saved : resolveLanguage(navigator.languages));
  window.addEventListener('storage', (event) => {
    if (event.key === languageStorageKey && isLanguage(event.newValue))
      void selectLanguage(event.newValue);
  });
}
