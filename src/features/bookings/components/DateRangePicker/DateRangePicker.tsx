import { useState } from 'react';
import { Button, Input } from '@/shared/ui/atoms';
import styles from './DateRangePicker.module.css';

type DateRangePickerProps = {
  pricePerDay: string;
};

export function DateRangePicker({ pricePerDay }: DateRangePickerProps) {
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const dateError =
    pickupDate && returnDate && returnDate <= pickupDate
      ? 'Das Rückgabedatum muss nach dem Abholdatum liegen.'
      : undefined;
  const totalDays =
    pickupDate && returnDate && !dateError
      ? Math.round(
          (new Date(`${returnDate}T00:00:00`).getTime() -
            new Date(`${pickupDate}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
  const totalPrice = totalDays * Number(pricePerDay);
  const formattedTotalPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalPrice);

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

      {totalDays > 0 && (
        <p className={styles.total}>
          {totalDays} {totalDays === 1 ? 'Tag' : 'Tage'} · Gesamt: {formattedTotalPrice}
        </p>
      )}

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
