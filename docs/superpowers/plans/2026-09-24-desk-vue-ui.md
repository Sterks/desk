# desk — Vue 3 + tn-uikit UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `desk`'s React web UI with Vue 3 + the internal `tn-uikit` component library (`@life_uikit/uikit`), keeping the HTTP/SSE contract, the pure data/logic layer, and every product scenario the current 20-test E2E suite covers.

**Architecture:** `ui/` and `tests/e2e/` are rewritten; `src/core`, `src/mcp`, `src/http`, `src/cli` are untouched. Pure logic (`api/`, `lib/`) ports byte-for-byte since it never imported React. Vue components are new authorship on `tn-uikit`'s design tokens plus a small set of custom `.vue` files for the board/card/drag-and-drop, which the kit doesn't provide. Drag-and-drop moves from `@dnd-kit` (imperative sensors, no client-side data mutation) to `vue-draggable-plus`/SortableJS (list-based, optimistic DOM moves) — Task 9 spells out the resulting design change (local mirror arrays, synchronous block via `onMove`, revert on cancel) so this isn't a silent behavior change.

**Tech Stack:** Vue 3.3+ (Composition API, `<script setup>`), Vite 6 + `@vitejs/plugin-vue`, `vue-tsc` for typecheck, `@life_uikit/uikit` v7.0.2 (vendored, `file:` dependency), `vue-draggable-plus`, `markdown-it` (unchanged), Playwright (unchanged runner, rewritten specs).

**Spec:** `docs/superpowers/specs/2026-09-24-desk-vue-ui-design.md` (this plan implements it in full; also still bound by `docs/superpowers/specs/2026-09-24-desk-kanban-design.md` sections 5–6 for the unchanged HTTP/SSE contract).

## Baseline (read before starting)

Current React implementation on `main`, HEAD at planning time: `ui/src/**` (React 19 + `@dnd-kit`), `tests/e2e/**` (Playwright). Every task below either ports a named file byte-for-byte or replaces it; nothing in `ui/` survives untouched except where a task says "byte-identical port". The current React tree is the ground truth for behavior — when this plan's prose and the current React source disagree on a detail, the source wins and the task's implementer should ask (NEEDS_CONTEXT) rather than guess.

`src/http/server.ts`'s `HttpServerOptions.testReset` (added by an earlier fix round) is unchanged by this plan — `tests/e2e/start-server.mjs` keeps using it exactly as today.

## Parts

| Part | Tasks | File |
|---|---|---|
| 1. Build setup + pure ports | 1–2 | `2026-09-24-desk-vue-ui/01-setup-and-ports.md` |
| 2. Composables + static board | 3–4 | `2026-09-24-desk-vue-ui/02-composables-and-board.md` |
| 3. Task panel + dialogs | 5–6 | `2026-09-24-desk-vue-ui/03-panel-and-dialogs.md` |
| 4. App wiring + drag-and-drop | 7–8 | `2026-09-24-desk-vue-ui/04-app-and-dnd.md` |
| 5. E2E and cutover | 9–10 | `2026-09-24-desk-vue-ui/05-e2e-and-cutover.md` |

Task list:

1. Vendor `tn-uikit`, Vite/`vue-tsc` build setup, `tokens.css` on kit variables
2. Byte-identical port of `api/` and `lib/` (framework-agnostic, already React-free)
3. Composables (`useBoardData`, `useUrlFilters`, `useProject`)
4. Static board: `Board.vue`, `Column.vue`, `TaskCard.vue`, `Banners.vue`
5. Task panel: `TaskPanel.vue`, `FieldInput.vue`, `Markdown.vue`, error-boundary wrapper
6. Dialogs and chrome: `Modal.vue`, `CreateTaskDialog.vue`, `RequiresDialog.vue`, `ThemeToggle.vue`, toaster wiring
7. `App.vue` — full wiring, matches current `App.tsx` behavior
8. Drag-and-drop with `vue-draggable-plus`
9. E2E functional suite — port all 20 scenarios
10. Visual regression, axe, package cleanup, final verification

## Global Constraints

