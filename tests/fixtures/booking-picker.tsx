import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { DateRangePicker } from '../../src/features/bookings/components/DateRangePicker/DateRangePicker';
export function Fixture() {
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  return (
    <main>
      <DateRangePicker
        pricePerDay="10"
        errorMessage={error}
        onDatesChange={() => setError(null)}
        onSubmit={async () => {
          setAttempts((value) => value + 1);
          if (location.search.includes('fail')) {
            setError('Bitte erneut versuchen.');
            throw new Error('Test failure');
          }
        }}
      />
      <output aria-label="Sendeversuche">{attempts}</output>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
