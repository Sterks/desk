# Part 2. Composables + static board (Tasks 3–4)

Index, Global Constraints, Review Focus: `../2026-09-24-desk-vue-ui.md`. Spec: sections 5, 6, 8.

---

### Task 3: Composables (`useBoardData`, `useUrlFilters`, `useProject`)

**Files:**
- Create: `ui/src/composables/useBoardData.ts`
- Create: `ui/src/composables/useUrlFilters.ts`
- Create: `ui/src/composables/useProject.ts`

**Interfaces:**
- Consumes: `api`, `errorMessage` (Task 2 `api/client.ts`); `BoardInfo`, `TaskList`, `ProjectInfo` (Task 2 `api/types.ts`); `Filters`, `filtersFromSearch`, `filtersToSearch` (Task 2 `lib/filters.ts`)
- Produces:
  - `useBoardData(): { board: Ref<BoardInfo | null>; list: Ref<TaskList | null>; error: Ref<string | null>; version: Ref<number>; refresh(): Promise<void> }`
  - `useUrlFilters(): { filters: Ref<Filters>; setFilters(patch: Partial<Filters>): void }`
  - `useProject(): Ref<ProjectInfo | null>`

Faithful port of the React hooks read in Part 1's baseline (`ui/src/hooks/{useBoardData,useUrlFilters,useProject}.ts` on `main`) to Composition API. Same behavior, same edge cases (SSE reconnect via `onerror`, `popstate` sync, `history.replaceState` only when the search string actually changed). No dedicated unit tests existed for these hooks on `main` either (only `lib/filters.test.ts` covers the pure logic they call) — same balance here, per spec section 9.

- [ ] **Step 1: `ui/src/composables/useBoardData.ts`**

```ts
import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskList } from '../api/types';

const EVENT_TYPES = ['task_changed', 'task_removed', 'board_changed'] as const;

export interface BoardData {
  board: Ref<BoardInfo | null>;
  list: Ref<TaskList | null>;
  error: Ref<string | null>;
  /** Растёт на каждом успешном обновлении: открытые панели по нему перечитывают задачу. */
  version: Ref<number>;
  refresh(): Promise<void>;
}

export function useBoardData(): BoardData {
  const board = ref<BoardInfo | null>(null);
  const list = ref<TaskList | null>(null);
  const error = ref<string | null>(null);
  const version = ref(0);

  const refresh = async (): Promise<void> => {
    try {
      const [nextBoard, nextList] = await Promise.all([api.board(), api.tasks()]);
      board.value = nextBoard;
      list.value = nextList;
      error.value = null;
      version.value += 1;
    } catch (e) {
      error.value = errorMessage(e);
    }
  };

  let source: EventSource | undefined;

  onMounted(() => {
    void refresh();
    source = new EventSource('/api/events');
    const onChange = (): void => void refresh();
    EVENT_TYPES.forEach((type) => source?.addEventListener(type, onChange));
    source.onopen = onChange;
    source.onerror = () => {
      error.value = 'Нет связи с desk ui. Переподключение…';
    };
  });

  onUnmounted(() => {
    source?.close();
  });

  return { board, list, error, version, refresh };
}
```

- [ ] **Step 2: `ui/src/composables/useUrlFilters.ts`**

```ts
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { filtersFromSearch, filtersToSearch, type Filters } from '../lib/filters';

export interface UrlFilters {
  filters: Ref<Filters>;
  setFilters(patch: Partial<Filters>): void;
}

export function useUrlFilters(): UrlFilters {
  const filters = ref<Filters>(filtersFromSearch(window.location.search)) as Ref<Filters>;

  const onPop = (): void => {
    filters.value = filtersFromSearch(window.location.search);
  };

  onMounted(() => window.addEventListener('popstate', onPop));
  onUnmounted(() => window.removeEventListener('popstate', onPop));

  watch(
    filters,
    (next) => {
      const search = filtersToSearch(next);
      if (search !== window.location.search) window.history.replaceState(null, '', `${window.location.pathname}${search}`);
    },
    { deep: true },
  );

  const setFilters = (patch: Partial<Filters>): void => {
    filters.value = { ...filters.value, ...patch };
  };

  return { filters, setFilters };
}
```

- [ ] **Step 3: `ui/src/composables/useProject.ts`**

```ts
import { onMounted, ref, type Ref } from 'vue';
import { api } from '../api/client';
import type { ProjectInfo } from '../api/types';

/**
 * Проект из `.desk/project.yaml` для шапки. Только отображение: без переключателя проектов
 * (одна доска на проект). Legacy-проект (без project.yaml) и ошибка загрузки — `null`:
 * имя проекта необязательно, а сбой связи с сервером и так показывает баннер useBoardData.
 */
export function useProject(): Ref<ProjectInfo | null> {
  const project = ref<ProjectInfo | null>(null);
  onMounted(() => {
    api.project().then(
      (info) => {
        project.value = info.legacy ? null : info;
      },
      () => {
        project.value = null;
      },
    );
  });
  return project;
}
```

