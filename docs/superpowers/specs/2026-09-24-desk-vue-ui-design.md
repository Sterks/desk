# desk — веб-UI на Vue 3 + tn-uikit

Дата: 2026-09-24
Статус: дизайн одобрен, ожидает ревью спеки

## 1. Цель

Заменить существующий веб-UI проекта `desk` (React 19, собственные компоненты) на Vue 3 с корпоративной библиотекой компонентов `@life_uikit/uikit` (`tn-uikit`). Причина: внутренний стандарт UI-кита, не устраивает текущий внешний вид собственных компонентов.

Меняется только папка `ui/` и `tests/e2e/`. Backend (`src/core`, `src/mcp`, `src/http`, `src/cli`) не меняется: HTTP API (`/api/board`, `/api/tasks/...`, `/api/events`) и MCP-сервер остаются как есть — см. `docs/superpowers/specs/2026-09-24-desk-kanban-design.md`, разделы 5–6, которые описывают контракт данных. Эта спека расширяет тот документ только в части раздела 6 (веб UI); всё остальное там продолжает действовать.

### Критерии успеха
- Все сценарии, которые сегодня покрыты 96 E2E-тестами (создание, перенос с проверкой обязательных полей, WIP-лимит, фильтры в URL, видимость невалидных/осиротевших задач, безопасный markdown, тёмная тема, поле `agent`), работают в новом UI и снова покрыты E2E.
- UI выглядит и ведёт себя как согласованный макет (`https://claude.ai/artifact/KrZVkfMBbYkQmXj53SnRzc`): карточка с пилюлей приоритета, моноширинным временем, тегами, аватаром исполнителя, счётчиком заметок; переключение темы.
- Обновления `board.yaml` пересобирают схему полей на лету — как и раньше (SSE `board_changed`).

## 2. Решения, зафиксированные в обсуждении

| Вопрос | Решение |
|---|---|
| Стоит ли вообще уходить с React | Да — по явному запросу пользователя, не техническая необходимость |
| Фреймворк | Vue 3, Composition API |
| Библиотека компонентов | `@life_uikit/uikit` v7.0.2 (`tn-uikit`), подключена как локальная `file:`-зависимость из распакованного архива в репозитории (не через приватный registry — токена пока нет) |
| Drag-and-drop | `vue-draggable-plus` (обёртка над SortableJS) |
| Визуальный стиль доски/карточки | Раскладка карточки в духе `@svar-ui/vue-kanban` (пилюля приоритета, время, теги, аватар, счётчик заметок), но без самого виджета — доска и drag-and-drop свои, поверх токенов `tn-uikit` |
| Макет | Согласован: `https://claude.ai/artifact/KrZVkfMBbYkQmXj53SnRzc` |

## 3. Архитектура

```
Browser ──HTTP/SSE (без изменений)──▶ desk ui (src/http, не меняется)
   │
   ▼
ui/ (Vue 3 + Vite + tn-uikit + vue-draggable-plus)
```

Контракт данных не меняется: те же эндпоинты, та же форма JSON (`BoardInfo`, `TaskItem`/`TaskFull`, `TaskList`, `ApiError`), тот же SSE-поток событий `task_changed`/`task_removed`/`board_changed`. Меняется только то, что эти данные рендерит.

Сборка: Vite + `@vitejs/plugin-vue` вместо `@vitejs/plugin-react`. Проверка типов — `vue-tsc` вместо `tsc` для файлов `.vue`.

## 4. `tn-uikit`: подключение

Архив кита (`uikit-master.zip`, версия `@life_uikit/uikit@7.0.2`) распаковывается в `ui/vendor/tn-uikit/` и коммитится в репозиторий как есть (пакет распространяется исходниками — `main: index.ts`, сборка не нужна, Vite потребляет `.vue`/`.ts` напрямую).

`ui/package.json`:
```json
{
  "dependencies": {
    "@life_uikit/uikit": "file:vendor/tn-uikit",
    "@floating-ui/vue": "^1.0.6",
    "click-outside-vue3": "^4.0.1",
    "maska": "^3.0.0",
    "overlayscrollbars": "^2.11.5",
    "overlayscrollbars-vue": "^0.5.9",
    "vue": "^3.3.0",
    "vue3-touch-events": "^4.1.0",
    "vue-draggable-plus": "^0.5.0"
  }
}
```
(Точные версии транзитивных зависимостей кита берутся из его собственного `package.json`, уже прочитанного при брейншторме.)

