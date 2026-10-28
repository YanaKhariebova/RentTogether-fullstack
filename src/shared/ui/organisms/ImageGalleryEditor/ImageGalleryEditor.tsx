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
  if (images.length === 0) return <p>Noch keine Fotos. Füge dein erstes Foto hinzu.</p>;
  return (
    <ol className={styles.gallery} aria-label="Fotos und Reihenfolge">
      {images.map((image, index) => (
        <li className={styles.card} key={image.id}>
          <img className={styles.photo} src={image.url} alt={`Foto ${index + 1}: ${image.name}`} />
          <p className={styles.name}>
            {index === 0 ? 'Titelbild' : `Foto ${index + 1}`} · {image.name}
          </p>
          <div className={styles.actions}>
            <Button
              type="button"
              disabled={index === 0}
              onClick={() => onMove(image.id, -1)}
              aria-label={`Foto ${index + 1} nach vorne verschieben`}
            >
              ←
            </Button>
            <Button
              type="button"
              disabled={index === images.length - 1}
              onClick={() => onMove(image.id, 1)}
              aria-label={`Foto ${index + 1} nach hinten verschieben`}
            >
              →
            </Button>
            <Button
              type="button"
              onClick={() => onRemove(image.id)}
              aria-label={`Foto ${index + 1} entfernen`}
            >
              Entfernen
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
