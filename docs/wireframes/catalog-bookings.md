# Wireframe: Katalog und Buchung

```mermaid
flowchart TD
    A["Entdecken<br/>──────────<br/>[ Suche ] [ Filter ]<br/><br/>[ Foto ] Beamer<br/>Berlin · 15,50 € / Tag<br/><br/>[ Foto ] Zelt<br/>Köln · 20,00 € / Tag"]
    B["Anzeige<br/>──────────<br/>[ Großes Foto ]<br/><br/>Beamer für einen Filmabend<br/>Berlin · Elektronik<br/>15,50 € / Tag<br/><br/>Beschreibung<br/><br/>[ Datum ab ]<br/>[ Datum bis ]<br/>Tage: — · Gesamt: —<br/><br/>[ Anfrage senden ]"]
    C["Anfrage gesendet<br/>──────────<br/>Deine Anfrage wurde gesendet.<br/><br/>Status: Ausstehend<br/><br/>[ Meine Mieten ansehen ]"]
    D["Meine Mieten<br/>──────────<br/>Beamer für einen Filmabend<br/>02.11.2026 — 04.11.2026<br/>31,00 €<br/>Status: Ausstehend"]

    A -->|Klick auf Karte| B
    B -->|Anfrage senden| C
    C -->|Meine Mieten ansehen| D
```

## Ziel des Ablaufs

Der Nutzer findet ein veröffentlichtes Item, öffnet dessen Detailseite,
wählt einen Zeitraum und sendet eine Buchungsanfrage. Die neue Anfrage ist
anschließend in `Meine Mieten` mit dem Status `PENDING` sichtbar.
