# Категории частной аренды — 03.11.2026

Справочник расширен с 4 до 27 категорий: добавлены 23 направления.
Исходные категории и UUID сохранены; существующие объявления не меняются.

## Полный список

- Elektronik
- Werkzeug
- Sport & Freizeit
- Haushalt & Garten
- Foto & Video
- Musikinstrumente & Tontechnik
- Party & Veranstaltungen
- Camping & Outdoor
- Fahrräder & Zubehör
- Autozubehör & Anhänger
- Baby & Kinder
- Spielzeug & Gesellschaftsspiele
- Kleidung & Kostüme
- Möbel & Einrichtung
- Umzug & Transport
- Reinigung & Pflege
- Küche & Gastronomie
- Heimwerken & Renovieren
- Nähen & Handarbeiten
- Kunst & Kreativbedarf
- Bücher & Lernmaterial
- Gesundheit & Wellness
- Büro & Präsentation
- Tierbedarf
- Reisegepäck & Zubehör
- Saisonartikel & Dekoration
- Sonstiges

## Реализация и обновление

Источник seed: server/prisma/seedCategories.ts, используется общим prisma/seed.ts.
Upsert по уникальному name; повторный запуск не создаёт дублей и не заменяет
существующие IDs. Это данные справочника, новая схема и миграция не нужны.

Каталог и ItemEditor читают GET /api/categories. API сортирует по имени:
поэтому после расширения первые четыре видимые категории могут измениться.
Все остальные доступны по Alle anzeigen; мобильный select получает весь список.

Локально выполнен только seedCategories — demo-пользователи и объявления
не создавались. API должен возвращать 27 категорий.

Для команды и Render после обновления backend:

```bash
npm --prefix server run db:seed
```

При настроенном Start Command `npm run db:deploy && npm run db:seed && npm start`
Render заполнит справочник при deployment backend. Одного frontend deployment
для изменения базы недостаточно. Neon в этой задаче не изменялась.

## Проверки

45/45 db:check на временной PostgreSQL с повторным seed; проверяются число,
уникальность имён, UUID и сохранение четырёх исходных IDs через публичный API.
Локальная БД также содержит 27 категорий после двух запусков seedCategories.

Новые категории пока локальные, без commit/push.
