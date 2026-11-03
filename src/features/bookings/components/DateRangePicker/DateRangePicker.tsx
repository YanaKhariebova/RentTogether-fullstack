import { useRef, useState } from 'react';
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
  onDatesChange?: () => void;
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
  onDatesChange,
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [sentRanges, setSentRanges] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const busy = sending || isSubmitting;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pickupDate = selectedRange?.from ? toDateString(selectedRange.from) : '';
  const returnDate = selectedRange?.to ? toDateString(selectedRange.to) : '';
  const rangeKey = pickupDate + '/' + returnDate;
  const isSubmitted = sentRanges.includes(rangeKey);
  async function submit() {
    if (submitting.current || busy || isSubmitted || !pickupDate || !returnDate || totalDays <= 0)
      return;
    submitting.current = true;
    setSending(true);
    try {
      await onSubmit({ pickupDate, returnDate });
      setSentRanges((current) => [...current, rangeKey]);
    } catch {
      // The mutation supplies the error message; unsuccessful requests remain retryable.
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }
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
  const formattedSelectedRange =
    selectedRange?.from && selectedRange.to
      ? `${selectedRange.from.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'short',
        })} – ${selectedRange.to.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'short',
        })}`
      : null;

  return (
    <section className={styles.picker}>
      <div>
        <h2>Zeitraum auswählen</h2>
        <p className={styles.hint}>Wähle Abhol- und Rückgabedatum aus.</p>
      </div>

      <div className={styles.selectionActions}>
        <Button
          className={styles.selectedPeriod}
          variant="secondary"
          aria-expanded={isCalendarOpen}
          aria-controls="booking-calendar"
          disabled={busy}
          onClick={() => {
            if (!isCalendarOpen && isSubmitted) {
              setSelectedRange(undefined);
              onDatesChange?.();
            }
            setIsCalendarOpen((current) => !current);
          }}
        >
          <span>
            {isCalendarOpen
              ? 'Kalender schließen'
              : formattedSelectedRange
                ? 'Zeitraum ändern'
                : 'Zeitraum auswählen'}
          </span>
          {formattedSelectedRange && (
            <span className={styles.periodSummary}>
              <span>{formattedSelectedRange}</span>
              <span>
                {totalDays} {totalDays === 1 ? 'Tag' : 'Tage'} · Gesamt: {formattedTotalPrice}
              </span>
            </span>
          )}
        </Button>
        <Button
          disabled={!pickupDate || !returnDate || totalDays <= 0 || busy || isSubmitted}
          onClick={() => void submit()}
        >
          {busy ? 'Anfrage wird gesendet…' : isSubmitted ? 'Anfrage gesendet' : 'Anfrage senden'}
        </Button>
      </div>

      {isCalendarOpen && (
        <div id="booking-calendar" className={styles.calendarPanel}>
          <DayPicker
            mode="range"
            locale={de}
            selected={selectedRange}
            onSelect={(range) => {
              setSelectedRange(range);
              onDatesChange?.();

              if (range?.from && range.to && range.to.getTime() > range.from.getTime()) {
                setIsCalendarOpen(false);
              }
            }}
            disabled={[{ before: today }, ...unavailableDateRanges]}
            excludeDisabled
            navLayout="around"
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
        </div>
      )}

      {isSubmitted && (
        <div className={styles.successNotice} role="status">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12 4.2 4.2L19 6.5" />
          </svg>
          <div>
            <strong>Anfrage gesendet</strong>
            <span>Du findest sie jetzt unter „Meine Mieten“.</span>
          </div>
        </div>
      )}
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </section>
  );
}
