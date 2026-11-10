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
        label="Name"
        name="name"
        autoComplete="name"
        required
        maxLength={100}
        defaultValue={user.name}
        error={fields.name?.[0]}
      />
      <Input
        label="Stadt"
        name="city"
        autoComplete="address-level2"
        maxLength={100}
        defaultValue={user.city}
        error={fields.city?.[0]}
      />
      <Input
        label="Telefonnummer"
        name="phone"
        type="tel"
        autoComplete="tel"
        maxLength={50}
        defaultValue={user.phone}
        hint="Optional. Wird nicht in öffentlichen Anzeigen angezeigt."
        error={fields.phone?.[0]}
      />
      <Input
        label="E-Mail-Adresse"
        type="email"
        value={user.email}
        readOnly
        hint="Du kannst deine E-Mail-Adresse über dein Benutzerkonto ändern."
      />
      {update.isError && <p role="alert">{update.error.message}</p>}
      {update.isSuccess && (
        <p role="status" className={styles.success}>
          Dein Profil wurde gespeichert.
        </p>
      )}
      <Button type="submit" loading={update.isPending}>
        Änderungen speichern
      </Button>
    </form>
  );
}

export function ProfilePage() {
  const user = useCurrentUser();
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <h1>Mein Profil</h1>
        {['MODERATOR', 'ADMIN'].includes(user.data?.user.role ?? '') && (
          <Link className={styles.moderationLink} to="/account/moderation">
            Zur Moderation
          </Link>
        )}
      </div>
      <p>So lernen dich andere Mitglieder kennen.</p>
      {user.isPending ? (
        <Spinner />
      ) : user.isError ? (
        <div role="alert">
          <p>{user.error.message}</p>
          <Button onClick={() => void user.refetch()}>Erneut versuchen</Button>
        </div>
      ) : (
        <>
          <ProfileForm key={user.data.user.id} user={user.data.user} />
        </>
      )}
    </section>
  );
}
