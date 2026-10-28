import { useState } from 'react';
import { Button, Input } from '@/shared/ui/atoms';
import styles from './DateRangePicker.module.css';

export function DateRangePicker() {
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const dateError =
    pickupDate && returnDate && returnDate <= pickupDate
      ? 'Das Rückgabedatum muss nach dem Abholdatum liegen.'
      : undefined;

  return (
    <section className={styles.picker}>
      <h2>Zeitraum auswählen</h2>

      <Input
        label="Abholdatum"
        type="date"
        value={pickupDate}
        onChange={(event) => setPickupDate(event.target.value)}
      />

      <Input
        label="Rückgabedatum"
        type="date"
        value={returnDate}
        min={pickupDate || undefined}
        error={dateError}
        onChange={(event) => setReturnDate(event.target.value)}
      />

      <Button
        disabled={!pickupDate || !returnDate || Boolean(dateError)}
        onClick={() => setIsRequestSent(true)}
      >
        Anfrage senden
      </Button>

      {isRequestSent && <p role="status">Deine Anfrage wurde gesendet.</p>}
    </section>
  );
}
