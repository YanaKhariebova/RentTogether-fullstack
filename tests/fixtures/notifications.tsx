// Isolated UI fixture: no API or authentication bypass is imported by production.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import '@fontsource-variable/inter';
import '../../src/index.css';
import { HeaderView } from '../../src/shared/ui/organisms/Header/Header';
import { ThemeToggle } from '../../src/features/theme/ThemeToggle';
import { NotificationBadge } from '../../src/features/notifications/components/NotificationBadge';
import { BookingNotificationsView } from '../../src/features/notifications/BookingNotifications';
import type { BookingNotification } from '../../src/features/notifications/types';
const params = new URLSearchParams(location.search);
const initialCount = Number(params.get('count') ?? 2);
const initialNotifications: BookingNotification[] =
  initialCount === 0
    ? []
    : [
        {
          id: '10000000-0000-4000-8000-000000000001',
          bookingId: '20000000-0000-4000-8000-000000000001',
          itemTitle: 'Akku-Bohrschrauber',
          type: 'BOOKING_REQUEST_CREATED',
          createdAt: '2026-11-03T10:00:00Z',
          readAt: null,
        },
        {
          id: '10000000-0000-4000-8000-000000000002',
          bookingId: '20000000-0000-4000-8000-000000000002',
          itemTitle: 'Campingzelt für zwei Personen',
          type: 'BOOKING_APPROVED',
          createdAt: '2026-11-03T09:00:00Z',
          readAt: null,
        },
      ];
export function Fixture() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [count, setCount] = useState(initialCount);
  const [readError, setReadError] = useState(false);
  const state = params.get('state');
  return (
    <>
      <HeaderView
        themeToggle={<ThemeToggle />}
        notificationBadge={(count) => <NotificationBadge count={count} />}
        auth={<a href="/account/profile">Mein Profil</a>}
        signedIn
        bookingUnreadCount={state === 'error' || state === 'unavailable' ? undefined : count}
      />
      <main
        id="main-content"
        style={{ maxWidth: 1000, padding: '24px 16px 100px', margin: 'auto' }}
      >
        <h1>Anfragen</h1>
        <BookingNotificationsView
          notifications={state === 'error' || state === 'unavailable' ? [] : notifications}
          unreadCount={state === 'error' || state === 'unavailable' ? undefined : count}
          loading={state === 'loading'}
          unavailable={state === 'unavailable'}
          error={state === 'error'}
          readError={readError}
          onRetry={() => {}}
          onLoadMore={() => {}}
          onRead={(ids) => {
            if (state === 'read-error') {
              setReadError(true);
              return;
            }
            const unreadIds = new Set(
              notifications
                .filter((item) => ids.includes(item.id) && !item.readAt)
                .map((item) => item.id),
            );
            setNotifications((current) =>
              current.map((item) =>
                unreadIds.has(item.id) ? { ...item, readAt: new Date().toISOString() } : item,
              ),
            );
            setCount((current) => Math.max(0, current - unreadIds.size));
          }}
        />
      </main>
    </>
  );
}
const root = createRootRoute({ component: Fixture });
const fixture = createRoute({
  getParentRoute: () => root,
  path: '/tests/fixtures/notifications.html',
  component: () => null,
});
const router = createRouter({ routeTree: root.addChildren([fixture]) });
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
