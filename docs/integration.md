# Подключение объявлений к общей основе

## Полученный ответ Влада

28 октября получен foundation PR № 3, коммит 0428c22. Контракты прочитаны,
совместимость проверена; результаты и ограничения — в [review](foundation-review.md).
Foundation объединён с main и веткой Ольги. Общие atoms, Header, Inter и
Router подключены к кабинету; объявления пока остаются mock-данными.
Текущее состояние описано в [интеграции](foundation-integration.md).

| Область                       | Принятый интерфейс foundation                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| User / Category               | `String @id @default(uuid()) @db.Uuid`; JSON ID — строки                                         |
| Связи Item                    | Будущие `ownerId`, `categoryId` — `String @db.Uuid`                                              |
| Текущий пользователь backend  | `res.locals.currentUser` после `deps.authenticate`                                               |
| Проверка владельца            | `requireOwner(item.ownerId, res.locals.currentUser.id)`                                          |
| Текущий пользователь frontend | `useCurrentUser()`, результат `data.user`                                                        |
| Atoms                         | `Button`, `Input`, `Textarea`, `Select`, `Badge`, `Spinner`, `IconButton` из `@/shared/ui/atoms` |
| API client                    | `useApi()` из `@/features/auth/api/useApi`; путь `/items`, без повторного `/api`                 |
| Категории                     | `useCategoriesQuery()`, результат `data.categories`                                              |
| Ошибки                        | `ApiError`: status, detail.code, detail.fields; fields — массивы строк                           |
| Query keys                    | `apiKeys.items`, `itemList(query)`, `item(id)`, `myItems(userId)`                                |
| Routes                        | `/account/items`, `/account/items/new`, `/account/items/$itemId/edit`                            |
| Layout                        | PageLayout уже подключён в root route                                                            |
| Шрифт                         | Inter Variable подключён локально со стороны foundation                                          |
| Логотип                       | Одинаковый SVG в `src/shared/assets/renttogether-icon.svg`                                       |

Подробные props atoms описаны Владом в `docs/ui.md` его ветки. Input/Textarea
получают label и error, Select — label и options из value/label, Button —
variant и loading. OnChange — стандартный DOM event; молекулы Ольги могут
сохранить onChange(value), адаптируя событие внутри. Submit-кнопке явно нужен
`type="submit"`.

## Следующие действия после интеграции frontend

1. Настроить ключи Clerk и проверить настоящий вход.
2. Подключить категории, локального пользователя и общий формат ошибок.
3. Добавить Item/ItemImage и обратные relations в User/Category; затем миграцию.
4. После owner API заменить useMockOwnerItems настоящими запросами и мутациями.
5. Инвалидировать согласованные ключи каталога, карточки и кабинета.

Общую схему меняем последовательно: User/Category → Item/ItemImage → Booking.
Схему Booking согласует Яна до своей миграции. Item требует createdAt для
сортировки, публичный DTO пока обходится без даты.

## Что ещё нужно согласовать

- Ключи одного Clerk-приложения для проверки реального входа. Секретный ключ
  используется только в server/.env, файлы env в Git не добавляются.
- Хранилище фото, серверная загрузка/удаление и постоянный image.url.
- Upload response и серверные ограничения: текущая форма допускает
  JPEG/PNG/WebP, до 5 МБ, до 8 фото. Сервер должен проверять их независимо.
- Контракты owner API и обновление кеша бронирований после нужных мутаций.

Mock-кабинет не проверяет реальное право доступа. Каждый изменяющий маршрут
backend обязан получить локального пользователя из auth и проверить владельца.
