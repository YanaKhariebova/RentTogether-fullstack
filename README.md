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

Der Besitzerbereich läuft aktuell mit Mock-Daten im Arbeitsspeicher.
Beim Neuladen gehen Änderungen verloren. Anmeldung, Datenbank und echte Bild-Uploads sind noch nicht verbunden.

## Prüfungen

```bash
npm run build
npm run lint
npm --prefix server run build
node --test src/features/items/model/*.test.mjs
```

## Dokumentation

Die Projektdokumentation liegt in [`docs/`](docs/):

- [Projektplan und Aufgaben](docs/TODO.md)
- [Originalanforderungen von DCI](docs/final-projekt-info.md)
- [Anforderungen und Design](docs/requirements.md)
- [Abgestimmter öffentlicher Items API Vertrag](docs/items-api.md)
- [Abhängigkeiten und Abstimmung mit dem Team](docs/integration.md)
- [Tagesberichte von Olga](docs/progress.md)