- [ ] **Step 4: `npx tsc --noEmit` and a scratch mount check**

```bash
npx tsc --noEmit
```
Expected: clean. There's no standalone unit test for these composables (matches the React baseline); their behavior is exercised end-to-end starting Task 4 (`useBoardData`/`useProject` via `App.vue`) and Task 6 (`useUrlFilters` via filters/panel routing) — this task's "GREEN" is a clean typecheck plus successful use by those later tasks, not an isolated test here.

- [ ] **Step 5: Commit**

```bash
git add ui/src/composables
git commit -m "feat: port board data, URL filters and project composables to Vue"
```

---

### Task 4: Static board — `Board.vue`, `Column.vue`, `TaskCard.vue`, `Banners.vue`

**Files:**
- Create: `ui/src/board/TaskCard.vue`, `ui/src/board/Column.vue`, `ui/src/board/Board.vue`
- Create: `ui/src/ui/Banners.vue`
- Create: `ui/src/lib/agentColor.ts` (already ported in Task 2 — consumed here, not recreated)
- Create: `ui/src/styles/board.css`, `ui/src/styles/global.css`

**Interfaces:**
- Consumes: `TaskItem`, `BoardInfo`, `TaskList` (Task 2 `api/types.ts`); `groupByColumn`, `orphanTasks` (Task 2 `lib/transitions.ts`); `priorityTone` (Task 2 `lib/priority.ts`); `agentColor` (Task 2 `lib/agentColor.ts`)
- Produces:
  - `TaskCard.vue` — props `{ task: TaskItem; board: BoardInfo }`, emits `open: [id: string]`. No drag behavior yet — Task 8 wraps this component's root element with `vue-draggable-plus` bindings; this task's markup already carries the `draggable`/`card` class names and `data-testid="card-<id>"` Task 8 and the E2E suite (Task 9) rely on, so Task 8 doesn't need to touch this file's template, only `Column.vue`'s list wrapper.
  - `Column.vue` — props `{ column: ColumnInfo; tasks: TaskItem[]; board: BoardInfo }`, emits `open: [id: string]`. `data-drop`/`data-limit` attributes default to `idle`/unset here; Task 8 adds the props that drive them during a drag.
  - `Board.vue` — props `{ board: BoardInfo; tasks: TaskItem[] }`, emits `open: [id: string]`.
  - `Banners.vue` — props `{ board: BoardInfo; list: TaskList; error: string | null }`, emits `open: [id: string]`.

