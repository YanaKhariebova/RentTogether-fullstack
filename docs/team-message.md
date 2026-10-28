# Текст для Ольги и Яны

Привет! Я подготовил основу в ветке `feat/foundation-auth`,
[PR #3](https://github.com/YanaKhariebova/RentTogether-fullstack/pull/3).

Контракты:

- [API, User/Category и auth](https://github.com/YanaKhariebova/RentTogether-fullstack/blob/feat/foundation-auth/docs/contracts.md)
- [Atoms и UI-гайд](https://github.com/YanaKhariebova/RentTogether-fullstack/blob/feat/foundation-auth/docs/ui.md)
- [Ответ на запрос Ольги по интеграции](https://github.com/YanaKhariebova/RentTogether-fullstack/blob/feat/foundation-auth/docs/owner-integration.md)

User.id и Category.id — UUID в PostgreSQL, string в JSON/TypeScript.
Для ownerId/categoryId в Item нужен `String @db.Uuid`. Clerk ID хранится отдельно.
После нашего auth middleware (`authenticate`, создан через `createRequireAuth`)
локальный пользователь — `res.locals.currentUser`; ownerId берём только из него.

Atoms импортируются из `@/shared/ui/atoms`. Клиент `useApi()` из
`@/features/auth/api/useApi` добавляет Clerk token; путь передаётся без `/api`.
Категории: GET /api/categories → `{ categories: [{ id, name }] }`.
Ошибки: `{ error: { code, message, fields } }`, fields — массивы строк по полям.
DTO Item соответствует договорённости Ольги и Яны.

Мои routes: `/account/items`, `/account/items/new`, `/account/items/$itemId/edit`.
Они наследуют общую защиту кабинета и подтверждены командой.
Публичная страница остаётся `/items/$itemId`.
Яна, для твоей части выбрал предложенные тобой `/account/rentals` и
`/account/requests`, обновил Router и навигацию. `Anfragen` ведёт на requests;
из обоих разделов доступны ссылки между арендой и входящими заявками.

Inter подключён локально, SVG из ветки Ольги добавлен в Header/favicon.
User/Category миграция и seed проверены на настоящей локальной PostgreSQL,
проверки профилей и разделения пользователей проходят. Настоящий Clerk-вход
ещё требует настройки ключей моего приложения. Фото-хранилище не выбрано;
upload/download/delete и лимиты согласуем отдельно, пока UI использует image.url.

Спасибо за review foundation: по вашему сообщению блокирующих замечаний нет,
модели, auth, atoms, API client и ошибки подходят. PR #1 с mock-кабинетом
пока не объединял. Item/ItemImage миграцию делаем после согласования и актуального
main с foundation; Booking до миграции обсуждаем вместе.
