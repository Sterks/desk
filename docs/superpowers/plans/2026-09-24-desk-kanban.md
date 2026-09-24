# desk — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Локальная канбан-доска на уровне проекта: агенты работают с ней через MCP-сервер `desk mcp`, человек — через веб UI `desk ui`; схема полей, колонки, переходы и инструкции для агентов задаются в `.desk/board.yaml`.

**Architecture:** Один npm-пакет `desk` на TypeScript. Общее ядро `src/core` читает и проверяет `board.yaml`, хранит задачи как markdown-файлы с YAML frontmatter и сериализует запись через lock-файл и атомарный rename. Над ядром два тонких адаптера: MCP-сервер по stdio (`src/mcp`) и HTTP-сервер с SSE и статикой UI (`src/http`). UI — Vite + React, собирается в `dist/ui`.

**Tech Stack:** Node.js ≥ 20, TypeScript 5, `@modelcontextprotocol/sdk` 1.x (низкоуровневый `Server`), `zod` 3, `yaml` 2, `chokidar` 4, `vitest` 3, `tsx`; UI: React 19, Vite 6, `@dnd-kit/core` 6, `markdown-it` 14, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`; E2E: Playwright.

**Spec:** `docs/superpowers/specs/2026-09-24-desk-kanban-design.md`

## Части плана

План разбит на файлы, чтобы каждый оставался читаемым. Выполнять строго по порядку задач.

| Часть | Задачи | Файл |
|---|---|---|
| 1. Ядро: основа | 1–4 | `2026-09-24-desk-kanban/01-core-foundation.md` |
| 2. Ядро: хранилище | 5–8 | `2026-09-24-desk-kanban/02-core-store.md` |
| 3. MCP | 9–11 | `2026-09-24-desk-kanban/03-mcp.md` |
| 4. HTTP и CLI | 12–13 | `2026-09-24-desk-kanban/04-http-cli.md` |
| 5. UI: основа и панели | 14–15 | `2026-09-24-desk-kanban/05-ui-foundation.md` |
| 6. UI: drag-and-drop и E2E | 16–17 | `2026-09-24-desk-kanban/06-ui-dnd-e2e.md` |

Список задач:

1. Каркас проекта, ошибки, типы, поиск корня
2. Проверка значений полей (`validate.ts`)
3. Схема и загрузка `board.yaml`
4. Формат файла задачи (parse/serialize)
5. ID, lock-файл, атомарная запись
6. Правила переходов (`transitions.ts`)
7. Хранилище задач, фильтры, представление
8. Тесты конкурентности
9. BoardHolder и наблюдатель за `.desk/`
10. MCP: схемы tools и обработчики
11. MCP: сервер, stdio, `list_changed`
12. HTTP-сервер: API, SSE, статика, защита Host/Origin
13. CLI: `init`, `validate`, `mcp`, `ui`, README
14. UI: сборка, токены, данные, доска
15. UI: панель задачи, создание, фильтры, markdown, toast
16. UI: drag-and-drop и окно `requires`
17. E2E, визуальная регрессия, кросс-браузер

## Global Constraints

- Node.js ≥ 20, ESM (`"type": "module"`), TypeScript `strict: true`, импорты внутри `src` с расширением `.js` (`module: NodeNext`).
- Данные проекта: `.desk/board.yaml`, `.desk/tasks/<ID>.md`, `.desk/.lock` (в `.gitignore`).
- `board.yaml`: `version: 1`; id колонок и полей — `^[a-z][a-z0-9_]*$`; `id_prefix` — латинские буквы, по умолчанию `T`; `name` по умолчанию `desk`.
- Встроенные поля: `id`, `title`, `column`, `assignee`, `created_by`, `created_at`, `updated_at`, `history`. Пользовательское поле с таким id — ошибка схемы.
- Типы полей: `string` (одна строка, до 200 символов), `text`, `number` (конечное, `min`/`max`), `bool`, `date` (`YYYY-MM-DD`), `url` (абсолютный `http(s)`), `enum`, `multi_enum` (уникальные значения), `task_ref` (ID существующей задачи).
- `title` — 1–200 символов, без переносов. `actor` — непустая строка до 64 символов без `:`, `·` и переносов.
- ID: максимальный номер + 1, минимум 3 цифры (`T-001`, `T-1000`).
- Время — UTC ISO 8601 без миллисекунд (`2026-09-24T10:30:00Z`).
- Lock: повтор 25 мс, таймаут 5 с (`LOCK_TIMEOUT`), брошенный lock старше 30 с удаляется.
- Коды ошибок: `NOT_FOUND`, `UNKNOWN_FIELD`, `INVALID_VALUE`, `REQUIRED_MISSING`, `TRANSITION_FORBIDDEN`, `TRANSITION_REQUIRES`, `WIP_LIMIT`, `INVALID_BOARD`, `LOCK_TIMEOUT`, `BAD_REQUEST`. JSON ошибки: `{ code, message, field, guide, allowed }` (отсутствующее — `null`).
- `list_tasks`: `limit` по умолчанию 50, максимум 200.
- HTTP: только `127.0.0.1`, порт по умолчанию `4717`; `Host` ∈ {`127.0.0.1:<port>`, `localhost:<port>`}; для не-GET `Origin` ∈ {`http://127.0.0.1:<port>`, `http://localhost:<port>`}; иначе 403.
- HTTP-статусы: 400 — ошибки проверки и `BAD_REQUEST`; 404 — `NOT_FOUND`; 409 — `WIP_LIMIT`, `TRANSITION_FORBIDDEN`, `TRANSITION_REQUIRES`; 503 — `LOCK_TIMEOUT`; 500 — `INVALID_BOARD`.
- SSE debounce 50 мс; события `task_changed {id}`, `task_removed {id}`, `board_changed`.
- Markdown в UI: `markdown-it` с `html: false`, ссылки только `http(s)` с `rel="noopener noreferrer"`.
- Покрытие ≥ 80% (lines, statements, functions, branches) для `src/core`, `src/mcp`, `src/http`.
- В `stdout` процесса `desk mcp` не пишет ничего, кроме протокола MCP.
- Коммиты: conventional commits (`feat:`, `test:`, `chore:`, `docs:`), каждый заканчивается строкой `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

Входы, о которых спека молчит, но которые почти наверняка встретятся. Тест на каждый пункт добавлен в задачу-владельца.

1. **Файл задачи с CRLF** (правка в редакторе Windows или через git с autocrlf) — читается так же, как с LF. Тест: Task 4.
2. **Описание задачи содержит заголовок `## Notes`** (агент пишет такой раздел сам) — описание не теряется и не превращается в notes; настоящие notes после него сохраняются. Тест: Task 4.
3. **Колонку удалили из `board.yaml`, а задачи в ней остались** — задачи видны как invalid и их можно перенести в любую существующую колонку. Тест: Task 6.
4. **Поле удалили из `board.yaml`, а в задачах значение осталось** — задача помечена `UNKNOWN_FIELD`, и `update_task` с `{"<поле>": null}` чистит его. Тест: Task 2 и Task 7.
5. **Claude Code запущен во вложенной папке проекта** — `desk mcp` находит `.desk/` вверх по дереву. Тест: Task 1.

