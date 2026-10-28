# Интеграция кабинета с foundation

28 октября 2026 года PR Влада № 3 объединён с main (8180d9d), затем с веткой
Ольги (merge-коммит bc06361). Конфликты README, index.html, App.tsx и
App.module.css разрешены с сохранением общей основы и кабинета.

## Подключено

- Общие ClerkProvider, QueryClientProvider, RouterProvider и PageLayout.
- Header, SVG логотип, favicon, Inter Variable и общие design tokens.
- Input, Textarea, Select, Button и Badge вместо временных HTML-controls Ольги.
- Защищённые routes /account/items, /account/items/new, /account/items/$itemId/edit.
- OwnerItemsProvider сохраняет mock-объявления и URL фото между страницами
  раздела. При выходе из раздела, перезагрузке или смене Clerk userId данные сбрасываются.
- Публичный Item DTO переиспользуется из shared/api/types.
- test:items запускает 15 тестов; команда добавлена в CI.
- В tests/fixtures/owner-items.html есть изолированный UI-стенд без Clerk,
  не импортируемый production-приложением.

Подготовка проверялась во временной копии: build, lint, Prettier и 15 тестов,
создание → preview → сохранение → список → динамический route редактирования.
Фото остаётся загруженным после перехода в список. На 360 px форма не имеет
горизонтального переполнения и использует Inter. В рабочей ветке также проходят обе сборки, ESLint, Prettier,
15 тестов items, 13 API/валидационных и 17 PostgreSQL/HTTP/seed тестов.

## Ещё не подключено

Ольга настроила локальные env и проверила вход через общий Clerk,
сохранение и перезагрузку профиля 28 октября. Эти значения в Git не хранятся.
Проверка объявлений с двумя реальными аккаунтами относится к следующему этапу.

Item/ItemImage и owner API уже реализованы и проверены на тестовой PostgreSQL.
Категории, объявления и владелец в frontend пока берутся из mock-данных.
Подключение Query, постоянных фотографий и настоящего owner API к форме ещё впереди.

## Маршруты Яны

Фактический итог main использует /account/bookings/my-rentals и
/account/bookings/incoming. Ранее команда присылала сообщение с /account/rentals
и /account/requests, но финальный коммит Влада c177125 сохранил исходные пути.
Во время подключения объявлений они не менялись.
