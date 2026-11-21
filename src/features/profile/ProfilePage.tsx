import { LanguagePicker } from '@/i18n/LanguagePicker';
import { useTranslation } from 'react-i18next';
import { translate as t } from '../../i18n/config';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { Link } from '@tanstack/react-router';
import { ApiError } from '../../shared/api/client';
import type { CurrentUser } from '../../shared/api/types';
import { Button, Input, Spinner } from '../../shared/ui/atoms';
import { useCurrentUser, useUpdateProfile } from './api/useCurrentUser';
import styles from './ProfilePage.module.css';

z.config(z.locales.de());

const schema = z.object({
  name: z.string().trim().min(1, 'Bitte gib deinen Namen ein.').max(100),
  city: z.string().trim().max(100),
  phone: z.string().trim().max(50),
});

function ProfileForm({ user }: { user: CurrentUser }) {
  useTranslation();
  const update = useUpdateProfile();
  const [fields, setFields] = useState<Record<string, string[]>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.reset();
    const result = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      setFields(z.flattenError(result.error).fieldErrors);
      return;
    }
    setFields({});
    try {
      await update.mutateAsync(result.data);
    } catch (error) {
      if (error instanceof ApiError) setFields(error.detail.fields);
    }
  }
  return (
    <form onSubmit={submit} className={styles.form}>
      <Input
        label={t('Name')}
        name="name"
        autoComplete="name"
        required
        maxLength={100}
        defaultValue={user.name}
        error={fields.name?.[0]}
      />
      <Input
        label={t('Stadt')}
        name="city"
        autoComplete="address-level2"
        maxLength={100}
        defaultValue={user.city}
        error={fields.city?.[0]}
      />
      <Input
        label={t('Telefonnummer')}
        name="phone"
        type="tel"
        autoComplete="tel"
        maxLength={50}
        defaultValue={user.phone}
        hint={t('Optional. Wird nicht in öffentlichen Anzeigen angezeigt.')}
        error={fields.phone?.[0]}
      />
      <Input
        label={t('E-Mail-Adresse')}
        type="email"
        value={user.email}
        readOnly
        hint={t('Du kannst deine E-Mail-Adresse über dein Benutzerkonto ändern.')}
      />
      {update.isError && <p role="alert">{t(update.error.message)}</p>}
      {update.isSuccess && (
        <p role="status" className={styles.success}>
          {t('Dein Profil wurde gespeichert.')}
        </p>
      )}
      <Button type="submit" loading={update.isPending}>
        {t('Änderungen speichern')}
      </Button>
    </form>
  );
}

export function ProfilePage() {
  useTranslation();
  const user = useCurrentUser();
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <h1>{t('Mein Profil')}</h1>
        {['MODERATOR', 'ADMIN'].includes(user.data?.user.role ?? '') && (
          <Link className={styles.moderationLink} to="/account/moderation">
            {t('Zur Moderation')}
          </Link>
        )}
      </div>
      <p>{t('So lernen dich andere Mitglieder kennen.')}</p>
      {user.isPending ? (
        <Spinner />
      ) : user.isError ? (
        <div role="alert">
          <p>{t(user.error.message)}</p>
          <Button onClick={() => void user.refetch()}>{t('Erneut versuchen')}</Button>
        </div>
      ) : (
        <>
          <div>
            <h2>{t('Sprache')}</h2>
            <LanguagePicker />
          </div>
          <ProfileForm key={user.data.user.id} user={user.data.user} />
        </>
      )}
    </section>
  );
}
