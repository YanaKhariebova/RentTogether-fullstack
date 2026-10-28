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
| Связи Item                    | `Item.ownerId`, `Item.categoryId` — `String @db.Uuid`                                            |
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

Вход и сохранение профиля проверены Ольгой 28 октября. Следующие задачи:

1. Подключить категории, локального пользователя и общий формат ошибок.
2. Заменить useMockOwnerItems настоящими запросами и мутациями после подключения фото.
3. Инвалидировать согласованные ключи каталога, карточки и кабинета.

Общую схему меняем последовательно: User/Category → Item/ItemImage → Booking.
Схему Booking согласует Яна до своей миграции. Item содержит createdAt для
сортировки, публичный DTO пока обходится без даты.

## Что ещё нужно согласовать

- Проверку полного сценария объявлений с двумя настоящими Clerk-аккаунтами.
- Хранилище фото, серверная загрузка/удаление и постоянный image.url.
- Upload response и серверные ограничения: текущая форма допускает
  JPEG/PNG/WebP, до 5 МБ, до 8 фото. Сервер должен проверять их независимо.
- Обновление кеша бронирований после нужных мутаций при интеграции с Яной.

Mock-кабинет не проверяет реальное право доступа. Каждый изменяющий маршрут
backend обязан получить локального пользователя из auth и проверить владельца.

## Итог первого этапа

Модели, миграция, owner API, mock-форма и opt-in seed готовы.
Состояние и ERD описаны в [итоге этапа](items-milestone-27-30.md).
Контракты реализованного owner API — в [items-api.md](items-api.md).
