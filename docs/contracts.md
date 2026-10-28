# Контракты команды — 28 октября 2026

Item API ниже согласован Ольгой и Яной в переписке. Auth, User/Category и UI —
реализованное предложение Влада для командного review. Наличие DTO не означает,
что Item endpoints уже реализованы в этой ветке.

## User / Category

Prisma: `server/prisma/schema.prisma`.
`User.id`, `Category.id` — `String @id @default(uuid()) @db.Uuid`.
Во всех JSON ID — строки. Значения `item-1`, `category-1` допустимы в mock;
для реальной БД используются UUID. Будущие `ownerId`/`categoryId` должны иметь
совместимый PostgreSQL UUID тип. Это нужно учесть Ольге в Item relations.

User: `id`, уникальный `clerkUserId`, `name`, `city`, `email`, `phone`,
`createdAt`, `updatedAt`. City/phone по умолчанию пустые строки, роли не нужны:
один пользователь может сдавать и арендовать вещи. Category: `id`, уникальный `name`.

## Авторизация

Frontend: `useAuth()` из `@clerk/react` даёт состояние сессии и `getToken()`.
`useApi()` из `@/features/auth/api/useApi` передаёт JWT в `Authorization: Bearer …`.
Локальный текущий профиль: `useCurrentUser()` из
`@/features/profile/api/useCurrentUser`; данные доступны через `data.user`.
Clerk `useUser()` возвращает профиль провайдера, а не локальный User для FK.
Ключ кеша профиля включает Clerk user ID, чтобы не смешивать аккаунты.

Backend: `clerkMiddleware()` проверяет JWT; `getAuth(req).userId` — Clerk subject.
`createRequireAuth()` получает этот subject, загружает профиль из Clerk Backend API
и upsert локального User по уникальному `clerkUserId`.
При создании берёт имя/email из Clerk; повторный sync обновляет только email,
сохраняя отредактированные локальные name/city/phone.
После middleware локальный пользователь находится в **`res.locals.currentUser`**.
Не брать ownerId/renterId из тела запроса.

Для новых защищённых маршрутов используйте тот же `authenticate`, что передан
в `createApp`. Он уже вызывается после Clerk middleware на `/api`.
Для проверки владельца после загрузки item:

```ts
requireOwner(item.ownerId, res.locals.currentUser.id);
```

Отсутствие сессии — `401 UNAUTHENTICATED`, чужой ресурс при изменении —
`403 FORBIDDEN`. Клиентская защита `/account/*` скрывает кабинет до входа;
доступ к данным всегда проверяет API.

## Реализованный API

`GET /api/me` — требуется сессия:

```json
{
  "user": {
    "id": "20000000-0000-4000-8000-000000000001",
    "name": "Vlad",
    "city": "Berlin",
    "email": "vlad@example.test",
    "phone": ""
  }
}
```

`PATCH /api/me`: частичный объект из `name`, `city`, `phone`, минимум одно поле.
Name: непустая строка до 100 символов; city: до 100; phone: до 50.
Строки обрезаются по краям; пустые city/phone допустимы.
Email изменяется через Clerk; ID/Clerk ID и неизвестные поля запрещены.
Возвращает тот же `{ "user": … }`. Ошибки валидации — `400`.

`GET /api/categories` — публичный:

```json
{ "categories": [{ "id": "10000000-0000-4000-8000-000000000001", "name": "Elektronik" }] }
```

Категории отсортированы по name. Пустой список — `200` и `categories: []`.

## Общие ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Bitte überprüfe deine Eingaben.",
    "fields": { "name": ["Bitte gib deinen Namen ein."] }
  }
}
```

`fields` всегда объект `Record<string, string[]>`; при отсутствии ошибок отдельных
полей — `{}`. Ошибки формы — `_form`. Сообщения для пользователя на немецком.
`ApiError` и `errorHandler` находятся в `server/src/lib/errors.ts`.
Другие коды: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
`INVALID_JSON` (400), `PAYLOAD_TOO_LARGE` (413), `INTERNAL_ERROR` (500).

## Согласованный публичный Item DTO

```json
{
  "id": "item-1",
  "title": "Beamer für einen Filmabend",
  "description": "Ein Beamer mit HDMI-Anschluss.",
  "pricePerDay": "15.50",
  "city": "Berlin",
  "category": { "id": "category-1", "name": "Elektronik" },
  "images": [{ "id": "image-1", "url": "https://storage.example/beamer.webp", "order": 0 }],
  "owner": { "id": "user-1", "name": "Olga", "city": "Berlin" },
  "isPublished": true
}
```

- Цена — строка в евро с двумя знаками после точки. UI форматирует в `15,50 €`.
- Images отсортированы по order, начиная с 0. Первое фото — обложка.
- Owner содержит только id/name/city; email, phone и Clerk ID не публикуются.
- Публичные endpoints показывают только опубликованные объявления.
- В Prisma Item Ольга добавляет `createdAt DateTime @default(now())` для сортировки;
  в публичный DTO добавлять поле пока не требуется.

`GET /api/items`: query `q`, `city`, `categoryId`, `minPrice`, `maxPrice`, `page`, `limit`.
Q — поиск по title/description без учёта регистра. City — точное совпадение без
учёта регистра. Ценовые границы включены, в евро (`minPrice=10.50`).
По умолчанию page=1, limit=12; максимум limit=50. Сначала новые объявления.

```json
{ "items": [], "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 } }
```

Пустой результат — 200; неверные query — 400.
`GET /api/items/:id` возвращает `{ "item": Item }`.
Отсутствующее или неопубликованное объявление — 404:

```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Die Anzeige wurde nicht gefunden.",
    "fields": {}
  }
}
```

Item/ItemImage делает Ольга; публичные GET endpoints — Яна.
Booking, семантику диапазонов дат и endpoint занятых дат согласовываем отдельно,
до миграции. Хранилище фото ещё не выбрано, UI использует только image.url.

## Предлагаемые frontend URL

| URL                            | Доступ      | Ответственный |
| ------------------------------ | ----------- | ------------- |
| `/`                            | публичный   | Влад          |
| `/sign-in`, `/sign-up`         | публичный   | Влад          |
| `/catalog`                     | публичный   | Яна           |
| `/items/$itemId`               | публичный   | Яна           |
| `/account/profile`             | после входа | Влад          |
| `/account/items`               | после входа | Ольга         |
| `/account/items/new`           | после входа | Ольга         |
| `/account/items/$itemId/edit`  | после входа | Ольга         |
| `/account/bookings`            | после входа | Яна           |
| `/account/bookings/my-rentals` | после входа | Яна           |
| `/account/bookings/incoming`   | после входа | Яна           |

В HTTP URL `$itemId` заменяется фактическим ID. В TanStack Link передаётся
`params={{ itemId }}`. Каталог/объявления/бронирования пока имеют заглушки.
`src/routeTree.gen.ts` не редактировать вручную: `npm run routes:generate`.

## Предлагаемые query keys

`apiKeys` в `@/shared/api/keys`: categories, items, itemList(query), item(id), myItems(userId).
`currentUserKey(clerkUserId)` — рядом с profile hook. Все пользовательские списки
должны включать идентификатор текущего пользователя в ключ, в том числе будущие bookings.
