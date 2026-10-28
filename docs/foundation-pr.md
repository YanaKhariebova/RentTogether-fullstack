# feat: add authentication, profiles and shared UI foundation

До этой ветки приложение содержало только стартовую страницу и health endpoint.
Теперь подготовлены Clerk-auth, локальные User/Category, API профиля/категорий,
защищённые маршруты, страница профиля и общий UI для подключения объявлений и каталога.

- Prisma 7, UUID IDs, начальная миграция, идемпотентный seed и переносимая локальная PostgreSQL.
- Bearer API client, единые ошибки, server-side проверка владельца и Zod validation.
- TanStack Router/Query, UI atoms, responsive Header/bottom nav, Inter и общий SVG логотип.
- Контракты: docs/contracts.md, docs/ui.md, docs/owner-integration.md.
- GitHub Actions проверяет сборки, lint, форматирование и миграции/seed на PostgreSQL.

Проверено локально: обе сборки/lint, Prisma validate, форматирование,
8 API-тестов, 4 интеграционных теста с настоящей PostgreSQL и 5 браузерных проверок
на 360/390/768/1024/1440 px. Миграция/seed дважды применены к чистой тестовой БД,
а также применены к рабочей локальной rent_together.

Настоящий вход/выход через Clerk пока не проверен: нужны ключи приложения Влада.
В DB-тестах подменяется только проверенная Clerk-идентичность.
Страницы Item/Booking — точки подключения с заглушками; реализация Ольги из PR #1
не объединена в эту ветку. Фото и Booking schema требуют отдельного согласования.

По сообщению команды 28 октября review foundation пройден без блокирующих
замечаний: модели, authenticate, atoms, API client, ошибки и owner routes подтверждены.
Яна подтвердила исходные /account/bookings/my-rentals и
/account/bookings/incoming; Router и навигация синхронизированы. Настоящий Clerk-вход
остаётся отдельной непроверенной интеграцией до настройки ключей.
