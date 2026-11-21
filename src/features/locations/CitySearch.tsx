import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { useEffect, useId, useState } from 'react';
import { z } from 'zod';
import { Input } from '@/shared/ui/atoms';
import { createApiClient } from '@/shared/api/client';
import styles from './CitySearch.module.css';

const api = createApiClient(async () => null);
const responseSchema = z.object({
  places: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      region: z.string(),
      country: z.string(),
      countryCode: z.string(),
      postcodes: z.array(z.string()),
    }),
  ),
});
type Place = z.infer<typeof responseSchema>['places'][number];

export function CitySearch({
  value,
  onChange,
  error,
  disabled = false,
}: {
  value: string;
  onChange: (city: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const query = value.trim();
  const noMatches = searched && !loading && !failure && query.length >= 2 && places.length === 0;
  const optionId = (place: Place) => id + '-' + encodeURIComponent(place.id);
  useEffect(() => {
    if (open && active >= 0 && places[active])
      document
        .getElementById(id + '-' + encodeURIComponent(places[active].id))
        ?.scrollIntoView({ block: 'nearest' });
  }, [active, open, places, id]);

  useEffect(() => {
    if (!open || query.length < 2 || disabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailure(null);
      try {
        const data = responseSchema.parse(
          await api<unknown>('/locations?q=' + encodeURIComponent(query), {
            signal: controller.signal,
          }),
        );
        if (!controller.signal.aborted) {
          setPlaces(data.places);
          setActive(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPlaces([]);
          setFailure(t('Ortssuche nicht erreichbar. Bitte versuche es erneut.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSearched(true);
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, disabled, retry]);

  function choose(place: Place) {
    onChange(place.name);
    setOpen(false);
    setFailure(null);
    setLoading(false);
  }
  return (
    <div
      className={styles.field}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Input
        id={id + '-input'}
        label={t('Ort *')}
        name="city"
        required
        maxLength={100}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && places.length > 0}
        aria-controls={id + '-results'}
        aria-activedescendant={
          open && active >= 0 ? (places[active] ? optionId(places[active]) : undefined) : undefined
        }
        autoComplete="off"
        value={value}
        error={
          error ??
          failure ??
          (noMatches
            ? t('Kein Ort gefunden. Prüfe die Schreibweise oder suche nach der Postleitzahl.')
            : undefined)
        }
        disabled={disabled}
        placeholder={t('Ortsname oder PLZ, z. B. Berlin oder 39104')}
        hint={t('Ort in Deutschland suchen und aus den Vorschlägen wählen.')}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.currentTarget.value);
          setOpen(true);
          setPlaces([]);
          setActive(-1);
          setSearched(false);
          setFailure(null);
          setLoading(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (!places.length || !open) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) =>
              event.key === 'ArrowDown'
                ? (current + 1) % places.length
                : current <= 0
                  ? places.length - 1
                  : current - 1,
            );
          }
          if (event.key === 'Enter' && active >= 0) {
            event.preventDefault();
            choose(places[active]!);
          }
        }}
      />
      {open && query.length >= 2 && (
        <div className={styles.dropdown}>
          {loading && <p role="status">{t('Orte werden gesucht …')}</p>}
          {failure ? (
            <div role="alert">
              <p>{failure}</p>
              <button type="button" onClick={() => setRetry((current) => current + 1)}>
                {t('Erneut versuchen')}
              </button>
            </div>
          ) : (
            <>
              <ul id={id + '-results'} role="listbox" aria-label={t('Ortsvorschläge')}>
                {places.map((place, index) => (
                  <li key={place.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={optionId(place)}
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(place)}
                    >
                      <strong>{place.name}</strong>
                      <span>
                        {[
                          place.region,
                          place.postcodes.includes(query)
                            ? query
                            : place.postcodes.slice(0, 2).join(', '),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!loading && searched && places.length === 0 && (
                <p role="status">
                  {t('Kein Ort gefunden. Prüfe die Schreibweise oder suche nach der Postleitzahl.')}
                </p>
              )}
            </>
          )}
          <small>
            {t('Ortsdaten:')}{' '}
            <a href="https://www.openplzapi.org/de/" target="_blank" rel="noreferrer">
              OpenPLZ API
            </a>
          </small>
        </div>
      )}
    </div>
  );
}
