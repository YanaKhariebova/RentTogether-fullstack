# RentTogether

Fullstack-Abschlussprojekt am DCI. Eine Plattform zum Mieten und Verleihen von Gegenständen.

## Lokaler Start

Voraussetzung für die aktuellen Testbefehle: Node.js 24.

```bash
npm ci
npm --prefix server ci
```

Vor dem ersten Start Clerk und PostgreSQL gemäß [Setup](docs/foundation-setup.md)
konfigurieren. Bestehende env-Dateien ergänzen. Danach alle lokalen Dienste starten:

```bash
npm run dev:all
```

Alte Backend-Prozesse vorher mit Ctrl+C beenden. Das Terminal offen lassen;
die Adresse erscheint nach `[dev:all] Ready`. Einzelne Startbefehle stehen im Setup.

Foundation mit Clerk, Router, Query und Inter ist integriert. Kopiere `.env.example`
nach `.env.local` und `server/.env.example` nach `server/.env` und konfiguriere
Clerk und PostgreSQL gemäß [Setup](docs/foundation-setup.md). Ohne Clerk Publishable Key
zeigt das Frontend einen Einrichtungshinweis.

Der Besitzerbereich unter `/account/items` ist mit der API verbunden. Anzeigen
und Fotos bleiben nach dem Neuladen erhalten. Cloudinary ist als Bildspeicher
integriert; Einrichtung: [Cloudinary](docs/cloudinary-setup.md).

`npm run dev` übernimmt Host und Port aus `CLIENT_URL` in `server/.env`, passend
zu CORS und Clerk im Backend. Ohne Konfiguration gilt `http://localhost:5173`.
Bei belegtem Port stoppt Vite, statt auf einen anderen Port auszuweichen.
Öffnet die im Terminal angezeigte Adresse. Weitere Details: [Lokales Setup](docs/foundation-setup.md).

## Prüfungen

```bash
npm run build
npm run lint
npm --prefix server run build
npm run test:items
npm run format:check
npm --prefix server test
npm --prefix server run db:check
npm run test:notifications
npm run test:messages
PLAYWRIGHT_CHANNEL=chrome npm run test:ui
```

Для проверки настоящих Clerk-сессий и сохранения профиля двумя аккаунтами:

```sh
npm run test:auth
```

Это отдельная проверка с Development-ключами и локальной PostgreSQL, не обычный
CI. Она создаёт двух временных пользователей, проверяет профиль/выход/переключение
и удаляет созданные данные. Подробности и ограничения —
[auth-verification.md](docs/auth-verification.md).

API-тесты используют отдельный HTTP-сервер и подменяют Clerk/репозиторий;
они не требуют ключей и не доказывают подключение к настоящей БД/Clerk.
UI-тесты в Playwright проверяют реальные компоненты в изолированной fixture:
360/390/768/1024/1440 px, переполнение, навигацию, доступные подписи и клавиатуру.
По умолчанию используется установленный Microsoft Edge. Для Linux можно запустить
`npx playwright install chromium` и задать `PLAYWRIGHT_CHANNEL=chromium`.

## Dokumentation

Die Projektdokumentation liegt in [`docs/`](docs/):

- [Projektplan und Aufgaben](docs/TODO.md)
- [Originalanforderungen von DCI](docs/final-projekt-info.md)
- [Abschlussprüfung und ERD — 04.11.2026](docs/final-readiness-2026-11-04.md)
- [Aktuelle Präsentation und Sprechtexte für Olha und Yana](docs/presentation-2026-11-09/START-HERE.txt)
- [Anforderungen und Design](docs/requirements.md)
- [Items API Vertrag](docs/items-api.md)
- [Teamstatus und Zuständigkeiten](docs/team-status.md)
- [Tagesberichte von Olga](docs/progress.md)
- [Foundation Setup](docs/foundation-setup.md)
- [Gemeinsame Verträge](docs/contracts.md)
- [Gemeinsame UI Komponenten](docs/ui.md)
