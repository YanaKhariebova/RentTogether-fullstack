import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '../../src/index.css';
import { CitySearch } from '../../src/features/locations/CitySearch';
import { ThemeToggle } from '../../src/features/theme/ThemeToggle';
export function Fixture() {
  const [city, setCity] = useState('');
  return (
    <main style={{ maxWidth: 450, margin: '20px auto', padding: 16 }}>
      <ThemeToggle />
      <form onSubmit={(event) => event.preventDefault()}>
        <CitySearch value={city} onChange={setCity} />
        <output aria-label="Gewählter Ort">{city}</output>
      </form>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
