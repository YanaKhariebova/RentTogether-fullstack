import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { currentLanguage, languages, translate as t } from './config';
import { useLanguagePreference } from './languageContext';
import styles from './LanguagePicker.module.css';
export function LanguagePicker() {
  useTranslation();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const language = currentLanguage();
  const selected = languages.find(({ code }) => code === language)!;
  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 1024px)');
    const close = () => dialog.current?.close();
    breakpoint.addEventListener('change', close);
    return () => breakpoint.removeEventListener('change', close);
  }, []);
  const { choose, saving, failed } = useLanguagePreference();
  return (
    <div className={styles.picker}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        data-language={language}
        aria-label={`${t('Sprache wählen')}: ${selected.name}`}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-describedby={failed || saving ? `${id}-status` : undefined}
        onClick={() => {
          dialog.current?.showModal();
          dialog.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
        }}
      >
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
        <span lang={language}>{selected.name}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          id={id}
          className={styles.dialog}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-description`}
          onKeyDown={(event) => event.stopPropagation()}
          onCancel={(event) => event.stopPropagation()}
          onClose={(event) => {
            event.stopPropagation();
            if (trigger.current?.getClientRects().length) trigger.current.focus();
          }}
          onClick={(event) => {
            event.stopPropagation();
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              dialog.current?.close();
          }}
        >
          <div className={styles.heading}>
            <h2 id={`${id}-title`}>{t('Sprache wählen')}</h2>
            <button
              type="button"
              className={styles.close}
              aria-label={t('Sprachauswahl schließen')}
              onClick={() => dialog.current?.close()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p id={`${id}-description`} className={styles.description}>
            {t('Wähle die Sprache für RentTogether.')}
          </p>
          <div className={styles.languages}>
            {languages.map(({ code, name }) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={code === language}
                className={styles.option}
                onClick={() => {
                  choose(code);
                  dialog.current?.close();
                }}
              >
                <span>{name}</span>
                {code === language && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </dialog>,
        document.body,
      )}
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
