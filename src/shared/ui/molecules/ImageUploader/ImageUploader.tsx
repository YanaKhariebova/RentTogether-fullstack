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
  return (
    <div className={styles.uploader}>
      <Input
        label="Fotos auswählen"
        name="images"
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        error={error}
        hint="JPEG, PNG oder WebP. Maximal 5 MB pro Foto, bis zu 8 Fotos."
        onChange={(event) => {
          onFilesSelected(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
