# RentTogether

Fullstack-Abschlussprojekt am DCI. Eine Plattform zum Mieten und Verleihen von Gegenständen.

## Lokaler Start

Voraussetzung für die aktuellen Testbefehle: Node.js 24.

```bash
npm ci
npm --prefix server ci
npm run dev
```

Das Frontend ist normalerweise unter `http://localhost:5173` erreichbar.
Den Express-Server bei Bedarf in einem zweiten Terminal starten:

```bash
npm --prefix server run dev
```

Foundation mit Clerk, Router, Query und Inter ist integriert. Kopiere `.env.example`
nach `.env.local` und `server/.env.example` nach `server/.env` und konfiguriere
Clerk und PostgreSQL gemäß [Setup](docs/foundation-setup.md). Ohne Clerk Publishable Key
zeigt das Frontend einen Einrichtungshinweis.

Der Besitzerbereich unter `/account/items` verwendet weiterhin Mock-Daten.
Änderungen gehen beim Neuladen oder Verlassen des Bereichs verloren. Echte
Item-Endpunkte und Bild-Uploads sind noch nicht verbunden.

## Prüfungen

```bash
npm run build
npm run lint
npm --prefix server run build
npm run test:items
npm run format:check
npm --prefix server test
```

## Dokumentation

Die Projektdokumentation liegt in [`docs/`](docs/):

- [Projektplan und Aufgaben](docs/TODO.md)
- [Originalanforderungen von DCI](docs/final-projekt-info.md)
- [Anforderungen und Design](docs/requirements.md)
- [Abgestimmter öffentlicher Items API Vertrag](docs/items-api.md)
- [Abhängigkeiten und Abstimmung mit dem Team](docs/integration.md)
- [Tagesberichte von Olga](docs/progress.md)

- [Foundation Setup](docs/foundation-setup.md)
- [Gemeinsame Verträge](docs/contracts.md)
- [Gemeinsame UI Komponenten](docs/ui.md)
- [Review des Foundation PR](docs/foundation-review.md)
- [Integration des Besitzerbereichs](docs/foundation-integration.md)
