import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/features/auth/api/useApi';
import { useCurrentUser } from '@/features/profile/api/useCurrentUser';
import { Button, Spinner } from '@/shared/ui/atoms';
import { ApiError } from '@/shared/api/client';
import styles from './ModerationPage.module.css';

type Report = {
  id: string;
  reason: string;
  details: string;
  createdAt: string;
  item: { id: string; title: string; isPublished: boolean };
  reporter: { name: string; email: string };
};
type TrashItem = { id: string; title: string; moderationRemovedAt: string };
type PendingAction =
  | { kind: 'dismiss' | 'remove'; report: Report }
  | { kind: 'delete'; item: TrashItem }
  | { kind: 'empty' }
  | null;

export function ModerationPage({ showTrash = false }: { showTrash?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const client = useQueryClient();
  const me = useCurrentUser();
  const enabled =
    isLoaded && !!isSignedIn && ['MODERATOR', 'ADMIN'].includes(me.data?.user.role ?? '');
  const reports = useQuery({
    queryKey: ['moderation', 'reports'],
    queryFn: () => api<{ reports: Report[] }>('/moderation/reports?status=OPEN'),
    enabled,
  });
  const trash = useQuery({
    queryKey: ['moderation', 'trash'],
    queryFn: () => api<{ items: TrashItem[] }>('/moderation/trash'),
    enabled,
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    void client.invalidateQueries({ queryKey: ['moderation', 'trash'] });
  };
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
  const restore = useMutation({
    mutationFn: (id: string) => api(`/moderation/trash/${id}/restore`, { method: 'POST' }),
    onSuccess: refresh,
  });
  const deleteForever = useMutation({
    mutationFn: (id: string) => api(`/moderation/trash/${id}/permanent`, { method: 'DELETE' }),
    onSuccess: refresh,
  });
  const emptyTrash = useMutation({
    mutationFn: () => api('/moderation/trash/permanent', { method: 'DELETE' }),
    onSuccess: refresh,
  });
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const busy =
    dismiss.isPending ||
    hide.isPending ||
    restore.isPending ||
    deleteForever.isPending ||
    emptyTrash.isPending;
  const actionError = [
    dismiss.error,
    hide.error,
    restore.error,
    deleteForever.error,
    emptyTrash.error,
  ].find((error) => error != null);
  useEffect(() => {
    if (pendingAction && !dialog.current?.open) dialog.current?.showModal();
    if (!pendingAction && dialog.current?.open) dialog.current.close();
  }, [pendingAction]);

  if (me.isPending) return <Spinner label="Moderation wird geladen …" />;
  if (!['MODERATOR', 'ADMIN'].includes(me.data?.user.role ?? '')) {
    return (
      <section className={styles.page}>
        <h1>Kein Zugriff</h1>
        <p>Diese Seite ist nur für Moderatoren.</p>
      </section>
    );
  }
  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <h1>{showTrash ? 'Papierkorb' : 'Moderation'}</h1>
        <Link
          className={styles.profileLink}
          to={showTrash ? '/account/moderation' : '/account/profile'}
        >
          {showTrash ? 'Zur Moderation' : 'Mein Profil'}
        </Link>
      </div>
      {!showTrash && (
        <>
          <p>Offene Meldungen</p>
          {reports.isPending ? <Spinner /> : null}
          {reports.isError ? (
            <div role="alert">
              <p>Meldungen konnten nicht geladen werden.</p>
              <Button onClick={() => void reports.refetch()}>Erneut versuchen</Button>
            </div>
          ) : null}
          {reports.data?.reports.length === 0 ? (
            <p className={styles.empty}>Keine offenen Meldungen.</p>
          ) : null}
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
                    disabled={busy}
                    onClick={() => setPendingAction({ kind: 'dismiss', report })}
                  >
                    Meldung ablehnen
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => setPendingAction({ kind: 'remove', report })}
                  >
                    Anzeige von der Seite entfernen
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <Link className={styles.trashLink} to="/account/trash">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m-8 0 1 13h8l1-13" />
            </svg>
            Papierkorb öffnen
          </Link>
        </>
      )}
      {showTrash && (
        <section className={styles.trash} aria-labelledby="trash-title">
          <div className={styles.trashHeading}>
            <h2 id="trash-title">
              <svg className={styles.trashIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m-8 0 1 13h8l1-13" />
              </svg>
              Papierkorb
            </h2>
            {trash.data?.items.length ? (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setPendingAction({ kind: 'empty' })}
              >
                Papierkorb endgültig leeren
              </Button>
            ) : null}
          </div>
          {trash.isPending ? <Spinner label="Papierkorb wird geladen …" /> : null}
          {trash.data?.items.length === 0 ? (
            <p className={styles.emptyTrash}>Der Papierkorb ist leer.</p>
          ) : null}
          {trash.data?.items.map((item) => (
            <div className={styles.trashItem} key={item.id}>
              <span>{item.title}</span>
              <Button
                variant="secondary"
                disabled={busy}
                loading={restore.isPending && restore.variables === item.id}
                onClick={() => restore.mutate(item.id)}
              >
                Zur Moderation zurückgeben
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setPendingAction({ kind: 'delete', item })}
              >
                Endgültig löschen
              </Button>
            </div>
          ))}
          {trash.isError || restore.isError || deleteForever.isError || emptyTrash.isError ? (
            <p role="alert">Aktion konnte nicht ausgeführt werden.</p>
          ) : null}
        </section>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        onCancel={(event) => {
          event.preventDefault();
          if (!busy) setPendingAction(null);
        }}
      >
        <h2>
          {pendingAction?.kind === 'dismiss'
            ? 'Meldung wirklich ablehnen?'
            : pendingAction?.kind === 'remove'
              ? 'Anzeige wirklich von der Seite entfernen?'
              : pendingAction?.kind === 'delete'
                ? 'Anzeige endgültig löschen?'
                : 'Papierkorb endgültig leeren?'}
        </h2>
        <p>
          {pendingAction?.kind === 'dismiss'
            ? `Die Anzeige „${pendingAction.report.item.title}“ bleibt öffentlich sichtbar.`
            : pendingAction?.kind === 'remove'
              ? `„${pendingAction.report.item.title}“ wird in den Papierkorb verschoben und ist nicht mehr öffentlich sichtbar. Du kannst sie später wiederherstellen.`
              : pendingAction?.kind === 'delete'
                ? `„${pendingAction.item.title}“ und die zugehörigen Fotos werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.`
                : 'Alle Anzeigen und zugehörigen Fotos im Papierkorb werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.'}
        </p>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={busy}
            autoFocus
            onClick={() => setPendingAction(null)}
          >
            Abbrechen
          </Button>
          <Button
            variant={pendingAction?.kind === 'dismiss' ? 'primary' : 'danger'}
            loading={busy}
            onClick={() => {
              if (!pendingAction) return;
              if (pendingAction.kind === 'dismiss' || pendingAction.kind === 'remove') {
                const mutation = pendingAction.kind === 'dismiss' ? dismiss : hide;
                mutation.mutate(pendingAction.report.id, {
                  onSuccess: () => setPendingAction(null),
                });
              } else if (pendingAction.kind === 'delete') {
                deleteForever.mutate(pendingAction.item.id, {
                  onSuccess: () => setPendingAction(null),
                });
              } else {
                emptyTrash.mutate(undefined, { onSuccess: () => setPendingAction(null) });
              }
            }}
          >
            {pendingAction?.kind === 'dismiss'
              ? 'Meldung ablehnen'
              : pendingAction?.kind === 'remove'
                ? 'In den Papierkorb verschieben'
                : pendingAction?.kind === 'delete'
                  ? 'Endgültig löschen'
                  : 'Papierkorb leeren'}
          </Button>
        </div>
        {actionError && (
          <p className={styles.dialogError} role="alert">
            {actionError instanceof ApiError
              ? actionError.message
              : 'Die Aktion konnte nicht ausgeführt werden. Bitte versuche es erneut.'}
          </p>
        )}
      </dialog>
    </section>
  );
}