`ui/src/main.ts`:
```ts
import { createApp } from 'vue';
import TNLifeUIKit from '@life_uikit/uikit';
import '@life_uikit/uikit/variables.css';
import '@life_uikit/uikit/fonts.css';
import './styles/tokens.css';   // наши токены поверх (доска, карточка, приоритет)
import './styles/board.css';
import App from './App.vue';

const app = createApp(App);
app.use(TNLifeUIKit);
app.mount('#root');
```

Обновление кита в будущем — вручную, заменой содержимого `ui/vendor/tn-uikit/` на новый архив; переход на приватный registry `gitlab.tn.ru` (`@life_uikit:registry=...`) — отдельная будущая задача, меняющая одну строку зависимости.

## 5. Соответствие компонентов

| Было (React, своё) | Стало (`tn-uikit` / своё) |
|---|---|
| `Modal.tsx` | `TNPopup` — форма создания задачи, диалог обязательных полей (`RequiresDialog`). `useDialog`-composable кита не подходит: он для confirm/alert (Promise-based), а не для форм с произвольным содержимым |
| `Toast.tsx`/`useToasts` | `useToaster()` composable кита — собственный код тостов не нужен |
| `FieldInput` (string/url/date) | `TNInput` (`error` → ошибка валидации, `description` → `guide` поля) |
| `FieldInput` (number) | `TNInput` с `numericKeyboard="decimal"`, преобразование строка↔число — своя функция `parseNumberInput` (портируется как есть) |
| `FieldInput` (text/textarea) | `TNTextarea` |
| `FieldInput` (enum) | `TNSelectV2` (`options` — массив строк из `values` поля) |
| `FieldInput` (multi_enum) | `TNMultiSelector` |
| `FieldInput` (bool) | `TNCheckbox` |
| Бейдж приоритета | Свой `<span class="priority-p0…p3">` (см. раздел 6) — у `TNTag` нет пропа для смены цвета текста/фона, только `iconColor` для иконки, поэтому для цветовой пилюли по значению `priority` кит не подходит |
| Теги `area`/`agent` на карточке | `TNTag` без переопределений — его дефолтный нейтральный вид уже совпадает с решением «пилюли без цветового шума» (раздел 6) |
| Кнопки | `TNButton` (`type="action"` — основное действие, `type="outline"` — второстепенное, `type="link"` — «отменить») |
| Пустая колонка | `TNEmptyContent` |
| `Board`/`Column`/`TaskCard` | Свои `.vue`-компоненты на CSS-токенах, см. раздел 6 — компонента «канбан-доска» в ките нет |
| Drag-and-drop (`@dnd-kit`) | `vue-draggable-plus` на список карточек в каждой колонке |
| Тёмная тема (`prefers-color-scheme`) | Класс `.tn-dark-theme` на `<html>`: по умолчанию синхронизируется с `matchMedia('(prefers-color-scheme: dark)')`, ручное переключение (кнопка ☀/☾ в шапке) переопределяет и запоминается в `localStorage` (per-viewer, не критичное состояние) |
| Граница ошибки рендера (React `ErrorBoundary`) | `onErrorCaptured` (Composition API) на корневом компоненте и на `TaskPanel` — тот же эффект: непойманная ошибка рендера не роняет всё приложение, а показывает восстанавливаемое сообщение (см. финальное ревью React-версии, проблема с нечитаемым файлом задачи) |

## 6. Карточка и колонка: визуальный дизайн

Раскладка согласована макетом (артефакт выше). Стилистически — раскладка карточки в духе `@svar-ui/vue-kanban`, но без самого виджета:

- **Карточка** (`.vue`, своя разметка на токенах кита + собственных токенах приоритета):
  - Пилюля приоритета сверху слева (`p0`–`p3`, каждому — пара цветов фон/текст, см. токены ниже).
  - Время создания сверху справа, моноширинным шрифтом (см. раздел 7 про шрифты).
  - Заголовок задачи, кнопка — открывает панель.
  - Первая строка описания, максимум 2 строки (`-webkit-line-clamp: 2`).
  - Теги (`area`, при наличии — `agent`, если отличается от `assignee`) — пилюли на акцентном фоне.
  - Подвал: слева — кружок-аватар с инициалами (цвет по хэшу имени, как в прежней реализации `agentColor`) + имя `assignee`; справа — иконка и число заметок (`notes.length`).
  - Флаг невалидности (`invalid: true`) — красная рамка/фон карточки (`--invalid-border`/`--invalid-bg`, см. токены ниже), как было в React-версии.
- **Колонка**: заголовок капителью (Swiss-стиль), справа — счётчик `count` или `count/wip_limit`; серым (`--wip-ok`) — в пределах лимита, красным (`--wip-over`) — при превышении. Верхняя граница колонки толщиной 3px — как в прежнем дизайне. Пустая колонка — `TNEmptyContent` с текстом «пусто».
- **Фон доски**: миллиметровая сетка на токенах `--bg`/`--grid`, как в согласованном макете и в прежней React-версии («операторская консоль»).

