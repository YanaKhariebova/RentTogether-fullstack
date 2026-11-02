# UI-гайд

Все пользовательские тексты — на немецком, включая Clerk (deDE).
Общий шрифт — Inter Variable, подключён локально через `@fontsource-variable/inter`
в `src/main.tsx`. Включены немецкие символы; браузер выбирает нужный unicode subset.
Логотип из ветки Ольги находится в `src/shared/assets/renttogether-icon.svg`
и подключён в Header и favicon.
Импорт `@/…` указывает на `src/`. Компоненты ничего не знают об API;
запросы, мутации и формы размещаются в `features/*`.

## Готовые общие компоненты

Импорт atoms: `import { Button, Input, Select } from '@/shared/ui/atoms'`.
Каждый компонент также доступен напрямую из папки `Component/Component`.
Типы props экспортируются из тех же файлов.

| Компонент  | Дополнительные props к стандартным HTML props                        |
| ---------- | -------------------------------------------------------------------- |
| Button     | variant: primary/secondary/danger, loading; type по умолчанию button |
| Input      | обязательный label; error, hint                                      |
| Textarea   | обязательный label; error                                            |
| Select     | обязательные label и options: `{ value, label }[]`; error            |
| Badge      | variant: neutral/success/warning                                     |
| Spinner    | label, по умолчанию `Wird geladen …`                                 |
| IconButton | обязательный label для aria-label и title                            |

```tsx
<Input label="Titel" name="title" required error={errors.title?.[0]} />
<Select label="Kategorie" value={categoryId} onChange={onChange}
  options={categories.map(({ id, name }) => ({ value: id, label: name }))} />
<Button type="submit" loading={isPending}>Anzeige speichern</Button>
<IconButton label="Foto entfernen" onClick={removePhoto}>×</IconButton>
```

`PageLayout` из `@/shared/ui/templates/PageLayout/PageLayout` принимает children;
его уже применяет корневой route, повторно оборачивать страницы не нужно.
`Header` из `@/shared/ui/organisms/Header/Header` содержит desktop-навигацию,
Clerk UserButton и мобильное боковое меню. Внизу на mobile остаются Entdecken,
Meine Anzeigen и Anfragen; профиль, избранное, тема и вход/выход доступны в меню.
Закрытые страницы — под `/account`. Подробности адаптации и установки:
[mobile-pwa.md](mobile-pwa.md).

PriceField, ImageUploader, CategorySelect, ItemForm и owner cards делает Ольга.
SearchBar, ItemCard, ItemGrid, DateRangePicker и BookingForm делает Яна.
DashboardLayout и общие EmptyState/ErrorState можно добавить позже при появлении
реального повторного использования; сейчас их готовых интерфейсов нет.

## Стили и доступность

Токены находятся в `src/index.css`: `--color-*`, `--space-*`, `--radius-*`,
`--shadow-card`. Там же только reset и общие правила шрифтов/фокуса.
Стиль блока — в `Component.module.css`, импорт `styles` и camelCase-классы.
Например, `styles.form`, `styles.errorMessage`. Не использовать глобальные
селекторы для конкретных компонентов и CSS-фреймворки.

Mobile-first от 320 px. CSS breakpoints: `@media (min-width: 768px)` и
`@media (min-width: 1024px)`; CSS variables в media queries не подставляются.
Header меняется на desktop-навигацию с 1024 px. Нижний отступ layout учитывает
mobile navigation и safe-area. Зоны нажатия — минимум 44×44 px.

Inputs имеют связанные label, error/hint — aria-describedby; loading — role=status,
ошибки формы — role=alert, IconButton всегда имеет понятное имя.
Фокус виден при работе клавиатурой; ссылка «Zum Inhalt springen» ведёт к main.
Spinner учитывает prefers-reduced-motion. Проверять 320/360/390/430/768/1024/1440 px,
клавиатуру и сенсорное управление. UI-тесты проверяют размеры зон нажатия;
физическое touch-взаимодействие ещё требует ручной проверки.

## Палитра — 29.10.2026

Цвета обновлены по новому референсу команды. Общий источник — `src/index.css`;
в компонентах используются CSS-переменные.

| Назначение                                  | Цвет      | Токен                |
| ------------------------------------------- | --------- | -------------------- |
| Основной: кнопки, ссылки, активные элементы | `#245C3C` | `--color-primary`    |
| Акцент: категории и предупреждающие badges  | `#F2C66D` | `--color-accent`     |
| Фон страниц                                 | `#F5F8F4` | `--color-background` |
| Карточки и поля                             | `#FFFFFF` | `--color-surface`    |
| Основной текст, текст на жёлтом             | `#20352D` | `--color-text`       |

Светлая зелёная подложка (`--color-primary-soft`) используется для превью фото,
информационных блоков и выбранных дат. Для ошибок и опасных действий сохраняется
семантический красный. Логотип сохраняет исходные цвета SVG.
