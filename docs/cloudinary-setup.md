# Cloudinary: подключение фотографий — 29.10.2026

Команда выбрала Cloudinary. Серверный адаптер реализован; настоящий аккаунт
подключается через локальный server/.env. Настоящий аккаунт команды проверен 29.10.2026: storage:check прошёл у Ольги,
затем браузерный сценарий с двумя реальными Clerk-аккаунтами прошёл с
Cloudinary URL. Изолированные тесты дополняют эту проверку.

## Что уже готово

- Подписанная серверная загрузка через официальный Node.js SDK.
- Стабильный HTTPS URL с версией изображения; frontend продолжает читать image.url.
- Уникальный public_id без перезаписи существующих файлов.
- Удаление по public_id с invalidate=true; отсутствие объекта считается успехом.
- Повтор удаления через ImageCleanup, включая потерянный ответ upload с известным ID.
- Смешанное чтение/удаление Cloudinary и старых локальных файлов.
- IMAGE_STORAGE=local сохраняется для offline-разработки; production требует cloudinary.

Проверка содержимого, размера, количества и владельца выполняется общим сервисом
до Cloudinary. Переключение не требует миграции БД: storageKey уже строковый.

## Шаг 1. Общий аккаунт

Используйте согласованный аккаунт команды. Если его ещё нет, создайте аккаунт
на [Cloudinary](https://cloudinary.com/). В Console Settings → API Keys найдите
Cloud name, API Key и API Secret. При изменении интерфейса ориентируйтесь на
[официальную инструкцию конфигурации](https://cloudinary.com/documentation/node_integration#configure).

Для server-side signed upload не нужен unsigned upload preset. Ключи передаются
участникам приватно; в репозитории остаётся только .env.example без значений.
Не добавляйте секрет в frontend, переменные VITE_* или сообщения PR.

## Шаг 2. Настройка локального server/.env

Сохраните существующие DATABASE_URL, Clerk и CLIENT_URL. Дополните файл:

```dotenv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=renttogether/dev/olga/items
```

Замените три значения на данные аккаунта, затем установите **одну** строку:

```dotenv
IMAGE_STORAGE=cloudinary
```

Уберите дубли IMAGE_STORAGE, если строка уже была в файле. Папка создаётся при
upload; Влад и Яна могут использовать dev/vlad/items и dev/yana/items, сохраняя
один cloud account. Выберите отдельную папку для общего demo/production.
Папка в настройке — сегменты из латинских букв, цифр, `_` и `-` через `/`.

Если после смены env backend остановился, проверьте полноту всех трёх значений.
Секретные значения в лог или чат не копируйте. После настройки **явно перезапустите
backend** через Ctrl+C и `npm --prefix server run dev`. В журнале должно быть
`(image storage: cloudinary)`. Успех storage:check сам по себе не переключает уже
запущенный процесс: команда читает env отдельно.

## Шаг 3. Зависимости и проверка аккаунта

Из корня проекта:

```sh
npm --prefix server ci
npm --prefix server run storage:check
```

storage:check работает только с IMAGE_STORAGE=cloudinary. Создаёт один временный
PNG 8×8, загружает его, получает публичный HTTPS URL, декодирует изображение и
удаляет именно созданный объект. При успехе выводит три сообщения:

```text
Cloudinary upload passed.
Public HTTPS image URL passed.
Cloudinary deletion confirmed (CDN invalidation may take time).
```

Проверка использует реальный аккаунт и сетевые обращения. При ошибке удаления
выводится несекретный ключ временного объекта для ручной очистки в Media Library.
Ключи аккаунта и ответы SDK с техническими деталями не печатаются.
CDN может некоторое время отдавать кеш после destroy: проверка не требует
мгновенного HTTP 404, а проверяет подтверждение удаления Cloudinary.

## Шаг 4. Проверка через интерфейс

При запущенных PostgreSQL, API и frontend:

1. Создать новое объявление с фото и сохранить черновик.
2. Открыть фото: адрес должен начинаться с https://res.cloudinary.com/.
3. Перезагрузить страницу; фото должно остаться.
4. Опубликовать вещь и открыть её из каталога.
5. Снять с публикации, отредактировать и удалить фото.
6. В Cloudinary Media Library проверить удаление соответствующего объекта.

Эта последовательность проверена 29.10.2026. При переносе настроек на другой
компьютер её нужно повторить. Прежние локальные фото не переносятся автоматически: они
продолжат работать на текущем локальном сервере. Для deployment нужно отдельно
перенести такие фотографии или загрузить их заново через форму.

## Ключ и очередь удаления

Новые ключи имеют вид `cloudinary:<cloud>:<version>:<format>:<public_id>`.
В URL/JSON наружу выдаётся только image.url, storageKey остаётся на сервере.
Ключи без префикса cloudinary: обрабатывает прежний локальный адаптер. При смене
папки старые Cloudinary ID продолжают удаляться; смена cloud account требует
отдельного переноса. Ключ другого cloud отклоняется, а не удаляется вслепую.

Сначала неуспешное удаление сохраняется в ImageCleanup; сервер повторяет его.
Как и у любого внешнего хранилища, аварийное завершение между upload и регистрацией
БД или одновременная недоступность БД/Cloudinary могут потребовать сверки объектов.
Перед production эта сверка остаётся отдельной эксплуатационной задачей.

## Источники и файлы

- [Node.js upload](https://cloudinary.com/documentation/node_image_and_video_upload).
- [Destroy и инвалидирование CDN](https://cloudinary.com/documentation/image_upload_api_reference#destroy).
- server/src/modules/items/storage/cloudinaryImageStorage.ts — SDK adapter.
- server/src/modules/items/storage/configureImageStorage.ts — выбор провайдера и legacy routing.
- server/src/scripts/checkImageStorage.ts — явная live-проверка.
- server/tests/cloudinaryStorage.test.ts — изолированные проверки без аккаунта.
