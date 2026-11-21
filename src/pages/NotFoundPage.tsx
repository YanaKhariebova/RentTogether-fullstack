import { useTranslation } from 'react-i18next';
import { translate as t } from '../i18n/config';
import { Link } from '@tanstack/react-router';
export function NotFoundPage() {
  useTranslation();
  return (
    <section>
      <h1>{t('Seite nicht gefunden')}</h1>
      <p>{t('Diese Seite gibt es leider nicht.')}</p>
      <Link to="/">{t('Zur Startseite')}</Link>
    </section>
  );
}