**Цветовая гамма — целиком из `tn-uikit`, ничего не изобретаем заново.** Компоновка карточки и колонки (раздел 6 выше) не меняется; меняется только то, какой CSS-токен красит какой элемент. Кит определяет свои переменные один раз в `:root` (светлая тема) и переопределяет только семантические роли в `.tn-dark-theme` (сырые шкалы `--red-60`, `--neutral-90` и т.п. — одни и те же в обеих темах, меняется только то, какая роль на них ссылается). Поэтому наши токены — это ссылки на переменные кита, а не свои hex-значения:

```css
.board-canvas {
  --board-bg: var(--background-tertiary-enabled);
  --board-grid-line: var(--border-secondary-enabled);
  --column-bg: var(--background-secondary-a-enabled);
  --column-accent: var(--content-primary-a-enabled);   /* верхняя линия колонки, 3px, «операторская» линейка */
  --card-bg: var(--background-primary-a-enabled);
  --card-border: var(--border-secondary-enabled);
  --card-shadow: var(--shadow-small);                  /* в тёмной теме кит сам меняет его на кольцо-обводку */

  --text: var(--content-primary-a-enabled);
  --text-muted: var(--content-secondary-enabled);
  --text-faint: var(--content-tertiary-enabled);

  --focus-ring: var(--content-accent-enabled);          /* акцент кита — красный, не выдуманный синий */
  --button-primary-bg: var(--background-accent-enabled);

  --tag-bg: var(--background-tertiary-enabled);         /* area/agent — нейтральные пилюли, без цветового шума */
  --tag-fg: var(--content-secondary-enabled);

  --wip-ok: var(--content-tertiary-enabled);            /* счётчик в пределах лимита — просто серый текст */
  --wip-over: var(--content-system-negative);            /* превышение — тот же красный, что у кита значит «плохо» */

  --invalid-border: var(--content-system-negative);
  --invalid-bg: color-mix(in srgb, var(--content-system-negative) 8%, var(--card-bg));
}
```

Пилюля приоритета — единственное место, где нужен цветовой акцент по значению `priority`, а готового токена «оттенок по значению enum» в ките нет. Берём семантические роли кита один в один по смыслу (`negative`/`warning`/`action`/`neutral`), а не свои цвета:

```css
.priority-p0 { color: var(--content-system-negative); background: color-mix(in srgb, var(--content-system-negative) 14%, var(--card-bg)); }
.priority-p1 { color: var(--content-system-warning);  background: color-mix(in srgb, var(--content-system-warning) 14%, var(--card-bg)); }
.priority-p2 { color: var(--content-action-enabled);  background: color-mix(in srgb, var(--content-action-enabled) 12%, var(--card-bg)); }
.priority-p3 { color: var(--content-system-neutral);  background: var(--background-tertiary-enabled); }
```
`color-mix(..., var(--card-bg))` вместо своего hex-фона — так подложка пилюли автоматически попадает в текущую тему (светлую или тёмную), а не хранится как две захардкоженные пары цветов. Порядок значений `enum`-поля `priority` в `board.yaml` определяет, какой класс к какому значению применяется (первое значение → `.priority-p0`, и так по порядку) — так же, как раньше вычислялся `priorityTone`.

Что **не** берём из кита, потому что он этого не определяет:
- цвет аватара-инициалов по имени исполнителя (`agentColor`) — остаётся своя функция на хэше строки, как в прежних версиях;
- сама раскладка доски/карточки/колонки — кит не содержит компонента «канбан», раздел 6 не меняется.

## 7. Шрифты

Компоненты кита сами проставляют себе `font-family` (`Inter`, из `fonts.css`) — это не переопределяется, таково поведение кита. `body` проекта тоже ставим на `Inter` через `--font-family-body`, как требует README кита. Для ID задач и времени (`T-012`, `24.09 10:30`) — акцент моноширинным шрифтом (`IBM Plex Mono` через Google Fonts, как в прежнем дизайне), это единственное место, где шрифт кита не используется, специально для «операторской консоли». Кит задаёт `html { font-size: 15px }` (`1rem = 15px`) — учитываем при вёрстке собственных отступов в `rem`.

## 8. Данные и состояние

Слой данных не завязан на React и переносится как есть, меняется только способ подключения к компонентам:

