# Подключение кабинета объявлений к foundation

Проверено 28 октября 2026 по текущей `feat/foundation-auth` и обновлённой
`origin/feat/items-owner-dashboard` (da7d2c2), включая `docs/integration.md`.
Эта памятка — ответ со стороны foundation на запрос Ольги.

## Модели и ID

Источник: [Prisma schema](../server/prisma/schema.prisma).
User/Category используют `String @id @default(uuid()) @db.Uuid`.
В TypeScript и JSON ID — `string`, в PostgreSQL — UUID.
Для Item `ownerId` и `categoryId` должны быть `String @db.Uuid`.
Clerk ID — отдельный `User.clerkUserId`, он не используется как FK.

- User: id, clerkUserId (unique), name, city, email, phone, createdAt, updatedAt.
- Category: id, name (unique).
- City/phone у User по умолчанию пустые строки.
- Mock ID вроде `user-1` не отправлять как реальные UUID.

В foundation подготовлена миграция User/Category и проверена на чистой локальной
PostgreSQL: deploy/seed проходят дважды, тесты сохранения профилей зелёные.
Сначала командный review и интеграция foundation, затем обновление
ветки Ольги и её миграция Item/ItemImage. Обратные relations в User/Category
добавляются вместе с Item. Booking согласовывается отдельно до миграции.
Item должен иметь `createdAt DateTime @default(now())` по запросу Яны.

## Текущий пользователь

Middleware в текущем wiring называется `authenticate`; он создан через
`createRequireAuth()` в `server/src/index.ts` и передан в `createApp`.
Готового singleton-экспорта с именем `requireAuth` сейчас нет.
Внутри `createApp` новые защищённые routes получают `deps.authenticate`:

```ts
app.post('/api/items', deps.authenticate, async (req, res) => {
  const ownerId = res.locals.currentUser.id;
  // Валидация тела и создание item с этим ownerId в сервисе Ольги.
});
```

Для Router-модуля передавайте этот же RequestHandler как зависимость.
Clerk middleware уже установлен на `/api` перед защищёнными маршрутами.
После authenticate доступен локальный User в `res.locals.currentUser`.
OwnerId из request body не принимать. Для изменения загруженного item:

```ts
import { requireOwner } from '../../middleware/requireAuth.js';
requireOwner(item.ownerId, res.locals.currentUser.id);
```

На frontend локальный профиль доступен через `useCurrentUser()` из
`@/features/profile/api/useCurrentUser`, результат `data.user`.
Clerk useUser возвращает другую сущность — профиль провайдера.

## Общие atoms

```tsx
import { Button, Input, Textarea, Select, Badge, Spinner, IconButton } from '@/shared/ui/atoms';
```

Все принимают обычные props соответствующего HTML-элемента, кроме Spinner.

| Atom       | Дополнительные props                                                 |
| ---------- | -------------------------------------------------------------------- |
| Button     | variant: primary/secondary/danger; loading; type по умолчанию button |
| Input      | label обязателен; error?: string; hint?: string                      |
| Textarea   | label обязателен; error?: string                                     |
| Select     | label и options: `{ value, label }[]` обязательны; error?: string    |
| Badge      | variant: neutral/success/warning                                     |
| Spinner    | label?: string                                                       |
| IconButton | label обязателен, используется для aria-label и title                |

Input/Textarea/Select используют стандартный DOM onChange(event).
Например, `onChange={(e) => onFieldChange('title', e.currentTarget.value)}`.
У молекул Ольги может остаться собственный onChange(value), с адаптацией внутри.
Button для сохранения должен явно получить `type="submit"`.
Подробнее: [UI-гайд](ui.md).

## API client и ошибки

```tsx
import { useApi } from '@/features/auth/api/useApi';
import { ApiError } from '@/shared/api/client';

const api = useApi();
// Пример внутри feature hook; endpoint реализует Ольга.
// const response = await api<ResponseDto>('/my/items');
// await api<ResponseDto>('/items', { method: 'POST', body: JSON.stringify(payload) });
```

Base URL уже заканчивается на `/api`, повторно добавлять `/api` не нужно.
Клиент получает Clerk token и добавляет Bearer header. Возвращает распарсенный
JSON целиком, без axios-обёртки `.data`. Поддерживает RequestInit, включая signal.
Для FormData не задавать Content-Type вручную: boundary выставляет браузер.
Категории: `useCategoriesQuery()` из `@/features/items/api/useCategoriesQuery`,
результат `data.categories`. Endpoint: публичный GET /api/categories.

Ошибка API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Bitte überprüfe deine Eingaben.",
    "fields": { "title": ["Bitte gib einen Titel ein."] }
  }
}
```

Клиент бросает ApiError: status, message, detail.code, detail.fields.
Для текущей формы Ольги с ошибками `string` использовать `detail.fields.title?.[0]`.
Общая ошибка формы может находиться в `_form`. Сетевая ошибка: status=0,
code=NETWORK_ERROR. На сервере ApiError/errorHandler находятся в
`server/src/lib/errors.ts`; сообщения для пользователя — на немецком.

## Router

- `/account/items` — список объявлений владельца.
- `/account/items/new` — создание.
- `/account/items/$itemId/edit` — редактирование.
- `/items/$itemId` — публичная страница Яны.
- `/catalog` — публичный каталог Яны.

Все `/account/*` уже защищены общим wrapper. PageLayout подключён в root route.
Заглушки страниц Ольги нужно заменить её page components после интеграции веток.
Для TanStack Link: `to="/account/items/$itemId/edit" params={{ itemId }}`.
Не редактировать `routeTree.gen.ts` вручную.

Ольга предложила `/items/new` и `/items/$itemId/edit`. В foundation уже
реализованы `/account/items/new` и `/account/items/$itemId/edit`, чтобы все
защищённые страницы наследовали общий `/account` wrapper. Эти пути подтверждены
командой 28 октября; публичным остаётся `/items/$itemId`.
Яна подтвердила `/account/bookings/my-rentals` и `/account/bookings/incoming`;
Router и навигация используют эти исходные пути foundation.

## Логотип и шрифт

Inter Variable подключён локально через `@fontsource-variable/inter`, без CDN.
Общий font-family в index.css; компонентам достаточно наследовать шрифт.
SVG из ветки Ольги скопирован без изменений и подключён в Header/favicon.

## Фото — остаётся согласовать

Провайдер/хранилище ещё не выбраны, учётных данных хранилища здесь нет.
Ольга реализует upload API; frontend продолжает использовать `image.url`.
Общий клиент уже поддерживает FormData. До выбора хранилища нельзя считать
загрузку на сервер интегрированной: blob URL для preview не является постоянным URL.

При согласовании нужно определить провайдера, способ загрузки (через API или
подписанный URL), допустимые MIME/размер/количество фото и удаление объектов.
Сервер проверяет владельца и файлы; бинарные данные в PostgreSQL не сохраняются.
Новый контракт upload response пока не утверждён.

Полный публичный Item контракт: [contracts.md](contracts.md).
Настоящие Clerk-сессии, профиль и переключение двух аккаунтов проверены через
`npm run test:auth`; границы helper-based проверки — в [auth-verification.md](auth-verification.md).
Ручные пароль/OTP/Google OAuth и upload требуют отдельной проверки.
PostgreSQL также проверена локально через `npm --prefix server run db:check`.
готовность кабинета на mock взята из сообщения команды.
