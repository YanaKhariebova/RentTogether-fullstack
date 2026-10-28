# Проверка Clerk и профиля — 28 октября 2026

Проверен полный путь через настоящий Development Clerk, браузер, Express API
и локальную PostgreSQL. Команда: `npm run test:auth`.

## Что подтверждено

- Без сессии `/account/profile` показывает приглашение войти.
- Два временных Clerk-пользователя получают разные UUID в локальной User.
- Редактирование имени, города и телефона сохраняется через PATCH /api/me.
- После перезагрузки браузера профиль загружается из БД с сохранёнными данными.
- После выхода кабинет скрыт, GET /api/me возвращает 401.
- В одном браузерном контексте переключение owner → renter → owner
  не смешивает профили и кеш TanStack Query.
- Публичный ответ /api/me не раскрывает clerkUserId.
- По окончании удаляются только Clerk-пользователи и локальные профили,
  созданные этим запуском теста.

## Как повторить локально

Нужны зависимости frontend/backend, свои env-файлы и запущенная PostgreSQL:

```sh
npm ci
npm --prefix server ci
npm --prefix server run db:local
```

В другом терминале при первом запуске:

```sh
npm --prefix server run db:deploy
npm --prefix server run db:seed
npm run test:auth
```

Тест сам запускает frontend/API либо использует уже работающие сервисы.
Frontend origin берётся из CLIENT_URL в server/.env; при порте 5174 он должен
быть `http://localhost:5174`. Существующий backend после смены env нужно перезапустить.
Ключи frontend и backend должны относиться к одному Development instance.
БД/frontend/API должны быть локальными. Production keys не принимаются.

По умолчанию используется установленный Edge. Для другого окружения установите
Playwright Chromium и задайте PLAYWRIGHT_CHANNEL=chromium.
Trace/video с сессионными данными не сохраняются. Секреты и пароли не записываются
в репозиторий. Пароли временных тестовых пользователей случайные и живут только
в памяти процесса создания; вход в тесте выполняется через официальный helper.

## Границы проверки

Используется [официальный Clerk signIn helper](https://clerk.com/docs/guides/development/testing/playwright/test-helpers)
с emailAddress: Clerk создаёт настоящую сессию, но helper пропускает ввод пароля,
email verification и MFA. Наш backend при этом получает и проверяет настоящий JWT;
auth middleware, БД и API не подменяются.

Ручная регистрация, ввод пароля/OTP, доставка email и Google OAuth этой проверкой
не покрываются. Их нужно проверить отдельно в обычном браузере перед демонстрацией.
Настройки общего Clerk Dashboard тест не меняет. Используются временные
[тестовые email-адреса Clerk](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)
с суффиксом +clerk_test.

Тест запускается явно и не добавлен в обычный CI: ему нужны действующие секреты
Development-приложения и локальная БД. Обычные API/UI/DB проверки CI остаются
независимыми от общих Clerk-ключей.
