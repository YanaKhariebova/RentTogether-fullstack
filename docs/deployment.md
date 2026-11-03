# Общий демонстрационный сайт RentTogether

Подготовка и размещение: 02.11.2026. Актуализация: 03.11.2026.
Общий demo-сайт уже работает; ниже сохранена инструкция настройки с нуля.
Ответственная за Render/Neon/Clerk deployment и Cloudinary — Ольга.
[Текущее распределение](team-status.md).

## Размещённая среда

- Frontend: https://renttogether-web.onrender.com.
- API: https://renttogether-api.onrender.com/api.
- PostgreSQL: общая Neon, отдельная от локальных БД.
- Файлы: общий Cloudinary, `IMAGE_STORAGE=cloudinary`.
- Подтверждены успешные deploy frontend/API и ручная публикация объявления.
- По сообщению Ольги совместный Booking flow с Яной, избранное, снимок цены
  и сохранение истории после скрытия проверены на общем сайте.

Ресурсы созданы через Render Dashboard вручную. `render.yaml` — альтернативный
шаблон, а не доказательство текущих dashboard-настроек. Не создавать второй
комплект сервисов при чтении инструкции. Настройку Auto-Deploy проверять отдельно.

## Схема

- Render Static Site — Vite frontend по общей HTTPS-ссылке.
- Render Free Web Service — существующий Express API, без переписывания в serverless.
- Neon Free — одна общая PostgreSQL, отдельная от локальных баз участников.
- Общие Clerk и Cloudinary остаются существующими внешними сервисами.

Среда предназначена для командной демонстрации и экзамена. По решению Ольги
примерные реквизиты Impressum и черновик Datenschutz пока сохраняются; для
экзамена задача их замены не планируется. Отметка о примерных данных остаётся.
Clerk и юридические страницы не объявляются готовыми для коммерческого production.

## Бесплатные тарифы: что важно

По официальной документации на дату подготовки:

- Render Static Sites бесплатны в пределах общих лимитов bandwidth/build minutes.
- Бесплатный API Render засыпает после 15 минут без запросов; пробуждение занимает примерно минуту. Отсутствие ответа сразу после открытия не обязательно означает поломку. Перед демонстрацией открыть API health и дождаться ответа.
- Локальный диск Render временный. Обязательно `IMAGE_STORAGE=cloudinary`, а не `local`.
- Бесплатная PostgreSQL Render истекает через 30 дней, поэтому здесь выбрана Neon.
- Neon Free не имеет фиксированного пробного срока, но имеет лимиты ресурсов и может приостанавливать вычисления. Это не гарантия постоянной бесплатной работы при любой нагрузке.
- Vercel Hobby ориентирован на личное некоммерческое использование. Для этой конфигурации отдельный Vercel не требуется.

Проверить текущие условия при регистрации; не выбирать платные планы или upgrade по привычке.

## Что подготовлено в репозитории

`render.yaml` описывает два сервиса с deployment из `main`. В шаблоне автодеплой
выключен; реальные сервисы создавались вручную, поэтому фактическое значение
Auto-Deploy нужно смотреть в Render Settings каждого сервиса. Команда может
выбрать After CI Checks Pass (`checksPass`) либо продолжать ручное обновление.

API:

- Root Directory: `server`.
- Build: `npm ci --include=dev && npm run build` — включает Prisma generate и TypeScript.
- Start: `npm run db:deploy && npm run db:seed && npm start`.
- Health Check: `/api/health`.
- Region: Frankfurt.
- Node: `24.14.0`, как в текущем локальном окружении; CI использует Node 24.

Миграции и seed запускаются до API, потому что отдельный pre-deploy hook недоступен бесплатному Web Service. Ошибка останавливает запуск, вместо старта с неподходящей схемой. Seed повторяемый; без `SEED_*` создаёт категории и не выдумывает Clerk-пользователей. Не задавать `SEED_OWNER_CLERK_ID` и `SEED_RENTER_CLERK_ID` для обычного облачного старта.

Frontend:

- Root Directory: корень репозитория.
- Build: `npm ci --include=dev && npm run build`.
- Publish Directory: `dist`.
- Rewrite `/*` → `/index.html`: обновление `/account/items`, `/hilfe` и других вложенных URL не приводит к 404.

Никакие локальные `.env` не редактируются. Секреты вводятся непосредственно в dashboard сервисов. В Blueprint стоят `sync: false`, реальные значения в Git отсутствуют. Render сам назначает `PORT`; не копировать локальный `PORT=3000`.

## Шаг 1. Аккаунты и доступ к коду

