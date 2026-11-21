import { useTranslation } from 'react-i18next';
import { translate as t } from '../../../../i18n/config';
import { Input } from '@/shared/ui/atoms';
import styles from './ImageUploader.module.css';
interface ImageUploaderProps {
  accept: string;
  disabled?: boolean;
  error?: string;
  onFilesSelected: (files: File[]) => void;
}
export function ImageUploader({
  accept,
  disabled = false,
  error,
  onFilesSelected,
}: ImageUploaderProps) {
  useTranslation();
  const formatsHint = t(
    'Erlaubte Formate: JPG/JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp). Maximal 5 MB pro Foto, bis zu 8 Fotos. HEIC, GIF und PDF werden nicht unterstützt.',
  );
  return (
    <div className={styles.uploader}>
      <Input
        label={t('Fotos auswählen')}
        name="images"
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        error={error}
        hint={formatsHint}
        onChange={(event) => {
          onFilesSelected(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = '';
        }}
      />
      {error && <p className={styles.hint}>{formatsHint}</p>}
    </div>
  );
}