| Было (React) | Стало (Vue) |
|---|---|
| `lib/fields.ts` (`diffFields`, `buildUpdate`, `rebaseDraft`, `mergeFresh`, `parseNumberInput`, `undeclaredFields`) | Тот же файл, без изменений в логике — чистые функции, framework-agnostic |
| `lib/transitions.ts`, `lib/filters.ts`, `lib/markdown.ts`, `lib/format.ts` | Без изменений |
| `hooks/useBoardData.ts` (React `useState`/`useEffect`) | `composables/useBoardData.ts` на `ref`/`onMounted`/`onUnmounted`, та же логика подписки на `/api/events` |
| `hooks/useUrlFilters.ts` | `composables/useUrlFilters.ts`, тот же принцип (URLSearchParams, `history.replaceState`) |
| `api/client.ts`, `api/types.ts` | Без изменений — чистый `fetch`-клиент, не зависит от фреймворка |

Особое внимание: `rebaseDraft`/`mergeFresh` (лог исправленного в прошлом раунде бага с потерей параллельной правки) переносятся **без изменений в алгоритме** — это была не React-специфичная проблема, а логика слияния черновика с сервера, и регрессия здесь недопустима. Модульные тесты на них переносятся как есть (framework-agnostic, `vitest` без `jsdom`-специфики).

## 9. Тестирование

- **Backend**: не меняется, 405 существующих тестов продолжают проходить без изменений.
- **UI unit-тесты** (`lib/*.test.ts`): переносятся как есть, framework-agnostic.
- **Vue-компоненты**: без обязательного отдельного слоя снапшот-тестов — как и в React-версии, основное поведение проверяется через E2E, а не через `@vue/test-utils`-снапшоты.
- **E2E (Playwright)**: полностью переписывается под новую разметку (`tests/e2e/board.spec.ts`, `visual.spec.ts`, `fixtures.ts`), но список сценариев не должен потерять покрытие относительно текущей версии:
  1. Число сохраняется как число, не строка.
  2. Задача с удалённым из `board.yaml` полем — можно удалить устаревшее поле и сохранить.
  3. Задача в удалённой колонке видна и переносима («осиротевшая»).
  4. Нечитаемый файл задачи — показывает ошибку, не роняет приложение; перезагрузка страницы с этой задачей в URL не роняет приложение (`onErrorCaptured`).
  5. Баннер дубликатов ID и нечитаемых файлов.
  6. Черновик правки не стирается живым обновлением с сервера и не затирает параллельную правку агента при сохранении (`rebaseDraft`).
  7. Реальный mouse-drag через `vue-draggable-plus` (не синтетические события) между колонками, с подсветкой разрешённых/запрещённых целей.
  8. Диалог обязательных полей — только недостающие поля, с их `guide`.
  9. Перенос через выбор колонки в панели — тоже открывает диалог обязательных полей, не идёт в обход.
  10. WIP-лимит: счётчик красный при превышении, перенос при заполненной колонке отклоняется.
  11. Фильтры (`q`, `assignee`, `priority`, `area`) сохраняются в URL и переживают перезагрузку.
  12. `mailto:`-ссылки не рендерятся кликабельными; `http(s)`-ссылки — с `target="_blank" rel="noopener noreferrer"`.
  13. Поле `agent` показывается на карточке и в панели, когда отличается от `assignee`.
  14. Скриншоты 320/768/1024/1440 × светлая/тёмная тема, `axe` без нарушений.

## 10. Структура файлов

```
ui/
  vendor/tn-uikit/          — вендоренный @life_uikit/uikit (архив распакован как есть)
  src/
    main.ts
    App.vue
    api/            client.ts  types.ts                      (без изменений)
    composables/    useBoardData.ts  useUrlFilters.ts
    lib/            fields.ts  transitions.ts  filters.ts  markdown.ts  format.ts  agentColor.ts  priority.ts
                     (+ *.test.ts на каждый)
    board/          Board.vue  Column.vue  TaskCard.vue
    task-panel/     TaskPanel.vue  FieldInput.vue  CreateTaskDialog.vue  RequiresDialog.vue
    filters/        FilterBar.vue
    ui/             ThemeToggle.vue  ErrorFallback.vue
    styles/         tokens.css  board.css
  tests/e2e/        (в корне репозитория, как и раньше) start-server.mjs  fixtures.ts  board.spec.ts  visual.spec.ts
```

## 11. Вне рамок этой спеки

- Переход на приватный npm-registry `gitlab.tn.ru` вместо вендоринга — будущая задача.
- ESLint-плагин кита (`@life_uikit/uikit/eslint-plugin`) — можно подключить отдельно, не блокирует UI.
- Замена `vue-draggable-plus` на что-то другое, если он не потянет доступность (клавиатурный перенос) — если всплывёт при реализации, решается отдельным раундом ревью, не меняет эту спеку.
