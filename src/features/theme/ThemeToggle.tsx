import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { useTheme } from './theme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  useTranslation();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('Helles Design aktivieren') : t('Dunkles Design aktivieren');
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20.8 13a8.8 8.8 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z" />
        )}
      </svg>
    </button>
  );
}
