import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import { Link } from '@tanstack/react-router';
import { useApi } from '@/features/auth/api/useApi';
import { useCurrentUser } from '@/features/profile/api/useCurrentUser';
import { Button, Spinner } from '@/shared/ui/atoms';
import styles from './ModerationPage.module.css';

type Report = {
  id: string;
  reason: string;
  details: string;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  createdAt: string;
  item: { id: string; title: string; isPublished: boolean };
  reporter: { name: string; email: string };
};

export function ModerationPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  const me = useCurrentUser();
  const reports = useQuery({
    queryKey: ['moderation', 'reports'],
    queryFn: () => api<{ reports: Report[] }>('/moderation/reports?status=OPEN'),
    enabled: isLoaded && !!isSignedIn && ['MODERATOR', 'ADMIN'].includes(me.data?.user.role ?? ''),
  });
  const refresh = () => client.invalidateQueries({ queryKey: ['moderation', 'reports'] });
  const hide = useMutation({
    mutationFn: (id: string) => api(`/moderation/reports/${id}/hide-item`, { method: 'POST' }),
    onSuccess: refresh,
  });
  const dismiss = useMutation({
    mutationFn: (id: string) =>
      api(`/moderation/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DISMISSED' }),
      }),
    onSuccess: refresh,
  });

  if (me.isPending) return <Spinner label="Moderation wird geladen …" />;
  if (!['MODERATOR', 'ADMIN'].includes(me.data?.user.role ?? ''))
    return (
      <section className={styles.page}>
        <h1>Kein Zugriff</h1>
        <p>Diese Seite ist nur für Moderatoren.</p>
      </section>
    );
  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <h1>Moderation</h1>
        <Link className={styles.profileLink} to="/account/profile">
          Mein Profil
        </Link>
      </div>
      <p>Offene Meldungen</p>
      {reports.isPending ? (
        <Spinner />
      ) : reports.isError ? (
        <div role="alert">
          <p>Meldungen konnten nicht geladen werden.</p>
          <Button onClick={() => void reports.refetch()}>Erneut versuchen</Button>
        </div>
      ) : reports.data?.reports.length === 0 ? (
        <p className={styles.empty}>Keine offenen Meldungen.</p>
      ) : (
        <div className={styles.list}>
          {reports.data?.reports.map((report) => (
            <article key={report.id} className={styles.card}>
              <div>
                <strong>{report.reason}</strong>
                <p>{report.details || 'Keine zusätzlichen Angaben.'}</p>
                <small>
                  Gemeldet von {report.reporter.name} ·{' '}
                  {new Intl.DateTimeFormat('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(report.createdAt))}
                </small>
              </div>
              <Link to="/items/$itemId" params={{ itemId: report.item.id }}>
                {report.item.title}
              </Link>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  disabled={dismiss.isPending || hide.isPending}
                  onClick={() => dismiss.mutate(report.id)}
                >
                  Ablehnen
                </Button>
                <Button
                  disabled={dismiss.isPending || hide.isPending}
                  onClick={() => hide.mutate(report.id)}
                >
                  Anzeige verbergen
                </Button>
              </div>
              {(dismiss.isError || hide.isError) && (
                <p role="alert">Aktion konnte nicht ausgeführt werden.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
