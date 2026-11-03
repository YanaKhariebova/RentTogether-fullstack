# Интеграция RentTogether

> Актуальная интеграция на 03.11.2026: [сводка команды](team-status.md) и [deployment](deployment.md). Объявления, Booking и Favorite используют API; упоминания mock и следующих шагов ниже относятся к первоначальной интеграции октября.

Общая памятка подключения кабинета владельца, каталога и бронирований.
Обновлена 28 октября 2026 при объединении PR #2 с `main`. Общие контракты —
[contracts.md](contracts.md), UI — [ui.md](ui.md). Детали зон сохранены ниже.

## Объявления и кабинет владельца

### Полученный ответ Влада

28 октября получен foundation PR № 3, коммит `0428c22`. Контракты прочитаны,
совместимость проверена; результаты и ограничения — в
[review](foundation-review.md). Foundation объединён с `main` и веткой Ольги.
Общие atoms, Header, Inter и Router подключены к кабинету; объявления пока
остаются mock-данными. Текущее состояние описано в
[интеграции](foundation-integration.md).

| Область                       | Принятый интерфейс foundation                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| User / Category               | `String @id @default(uuid()) @db.Uuid`; JSON ID — строки                                         |
| Связи Item                    | `Item.ownerId`, `Item.categoryId` — `String @db.Uuid`                                            |
| Текущий пользователь backend  | `res.locals.currentUser` после `deps.authenticate`                                               |
| Проверка владельца            | `requireOwner(item.ownerId, res.locals.currentUser.id)`                                          |
| Текущий пользователь frontend | `useCurrentUser()`, результат `data.user`                                                        |
| Atoms                         | `Button`, `Input`, `Textarea`, `Select`, `Badge`, `Spinner`, `IconButton` из `@/shared/ui/atoms` |
| API client                    | `useApi()` из `@/features/auth/api/useApi`; путь `/items`, без повторного `/api`                 |
| Категории                     | `useCategoriesQuery()`, результат `data.categories`                                              |
| Ошибки                        | `ApiError`: `status`, `detail.code`, `detail.fields`; `fields` — массивы строк                   |
| Query keys                    | `apiKeys.items`, `itemList(query)`, `item(id)`, `myItems(userId)`                                |
| Routes                        | `/account/items`, `/account/items/new`, `/account/items/$itemId/edit`                            |
| Layout                        | `PageLayout` уже подключён в root route                                                          |
| Шрифт                         | Inter Variable подключён локально со стороны foundation                                          |
| Логотип                       | Одинаковый SVG в `src/shared/assets/renttogether-icon.svg`                                       |

Подробные props atoms описаны Владом в `docs/ui.md` его ветки. `Input` и
`Textarea` получают `label` и `error`, `Select` — `label` и `options` из
`value`/`label`, `Button` — `variant` и `loading`. `onChange` — стандартный DOM
event; молекулы Ольги могут сохранить `onChange(value)`, адаптируя событие
внутри. Submit-кнопке явно нужен `type="submit"`.

### Следующие действия после интеграции frontend

Вход и сохранение профиля проверены Ольгой 28 октября. Следующие задачи:

1. Подключить категории, локального пользователя и общий формат ошибок.
2. Заменить `useMockOwnerItems` настоящими запросами и мутациями после
   подключения фото.
3. Инвалидировать согласованные ключи каталога, карточки и кабинета.

Общую схему меняем последовательно: User/Category → Item/ItemImage → Booking.
Схему Booking согласует Яна до своей миграции. Item содержит `createdAt` для
сортировки, публичный DTO пока обходится без даты.

### Что ещё нужно согласовать

- Проверку полного сценария объявлений с двумя настоящими Clerk-аккаунтами.
- Хранилище фото, серверную загрузку/удаление и постоянный `image.url`.
- Upload response и серверные ограничения: текущая форма допускает JPEG/PNG/WebP,
  до 5 МБ, до 8 фото. Сервер должен проверять их независимо.
- Обновление кеша бронирований после нужных мутаций при интеграции с Яной.

Mock-кабинет не проверяет реальное право доступа. Каждый изменяющий маршрут
backend обязан получить локального пользователя из auth и проверить владельца.

### Итог первого этапа

Модели, миграция, owner API, mock-форма и opt-in seed готовы. Состояние и ERD
описаны в итоге этапа. Контракты реализованного owner API — в
[items-api.md](items-api.md).

## Каталог и бронирования

### Статус foundation — 28 октября 2026