1. Создать аккаунты [Render](https://dashboard.render.com/) и [Neon](https://console.neon.tech/). По возможности использовать приглашения участников, а не общий пароль.
2. В Render связать GitHub и дать доступ только к `YanaKhariebova/RentTogether-fullstack`. Для приватного репозитория его владелице может потребоваться одобрить установку GitHub-приложения.
3. Провести review и merge deployment-пакета в `main`. Чужие незавершённые изменения в main ради deployment не переносить.

## Шаг 2. Создать общую PostgreSQL в Neon

1. Создать Free-проект `renttogether-demo`.
2. Выбрать регион по возможности рядом с API Frankfurt.
3. Открыть Connect, выбрать базу и роль, скопировать **direct/unpooled connection string**. Здесь один обычный backend, поэтому отдельный pooler не обязателен.
4. Сохранить целиком строку с TLS-параметрами, выданными Neon. Не отключать проверку сертификатов для обхода ошибки подключения.
5. Вставить её только как `DATABASE_URL` backend в Render. Не вставлять в `VITE_*`, документы, коммиты или скриншоты.

Новое облако сначала пустое: миграции создают структуру, seed — категории. Старые локальные объявления сами туда не переезжают. Для первого запуска проще создать новые демонстрационные объявления через общий сайт.

## Шаг 3. Подготовить переменные

### Backend — только Render API

| Имя                     | Значение                                                    |
| ----------------------- | ----------------------------------------------------------- |
| `NODE_ENV`              | `production`                                                |
| `NODE_VERSION`          | `24.14.0`                                                   |
| `DATABASE_URL`          | Секретная TLS-строка из Neon                                |
| `CLIENT_URL`            | Реальный HTTPS-origin frontend, без завершающего `/` и пути |
| `CLERK_PUBLISHABLE_KEY` | Публичный ключ выбранного общего Clerk instance             |
| `CLERK_SECRET_KEY`      | Секретный ключ **того же** instance                         |
| `IMAGE_STORAGE`         | `cloudinary`                                                |
| `CLOUDINARY_CLOUD_NAME` | Из общего Cloudinary                                        |
| `CLOUDINARY_API_KEY`    | Из общего Cloudinary                                        |
| `CLOUDINARY_API_SECRET` | Из общего Cloudinary                                        |
| `CLOUDINARY_FOLDER`     | `renttogether/demo/items`                                   |

`CLIENT_URL` используется и для CORS, и для проверки Clerk authorized parties. Разрешён ровно выбранный frontend. Локальные origin этим не подменяются: на ПК участников остаются локальные env.

### Frontend — только Render Static Site

| Имя                          | Значение                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| `NODE_VERSION`               | `24.14.0`                                                         |
| `VITE_CLERK_PUBLISHABLE_KEY` | Тот же publishable key, что на backend                            |
| `VITE_API_URL`               | Реальный HTTPS URL API **с `/api` в конце**, без завершающего `/` |

`VITE_*` попадают в доступный браузеру JS. Секретный ключ Clerk, Cloudinary secret и строка PostgreSQL туда не добавляются. После смены `VITE_*` требуется новая **сборка** frontend.

## Шаг 4. Создать сервисы

Есть два равнозначных способа: Blueprint или ручное создание. Выбрать один, не создавать дубликаты.

### Вариант A — Blueprint

1. Render → New → Blueprint → выбрать репозиторий и `main` с `render.yaml`.
2. Проверить, что API на Free, frontend — Static Site, платная Render PostgreSQL не добавляется.
3. Внести значения `sync: false`.
4. Если реальные URL сервисов ещё неизвестны, временно использовать `CLIENT_URL=https://example.invalid` и `VITE_API_URL=https://example.invalid/api`. Это заглушки, а не рабочие адреса.
5. После создания скопировать **реальные** выданные URL: названия могут получить суффикс, угадывать адреса нельзя.
6. В API заменить `CLIENT_URL` реальным frontend origin и выполнить redeploy API.
7. В frontend заменить `VITE_API_URL` реальным API URL + `/api` и выполнить redeploy frontend.
8. Только после этих замен проверять вход и данные. Изначальные ошибки соединения с заглушкой ожидаемы.

### Вариант B — вручную, по одному сервису

1. New → Static Site: репозиторий, `main`, build/publish и frontend env из этой инструкции. Временно `VITE_API_URL=https://example.invalid/api`.
2. После создания записать фактический URL frontend.
3. Settings → Redirects/Rewrites: Source `/*`, Destination `/index.html`, Action **Rewrite** (не redirect).
4. New → Web Service: тот же репозиторий, `main`, Node runtime, Root Directory `server`, Free, Frankfurt; build/start/health и backend env из инструкции. В `CLIENT_URL` уже поставить известный адрес frontend.
5. Дождаться успешного API deployment, записать его фактический URL.
6. В Static Site заменить `VITE_API_URL` на API URL + `/api`, пересобрать frontend.
7. Отключить автоматический deployment на этапе первого запуска либо настроить запуск после успешных checks по согласованию команды.

## Шаг 5. Проверить Clerk

Ключи общего Development instance подходят только для командной тестовой среды, а не для запуска настоящего публичного сервиса. Согласовать с Владом выбранное окружение; не менять действующий общий instance вслепую.

- Проверить вход/выход на фактическом HTTPS-origin и переходы `/sign-in`, `/sign-up`, `/account/profile`.
- Если dashboard требует настройки разрешённых origin, redirect или OAuth, добавить реальный demo-origin, сохранив локальную разработку участников. Не ослаблять серверную проверку authorized parties до wildcard.
- Для публичного production Clerk требует отдельной настройки домена/DNS и production instance; Development и Production имеют разные ключи и пользователей.
- `NODE_ENV=production` у Express само по себе не переводит Clerk в Production.

При ошибке входа сначала сравнить instance ключей, точный `CLIENT_URL` и актуальную frontend сборку. Не отправлять секреты в чат.

## Шаг 6. Проверка общей ссылки

Из корня репозитория, подставив реальные адреса:

```bash
node scripts/check-deployment.mjs https://renttogether-web.onrender.com https://renttogether-api.onrender.com/api
```

Скрипт делает только публичные GET: HTTPS frontend, SPA fallback `/hilfe`, health, CORS, категории и каталог. Он не входит в аккаунт, не создаёт записи и не подтверждает защищённые сценарии. Время ожидания запроса — до двух минут на пробуждение free API.

Затем вручную двумя аккаунтами и желательно с разных устройств:

- [ ] Вход, изменение профиля и reload.
- [x] Владелец создаёт вещь с фото и публикует её.
- [x] Второй пользователь на другом ПК видит вещь в общем каталоге.
- [x] Фото открывается по HTTPS Cloudinary URL; после reload всё сохраняется.
- [x] Избранное сохраняется; пользовательский rental/favorite сценарий подтверждён Ольгой.
- [ ] Отдельная негативная cloud-проверка чужого списка/изменения — при необходимости; локальные auth/DB тесты изоляции уже прошли.
- [x] Заявка → подтверждение → занятые даты → ACTIVE → COMPLETED.
- [x] Изменение цены вещи не меняет цену заявки; скрытие сохраняет историю.
- [ ] Чужое объявление нельзя менять.
- [x] Прямая загрузка вложенных маршрутов работает (публичный smoke: `/hilfe`).
- [ ] Ольга и Яна согласуют исполнителя проверки mobile/PWA по HTTPS; Влад больше не назначается на эту задачу.

Обновление приложения: сначала backup/оценка совместимости БД, затем deployment API с миграциями и frontend. Не выполнять `migrate reset`, не удалять рабочие миграции. При откате кода учитывать, что схема автоматически назад не откатывается.

## Что уже выполнено и что остаётся

Render frontend/API и Neon созданы и настроены, схема и категории доступны,
Cloudinary подключён, интерфейс обращается к реальному API. Общая ссылка работает.
Секреты хранятся в настройках сервисов и не включены в этот документ.
Локальные env участников автоматически облачными не заменялись.

Повторный полный Booking flow сейчас не требуется: Ольга подтвердила его с Яной.
Остаются проверка фактических Render revisions после новых merge, PWA на реальных
устройствах и репетиция экзамена. При регрессиях повторять затронутые сценарии.
В GitHub уже merged исправления фото (#43) и синхронизации сердечек (#44),
но это само по себе не подтверждает, что оба Render сервиса развёрнуты на последнем main.

## Официальные источники

- [Render: бесплатные сервисы и ограничения](https://render.com/docs/free).
- [Render: Static Sites](https://render.com/docs/static-sites).
- [Render: Blueprint specification](https://render.com/docs/blueprint-spec).
- [Render: Node version](https://render.com/docs/node-version).
- [Neon: актуальные тарифы](https://neon.com/pricing).
- [Neon: подключение PostgreSQL](https://neon.com/docs/connect/connect-from-any-app).
- [Clerk: Development и Production](https://clerk.com/docs/guides/development/managing-environments).
- [Clerk: production deployment](https://clerk.com/docs/guides/development/deployment/production).
- [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Проверки подготовленного пакета

- `render.yaml` соответствует официальной JSON Schema Render.
- `npm run lint`, `npm run build`, `npm --prefix server run build`, Prettier и `git diff --check` прошли.
- `node --check scripts/check-deployment.mjs` прошёл.
- Публичный smoke прошёл на реальном deployment 02.11 и повторно 03.11: frontend HTTPS, SPA fallback, API health, категории Neon/CORS и каталог. Он не заменяет ручной вход и защищённые сценарии.