## Структура файлов

```
package.json  tsconfig.json  tsconfig.build.json  vitest.config.ts  playwright.config.ts  .gitignore  README.md
src/version.ts
src/core/   errors.ts  types.ts  paths.ts  validate.ts  board-schema.ts  board-loader.ts
            task-file.ts  ids.ts  lock.ts  fs-atomic.ts  transitions.ts  query.ts  present.ts
            task-store.ts  board-holder.ts  watch.ts
src/mcp/    input-schema.ts  tools.ts  server.ts
src/http/   origin-guard.ts  events.ts  static.ts  routes.ts  server.ts
src/cli/    index.ts  run.ts  init.ts  validate-project.ts  templates.ts  git.ts
ui/         index.html  vite.config.ts  tsconfig.json
ui/src/     main.tsx  App.tsx
ui/src/api/        types.ts  client.ts
ui/src/hooks/      useBoardData.ts  useUrlFilters.ts
ui/src/lib/        transitions.ts  filters.ts  fields.ts  agentColor.ts  priority.ts  markdown.ts  (+ *.test.ts)
ui/src/board/      Board.tsx  Column.tsx  TaskCard.tsx
ui/src/task-panel/ TaskPanel.tsx  FieldInput.tsx  CreateTaskDialog.tsx  RequiresDialog.tsx
ui/src/filters/    FilterBar.tsx
ui/src/ui/         Modal.tsx  Toast.tsx  Markdown.tsx
ui/src/styles/     tokens.css  global.css  board.css  panel.css
tests/helpers/     project.ts  board.ts  errors.ts  http.ts  worker.ts
tests/unit/        *.test.ts
tests/integration/ *.test.ts
tests/e2e/         start-server.mjs  fixtures.ts  board.spec.ts  visual.spec.ts
```
