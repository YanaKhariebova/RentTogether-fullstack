# Сердечки в кабинете владельца: общий Favorite API

Обновлено 2 ноября 2026. API Яны из PR #30 объединён с main, миграция применена.
Подключена только часть Ольги: Meine Anzeigen. Каталог, страница вещи,
авторизация, Prisma и реализация Favorite API в этом пакете не менялись.

## Реальное сохранение

- useOwnerItems использует PUT/DELETE /api/me/favorites/:itemId через useApi с Clerk token.
- GET /api/my/items возвращает isFavorite текущего владельца. Сервер читает
  Favorite, отфильтрованный по его локальному userId; ID записей Favorite и
  внутренние relation/count поля в JSON не попадают.
- Состояние подтверждается сервером; после успеха обновляется кеш myItems(userId),
  инвалидируются own items, публичные item queries и префикс ['favorites'].
- Ошибка остаётся видимой, повторный запрос той же вещи блокируется, мутация
  автоматически не повторяется. Отдельного localStorage нет.
- Новый черновик нельзя добавить. Уже сохранённую скрытую вещь можно убрать.
- Скрытие вещи сохраняет isFavorite в кабинете владельца, хотя GET /me/favorites
  правильно не возвращает скрытую вещь. Окончательное удаление Item удаляет Favorite каскадно.

## Интерфейс owner UI

OwnerItemCard использует существующий IconButton 44×44, aria-pressed и
aria-busy. Пустое сердечко — не сохранено; заполненное — сохранено.
Кнопки работают мышью и клавиатурой. Состояние передаётся через item.isFavorite.

OwnerItemsStore предоставляет метод:

```ts
setFavorite?: (id: string, isFavorite: boolean) => void | Promise<void>;
```

В настоящем провайдере метод подключён, в изолированном стенде без adapter
кнопка остаётся отключённой. Для будущего общего Favorite hook можно заменить
внутреннюю реализацию useOwnerItems, сохранив контракт карточек.

## Граница с зоной Яны

Общий Favorite API готов, но каталог пока использует собственный локальный
isFavorite в ItemCard. Этот пакет не меняет ItemCard Яны и не обещает одинаковое
состояние сердечек во всём приложении до подключения её UI.
Для будущих запросов списка избранного рекомендуется ['favorites', clerkUserId],
чтобы общий префикс инвалидации работал, а данные разных аккаунтов не смешивались.
Публичные items/list/detail могут получать isFavorite отдельно в зоне Яны.

## Обновление окружения

При работающей PostgreSQL:

```sh
npm --prefix server run db:deploy
npm --prefix server run db:generate
```

После generate перезапустите backend; новых env и зависимостей нет.

## Проверки

- HTTP/DB: owner isFavorite относится только к пользователю, не исчезает после
  скрытия; удаление сердечка сохраняется; удаление Item очищает Favorite.
- Браузер: сохранение через сердечко, reload, изоляция второго Clerk-аккаунта,
  скрытие и снятие сердечка у скрытой вещи.
- Изолированный UI-стенд tests/fixtures/owner-items.html?favorite=demo использует
  adapter только в памяти; favorite=error показывает ошибку. Это не production.

Команды:

```sh
npm --prefix server run db:check
PLAYWRIGHT_CHANNEL=chrome npm run test:auth -- tests/auth/items.spec.ts --grep real.owner.creates
```

Итог 02.11: db:check — 44/44, настоящий owner browser test — 1 passed (59.2 с),
server tests — 32/32, обе сборки, lint и форматирование прошли. Owner-пакет пока
локальный, commit/push не выполнялись.
