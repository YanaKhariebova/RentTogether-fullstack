# RentTogether

Fullstack-Abschlussprojekt am DCI. Eine Plattform zum Mieten und Verleihen von Gegenständen.

## Lokaler Start

Voraussetzung für die aktuellen Testbefehle: Node.js 24.

```bash
npm ci
npm --prefix server ci
```

Vor dem ersten Start Clerk und PostgreSQL gemäß [Setup](docs/foundation-setup.md)
konfigurieren. Bestehende env-Dateien ergänzen. Backend und Frontend in getrennten Terminals starten:

```bash
npm --prefix server run dev
```

```bash
npm run dev
```

Foundation mit Clerk, Router, Query und Inter ist integriert. Kopiere `.env.example`
nach `.env.local` und `server/.env.example` nach `server/.env` und konfiguriere
Clerk und PostgreSQL gemäß [Setup](docs/foundation-setup.md). Ohne Clerk Publishable Key
zeigt das Frontend einen Einrichtungshinweis.

Der Besitzerbereich unter `/account/items` verwendet weiterhin Mock-Daten.
Änderungen gehen beim Neuladen oder Verlassen des Bereichs verloren. Item-Modelle
und Owner-API sind implementiert; die Verbindung zum Frontend und echte Bild-Uploads
sind der nächste Schritt.

Vite verwendet standardmäßig Port 5173. Bei Port 5174 muss CLIENT_URL im Backend
auch `http://localhost:5174` sein. Details zum Items-Seed und zu den erledigten
Aufgaben stehen im [Etappenbericht 27–30 Oktober](docs/items-milestone-27-30.md).

## Prüfungen

```bash
npm run build
npm run lint
npm --prefix server run build
npm run test:items
npm run format:check
npm --prefix server test
npm --prefix server run db:check
```

## Dokumentation

Die Projektdokumentation liegt in [`docs/`](docs/):

- [Projektplan und Aufgaben](docs/TODO.md)
- [Originalanforderungen von DCI](docs/final-projekt-info.md)
- [Anforderungen und Design](docs/requirements.md)
- [Items API Vertrag](docs/items-api.md)
- [Abhängigkeiten und Abstimmung mit dem Team](docs/integration.md)
- [Tagesberichte von Olga](docs/progress.md)
- [Abgeschlossene Items Etappe und ERD](docs/items-milestone-27-30.md)
- [Foundation Setup](docs/foundation-setup.md)
- [Gemeinsame Verträge](docs/contracts.md)
- [Gemeinsame UI Komponenten](docs/ui.md)
- [Review des Foundation PR](docs/foundation-review.md)
- [Integration des Besitzerbereichs](docs/foundation-integration.md)
