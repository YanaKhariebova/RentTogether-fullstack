# Подключение каталога и бронирований к общей основе

## Статус foundation — 28 октября 2026

В эту ветку объединена `main` с foundation из PR #3 (merge commit `8180d9d`).
Clerk/Query providers, API client, общие atoms, дизайн-токены, Inter и Router
уже доступны. Контракты — в [contracts.md](contracts.md), UI — в [ui.md](ui.md).
Mock-каталог и booking mocks сохранены; подключение страниц к routes остаётся
за Яной. Реальные API каталога/бронирований пока не реализованы.

Подтверждённые frontend routes: `/catalog`, `/items/$itemId`,
`/account/bookings/my-rentals`, `/account/bookings/incoming`.
Для запуска локально нужны свои игнорируемые env-файлы по README;
ключи и данные PostgreSQL из окружения Влада в ветку не копируются.

## Зона Яны: catalog и bookings

Цель моей части — пользователь находит опубликованную вещь в каталоге,
открывает её, выбирает свободные даты и создаёт заявку. Владелец видит
входящую заявку и управляет её статусом.

## Что уже подготовлено

- В `src/features/catalog/` есть адаптивный mock-каталог: `CatalogPage`,
  `ItemGrid` и `ItemCard`.
- Mock-данные находятся в `src/features/catalog/mocks/items.mock.ts`.
- Тип объявления находится в `src/features/catalog/types/item.ts`.
- Текущий контракт объявления совпадает с зоной Ольги:
  - `pricePerDay` — строка с ценой в EUR;
  - `images` — массив объектов `id`, `url`, `order`;
  - `owner` — публичные поля `id`, `name`, `city`.
- Карточки адаптированы для mobile, tablet и desktop.

## Что нужно от Ольги

1. Опубликовать и поддерживать контракт item API в `docs/items-api.md`.
2. Для каталога нужны публичные маршруты:
   - `GET /api/items` — опубликованные объявления с фильтрами и пагинацией;
   - `GET /api/items/:id` — одно объявление с категорией, изображениями и
     публичными данными владельца.
3. В ответах сохранить согласованные форматы `pricePerDay`, `images` и
   `owner`.
4. После создания модели `Item` сообщить, какие query-параметры поддерживает
   каталог: поиск, город, категория, минимальная/максимальная цена, страница
   и лимит.

## Что нужно от Влада

1. TanStack Router подключён. Подтверждённые маршруты:
   - `/catalog` — каталог;
   - `/items/$itemId` — детальная страница вещи;
   - `/account/bookings/my-rentals` — `Meine Mieten`;
   - `/account/bookings/incoming` — `Eingehende Anfragen`.
2. Подготовить общий API client с Clerk-токеном, единый формат ошибок и
   TanStack Query provider.
3. Согласовать общие query keys для каталога, детали объявления, моих аренд
   и входящих заявок.
4. Общий шрифт `Inter` подключён в foundation, токены находятся в `src/index.css`.
5. Общий логотип находится в
   `src/shared/assets/renttogether-icon.svg`.

## План замены mock-данных

- `mockItems` заменяется query hook для `GET /api/items`.
- Детальная страница будет получать item по `GET /api/items/:id`.
- Фильтры каталога передаются как query-параметры API.
- Loading, error и empty states отображаются в feature-коде каталога.
- UI-код карточки не должен содержать API-запросы.

## Контракт бронирования

Для booking feature нужны типы `Booking` и `BookingStatus`.

- Статусы: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `ACTIVE`,
  `COMPLETED`.
- Арендатор создаёт заявку со статусом `PENDING`.
- Арендатор может отменить только `PENDING` заявку.
- Владелец принимает или отклоняет `PENDING` заявку; после принятия он
  переводит её в `ACTIVE`, затем в `COMPLETED`.
- Нельзя бронировать собственную вещь.
- `returnDate` должна быть позже `pickupDate`.
- День возврата не оплачивается:
  `totalDays = returnDate - pickupDate`.
- Клиент показывает предварительную сумму, но сервер вычисляет и сохраняет
  итоговую цену и `pricePerDay` при создании заявки.
- При подтверждении сервер повторно проверяет пересечение дат для одной
  вещи и при конфликте возвращает `409 BOOKING_DATES_UNAVAILABLE`.

## Что нужно для booking API

- `POST /api/bookings` — создать заявку.
- `GET /api/bookings/my-rentals` — заявки текущего арендатора.
- `GET /api/bookings/incoming` — заявки на вещи текущего владельца.
- Endpoint для разрешённых переходов статуса заявки.
- В ответе должны быть: ID заявки, item, даты, статус, цена за день и
  сохранённая итоговая цена.

## Что я делаю до готовности API

- Создаю типы и mock-данные бронирований в `src/features/bookings/`.
- Делаю интерфейс выбора диапазона дат и форму заявки на mock-данных.
- Создаю mock-страницы `Meine Mieten` и `Eingehende Anfragen`.
- Не подключаю реальные API и Clerk до появления общей основы от Влада.
