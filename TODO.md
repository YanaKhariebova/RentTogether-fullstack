# RentTogether — план первой версии

## Цель MVP

Демонстрация должна проходить от начала до конца с двумя аккаунтами: владелец
создаёт объявление о проекторе, арендатор находит его в каталоге и отправляет
заявку, владелец подтверждает её, а занятые даты больше нельзя выбрать.

## Срок и режим работы

**Дедлайн: пятница, 20 ноября 2026 года.** В плане учтены только рабочие дни:
с 27 октября по 20 ноября — 19 дней. Суббота и воскресенье полностью свободны;
в них не планируем встречи, задачи и дедлайны.

Интерфейс и все тексты для пользователя пишем **на немецком**. Этот TODO,
технические заметки и комментарии команды можно вести на русском.

## Адаптивный интерфейс: mobile-first и desktop

Приложение должно ощущаться как мобильное приложение на телефоне, но быть
полноценным на desktop. Не делаем отдельные два интерфейса: один компонент
адаптируется через CSS Modules и media queries.

- [ ] Начинать вёрстку с ширины 360 px; проверить 360, 390, 768, 1024 и 1440 px.
- [ ] На mobile: компактный header, нижняя навигация для основных разделов,
  крупные зоны нажатия (минимум 44×44 px), фильтры в drawer/modal и одна
  колонка карточек.
- [ ] На desktop (от 1024 px): верхняя навигация, фильтры сбоку или в строке,
  3–4 колонки карточек и dashboard-таблицы/списки.
- [ ] Нижняя навигация содержит: `Entdecken`, `Meine Anzeigen`, `Anfragen`,
  `Profil`; на desktop её заменяет header/navigation.
- [ ] Для дат, загрузки фото и подтверждений использовать bottom sheet/modal
  на mobile и dialog/панель на desktop.
- [ ] Любое изменение UI проверять клавиатурой, на touch и на узком экране.
- [ ] В CSS Modules использовать mobile-first правила; desktop-изменения
  добавлять через `@media (min-width: 768px)` и `@media (min-width: 1024px)`.

## Принципы команды

- Один пользователь может одновременно быть владельцем и арендатором.
- Клиент показывает интерфейс; **все бизнес-правила проверяет Express API**.
- День возврата не оплачивается: `totalDays = returnDate - pickupDate`.
- Сумма и цена за день сохраняются в `Booking` при создании заявки.
- Используем feature-папки для сценариев и Atomic Design внутри UI-компонентов.
- Стили — только CSS Modules рядом с компонентом. Глобально остаются reset,
  токены (`index.css`) и шрифты.

## Рекомендуемая структура

- [x] Создан каркас папок `src/` и `server/`; пустые папки сохранены через
  `.gitkeep`.

```text
src/
  app/                         # App, роутер, провайдеры, глобальные стили
  routes/                      # TanStack Router: file-based страницы
    __root.tsx                 # общий layout
    index.tsx                  # главная
    catalog/
    items/
    account/
  pages/                       # композиция страниц и route components
  features/
    auth/
    profile/
    items/                      # создание/редактирование, кабинет владельца
    catalog/
    bookings/
  shared/
    api/                        # apiClient, типы DTO, React Query keys
    hooks/                      # только переиспользуемые UI hooks
    lib/                        # date/currency/validation helpers
    ui/
      atoms/                    # Button, Input, Select, Badge, IconButton
      molecules/                # SearchBar, PriceField, DateRangePicker
      organisms/                # Header, ItemCard, ItemGrid, EmptyState
      templates/                # PageLayout, DashboardLayout
    types/
server/
  src/
    modules/                    # auth, users, categories, items, bookings
    routes/                     # Express API routes: items, bookings, users
    middleware/                 # requireAuth, validate, errorHandler
    lib/                         # prisma client, dates, errors
  prisma/
    schema.prisma
    seed.ts
```