See the documented deviation in Global Constraints: no description preview, no notes-count badge on the card (`TaskItem` doesn't carry either).

- [ ] **Step 1: `ui/src/styles/global.css`**

Port `ui/src/styles/global.css` from `main`, with every `--color-*`/`--shadow-*`/`--radius-*`/`--space-*`/`--text-*`/`--duration-*`/`--ease-*` custom-property **name** kept as a local token (they're layout/spacing/motion tokens the kit doesn't provide — spec section 6 only replaces the *color* tokens, not spacing/radius/motion), but every remaining color reference retargeted to the Task 1 `tokens.css` names:

```bash
git show main:ui/src/styles/global.css > ui/src/styles/global.css
```
Then hand-edit the color references only:
- `--color-bg` → `--board-bg`
- `--color-surface` → `--card-bg`
- `--color-text` → `--text`
- `--color-text-muted` → `--text-muted`
- `--color-accent` → `--focus-ring`
- `--color-on-accent` → `var(--content-primary-b-enabled)` (the kit's "on dark/colored surface" text role)
- `--color-border` → `--card-border`
- `--color-critical` → `--wip-over`
- `--color-danger-bg` → `--invalid-bg`
- `--color-warn-bg` → `color-mix(in srgb, var(--content-system-warning) 10%, var(--board-bg))`
- `--color-grid` → `--board-grid-line`
- `--color-surface-sunken` → `--column-bg`

Everything else (`--space-*`, `--text-2xs`…`--text-display`, `--radius-*`, `--duration-*`, `--ease-out-expo`, `--tracking-caps`, `--shadow-lift`, `--shadow-panel`, `--column-width`) stays defined locally in this file exactly as on `main` — the kit has no equivalent tokens for spacing/motion/elevation-beyond-`--shadow-small`, so those remain our own design decisions. Add `--shadow-lift`/`--shadow-panel` and the leftover `--space-*`/`--text-*`/`--radius-*`/`--duration-*`/`--tracking-caps` block to `ui/src/styles/tokens.css` from Task 1 (not `global.css`) so every token lives in one file — move them there now.

Also delete the `.button`/`.button-primary`/`.control` rule blocks from `global.css` (ported from `main`): those styled our own hand-rolled form controls, which `TNButton`/`TNInput`/`TNSelectV2` replace starting Task 5 — keep only the reset, `.app`/`.app-state` layout, and focus-visible rules from `main`'s file.

- [ ] **Step 2: `ui/src/styles/board.css`**

Port `ui/src/styles/board.css` from `main` (`git show main:ui/src/styles/board.css > ui/src/styles/board.css`), then:
- Retarget colors the same way as Step 1 (`--color-surface-sunken`→`--column-bg`, `--color-border`→`--card-border`/`--column-border` as appropriate, `--color-text`→`--column-accent` for `.column`'s `border-top`, `--color-accent`/`--color-accent-tint`→`--focus-ring`/a new `color-mix(in srgb, var(--focus-ring) 10%, var(--card-bg))` inline where `--color-accent-tint` was used for `[data-drop='over']`).
- **Remove** the `.card::before`/`--card-tone`/`[data-tone]` stripe block entirely — priority is now the top-left pill (`.priority-pN`, Task 1's `tokens.css`), not a left-edge stripe. This is the approved-mockup card design (spec section 6), replacing the old stripe-based `priorityTone` visualization.
- **Remove** the `.badge[data-tone]` rules for the same reason — the badge itself becomes `<span class="priority-pill priority-pN">` and needs no `data-tone` styling block, `priorityTone` (Task 2) still computes which class name to apply (see Step 4).
- Keep `.card[data-invalid]` but retarget: `background: var(--invalid-bg); border-color: var(--invalid-border);`.
- Keep `.card-agent` as-is (already correctly named per the mockup and the current React version).
- Add a small `.card-time` rule (new, for the timestamp the mockup added): `font-family: var(--font-mono); font-size: var(--text-2xs); color: var(--text-faint);`.
- `.draggable`/`.draggable[data-dragging]` stay — Task 8 uses them.

- [ ] **Step 3: Write failing tests for `agentColor`/`priorityTone` usage — skip, already covered by Task 2's ported unit tests.** This task's "RED" is the component files not existing yet; there's no new pure-logic unit test to add here (component behavior is exercised by Task 9's E2E, matching the React baseline's own test balance).

- [ ] **Step 4: `ui/src/board/TaskCard.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { agentColor } from '../lib/agentColor';
import { priorityTone } from '../lib/priority';

const props = defineProps<{ task: TaskItem; board: BoardInfo }>();
const emit = defineEmits<{ open: [id: string] }>();

const tone = computed(() => priorityTone(props.board, props.task.fields.priority));
const priority = computed(() => (typeof props.task.fields.priority === 'string' ? props.task.fields.priority : null));
const showAgent = computed(() => props.task.agent && props.task.agent !== props.task.assignee);
const time = computed(() =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(
    new Date(props.task.created_at),
  ),
);
</script>

<template>
  <article
    class="card"
    :data-testid="`card-${task.id}`"
    :data-invalid="task.invalid || undefined"
  >
    <header class="card-head">
      <span v-if="priority" class="priority-pill" :class="`priority-${priority}`">{{ priority }}</span>
      <time class="card-time" :datetime="task.created_at">{{ time }}</time>
    </header>
    <button type="button" class="card-title" @click="emit('open', task.id)">{{ task.title }}</button>
    <span v-if="showAgent" class="card-agent" title="Тип сабагента">{{ task.agent }}</span>
    <span v-if="task.invalid" class="card-flag" :title="task.errors.join('\n')">ошибка схемы</span>
    <footer class="card-meta">
      <span v-if="task.assignee" class="assignee" :style="{ '--agent-color': agentColor(task.assignee) }">{{ task.assignee }}</span>
    </footer>
  </article>
</template>
```

- [ ] **Step 5: `ui/src/board/Column.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, ColumnInfo, TaskItem } from '../api/types';
import TaskCard from './TaskCard.vue';

const props = defineProps<{ column: ColumnInfo; tasks: TaskItem[]; board: BoardInfo }>();
const emit = defineEmits<{ open: [id: string] }>();

const limitState = computed(() => {
  const limit = props.column.wip_limit;
  if (limit === null) return undefined;
  if (props.column.count > limit) return 'over';
  if (props.column.count >= limit) return 'full';
  return undefined;
});
const countLabel = computed(() => (props.column.wip_limit === null ? String(props.column.count) : `${props.column.count}/${props.column.wip_limit}`));
</script>

<template>
  <section class="column" :aria-label="column.title" data-drop="idle" :data-limit="limitState">
    <header class="column-head">
      <h2 class="column-title">{{ column.title }}</h2>
      <span class="column-count" :title="column.wip_limit === null ? 'Задач в колонке' : 'Задач / WIP-лимит'">{{ countLabel }}</span>
    </header>
    <p v-if="column.guide" class="column-guide">{{ column.guide }}</p>
    <div class="column-body">
      <p v-if="tasks.length === 0" class="column-empty">пусто</p>
      <TaskCard v-for="task in tasks" :key="task.id" :task="task" :board="board" @open="emit('open', $event)" />
    </div>
  </section>
</template>
```

- [ ] **Step 6: `ui/src/board/Board.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import { groupByColumn } from '../lib/transitions';
import Column from './Column.vue';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[] }>();
const emit = defineEmits<{ open: [id: string] }>();

const byColumn = computed(() => groupByColumn(props.board, props.tasks));
</script>

<template>
  <div class="board">
    <Column
      v-for="column in board.columns"
      :key="column.id"
      :column="column"
      :tasks="byColumn.get(column.id) ?? []"
      :board="board"
      @open="emit('open', $event)"
    />
  </div>
</template>
```

- [ ] **Step 7: `ui/src/ui/Banners.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskList } from '../api/types';
import { orphanTasks } from '../lib/transitions';

const props = defineProps<{ board: BoardInfo; list: TaskList; error: string | null }>();
const emit = defineEmits<{ open: [id: string] }>();

const orphans = computed(() => orphanTasks(props.board, props.list.tasks));
const hasAny = computed(() => Boolean(props.error) || props.list.duplicate_ids.length > 0 || props.list.invalid_files.length > 0 || orphans.value.length > 0);
</script>

<template>
  <div v-if="hasAny" class="banners">
    <p v-if="error" class="banner banner-error" role="alert">{{ error }}</p>
    <p v-if="list.duplicate_ids.length > 0" class="banner banner-warn">
      Дубликаты ID: {{ list.duplicate_ids.map((group) => group.join(' = ')).join('; ') }}. Переименуй файлы в .desk/tasks.
    </p>
    <p v-if="list.invalid_files.length > 0" class="banner banner-error">
      Не читаются файлы:
      <span v-for="f in list.invalid_files" :key="f.id">
        <button type="button" @click="emit('open', f.id)">{{ f.id }}</button>({{ f.errors.join('; ') }})
      </span>
      . Запусти desk validate.
    </p>
    <p v-if="orphans.length > 0" class="banner banner-warn">
      Задачи в колонках, которых нет в board.yaml:
      <button v-for="task in orphans" :key="task.id" type="button" @click="emit('open', task.id)">{{ task.id }}</button>
      . Перенеси их в существующую колонку.
    </p>
  </div>
</template>
```

- [ ] **Step 8: Wire into `App.vue` for a manual check** (temporary — Task 7 replaces this with the full wiring)

Add to `ui/src/App.vue` from Task 1, replacing its body, so this task is independently checkable:
```vue
<script setup lang="ts">
import { computed } from 'vue';
import Board from './board/Board.vue';
import Banners from './ui/Banners.vue';
import { useBoardData } from './composables/useBoardData';

const { board, list, error } = useBoardData();
const noop = (): void => undefined;
</script>

<template>
  <main v-if="!board || !list" class="app-state">{{ error ?? 'Загрузка доски…' }}</main>
  <div v-else class="app">
    <Banners :board="board" :list="list" :error="error" @open="noop" />
    <main class="app-main">
      <Board :board="board" :tasks="list.tasks" @open="noop" />
    </main>
  </div>
</template>
```

- [ ] **Step 9: `npx tsc --noEmit` (root, includes `vue-tsc`-checkable files via Task 1's script), build, manual check**

```bash
npx tsc --noEmit && npm run build
DIR=$(mktemp -d) && cd "$DIR" && node ~/projects/desk/dist/cli/index.js init && node ~/projects/desk/dist/cli/index.js ui --port 4717 --open &
```
Open the browser: 4 columns render (Backlog/In progress/Review/Done), empty ("пусто"), no console errors. Create a task via MCP or by hand-writing a `.desk/tasks/T-001.md` file (use the template from `docs/superpowers/specs/2026-09-24-desk-kanban-design.md` section 3.3) and confirm the card appears live (SSE), showing the priority pill, timestamp, title, and assignee avatar. Stop the server (`kill %1`).

- [ ] **Step 10: Commit**

```bash
git add ui/src/board ui/src/ui/Banners.vue ui/src/styles/board.css ui/src/styles/global.css ui/src/styles/tokens.css ui/src/App.vue
git commit -m "feat: add static board, column, card and banner components on tn-uikit tokens"
```
