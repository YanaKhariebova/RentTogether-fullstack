import { useId } from "react";
import styles from "./ImageUploader.module.css";

interface ImageUploaderProps {
  accept: string;
  disabled?: boolean;
  error?: string;
  onFilesSelected: (files: File[]) => void;
}

export function ImageUploader({ accept, disabled = false, error, onFilesSelected }: ImageUploaderProps) {
  const hintId = useId();
  return (
    <div className={styles.uploader}>
      <label className={styles.label}>
        Fotos auswählen
        <input className={styles.input} type="file" accept={accept} multiple disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={`${hintId}${error ? ` ${hintId}-error` : ""}`}
          onChange={(event) => {
            onFilesSelected(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }} />
      </label>
      <p className={styles.hint} id={hintId}>JPEG, PNG oder WebP. Maximal 5 MB pro Foto, bis zu 8 Fotos.</p>
      {error && <p className={styles.error} id={`${hintId}-error`}>{error}</p>}
    </div>
  );
}
