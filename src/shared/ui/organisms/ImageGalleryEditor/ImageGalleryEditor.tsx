import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import { Button } from '@/shared/ui/atoms';
import styles from './ImageGalleryEditor.module.css';

interface GalleryImage {
  id: string;
  url: string;
  name: string;
}
interface ImageGalleryEditorProps {
  images: GalleryImage[];
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

export function ImageGalleryEditor({ images, onRemove, onMove }: ImageGalleryEditorProps) {
  useTranslation();
  if (images.length === 0) return <p>{t('Noch keine Fotos. Füge dein erstes Foto hinzu.')}</p>;
  return (
    <ol className={styles.gallery} aria-label={t('Fotos und Reihenfolge')}>
      {images.map((image, index) => (
        <li className={styles.card} key={image.id}>
          <img
            className={styles.photo}
            src={image.url}
            alt={t('Foto {{value0}}: {{value1}}', { value0: index + 1, value1: image.name })}
          />
          <p className={styles.name}>
            {index === 0 ? t('Titelbild') : t('Foto {{value0}}', { value0: index + 1 })} ·{' '}
            {image.name}
          </p>
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(image.id, -1)}
              aria-label={t('Foto {{value0}} nach vorne verschieben', { value0: index + 1 })}
            >
              ←
            </Button>
            <Button
              type="button"
              disabled={index === images.length - 1}
              onClick={() => onMove(image.id, 1)}
              aria-label={t('Foto {{value0}} nach hinten verschieben', { value0: index + 1 })}
            >
              →
            </Button>
            <Button
              type="button"
              onClick={() => onRemove(image.id)}
              variant="danger"
              aria-label={t('Foto {{value0}} entfernen', { value0: index + 1 })}
            >
              {t('Entfernen')}
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
