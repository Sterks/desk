# Part 4. App wiring + drag-and-drop (Tasks 7–8)

Index, Global Constraints, Review Focus: `../2026-09-24-desk-vue-ui.md`. Spec: sections 5, 8, 9 (scenarios 6–10).

---

### Task 7: `App.vue` — full wiring

**Files:**
- Modify: `ui/src/App.vue` (replaces Task 4 Step 7's temporary skeleton)
- Modify: `ui/src/styles/global.css` (add `.app-project`, restore anything Task 4 deferred)

**Interfaces:**
- Consumes: every component and composable from Tasks 2–6: `useBoardData`, `useUrlFilters`, `useProject`; `Board.vue`, `Banners.vue`, `FilterBar.vue`, `TaskPanel.vue`, `CreateTaskDialog.vue`, `RequiresDialog.vue`, `ThemeToggle.vue`, `ErrorBoundary.vue`; `api`, `errorMessage`, `FieldChanges`; `missingForMove` (`lib/transitions.ts`)
- Produces: the assembled app, matching `ui/src/App.tsx` on `main` behavior for behavior for filter/panel/dialog wiring exactly (drag-and-drop itself is Task 8 — `App.vue` exposes `handleMove` the same way regardless of whether the caller is a `<select>` in the panel or a drag drop).

- [ ] **Step 1: `ui/src/App.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { api, errorMessage, type FieldChanges } from './api/client';
import type { TaskItem } from './api/types';
import Board from './board/Board.vue';
import FilterBar from './filters/FilterBar.vue';
import { useBoardData } from './composables/useBoardData';
import { useProject } from './composables/useProject';
import { useUrlFilters } from './composables/useUrlFilters';
import { applyFilters } from './lib/filters';
import { missingForMove } from './lib/transitions';
import CreateTaskDialog from './task-panel/CreateTaskDialog.vue';
import RequiresDialog from './task-panel/RequiresDialog.vue';
import TaskPanel from './task-panel/TaskPanel.vue';
import Banners from './ui/Banners.vue';
import ErrorBoundary from './ui/ErrorBoundary.vue';
import ThemeToggle from './ui/ThemeToggle.vue';

interface Toast {
  id: number;
  text: string;
}

interface PendingMove {
  task: TaskItem;
  to: string;
  missing: string[];
}

const { board, list, error, version, refresh } = useBoardData();
const project = useProject();
const { filters, setFilters } = useUrlFilters();
const creating = ref(false);
const pendingMove = ref<PendingMove | null>(null);
const toasts = ref<Toast[]>([]);
let nextToastId = 1;

function pushToast(text: string): void {
  const id = nextToastId++;
  toasts.value = [...toasts.value, { id, text }];
  window.setTimeout(() => dismissToast(id), 6000);
}
function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function openTask(id: string): void {
  setFilters({ task: id });
}
function closeTask(): void {
  setFilters({ task: null });
}

async function performMove(id: string, to: string, fields: FieldChanges): Promise<void> {
  await api.move(id, to, fields);
  await refresh();
}

function handleMove(task: TaskItem, to: string): void {
  if (!board.value) return;
  const missing = missingForMove(board.value, task, to);
  if (missing.length > 0) {
    pendingMove.value = { task, to, missing };
    return;
  }
  performMove(task.id, to, {}).catch((e: unknown) => pushToast(errorMessage(e)));
}

const visible = computed(() => (list.value ? applyFilters(list.value.tasks, filters.value) : []));

function panelFallback(message: string): void {
  // Компонент рендерится в шаблоне ниже через слот `fallback`; см. TaskPanelCrash-эквивалент там же.
}
</script>

<template>
  <main v-if="!board || !list" class="app-state">{{ error ?? 'Загрузка доски…' }}</main>
  <div v-else class="app">
    <header class="app-header">
      <div class="app-brand">
        <span class="app-mark" aria-hidden="true">▦</span>
        <h1>{{ board.name }}</h1>
        <span v-if="project" class="app-project">{{ project.name }}</span>
      </div>
      <FilterBar :board="board" :tasks="list.tasks" :filters="filters" @change="setFilters" @create="creating = true" />
      <ThemeToggle />
    </header>
    <Banners :board="board" :list="list" :error="error" @open="openTask" />
    <main class="app-main">
      <Board :board="board" :tasks="visible" @open="openTask" @move="handleMove" />
    </main>
    <ErrorBoundary v-if="filters.task" :key="filters.task">
      <TaskPanel :board="board" :task-id="filters.task" :version="version" @close="closeTask" @error="pushToast" @move="handleMove" />
      <template #fallback="{ message }">
        <div class="panel-backdrop" @mousedown="closeTask" />
        <aside class="panel" role="dialog" aria-modal="true" :aria-label="filters.task ?? ''">
          <header class="panel-head">
            <span class="panel-id">{{ filters.task }}</span>
            <button type="button" class="button panel-close" aria-label="Закрыть панель" @click="closeTask">Esc</button>
          </header>
          <div class="panel-body">
            <p class="banner banner-error" role="alert">Панель задачи не отрисовалась: {{ message }}</p>
          </div>
        </aside>
      </template>
    </ErrorBoundary>
    <CreateTaskDialog
      v-if="creating"
      :board="board"
      @close="creating = false"
      @created="(task) => { creating = false; void refresh(); openTask(task.id); }"
    />
    <RequiresDialog
      v-if="pendingMove"
      :board="board"
      :task="pendingMove.task"
      :to="pendingMove.to"
      :missing="pendingMove.missing"
      :on-submit="async (fields) => { await performMove(pendingMove!.task.id, pendingMove!.to, fields); pendingMove = null; }"
      @cancel="pendingMove = null"
    />
    <div class="toasts" role="status" aria-live="polite" aria-label="Уведомления">
      <div v-for="t in toasts" :key="t.id" class="toast" data-kind="error">
        <span>{{ t.text }}</span>
        <button type="button" aria-label="Закрыть уведомление" @click="dismissToast(t.id)">×</button>
      </div>
    </div>
  </div>
</template>
```

Two things to fix while implementing, not to ship as written above:
- Delete the unused `panelFallback` function stub — it was left from drafting and does nothing; the real fallback is the `<template #fallback>` block. `npx tsc --noEmit`/lint will flag it as unused if you don't remove it.
- Whole-app crash handling (`{name: 'broken'}` malformed board response, current E2E scenario "ошибка отрисовки всего приложения") needs an `ErrorBoundary` wrapping the **entire** `<div class="app">`/`<main class="app-state">` tree too, at the top of this template, with its own fallback showing "Интерфейс desk не отрисовался" and a "Перезагрузить доску" button that calls `window.location.reload()` — the React version wraps this at `main.tsx`'s render call (`<ErrorBoundary>` around `<App/>`), not inside `App.tsx` itself. Port that one level up: wrap `<App />` in `main.ts`'s `app.mount` call is not directly possible (Vue's `createApp` takes a single root component, not JSX children) — instead, make a tiny `AppRoot.vue` that is `main.ts`'s actual mounted component, containing `<ErrorBoundary><App /><template #fallback>...</template></ErrorBoundary>`, and update `main.ts` to import/mount `AppRoot.vue` instead of `App.vue` directly. Write this `AppRoot.vue` file too and adjust `main.ts`'s import in this task.

- [ ] **Step 2: `ui/src/styles/global.css` — restore `.toasts`/`.toast` rules**

Task 4 Step 1 didn't remove these (they're not form controls), but double check they're present — port them from `main`'s `panel.css` (they were defined there, not `global.css`, on the React branch) into `global.css` here since `App.vue` now owns the toast stack directly (matches the React version's `ToastStack` living at the app root, not inside the panel).

- [ ] **Step 3: `npx tsc --noEmit`, full manual walkthrough**

Build, run against a seeded project, and manually walk every scenario Task 9 will automate: open/close the panel, create a task, trigger a requires-dialog by moving the panel's column `<select>` to a column needing a field, cancel it (task stays put), fill it and submit (task moves), search filters, theme toggle, a malformed `/api/tasks/T-001` response (use browser devtools to block/modify the request) shows the panel-crash fallback without breaking the board, a malformed `/api/board` response shows the whole-app fallback with a working reload button.

- [ ] **Step 4: Commit**

```bash
git add ui/src/App.vue ui/src/main.ts ui/src/styles/global.css
git commit -m "feat: wire the full Vue app — panel, dialogs, filters, theme, toasts, crash fallbacks"
```

---

### Task 8: Drag-and-drop with `vue-draggable-plus`

**Files:**
- Modify: `ui/src/board/Column.vue`, `ui/src/board/Board.vue`, `ui/src/board/TaskCard.vue`
- Modify: `ui/src/styles/board.css` (dimming/allowed/blocked states, already scaffolded in Task 4 — verify against the real drag markup)

**Interfaces:**
- Consumes: `allowedTargets` (Task 2 `lib/transitions.ts`, already used by `useDraggable`-equivalent logic below); `VueDraggable` component or `useSortable`/`useDraggable` composable from `vue-draggable-plus` (check the package's actual export names — `README`/`index.d.ts` under `node_modules/vue-draggable-plus`, since planning didn't fetch this package's source, only confirmed it wraps SortableJS and its version range from `main`'s already-approved spec)
- Produces: `Board.vue` gains an `@move: [task: TaskItem, to: string]` emit (Task 7 already wires a `@move="handleMove"` listener expecting this — Task 7 was written against this task's final contract, so keep the emit name/payload exactly `move: [TaskItem, string]`).

**Design (binding — read before writing code):** `@dnd-kit` (the React version) never mutated any array; it was a pure event source, so a forbidden drop simply did nothing to local state and the card visually never left its column. `vue-draggable-plus`/SortableJS is list-based and optimistic: it moves the DOM (and, with `v-model`, the backing array) as soon as the pointer crosses into another list, before we get a say. To reproduce the exact same product behavior (a card only ever visually moves once the server accepts it, or once a requires-dialog is submitted) without fighting the library, this task keeps **one local, per-column mirror array** (a `ref<TaskItem[]>` per column, resynced from `props.tasks` whenever it changes) as the thing `v-model`-bound to the draggable list, and uses SortableJS's own `onMove` hook — which can **synchronously return `false`** to refuse a drop before it happens — to block drops into columns `allowedTargets` doesn't list. That means blocked columns are physically un-droppable, not just dimmed-and-then-reverted, which is a strictly stronger version of the current behavior, not a weaker one.

- [ ] **Step 1: Confirm `vue-draggable-plus`'s real API**

```bash
cat node_modules/vue-draggable-plus/package.json | grep version
find node_modules/vue-draggable-plus/dist -name "*.d.ts" | xargs grep -l "onMove\|VueDraggable\|useDraggable" 
```
Read whichever `.d.ts` file(s) that finds. Confirm: the component/composable name, whether `onMove` receives the same shape SortableJS's own `Sortable.Options.onMove` does (`(evt, originalEvent) => boolean | -1 | 1 | void`), and whether `group` (for cross-list dragging) is a plain string or an object (`{ name, pull, put }`). If the exported API is meaningfully different from what this task assumes, stop and report NEEDS_CONTEXT with what you found rather than guessing — the block-on-`onMove` mechanism this task relies on only works if the wrapper actually forwards SortableJS's `onMove` option.

- [ ] **Step 2: `Column.vue` — mirror array, `onMove` gate, `onEnd`/`onAdd` → emit**

Rewrite `Column.vue` (from Task 4) to:
```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus'; -- adjust import to Step 1's findings
import type { BoardInfo, ColumnInfo, TaskItem } from '../api/types';
import { allowedTargets } from '../lib/transitions';
import TaskCard from './TaskCard.vue';

const props = defineProps<{ column: ColumnInfo; tasks: TaskItem[]; board: BoardInfo; draggedFrom: string | null }>();
const emit = defineEmits<{ open: [id: string]; move: [task: TaskItem, to: string]; dragStart: [task: TaskItem]; dragEnd: [] }>();

const mirror = ref<TaskItem[]>([...props.tasks]);
watch(() => props.tasks, (next) => { mirror.value = [...next]; });

const dropState = computed<'idle' | 'origin' | 'allowed' | 'blocked'>(() => {
  if (props.draggedFrom === null) return 'idle';
  if (props.draggedFrom === props.column.id) return 'origin';
  return allowedTargets(props.board, props.draggedFrom).includes(props.column.id) ? 'allowed' : 'blocked';
});

// SortableJS-level gate: a blocked column physically refuses the drop (return false), it never
// even shows the item landing there — stronger than "dim and revert after the fact".
function onMove(evt: { from: HTMLElement; to: HTMLElement }): boolean {
  const fromColumnId = evt.from.closest<HTMLElement>('[data-column-id]')?.dataset.columnId;
  if (!fromColumnId || fromColumnId === props.column.id) return true;
  return allowedTargets(props.board, fromColumnId).includes(props.column.id);
}

function onAdd(evt: { item: HTMLElement; newIndex?: number }): void {
  const taskId = evt.item.dataset.taskId;
  const task = props.tasks.find((t) => t.id === taskId) ?? mirror.value.find((t) => t.id === taskId);
  if (task) emit('move', task, props.column.id);
}
</script>

<template>
  <section class="column" :aria-label="column.title" :data-drop="dropState" :data-column-id="column.id">
    <!-- header unchanged from Task 4 -->
    <VueDraggable
      v-model="mirror"
      class="column-body"
      group="board"
      item-key="id"
      :animation="150"
      :on-move="onMove"
      @add="onAdd"
      @start="() => emit('dragStart', mirror[0])"
      @end="() => emit('dragEnd')"
    >
      <TaskCard v-for="task in mirror" :key="task.id" :task="task" :board="board" :data-task-id="task.id" @open="emit('open', $event)" />
    </VueDraggable>
    <p v-if="mirror.length === 0" class="column-empty">пусто</p>
  </section>
</template>
```
This sketch has known gaps to close while implementing (the plan can't finalize them without Step 1's real API):
- `@start`'s payload needs the actually-dragged task, not `mirror[0]` — get it from the SortableJS `start` event's `oldIndex`/`item`, matching whatever shape Step 1 found.
- The mirror array must **not** actually keep a card that landed in a blocked column (the `onMove` gate should prevent this already, but verify empirically — write the Review Focus #1 test in Task 9 against the real behavior, not against this sketch).
- **Requires-dialog cancel must revert the mirror.** When `onAdd` fires into a column that needs fields (`missingForMove` returns non-empty, checked by `App.vue`/`Board.vue`, not by `Column.vue` — a column doesn't know the app's `pendingMove` state), the card already sits in the target column's `mirror` array (SortableJS moved it optimistically). If the user cancels the requires-dialog, `Board.vue` (Step 3 below) must move it back — either by forcing a `refresh()` (simplest: the mirror resyncs from `props.tasks` on the next watch tick once the parent's `list` is unchanged, since nothing was actually saved) or by directly re-inserting it into the origin column's mirror. Prefer the simplest correct fix and say which you used in the report; a full-board `refresh()` after every cancel is acceptable even though it's not instant, as long as the card visibly returns to origin before the user notices — verify this against Task 9's cancel-requires-dialog E2E case, which this task must add (it doesn't exist in the current suite, see Review Focus #1).

- [ ] **Step 3: `Board.vue` — own `draggedFrom` state, forward `move` up**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { groupByColumn } from '../lib/transitions';
import Column from './Column.vue';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[] }>();
const emit = defineEmits<{ open: [id: string]; move: [task: TaskItem, to: string] }>();

const byColumn = computed(() => groupByColumn(props.board, props.tasks));
const draggedFrom = ref<string | null>(null);
</script>

<template>
  <div class="board">
    <Column
      v-for="column in board.columns"
      :key="column.id"
      :column="column"
      :tasks="byColumn.get(column.id) ?? []"
      :board="board"
      :dragged-from="draggedFrom"
      @open="emit('open', $event)"
      @move="(task, to) => emit('move', task, to)"
      @drag-start="(task) => (draggedFrom = task.column)"
      @drag-end="() => (draggedFrom = null)"
    />
  </div>
</template>
```

- [ ] **Step 4: `TaskCard.vue` — drag handle attributes**

Confirm `TaskCard.vue`'s root `<article>` already carries `:data-task-id="task.id"` (Step 2 adds it from the parent via `v-bind` fallthrough — Vue passes non-prop attributes through automatically, but SortableJS reads `data-*` off the actual dragged DOM node, so verify the attribute lands on `.card`, not on some wrapper `VueDraggable` inserts; add it explicitly inside `TaskCard.vue`'s own template — `:data-testid` and `:data-task-id` both on the `<article>` — if fallthrough doesn't reach it reliably).

Add the accessible drag affordance the React version had (`role="group"`, `aria-roledescription`, `aria-label`) to whatever wrapper element ends up draggable — confirm during implementation whether that's `TaskCard.vue`'s own root or a wrapper `VueDraggable` renders around it, and put the ARIA attributes on the actually-focusable/draggable element.

- [ ] **Step 5: `board.css` — verify dimming**

Task 4 already added `.column[data-drop='blocked'] { opacity: 0.38; }` and `.column[data-drop='allowed']`/`[data-drop='over']` border-color rules. Confirm these still apply correctly given `data-drop` now lives on `.column` per Step 2's markup (unchanged attribute name/host element from Task 4) — no CSS change should be needed, just verify.

- [ ] **Step 6: Manual verification, then the Review Focus #1 test (written here, run again by Task 9's E2E)**

Manually drag a card: into an allowed column (moves, requires-dialog appears if fields are missing); into a blocked column (SortableJS should refuse the drop outright — the card should visually snap back to its origin column without ever appearing in the blocked one); cancel an opened requires-dialog (card returns to origin). If any of these don't hold, this task isn't done — don't move to Task 9 with a known-broken revert path.

Also empirically re-verify the focus-delay concern from `main`'s `Modal.tsx` comment (dnd-kit's 50ms text-selection-clear window): open a requires-dialog via a real drag-and-drop with `vue-draggable-plus`, and check whether typing into the auto-focused field immediately after drop loses keystrokes the way it did with dnd-kit. If it does, add the same kind of deliberate focus delay (measure the actual timing empirically — don't assume `80ms` still applies, that number was specific to `@dnd-kit/core` 6.3.1's internals, not a general truth) in `RequiresDialog.vue`'s own field-focus handling (add an explicit focus call in `onMounted` with `nextTick` plus the delay you measure, since `TNPopup`'s own `setFocus` focuses its container, not necessarily the first form field — confirm which element it focuses and whether it interferes). If it does not reproduce, don't add a delay that isn't needed — leave whatever focus behavior `TNPopup`/the browser default gives, and note in the report that this Review Focus item didn't reproduce with the new drag library.

- [ ] **Step 7: Commit**

```bash
git add ui/src/board/Column.vue ui/src/board/Board.vue ui/src/board/TaskCard.vue ui/src/styles/board.css
git commit -m "feat: add drag-and-drop with vue-draggable-plus, blocking forbidden columns synchronously"
```