Правило для Atomic Design: atom не знает о бизнес-сущностях и API; molecule
собирает atoms; organism может получать доменные props (`item`, `booking`), но
не выполняет запросы сам. Запросы, мутации и состояние формы остаются в
`features/*`. Каждому компоненту — свой `Component.tsx`,
`Component.module.css` и при необходимости `Component.test.tsx`.

### Правило для hooks

- Общие hooks без доменной логики кладём в `shared/hooks/`: `useDebounce`,
  `useMediaQuery`, `useLocalStorage`, `useOutsideClick`.
- Hooks одной функции храним внутри неё: например,
  `features/catalog/hooks/useCatalogFilters.ts`,
  `features/bookings/hooks/useBookingActions.ts`,
  `features/items/hooks/useItemForm.ts`.
- React Query hooks также живут в feature, рядом с API-файлом:
  `features/catalog/api/useItemsQuery.ts` и
  `features/bookings/api/useCreateBookingMutation.ts`.
- Не создавать `hooks/` на верхнем уровне `src`: это быстро превращается в
  неструктурированную папку. Переносить hook в `shared` стоит только после
  реального повторного использования минимум в двух feature.

## Общие задачи — согласовать в первый день

- [x] Создан отдельный `server/` на Express + TypeScript; установлены Zod,
  Clerk, TanStack Query и TanStack Router.
- [x] Создан `server/.env.example` без секретов: `DATABASE_URL`, Clerk publishable
  key, Clerk secret key, `CLIENT_URL`, `PORT`.
- [ ] Подключить PostgreSQL и настроить Prisma schema, migration и Prisma
  client.
- [ ] Согласовать единый формат ошибок:
  `{ "error": { "code": "...", "message": "...", "fields": {} } }`.
- [ ] Согласовать DTO и OpenAPI/README с маршрутами до начала реализации.
- [ ] Настроить ESLint, форматирование, алиасы импортов и проверку `lint` +
  `build` в каждом PR.
- [ ] В `index.css` завести только design tokens: цвета, радиусы, тени,
  breakpoints, spacing и typography; не хранить там стили конкретных блоков.
- [ ] Сделать seed: категории, два тестовых пользователя, проектор и минимум
  одно бронирование для демонстрации.

## Участник 1 — фундамент, авторизация и профиль

### Backend

- [x] Настроить минимальный Express-сервер, CORS и `GET /api/health`.
- [ ] Настроить Prisma client и централизованный `errorHandler`.
- [ ] Описать Prisma-модели `User` и `Category`; добавить миграции и seed.
- [ ] Подключить Clerk middleware: получать `clerkUserId`, создавать/обновлять
  локального `User` при первом входе.
- [ ] Реализовать `GET /api/me` и `PATCH /api/me` (имя, город, контакты).
- [ ] Реализовать `GET /api/categories`.
- [ ] Написать middleware `requireAuth`, `requireOwner`/проверку владельца в
  сервисах и Zod-валидацию request body/query.

### Frontend и дизайн-система

- [ ] Настроить TanStack Router (типизированные file-based routes), QueryClient
  и API client с токеном Clerk.
- [ ] Собрать `PageLayout`, `Header`, навигацию, responsive mobile menu и
  страницу 404.
- [ ] Создать базовые atoms: `Button`, `Input`, `Textarea`, `Select`, `Badge`,
  `Spinner`, `IconButton` — с вариантами и CSS Modules.
- [ ] Реализовать вход/выход Clerk и защищённый route wrapper.
- [ ] Реализовать страницу профиля: просмотр и редактирование имени, города,
  контактов, состояния loading/error/success.
- [ ] Описать краткий UI-гайд в README: токены, naming CSS-классов, примеры
  компонентов и правила адаптива.

## Участник 2 — объявления и кабинет владельца

### Backend

- [ ] Описать Prisma-модели `Item` и `ItemImage`: владелец, категория, цена
  за день, город, публикация, порядок изображений.
- [ ] Реализовать загрузку изображений через выбранное хранилище; сервер
  валидирует тип и размер файла. Не хранить бинарные файлы в PostgreSQL.
