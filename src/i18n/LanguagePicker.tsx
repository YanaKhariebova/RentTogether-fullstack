import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { currentLanguage, isLanguage, languages, translate as t } from './config';
import { useLanguagePreference } from './languageContext';
import styles from './LanguagePicker.module.css';
export function LanguagePicker() {
  useTranslation();
  const id = useId();
  const { choose, saving, failed } = useLanguagePreference();
  return (
    <div className={styles.picker}>
      <label htmlFor={id} className={styles.label}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18" />
        </svg>
        <span className={styles.srOnly}>{t('Sprache wählen')} / Language</span>
        <select
          id={id}
          value={currentLanguage()}
          onChange={(event) => {
            if (isLanguage(event.target.value)) choose(event.target.value);
          }}
          aria-describedby={failed || saving ? `${id}-status` : undefined}
        >
          {languages.map(({ code, name }) => (
            <option key={code} value={code} lang={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <span
        id={`${id}-status`}
        role={failed ? 'alert' : 'status'}
        className={failed ? styles.error : styles.srOnly}
      >
        {failed
          ? t(
              'Die Sprache wurde auf diesem Gerät geändert, konnte aber nicht im Konto gespeichert werden.',
            )
          : saving
            ? t('Sprache wird gespeichert …')
            : ''}
      </span>
      {failed && (
        <button type="button" className={styles.retry} onClick={() => choose(currentLanguage())}>
          {t('Erneut versuchen')}
        </button>
      )}
    </div>
  );
}
