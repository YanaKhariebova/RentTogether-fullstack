import { useTranslation } from 'react-i18next';
import { translate as t } from '../i18n/config';
export function FeaturePlaceholder({ title }: { title: string }) {
  useTranslation();
  return (
    <section>
      <h1>{title}</h1>
      <p>
        {t(
          'Dieser Bereich wird gerade vorbereitet. Bald kannst du hier Dinge entdecken und gemeinsam nutzen.',
        )}
      </p>
    </section>
  );
}