- Node.js ≥ 20, ESM, TypeScript `strict: true`. `.vue` files type-check with `vue-tsc --noEmit -p ui/tsconfig.json`; the root `tsc --noEmit` for `src/**` is untouched and must stay green throughout (this plan never edits `src/`).
- `ui/vendor/tn-uikit/` holds the unpacked `@life_uikit/uikit@7.0.2` archive, committed as-is (source-only package, no build step). Never hand-edit files under it — if a kit behavior is wrong for our use, work around it in our own code, and say so in the task report.
- `tn-uikit` colors: our CSS never hardcodes a hex value for anything the kit already names — every color is `var(--content-*)`/`var(--background-*)`/`var(--border-*)`/`var(--shadow-*)` from `ui/vendor/tn-uikit/variables.css` / `variables-dark.css`, per spec section 6. The only exception is `agentColor()` (per-assignee avatar hue), which the kit doesn't define.
- Priority pill is custom markup (`<span class="priority-p0">`…`p3`), never `TNTag` — `TNTag` has no color-override prop (spec section 5). `TNTag` (no overrides) is used for the neutral `area`/`agent` tags.
- Monospace accent (`IBM Plex Mono`, task IDs and timestamps) is the only place that doesn't use the kit's `Inter`; `body` font otherwise follows `--font-family-body` from the kit.
- Every new field-editing component must produce the exact same `FieldChanges` shape (`Record<string, FieldValue | null>`) the current React version does — `null` always means "clear this field", never omit-to-clear.
- `rebaseDraft`/`mergeFresh`/`diffFields`/`buildUpdate`/`undeclaredFields`/`parseNumberInput` (in `lib/fields.ts`) port with **zero algorithm changes** — these fixed a real data-loss bug in a prior round; regressing them is a Critical finding, not a style nit.
- `desk ui` binds `127.0.0.1` only; the Origin/Host guard in `src/http` is unchanged — dev mode (`npm run dev:ui`) keeps proxying `/api` through `ui/vite.config.ts` with the `origin` header rewrite, same as today.
- Accessibility: every interactive element is a real `<button>`/`<a href>`/`<input>`+`<label>`/`<select>`, never a `div`/`span` with a click handler. `tn-uikit` components already do this internally; our own markup (board/card/panel chrome) must too, matching the current React version's `role="dialog"` / `aria-modal` / `aria-label` / `role="region"` / `role="status"` usage exactly — the E2E suite (Task 9) locates elements by role and accessible name, not CSS selectors, so a wrong role or missing name fails a test, not just an audit.
- Commits: conventional (`feat:`, `test:`, `chore:`, `docs:`), each ending with a blank line then `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- **Documented deviation from the approved mockup (`https://claude.ai/artifact/KrZVkfMBbYkQmXj53SnRzc`):** the card shows no description preview and no notes-count badge. `TaskItem` (the shape `GET /api/tasks` returns, what the board renders) has no `description`/`notes` field — only `TaskFull` (`GET /api/tasks/:id`, fetched per task when its panel opens) does. Adding either to the list payload is a backend change (`src/core/present.ts`), out of this plan's scope (Global Constraint: only `ui/` and `tests/e2e/` change). The card keeps everything the mockup showed that `TaskItem` actually carries: priority pill, `created_at` timestamp, title, `agent` line, assignee avatar.

## Review Focus

Failure modes the spec implies but no single task's own tests are guaranteed to catch. Each gets a test in the task that owns the area.

1. **Drag-and-drop with `vue-draggable-plus` optimistically moves the card in the DOM before the server confirms.** A forbidden-transition drop or a cancelled requires-dialog must leave the task in its original column on screen and on disk — not just eventually, after a refresh, but immediately when the drop is rejected/cancelled. Test: Task 8's revert-on-cancel and revert-on-forbidden cases; Task 9's E2E ports the existing "запрещённый переход" and adds a cancel-requires-dialog case that isn't in the current suite (§Task 9).
2. **`rebaseDraft` regression under a real Vue reactivity system.** `ref`/`reactive` can silently deep-clone or lose object identity in ways plain React `useState` didn't; a naive port could reintroduce the lost-update bug a prior round fixed. Test: Task 3/5's unit and E2E ports of "параллельная запись агента не откатывается".
3. **`TNInput`'s own internal state shadows our `v-model`.** Several `tn-uikit` inputs (per README `TNInput`/`TNSelectV2`) manage focus/mask internals themselves; a naive two-way binding could desync from `board.draft` on rapid typing during a live SSE refresh. Test: Task 5's field-editing tests, specifically typing while a refresh lands.
4. **`onErrorCaptured` behaves differently from React's `ErrorBoundary` at the boundary of `async setup()`/`<script setup>` top-level awaits** — an error thrown before the component finishes mounting may not be captured the same way as a render-phase error. Test: Task 5's error-boundary tests reproduce the exact malformed-response scenarios the current E2E suite uses (`{id: 'T-001'}` with no other fields; `{name: 'broken'}` board), not a synthetic `throw`.
5. **`color-mix()` and `.tn-dark-theme` class toggling interact with `matchMedia` listeners incorrectly on first paint** — a viewer whose OS theme changes while the tab is open, or whose stored preference disagrees with the OS, could get a flash of the wrong theme or a stuck theme. Test: Task 6/10's theme-toggle test explicitly covers OS-preference-changes-while-open in addition to the visual snapshots.