В эту ветку объединена `main` с foundation из PR #3 (merge commit `8180d9d`).
Clerk/Query providers, API client, общие atoms, дизайн-токены, Inter и Router
уже доступны. Контракты — в [contracts.md](contracts.md), UI — в
[ui.md](ui.md). Mock-каталог и booking mocks сохранены. `CatalogPage` и
`ItemDetailPage` подключены к routes. Реальные API каталога/бронирований пока
не реализованы.

Подтверждённые frontend routes: `/catalog`, `/items/$itemId`,
`/account/bookings/my-rentals`, `/account/bookings/incoming`. Для запуска
локально нужны свои игнорируемые env-файлы по README; ключи и данные PostgreSQL
из окружения Влада в ветку не копируются.

### Зона Яны: catalog и bookings

Цель моей части — пользователь находит опубликованную вещь в каталоге,
открывает её, выбирает свободные даты и создаёт заявку. Владелец видит
входящую заявку и управляет её статусом.

### Что уже подготовлено

- В `src/features/catalog/` есть адаптивный mock-каталог: `CatalogPage`,
  `ItemGrid` и `ItemCard`.
- Mock-данные находятся в `src/features/catalog/mocks/items.mock.ts`.
- Тип объявления находится в `src/features/catalog/types/item.ts`.
- Текущий контракт объявления совпадает с зоной Ольги:
  - `pricePerDay` — строка с ценой в EUR;
  - `images` — массив объектов `id`, `url`, `order`;
  - `owner` — публичные поля `id`, `name`, `city`.
- Карточки адаптированы для mobile, tablet и desktop.

### Контракт с зоной Ольги

Контракт Item API опубликован в [items-api.md](items-api.md). Модели
`Item`/`ItemImage`, миграция и owner API объединены в `main` через PR #1.
Публичные GET реализует Яна:

- `GET /api/items` — опубликованные объявления с фильтрами и пагинацией.
- `GET /api/items/:id` — объявление с категорией, изображениями и публичным
  owner.
- Поля `pricePerDay`, `images` и `owner` сохраняют согласованный формат.
- Query: `q`, `city`, `categoryId`, `minPrice`, `maxPrice`, `page`, `limit`.

### Что нужно от Влада

1. TanStack Router подключён. Подтверждённые маршруты:
   - `/catalog` — каталог;
   - `/items/$itemId` — детальная страница вещи;
   - `/account/bookings/my-rentals` — `Meine Mieten`;
   - `/account/bookings/incoming` — `Eingehende Anfragen`.
2. Общий API client с Clerk-токеном, формат ошибок и Query provider готовы в
   foundation; использовать их при подключении реального API.
3. Согласовать общие query keys для каталога, детали объявления, моих аренд и
   входящих заявок.
4. Общий шрифт Inter подключён в foundation, токены находятся в `src/index.css`.
5. Общий логотип находится в `src/shared/assets/renttogether-icon.svg`.

### План замены mock-данных

- `mockItems` заменяется query hook для `GET /api/items`.
- Детальная страница будет получать item по `GET /api/items/:id`.
- Фильтры каталога передаются как query-параметры API.
- Loading, error и empty states отображаются в feature-коде каталога.
- UI-код карточки не должен содержать API-запросы.

### Контракт бронирования

Для booking feature нужны типы `Booking` и `BookingStatus`.

- Статусы: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `ACTIVE`,
  `COMPLETED`.
- Арендатор создаёт заявку со статусом `PENDING`.
- Арендатор может отменить только `PENDING` заявку.
- Владелец принимает или отклоняет `PENDING` заявку; после принятия он
  переводит её в `ACTIVE`, затем в `COMPLETED`.
- Нельзя бронировать собственную вещь.
- `returnDate` должна быть позже `pickupDate`.
- День возврата не оплачивается: `totalDays = returnDate - pickupDate`.
- Клиент показывает предварительную сумму, но сервер вычисляет и сохраняет
  итоговую цену и `pricePerDay` при создании заявки.
- При подтверждении сервер повторно проверяет пересечение дат для одной вещи и
  при конфликте возвращает `409 BOOKING_DATES_UNAVAILABLE`.

### Что нужно для booking API

- `POST /api/bookings` — создать заявку.
- `GET /api/bookings/my-rentals` — заявки текущего арендатора.
- `GET /api/bookings/incoming` — заявки на вещи текущего владельца.
- Endpoint для разрешённых переходов статуса заявки.
- В ответе должны быть: ID заявки, item, даты, статус, цена за день и
  сохранённая итоговая цена.

### Что я делаю до готовности API

- Создаю типы и mock-данные бронирований в `src/features/bookings/`.
- Делаю интерфейс выбора диапазона дат и форму заявки на mock-данных.
- Создаю mock-страницы `Meine Mieten` и `Eingehende Anfragen`.
- Реальные booking API подключаются после реализации backend; foundation уже
  доступен.
