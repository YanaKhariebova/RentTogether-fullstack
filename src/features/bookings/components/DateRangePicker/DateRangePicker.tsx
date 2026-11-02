import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { de } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { Button } from '@/shared/ui/atoms';
import styles from './DateRangePicker.module.css';

type DateRangePickerProps = {
  pricePerDay: string;
  unavailableRanges?: {
    pickupDate: string;
    returnDate: string;
  }[];
  onSubmit: (dates: { pickupDate: string; returnDate: string }) => Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSubmitted?: boolean;
};

function toLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function dayBefore(date: string) {
  const result = toLocalDate(date);
  result.setDate(result.getDate() - 1);

  return result;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function DateRangePicker({
  pricePerDay,
  unavailableRanges = [],
  onSubmit,
  isSubmitting = false,
  errorMessage,
  isSubmitted = false,
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = selectedRange?.from ? toDateString(selectedRange.from) : '';
  const returnDate = selectedRange?.to ? toDateString(selectedRange.to) : '';
  const unavailableDateRanges = unavailableRanges.map((range) => ({
    from: toLocalDate(range.pickupDate),
    // The return day is available for the next pickup and is not charged.
    to: dayBefore(range.returnDate),
  }));
  const totalDays =
    selectedRange?.from && selectedRange.to
      ? Math.round(
          (selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;
  const totalPrice = totalDays * Number(pricePerDay);
  const formattedTotalPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalPrice);

  return (
    <section className={styles.picker}>
      <div>
        <h2>Zeitraum auswählen</h2>
        <p className={styles.hint}>Wähle Abhol- und Rückgabedatum aus.</p>
      </div>

      <DayPicker
        mode="range"
        locale={de}
        selected={selectedRange}
        onSelect={(range) => {
          setSelectedRange(range);
        }}
        disabled={[{ before: today }, ...unavailableDateRanges]}
        excludeDisabled
        modifiers={{ unavailable: unavailableDateRanges }}
        modifiersClassNames={{ unavailable: styles.unavailableDay }}
        weekStartsOn={1}
        className={styles.calendar}
      />

      {unavailableDateRanges.length > 0 && (
        <p className={styles.legend}>
          <span aria-hidden="true" /> Bereits vergeben
        </p>
      )}

      {pickupDate && returnDate && totalDays > 0 && (
        <p className={styles.total}>
          {totalDays} {totalDays === 1 ? 'Tag' : 'Tage'} · Gesamt: {formattedTotalPrice}
        </p>
      )}

      <Button
        disabled={!pickupDate || !returnDate || totalDays === 0 || isSubmitting}
        onClick={() => void onSubmit({ pickupDate, returnDate })}
      >
        {isSubmitting ? 'Anfrage wird gesendet…' : 'Anfrage senden'}
      </Button>

      {isSubmitted && <p role="status">Deine Anfrage wurde gesendet.</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </section>
  );
}
