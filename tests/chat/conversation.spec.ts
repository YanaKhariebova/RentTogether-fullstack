import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { ChatMessage } from '../../src/features/messages/types/message';

const incoming = (id = 'incoming-1'): ChatMessage => ({
  id,
  senderId: 'renter',
  body: 'Hallo, kann ich um 17 Uhr abholen?',
  createdAt: new Date().toISOString(),
  readAt: null,
  editedAt: null,
  replyTo: null,
});

async function mockChat(page: Page) {
  const state = {
    readCalls: 0,
    sendCalls: 0,
    readFails: false,
    sendFails: false,
    messagesStatus: 200,
    profileStatus: 200,
    failRefreshAfterSend: false,
    messages: [incoming()],
  };
  await page.route('**/__chat-test-api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace('/__chat-test-api', '');
    const error = (status: number) =>
      route.fulfill({
        status,
        json: { error: { code: 'TEST_ERROR', message: 'Temporary failure', fields: {} } },
      });
    if (path === '/me') {
      return state.profileStatus === 200
        ? route.fulfill({ json: { user: { id: 'owner', name: 'Olga' } } })
        : error(state.profileStatus);
    }
    if (path === '/conversations') {
      return route.fulfill({
        json: {
          conversations: [
            {
              id: 'test-conversation',
              kind: 'ITEM_INQUIRY',
              itemTitle: 'Testartikel',
              otherParticipantName: 'Yana',
            },
          ],
          nextCursor: null,
        },
      });
    }
    if (path.endsWith('/read')) {
      state.readCalls++;
      if (state.readFails) return error(500);
      // The server marks incoming messages only, never the current user's messages.
      state.messages = state.messages.map((m) =>
        m.senderId === 'renter' ? { ...m, readAt: new Date().toISOString() } : m,
      );
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/messages') && req.method() === 'POST') {
      state.sendCalls++;
      if (state.sendFails) return error(500);
      const message: ChatMessage = {
        ...incoming('outgoing-' + state.sendCalls),
        senderId: 'owner',
        body: req.postDataJSON().body,
      };
      state.messages.unshift(message);
      if (state.failRefreshAfterSend) state.messagesStatus = 500;
      return route.fulfill({ status: 201, json: { message } });
    }
    if (path.endsWith('/messages')) {
      return state.messagesStatus === 200
        ? route.fulfill({ json: { messages: state.messages, nextCursor: null, canSend: true } })
        : error(state.messagesStatus);
    }
    return error(404);
  });
  return state;
}

const openChat = (page: Page) => page.goto('/tests/chat/index.html');

test('a failed read receipt does not retry on every render or block an answer', async ({
  page,
}) => {
  const state = await mockChat(page);
  state.readFails = true;
  await openChat(page);
  const composer = page.getByRole('textbox', { name: 'Nachricht schreiben' });
  await expect(composer).toBeVisible();
  await composer.fill('Ja, 17 Uhr passt!');
  // Observe several mutation/render cycles: the old effect floods /read here.
  await page.waitForTimeout(400);
  expect(state.readCalls).toBe(1);
  await page.getByRole('button', { name: 'Senden', exact: true }).click();
  await expect(page.getByText('Ja, 17 Uhr passt!', { exact: true })).toBeVisible();
  expect(state.sendCalls).toBe(1);
  expect(state.readCalls).toBe(1);
  await expect(composer).toHaveValue('');
});

test('a successful send remains visible when refresh fails; retry preserves the next draft', async ({
  page,
}) => {
  const state = await mockChat(page);
  state.failRefreshAfterSend = true;
  await openChat(page);
  const composer = page.getByRole('textbox', { name: 'Nachricht schreiben' });
  await composer.fill('Ja, 17 Uhr passt!');
  await page.getByRole('button', { name: 'Senden', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('bisherige Verlauf bleibt sichtbar');
  await expect(page.getByText('Ja, 17 Uhr passt!', { exact: true })).toBeVisible();
  await expect(page.getByText(incoming().body, { exact: true })).toBeVisible();
  await composer.fill('Mein nächster Entwurf');
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(composer).toHaveValue('Mein nächster Entwurf');
  state.messagesStatus = 200;
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(composer).toHaveValue('Mein nächster Entwurf');
  await expect(page.getByText('Ja, 17 Uhr passt!', { exact: true })).toHaveCount(1);
  expect(state.sendCalls).toBe(1);
});

test('a failed send retains the draft and allows one explicit retry', async ({ page }) => {
  const state = await mockChat(page);
  state.sendFails = true;
  await openChat(page);
  const composer = page.getByRole('textbox', { name: 'Nachricht schreiben' });
  await composer.fill('Mein Antworttext');
  await page.getByRole('button', { name: 'Senden', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Nachricht konnte nicht gesendet werden');
  await expect(composer).toHaveValue('Mein Antworttext');
  state.sendFails = false;
  await page.getByRole('button', { name: 'Senden', exact: true }).click();
  await expect(page.getByText('Mein Antworttext', { exact: true })).toBeVisible();
  expect(state.sendCalls).toBe(2);
});

test('a new incoming message gets its own receipt; outgoing messages stay unread', async ({
  page,
}) => {
  const state = await mockChat(page);
  state.messages.unshift({
    ...incoming('own-initial'),
    senderId: 'owner',
    body: 'Meine alte Nachricht',
  });
  await openChat(page);
  await expect.poll(() => state.readCalls).toBe(1);
  await expect(page.getByLabel('Gesendet', { exact: true })).toBeVisible();
  state.messages.unshift({ ...incoming('incoming-2'), body: 'Noch eine Frage' });
  await page.getByRole('button', { name: 'Test refresh', exact: true }).click();
  await expect(page.getByText('Noch eine Frage', { exact: true })).toBeVisible();
  await expect.poll(() => state.readCalls).toBe(2);
  await expect(page.getByLabel('Gesendet', { exact: true })).toBeVisible();
});

test('retry also recovers an initially failed profile request', async ({ page }) => {
  const state = await mockChat(page);
  state.profileStatus = 500;
  await openChat(page);
  await expect(page.getByRole('alert')).toContainText('Chat konnte nicht geladen werden');
  state.profileStatus = 200;
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nachricht schreiben' })).toBeVisible();
});

test('revoked access hides cached messages and the composer', async ({ page }) => {
  const state = await mockChat(page);
  await openChat(page);
  await expect(page.getByRole('textbox', { name: 'Nachricht schreiben' })).toBeVisible();
  state.messagesStatus = 403;
  await page.getByRole('button', { name: 'Test refresh', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Chat konnte nicht geladen werden');
  await expect(page.getByRole('textbox', { name: 'Nachricht schreiben' })).toHaveCount(0);
  await expect(page.getByText(incoming().body, { exact: true })).toHaveCount(0);
});