- [ ] Реализовать `POST /api/items`, `PATCH /api/items/:id`,
  `DELETE /api/items/:id` или безопасное снятие с публикации.
- [ ] Реализовать `POST /api/items/:id/images` и удаление/смену порядка фото.
- [ ] Реализовать `GET /api/my/items`.
- [ ] Проверить в каждом изменяющем маршруте: менять/удалять item может только
  его владелец.

### Frontend

- [ ] Создать feature `items` и страницы «Новое объявление», «Редактировать»,
  «Мои объявления».
- [ ] Собрать molecules `PriceField`, `ImageUploader`, `CategorySelect` и
  organisms `ItemForm`, `OwnerItemCard`, `ImageGalleryEditor`.
- [ ] Сделать Zod-валидацию формы: название, описание, город, категория,
  положительная цена, хотя бы одно фото.
- [ ] Реализовать предпросмотр, удаление и изменение порядка фотографий.
- [ ] На «Моих объявлениях» добавить редактирование и снятие с публикации с
  подтверждением; показать empty/loading/error состояния.
- [ ] Не создавать отдельные копии Button/Input: использовать shared UI от
  участника 1.

## Участник 3 — каталог, страница вещи и бронирование

### Backend

- [ ] Реализовать публичный `GET /api/items` с пагинацией и query-фильтрами:
  `q`, `city`, `categoryId`, `minPrice`, `maxPrice`, `page`, `limit`.
- [ ] Реализовать `GET /api/items/:id` с фото, категорией и публичными данными
  владельца; не выдавать приватные контакты без необходимости.
- [ ] Описать Prisma-модель `Booking`: item, renter, pickupDate, returnDate,
  status, pricePerDaySnapshot, totalPrice.
- [ ] Реализовать `POST /api/bookings`: нельзя бронировать свою вещь, return
  позже pickup, цена и итог считаются только сервером; статус `PENDING`.
- [ ] Реализовать `GET /api/bookings/my-rentals` и
  `GET /api/bookings/incoming` — только для участника заявки.
- [ ] Реализовать переходы: владелец `PENDING → APPROVED/REJECTED`, владелец
  `APPROVED → ACTIVE → COMPLETED`, арендатор `PENDING → CANCELLED`.
- [ ] Подтверждать заявку в Prisma transaction: заблокировать item, повторно
  проверить пересечение с `APPROVED`/`ACTIVE`, затем обновить статус. При
  конфликте вернуть `409 BOOKING_DATES_UNAVAILABLE`.

### Frontend

- [ ] Создать страницу каталога с `SearchBar`, фильтрами города/категории/цены,
  `ItemCard`, `ItemGrid`, пагинацией и состоянием «ничего не найдено».
- [ ] Сделать страницу вещи: галерея, описание, цена, город, владелец и CTA.
- [ ] Собрать `DateRangePicker` и `BookingForm`: заблокировать прошедшие и
  занятые даты; итоговая сумма на клиенте — только preview, сервер — источник
  истины.
- [ ] Создать «Мои аренды» для арендатора и «Входящие заявки» для владельца с
  понятными статусами, суммой и разрешёнными кнопками действий.
- [ ] После мутаций инвалидировать TanStack Query ключи карточки, каталога и
  обоих кабинетов.

## Распределение: каждый делает свой frontend и backend

| Участник | Своя вертикальная зона | Frontend | Backend / БД |
| --- | --- | --- | --- |
| 1 | Основа, авторизация, профиль | App shell, responsive header/bottom navigation, базовые atoms, вход/выход, профиль | Express foundation, Clerk middleware, `User`, `Category`, `GET/PATCH /me`, категории |
| 2 | Объявления владельца | Создание/редактирование, загрузка фото, «Meine Anzeigen», owner cards | `Item`, `ItemImage`, CRUD объявлений, загрузка/сортировка фото, проверка владельца |
| 3 | Поиск и аренда | Каталог, фильтры, детальная страница, даты, «Meine Mieten» и «Eingehende Anfragen» | Публичное чтение items, `Booking`, цена на сервере, статусы, транзакция approve и проверка пересечений |

