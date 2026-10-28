# Review foundation для кабинета владельца

28 октября 2026 года проверен [PR Влада № 3](https://github.com/YanaKhariebova/RentTogether-fullstack/pull/3),
коммит `0428c22`. Review выполнен по коду и контрактам в отдельной копии ветки;
foundation не объединён с рабочей веткой Ольги.

## Результат

Блокирующих замечаний в проверенных частях не обнаружено. Контракты подходят
для дальнейшей реализации объявлений:

- PostgreSQL UUID для User/Category и будущих ownerId/categoryId; в JSON строки.
- `res.locals.currentUser.id` после `deps.authenticate` — локальный ID владельца.
- `requireOwner(item.ownerId, currentUserId)` — общая проверка владельца.
- Общая ошибка содержит `fields: Record<string, string[]>`.
- `pricePerDay`, изображения и публичный owner совпадают с контрактом Яны и Ольги.
- Защищённые маршруты `/account/items`, `/account/items/new`, `/account/items/$itemId/edit`
  подходят вместо ранее предложенных `/items/new` и `/items/$itemId/edit`.
- Общие atoms, API client и query keys подходят для замены временной основы.
- Inter и исходный SVG подключены со стороны foundation.

## Независимые проверки

Во временной копии выполнены `npm ci` для frontend и server, затем:

- [x] Frontend ESLint, Prettier check и production build.
- [x] Backend Prisma generate, TypeScript build и ESLint.
- [x] Prisma validate.
- [x] 8 API-тестов с подменённой Clerk-идентичностью и репозиторием.
- [x] Миграция и seed дважды на отдельной PostgreSQL через db:check.
- [x] 4 DB-теста: UUID/категории, сохранение профиля, разделение аккаунтов,
      отказ в анонимной записи.

Настоящий Clerk-вход и работа с двумя реальными сессиями не проверены:
ещё нужны ключи одного командного Clerk-приложения. UI-тесты Playwright
в рамках этого review не запускались. Фото-хранилище и Booking вне PR.

## Интеграция ветки Ольги

Пробное объединение с коммитом Ольги `da7d2c2` выявило конфликты в четырёх файлах:
`README.md`, `index.html`, `src/App.tsx`, `src/App.module.css`.
Ветка, индекс и рабочие файлы при проверке не изменялись.

После командного merge foundation в main:

1. Обновить ветку Ольги от main и разрешить конфликты.
2. Сохранить Router/Clerk/Query из foundation, а наши страницы подключить
   к защищённым routes. Общий Header заменяет временный заголовок App.
3. Сохранить favicon и немецкий title; README оставить точкой входа,
   подробную документацию держать в docs.
4. Заменить нативные поля/кнопки общими atoms и использовать общие токены.
5. Применить согласованный Prettier к добавленным файлам Ольги.
6. Последовательно добавить Item/ItemImage, обратные связи User/Category,
   миграцию, seed и owner API. Booking добавляет Яна отдельно.

До этого существующий mock-кабинет остаётся доступен в ветке Ольги.

## Обновление после merge

Foundation вошёл в main коммитом 8180d9d и объединён с веткой Ольги
merge-коммитом bc06361. Подключение кабинета описано в [интеграции](foundation-integration.md).
Финальный код foundation использует исходные booking URL; маршруты объявлений не менялись.