Общий UI-kit создаёт участник 1, но все трое используют его и не дублируют
компоненты. Участник 2 публикует контракт item API до начала подключения
каталога; участник 3 не меняет `Item`-схему без согласования с участником 2.

## План по рабочим дням до 20 ноября

| Даты | Участник 1: auth/profile | Участник 2: items | Участник 3: catalog/bookings | Общий результат |
| --- | --- | --- | --- | --- |
| 27–30 окт. | Настроить app shell, Router, Query, Clerk; `User`/`Category`; profile API/UI | Описать `Item`/`ItemImage`, миграцию и DTO; собрать форму на mock | Согласовать Booking DTO, статусы и правила; каталог и date UI на mock | Структура, `.env.example`, API-контракты, mobile tokens |
| 2–6 нояб. | Header + mobile bottom nav, atoms/molecules, profile page и protected routes | CRUD API items, фото, `Meine Anzeigen`, create/edit form | Каталог, фильтры, item detail; создать `Booking` и `POST /bookings` | Можно создать item, найти его с mobile и desktop |
| 9–13 нояб. | Loading/error/empty UI-kit, accessibility и немецкие тексты | Редактирование, снятие с публикации, порядок фото, права владельца | Кабинеты заявок, transitions, approve transaction, занятые даты | Главный сценарий работает с двумя аккаунтами |
| 16–18 нояб. | Проверка навигации/профиля на всех брейкпоинтах | Проверка item API/UI и изображения | Проверка конфликтов дат, цены и статусов | Интеграция, bugfix, seed и тестовые данные |
| 19 нояб. | Review чужого PR и финальные стили | Review чужого PR и финальные стили | Review чужого PR и финальные стили | Полный rehearsal презентации |
| 20 нояб. | Вместе: только исправления блокирующих ошибок и презентация | Вместе: только исправления блокирующих ошибок и презентация | Вместе: только исправления блокирующих ошибок и презентация | Готовый MVP |

### Ежедневный ритм

- [ ] В начале рабочего дня — 10 минут: что готово, что блокирует, что будет
  сделано сегодня.
- [ ] В конце дня — один маленький Pull Request или commit с понятным именем.
- [ ] Перед merge в `main` — один другой участник проверяет код, mobile-версию
  и `npm run build` нужной части.
- [ ] В пятницу, 30 октября, 6, 13 и 20 ноября — короткая общая интеграция;
  выходные после неё не используем для «догоняния» задач.

## Контракт данных и порядок работы

- [ ] Сначала участник 1 публикует базовый API client, типы DTO, atoms и
  приложение с маршрутами.
- [ ] Затем участник 2 делает `Item`/`ItemImage`, а участник 3 параллельно
  собирает каталог и booking UI на mock-данных по согласованным DTO.
- [ ] После merge модели Item участник 3 подключает каталог к API.
- [ ] После merge модели Booking проверить бронирование двумя разными Clerk
  аккаунтами.
- [ ] Каждая feature-ветка добавляет свои миграции только после актуального
  `main`; перед merge применять миграции на чистой локальной БД.

## Definition of Done

- [ ] `npm run lint` проходит на клиенте и сервере.
- [x] `npm run build` проходит на клиенте и сервере.
- [ ] Все API входы валидируются Zod; закрытые endpoints требуют Clerk auth.
- [ ] Нельзя изменить чужое объявление, увидеть чужие заявки или забронировать
  свою вещь.
- [ ] Две подтверждённые/активные аренды одной вещи не пересекаются, включая
  два одновременных approve-запроса.
- [ ] Сохранённые в заявке цена за день и итог не меняются после редактирования
  объявления.
- [ ] Интерфейс работает на mobile и desktop, клавиатурно доступен, содержит
  loading/error/empty состояния.
- [ ] Презентационный сценарий успешно пройден от публикации до `COMPLETED`.
