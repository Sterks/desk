# Part 3. Task panel + dialogs (Tasks 5–6)

Index, Global Constraints, Review Focus: `../2026-09-24-desk-vue-ui.md`. Spec: sections 5, 8.

**A real finding from reading `ui/vendor/tn-uikit/components/popup/popup.vue` during planning, binding on both tasks below:** `TNPopup`'s own Escape handling (`@keydown.esc.exact="handleEscPress"`) is a normal bubble-phase Vue template listener whose handler ignores the native event object — it can't call `preventDefault()`. The current React version fixed a real bug (Escape on the requires-dialog also closing the task panel underneath) with a capture-phase `window` listener + `preventDefault()` + a `defaultPrevented` check in the panel. `TNPopup` alone does not give us that. **Design decision for this plan:** don't fight `TNPopup`'s event wiring — track "how many dialogs are open" in one small shared composable (`useDialogStack`, Task 6 Step 1) and have `TaskPanel.vue`'s own Escape handler no-op while that count is above zero. Simpler than replicating the capture/`preventDefault` trick against a component we don't control, and it uses `TNPopup` unmodified.

---

### Task 5: Task panel — `TaskPanel.vue`, `FieldInput.vue`, `Markdown.vue`, error boundary

**Files:**
- Create: `ui/src/task-panel/FieldInput.vue`
- Create: `ui/src/task-panel/TaskPanel.vue`
- Create: `ui/src/ui/Markdown.vue`
- Create: `ui/src/ui/ErrorBoundary.vue`
- Create: `ui/src/styles/panel.css`

**Interfaces:**
- Consumes: `api`, `errorMessage` (Task 2); `FieldInfo`, `FieldValue`, `TaskFull`, `UnreadableTask` (Task 2 `api/types.ts`); `ASSIGNEE_FIELD`, `buildUpdate`, `isDirty`, `isUnreadable`, `mergeFresh`, `toDraft`, `undeclaredFields`, `parseNumberInput`, `PanelState`, `TaskDraft` (Task 2 `lib/fields.ts`); `formatTime` (Task 2 `lib/format.ts`); `renderMarkdown` (Task 2 `lib/markdown.ts`)
- Produces:
  - `FieldInput.vue` — props `{ def: FieldInfo; value: FieldValue | undefined | null }`, emits `update:value: [FieldValue | null]`. Dispatches to the right `tn-uikit` input per `def.type`, exactly like the current `FieldInput`/`FieldRow` pair in `ui/src/task-panel/FieldInput.tsx` on `main` — this file merges both (a Vue prop-driven component doesn't need the React version's `useId`-per-render trick for duplicate-id safety across two simultaneously-open forms, since `tn-uikit` inputs generate their own internal ids; confirm this against `ui/vendor/tn-uikit/components/input/input.vue` before assuming — if it does need an explicit id, pass one via `:id` the same way the React version did with `useId()`, using Vue's own `useId()` from `vue` 3.5+).
  - `TaskPanel.vue` — props `{ board: BoardInfo; taskId: string; version: number }`, emits `close: []`, `error: [message: string]`, `move: [task: TaskItem, to: string]`. Same behavior as `ui/src/task-panel/TaskPanel.tsx` on `main`: loads the task on `taskId`/`version` change, branches on `isUnreadable`, shows undeclared fields with a delete affordance, saves only changed fields via `buildUpdate`, merges live refreshes via `mergeFresh` without discarding a dirty draft.
  - `Markdown.vue` — prop `{ source: string }`, renders `renderMarkdown(source)` via `v-html` (same trust boundary as the React version's `dangerouslySetInnerHTML` — `renderMarkdown` already escapes raw HTML and allow-lists `http(s)` links, per `lib/markdown.ts`, Task 2).
  - `ErrorBoundary.vue` — default slot content; slot prop or `#fallback` scoped slot receiving `message: string`. Wraps `onErrorCaptured` the way `ui/src/ui/ErrorBoundary.tsx` (a class component with `getDerivedStateFromError`) does on `main`.

**⚠️ Before writing `FieldInput.vue`: read `ui/vendor/tn-uikit/components/{input,textarea,checkbox,select_v2,multiselect}/*.vue` for their exact prop names.** Planning verified `TNInput`'s props precisely (below) and confirmed `TNTextarea`/`TNCheckbox`/`TNSelectV2`/`TNMultiSelector` all use standard `modelValue`/`update:modelValue` v-model, but did **not** verify `label`/`description`/`error`/`required`/`disabled` exist identically on `TNTextarea`/`TNCheckbox`/`TNMultiSelector` (only confirmed on `TNInput` and implied by the kit's consistent pattern). If a prop name below is wrong, fix it to match the real component and note the correction in your report — don't silently change behavior to work around a wrong prop name (e.g. don't drop the `guide` text instead of finding the right prop for it).

- [ ] **Step 1: `ui/src/styles/panel.css`**

Port `ui/src/styles/panel.css` from `main` (`git show main:ui/src/styles/panel.css > ui/src/styles/panel.css`), then:
- Retarget every `--color-*` reference the same way as Part 2 Task 4 Step 1 (`--color-surface`→`--card-bg`, `--color-border`→`--card-border`, `--color-text`→`--text`, `--color-text-muted`→`--text-muted`, `--color-accent`→`--focus-ring`, `--color-critical`→`--wip-over`, `--color-danger-bg`→`--invalid-bg`).
- **Remove** `.control`, `.field-row`, `.multi`, `.field-guide`, `.field-required` rules — `TNInput`/`TNTextarea`/`TNSelectV2`/`TNCheckbox`/`TNMultiSelector` style themselves; our CSS only needs to lay out the grid these controls sit in (keep a slimmer `.fields-grid { display: grid; gap: var(--space-3); }` and nothing per-input).
- Keep `.stale-field`, `.stale-value`, `.panel-*`, `.timeline`, `.note-form`, `.markdown`, `.description-empty`, `.link-button`, `.error-list` — none of those are form controls, they stay hand-styled.
- **Remove** `.modal-*`, `.toast*` rules — Task 6 uses `TNPopup` (its own styles) and `useToaster` (its own styles) instead.

- [ ] **Step 2: `ui/src/ui/Markdown.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '../lib/markdown';

const props = defineProps<{ source: string }>();
const html = computed(() => renderMarkdown(props.source));
</script>

<template>
  <!-- renderMarkdown экранирует HTML (html: false) и пропускает только http(s)-ссылки — см. markdown.test.ts. -->
  <div class="markdown" v-html="html" />
</template>
```

- [ ] **Step 3: `ui/src/ui/ErrorBoundary.vue`**

```vue
<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import { errorMessage } from '../api/client';

const message = ref<string | null>(null);

onErrorCaptured((error) => {
  // В браузере нет серверного лога: консоль — единственное место для стека компонентов.
  // eslint-disable-next-line no-console
  console.error('desk ui: ошибка отрисовки', error);
  message.value = errorMessage(error);
  return false; // не даём ошибке всплыть дальше — этот компонент её обработал
});

defineExpose({ reset: () => { message.value = null; } });
</script>

<template>
  <slot v-if="message === null" />
  <slot v-else name="fallback" :message="message" />
</template>
```

Note the difference from React: React's `key`-based reset (`<ErrorBoundary key={filters.task}>`) remounts the whole boundary on a new key, clearing its state automatically. Vue's `:key` on a component does the same — `App.vue` (Task 7) must key this component by `taskId` for the same reset-on-new-task behavior; don't rely on `reset()` for that (it's exposed only as an escape hatch, not the primary mechanism).

- [ ] **Step 4: `ui/src/task-panel/FieldInput.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { FieldInfo, FieldValue } from '../api/types';
import { parseNumberInput } from '../lib/fields';

const props = defineProps<{ def: FieldInfo; value: FieldValue | undefined | null }>();
const emit = defineEmits<{ 'update:value': [FieldValue | null] }>();

const textValue = computed(() => (typeof props.value === 'string' ? props.value : ''));
const numberValue = computed(() => (typeof props.value === 'number' ? props.value : null));
const boolValue = computed(() => props.value === true);
const listValue = computed(() => (Array.isArray(props.value) ? props.value : []));
const orNull = (text: string): string | null => (text === '' ? null : text);
</script>

<template>
  <div class="field-row">
    <TNSelectV2
      v-if="def.type === 'enum'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :options="def.values ?? []"
      :model-value="textValue || undefined"
      @update:model-value="(v) => emit('update:value', v ?? null)"
    />
    <TNMultiSelector
      v-else-if="def.type === 'multi_enum'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :options="def.values ?? []"
      :model-value="listValue"
      @update:model-value="(v) => emit('update:value', v && v.length > 0 ? v : null)"
    />
    <TNCheckbox
      v-else-if="def.type === 'bool'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :model-value="boolValue"
      @update:model-value="(v) => emit('update:value', v)"
    />
    <TNInput
      v-else-if="def.type === 'number'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      numeric-keyboard="decimal"
      :model-value="numberValue === null ? '' : String(numberValue)"
      @update:model-value="(v) => emit('update:value', parseNumberInput(v))"
    />
    <TNTextarea
      v-else-if="def.type === 'text'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :model-value="textValue"
      @update:model-value="(v) => emit('update:value', orNull(v))"
    />
    <TNInput
      v-else
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :model-value="textValue"
      @update:model-value="(v) => emit('update:value', orNull(v))"
    />
  </div>
</template>
```
(`TNInput` has no dedicated `type="url"`/`type="date"` variant beyond `numericKeyboard` — confirmed during planning it only exposes `numericKeyboard` for input-mode hints, not an HTML `type` prop. Check `ui/vendor/tn-uikit/components/input/input.vue`'s template for whether it renders a native `<input type="...">` you can influence, or add plain HTML validation for `url`/`date` in `TaskPanel.vue`'s save path instead if the kit gives no way to hint the native picker — either is acceptable, the server already validates the value regardless; note your choice in the report.)

- [ ] **Step 5: `ui/src/task-panel/TaskPanel.vue`**

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { api, errorMessage } from '../api/client';
import type { FieldValue, TaskFull, UnreadableTask } from '../api/types';
import {
  ASSIGNEE_FIELD,
  buildUpdate,
  isDirty,
  isUnreadable,
  mergeFresh,
  toDraft,
  undeclaredFields,
  type PanelState,
} from '../lib/fields';
import { formatTime } from '../lib/format';
import Markdown from '../ui/Markdown.vue';
import FieldInput from './FieldInput.vue';
import { dialogsOpen } from '../composables/useDialogStack';
import type { BoardInfo, TaskItem } from '../api/types';

const props = defineProps<{ board: BoardInfo; taskId: string; version: number }>();
const emit = defineEmits<{ close: []; error: [string]; move: [TaskItem, string] }>();

const state = ref<PanelState | null>(null);
const unreadable = ref<UnreadableTask | null>(null);
const loadError = ref<string | null>(null);
const editingDescription = ref(false);
const note = ref('');
const saving = ref(false);

async function load(): Promise<void> {
  try {
    const next = await api.task(props.taskId);
    loadError.value = null;
    if (isUnreadable(next)) {
      unreadable.value = next;
      state.value = null;
      return;
    }
    unreadable.value = null;
    state.value = mergeFresh(state.value, next);
  } catch (e) {
    loadError.value = errorMessage(e);
  }
}

watch(() => [props.taskId, props.version], load, { immediate: true });

function onWindowEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape' && dialogsOpen.value === 0) emit('close');
}
import { onMounted, onUnmounted } from 'vue';
onMounted(() => window.addEventListener('keydown', onWindowEscape));
onUnmounted(() => window.removeEventListener('keydown', onWindowEscape));

function setDraft(patch: Partial<PanelState['draft']>): void {
  if (state.value) state.value = { ...state.value, draft: { ...state.value.draft, ...patch } };
}
function setField(id: string, value: FieldValue | null): void {
  if (state.value) state.value = { ...state.value, draft: { ...state.value.draft, fields: { ...state.value.draft.fields, [id]: value } } };
}

async function run(action: () => Promise<TaskFull>): Promise<void> {
  saving.value = true;
  try {
    const updated = await action();
    state.value = mergeFresh(state.value, updated);
  } catch (e) {
    emit('error', errorMessage(e));
  } finally {
    saving.value = false;
  }
}

function save(): void {
  const current = state.value;
  if (!current) return;
  const update = buildUpdate(current.task, current.draft);
  void run(async () => {
    const updated = await api.update(current.task.id, update);
    state.value = { task: updated, draft: toDraft(updated) };
    editingDescription.value = false;
    return updated;
  });
}

function submitNote(): void {
  const current = state.value;
  if (!current || note.value.trim() === '') return;
  const text = note.value;
  void run(async () => {
    const updated = await api.addNote(current.task.id, text);
    note.value = '';
    return updated;
  });
}

function moveTo(to: string): void {
  const current = state.value;
  if (!current || to === current.task.column) return;
  emit('move', current.task, to);
}

const column = computed(() => (state.value ? props.board.columns.find((c) => c.id === state.value?.task.column) : undefined));
const dirty = computed(() => (state.value ? isDirty(state.value.task, state.value.draft) : false));
const stale = computed(() => (state.value ? undeclaredFields(props.board, state.value.task.fields) : []));
</script>

<template>
  <div class="panel-backdrop" @mousedown="emit('close')" />
  <aside class="panel" role="dialog" aria-modal="true" :aria-label="taskId">
    <header class="panel-head">
      <span class="panel-id">{{ taskId }}</span>
      <span v-if="state?.task.agent" class="panel-agent" title="Тип сабагента">· {{ state.task.agent }}</span>
      <select
        v-if="state"
        class="control panel-move"
        aria-label="Колонка"
        :value="state.task.column"
        :disabled="saving"
        @change="moveTo(($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!column" :value="state.task.column">{{ state.task.column }} (нет в board.yaml)</option>
        <option v-for="c in board.columns" :key="c.id" :value="c.id">{{ c.title }}</option>
      </select>
      <button type="button" class="button" aria-label="Закрыть панель" @click="emit('close')">Esc</button>
    </header>

    <p v-if="loadError" class="banner banner-error">{{ loadError }}</p>

    <div v-if="unreadable" class="panel-body">
      <p class="banner banner-error">Файл задачи не читается. Исправь .desk/tasks/{{ unreadable.id }}.md вручную и запусти desk validate.</p>
      <ul class="error-list">
        <li v-for="error in unreadable.errors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <template v-if="state">
      <div class="panel-body">
        <ul v-if="state.task.errors.length > 0" class="error-list">
          <li v-for="error in state.task.errors" :key="error">{{ error }}</li>
        </ul>
        <input class="panel-title" aria-label="Название" :value="state.draft.title" @input="setDraft({ title: ($event.target as HTMLInputElement).value })" />
        <section class="panel-section">
          <h3>Поля</h3>
          <div class="fields-grid">
            <FieldInput :def="ASSIGNEE_FIELD" :value="state.draft.assignee || undefined" @update:value="(v) => setDraft({ assignee: typeof v === 'string' ? v : '' })" />
            <FieldInput v-for="f in board.fields" :key="f.id" :def="f" :value="state.draft.fields[f.id] ?? undefined" @update:value="(v) => setField(f.id, v)" />
            <div v-for="key in stale" :key="key" class="field-row stale-field">
              <span class="field-label">{{ key }}</span>
              <div class="stale-value">
                <code>{{ JSON.stringify(state.task.fields[key]) }}</code>
                <button type="button" class="link-button" :disabled="state.draft.fields[key] === null" @click="setField(key, null)">
                  {{ state.draft.fields[key] === null ? 'удалится при сохранении' : 'удалить' }}
                </button>
              </div>
              <p class="field-guide">Поля нет в board.yaml. Удали его — иначе задачу нельзя сохранить.</p>
            </div>
          </div>
        </section>
        <section class="panel-section">
          <h3>Описание <button type="button" class="link-button" @click="editingDescription = !editingDescription">{{ editingDescription ? 'просмотр' : 'редактировать' }}</button></h3>
          <textarea v-if="editingDescription" class="control" rows="10" aria-label="Описание" :value="state.draft.description" @input="setDraft({ description: ($event.target as HTMLTextAreaElement).value })" />
          <Markdown v-else-if="state.draft.description" :source="state.draft.description" />
          <p v-else class="description-empty">Описания нет.</p>
        </section>
        <section class="panel-section">
          <h3>Notes</h3>
          <p v-if="state.task.notes.length === 0" class="description-empty">Заметок нет.</p>
          <ol v-else class="timeline">
            <li v-for="(n, i) in state.task.notes" :key="`${n.at}-${i}`">
              <time :datetime="n.at">{{ formatTime(n.at) }}</time>
              <span><strong>{{ n.by }}</strong>: {{ n.text }}</span>
            </li>
          </ol>
          <form class="note-form" @submit.prevent="submitNote">
            <input class="control" aria-label="Новая заметка" placeholder="Заметка" v-model="note" />
            <button class="button" type="submit" :disabled="saving || note.trim() === ''">Добавить</button>
          </form>
        </section>
        <section class="panel-section">
          <h3>История</h3>
          <ol class="timeline">
            <li v-for="(h, i) in state.task.history" :key="`${h.at}-${i}`">
              <time :datetime="h.at">{{ formatTime(h.at) }}</time>
              <span><strong>{{ h.by }}</strong>: {{ h.from === null ? `создал в ${h.to}` : `${h.from} → ${h.to}` }}</span>
            </li>
          </ol>
        </section>
      </div>
      <footer class="panel-foot">
        <button type="button" class="button button-primary" :disabled="saving || !dirty" @click="save">Сохранить</button>
      </footer>
    </template>
  </aside>
</template>
```

The React version's `titleId`/`aria-labelledby` pointed at a rendered `<span id>`; this port uses `aria-label="taskId"` directly on the `role="dialog"` element instead — one fewer moving part, same accessible name (`taskId`), which is what Task 9's E2E locates by (`page.getByRole('dialog', { name: 'T-001' })`). Confirm this still matches every E2E assertion that names the panel by task id before moving on.

- [ ] **Step 6: `npx tsc --noEmit`, manual check**

Build and run the dev server against a seeded `.desk/`; open a task, edit a field of each type, save, confirm the file changes. Confirm an unreadable task file (hand-write one with garbage content) shows the unreadable branch, not a crash. Confirm a stale field (present in the task file, absent from `board.yaml`) shows the delete affordance and the panel saves after removing it.

- [ ] **Step 7: Commit**

```bash
git add ui/src/task-panel/FieldInput.vue ui/src/task-panel/TaskPanel.vue ui/src/ui/Markdown.vue ui/src/ui/ErrorBoundary.vue ui/src/styles/panel.css
git commit -m "feat: add task panel, field inputs and an onErrorCaptured boundary on tn-uikit"
```

---

### Task 6: Dialogs and chrome — `CreateTaskDialog.vue`, `RequiresDialog.vue`, `ThemeToggle.vue`, toaster wiring

**Files:**
- Create: `ui/src/composables/useDialogStack.ts`
- Create: `ui/src/task-panel/CreateTaskDialog.vue`
- Create: `ui/src/task-panel/RequiresDialog.vue`
- Create: `ui/src/filters/FilterBar.vue`
- Create: `ui/src/ui/ThemeToggle.vue`

**Interfaces:**
- Consumes: `api`, `errorMessage`, `FieldChanges` (Task 2); `ASSIGNEE_FIELD`, `compactFields`, `defaultsFor`, `fieldInfo`, `Draft` (Task 2 `lib/fields.ts`); `isEmptyValue` (Task 2 `lib/transitions.ts`); `FieldInput.vue` (Task 5); `TNPopup`, `useToaster` (kit, globally registered by Task 1's `main.ts`)
- Produces:
  - `useDialogStack(): { dialogsOpen: Ref<number>; register(): () => void }` — `register()` increments the shared count and returns an unregister function; call it in `onMounted`, call the returned function in `onUnmounted`.
  - `CreateTaskDialog.vue` — props `{ board: BoardInfo }`, emits `close: []`, `created: [TaskFull]`.
  - `RequiresDialog.vue` — props `{ board: BoardInfo; task: TaskItem; to: string; missing: string[] }`, emits `cancel: []`, `submit: [FieldChanges]` (async — the parent awaits it and closes on success, matching `RequiresDialogProps.onSubmit` on `main`).
  - `FilterBar.vue` — props `{ board: BoardInfo; tasks: TaskItem[]; filters: Filters }`, emits `change: [Partial<Filters>]`, `create: []`. Byte-equivalent port of `ui/src/filters/FilterBar.tsx` on `main`, using `TNInput`/`TNSelectV2`/`TNButton` instead of plain `<input>`/`<select>`/`<button>`.
  - `ThemeToggle.vue` — no props; toggles `.tn-dark-theme` on `<html>`, syncs with `matchMedia('(prefers-color-scheme: dark)')` by default, remembers an explicit override in `localStorage` (spec section 5, Review Focus item 5).

- [ ] **Step 1: `ui/src/composables/useDialogStack.ts`**

```ts
import { ref, type Ref } from 'vue';

/** Сколько TNPopup-диалогов сейчас открыто — TaskPanel.vue проверяет это перед закрытием по Escape,
 *  потому что TNPopup сам не глушит всплытие Escape (см. Part 3 README). */
export const dialogsOpen: Ref<number> = ref(0);

export function useDialogStack(): { register(): () => void } {
  return {
    register: () => {
      dialogsOpen.value += 1;
      return () => {
        dialogsOpen.value -= 1;
      };
    },
  };
}
```

- [ ] **Step 2: `ui/src/task-panel/CreateTaskDialog.vue`**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskFull } from '../api/types';
import { ASSIGNEE_FIELD, compactFields, defaultsFor, type Draft } from '../lib/fields';
import { useDialogStack } from '../composables/useDialogStack';
import FieldInput from './FieldInput.vue';

const props = defineProps<{ board: BoardInfo }>();
const emit = defineEmits<{ close: []; created: [TaskFull] }>();

const title = ref('');
const description = ref('');
const column = ref(props.board.columns[0]?.id ?? '');
const assignee = ref('');
const fields = ref<Draft>(defaultsFor(props.board));
const error = ref<string | null>(null);
const saving = ref(false);

const { register } = useDialogStack();
let unregister: (() => void) | undefined;
onMounted(() => { unregister = register(); });
onUnmounted(() => unregister?.());

async function submit(): Promise<void> {
  saving.value = true;
  error.value = null;
  try {
    const created = await api.create({
      title: title.value,
      description: description.value,
      column: column.value,
      fields: { ...compactFields(fields.value), ...(assignee.value.trim() ? { assignee: assignee.value.trim() } : {}) },
    });
    emit('created', created);
  } catch (e) {
    error.value = errorMessage(e);
    saving.value = false;
  }
}
</script>

<template>
  <TNPopup is-visible title="Новая задача" role="dialog" aria-modal="true" aria-label="Новая задача" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="field-row">
        <label for="new-title">title *</label>
        <TNInput id="new-title" v-model="title" required />
      </div>
      <div class="field-row">
        <label for="new-column">column</label>
        <TNSelectV2 id="new-column" v-model="column" :options="board.columns.map((c) => c.id)" />
      </div>
      <FieldInput :def="ASSIGNEE_FIELD" :value="assignee || undefined" @update:value="(v) => (assignee = typeof v === 'string' ? v : '')" />
      <FieldInput v-for="f in board.fields" :key="f.id" :def="f" :value="fields[f.id] ?? undefined" @update:value="(v) => (fields = { ...fields, [f.id]: v })" />
      <div class="field-row">
        <label for="new-description">description</label>
        <TNTextarea id="new-description" v-model="description" :rows="5" />
      </div>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <footer class="modal-foot">
        <TNButton type="outline" @click="emit('close')">Отмена</TNButton>
        <TNButton native-type="submit" type="action" :disabled="saving || title.trim() === ''">Создать</TNButton>
      </footer>
    </form>
  </TNPopup>
</template>
```
`TNSelectV2`'s `id`/`TNButton`'s `native-type` (for `type="submit"` on the underlying `<button>`, distinct from the component's own `type` prop which picks its visual style — check `ui/vendor/tn-uikit/components/button/button.types.ts` for the exact prop name; it may not be called `native-type`) — verify against the real component before relying on it; if there's no such prop, keep the `<TNButton>` as `type="button"` visual style and drive submission from a plain `@click="submit"` instead of relying on native form submit, same net effect.

- [ ] **Step 3: `ui/src/task-panel/RequiresDialog.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { errorMessage, type FieldChanges } from '../api/client';
import type { BoardInfo, TaskItem } from '../api/types';
import { compactFields, fieldInfo, type Draft } from '../lib/fields';
import { isEmptyValue } from '../lib/transitions';
import { useDialogStack } from '../composables/useDialogStack';
import FieldInput from './FieldInput.vue';

const props = defineProps<{
  board: BoardInfo;
  task: TaskItem;
  to: string;
  missing: string[];
  /** Функция, а не emit: Vue-события ничего не возвращают, а нам нужно дождаться результата
   *  performMove (владеет им App.vue, Task 7) и показать ошибку в ЭТОМ диалоге при отказе сервера —
   *  тот же контракт, что у RequiresDialogProps.onSubmit в React-версии. */
  onSubmit: (fields: FieldChanges) => Promise<void>;
}>();
const emit = defineEmits<{ cancel: [] }>();

const values = ref<Draft>(Object.fromEntries(props.missing.map((id) => [id, null])));
const error = ref<string | null>(null);
const saving = ref(false);

const { register } = useDialogStack();
let unregister: (() => void) | undefined;
onMounted(() => { unregister = register(); });
onUnmounted(() => unregister?.());

const target = computed(() => props.board.columns.find((c) => c.id === props.to)?.title ?? props.to);
const complete = computed(() => props.missing.every((id) => !isEmptyValue(values.value[id])));

async function submit(): Promise<void> {
  saving.value = true;
  error.value = null;
  try {
    await props.onSubmit(compactFields(values.value));
    // Успех: App.vue снимает pendingMove и этот компонент размонтируется — сбрасывать saving не нужно.
  } catch (e) {
    error.value = errorMessage(e);
    saving.value = false;
  }
}
</script>

<template>
  <TNPopup is-visible :title="`${task.id} → ${target}`" subtitle="Этот переход требует заполнить поля." role="dialog" aria-modal="true" :aria-label="`${task.id} → ${target}`" @close="emit('cancel')">
    <form @submit.prevent="submit">
      <template v-for="id in missing" :key="id">
        <FieldInput v-if="fieldInfo(board, id)" :def="fieldInfo(board, id)!" :value="values[id] ?? undefined" @update:value="(v) => (values = { ...values, [id]: v })" />
      </template>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <footer class="modal-foot">
        <TNButton type="outline" @click="emit('cancel')">Отмена</TNButton>
        <TNButton type="action" :disabled="!complete || saving" @click="submit">Перенести</TNButton>
      </footer>
    </form>
  </TNPopup>
</template>
```
`onSubmit` is a plain function prop (Vue 3 supports function-typed props natively via `defineProps<{...}>()` — no special syntax needed beyond the type). `App.vue` (Task 7) passes its `performMove`-based handler here directly, exactly mirroring `RequiresDialogProps.onSubmit` on `main`.

- [ ] **Step 4: `ui/src/filters/FilterBar.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { BoardInfo, TaskItem } from '../api/types';
import type { Filters } from '../lib/filters';

const props = defineProps<{ board: BoardInfo; tasks: TaskItem[]; filters: Filters }>();
const emit = defineEmits<{ change: [Partial<Filters>]; create: [] }>();

const assignees = computed(() => [...new Set(props.tasks.flatMap((t) => (t.assignee ? [t.assignee] : [])))].sort());
const enumFields = computed(() => props.board.fields.filter((f) => (f.type === 'enum' || f.type === 'multi_enum') && f.values));
</script>

<template>
  <form role="search" class="filter-bar" @submit.prevent>
    <TNSearch aria-label="Поиск по ID и названию" placeholder="Поиск: T-012 или слово из названия" :model-value="filters.q" @update:model-value="(v: string) => emit('change', { q: v })" />
    <TNSelectV2 aria-label="Исполнитель" :options="assignees" :model-value="filters.assignee || undefined" @update:model-value="(v) => emit('change', { assignee: v ?? '' })" />
    <TNSelectV2
      v-for="f in enumFields"
      :key="f.id"
      :aria-label="f.id"
      :options="f.values ?? []"
      :model-value="filters.fields[f.id] || undefined"
      @update:model-value="(v) => emit('change', { fields: { ...filters.fields, [f.id]: v ?? '' } })"
    />
    <TNButton type="action" @click="emit('create')">Новая задача</TNButton>
  </form>
</template>
```
`TNSearch` is the kit's dedicated search-input component (`index.ts` exports it) — check `ui/vendor/tn-uikit/components/search/search.vue` for its exact `aria-label`/placeholder prop names (it may wrap a native `<input type="search">` with `role="searchbox"` automatically, or it may not — Task 9's E2E locates this control via `page.getByRole('searchbox', { name: 'Поиск по ID и названию' })`, so confirm `TNSearch` actually produces that role/name combination; if it renders a plain `role="textbox"` instead, either pass an explicit `role="searchbox"` override or use a plain `<input type="search">` styled by hand instead of `TNSearch`, and say which you picked in the report).

- [ ] **Step 5: `ui/src/ui/ThemeToggle.vue`**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const STORAGE_KEY = 'desk-theme';
type ThemeOverride = 'light' | 'dark' | null;

function readOverride(): ThemeOverride {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

function apply(isDark: boolean): void {
  document.documentElement.classList.toggle('tn-dark-theme', isDark);
}

const override = ref<ThemeOverride>(readOverride());
const media = window.matchMedia('(prefers-color-scheme: dark)');

function sync(): void {
  apply(override.value === null ? media.matches : override.value === 'dark');
}

function onMediaChange(): void {
  if (override.value === null) sync();
}

onMounted(() => {
  sync();
  media.addEventListener('change', onMediaChange);
});
onUnmounted(() => media.removeEventListener('change', onMediaChange));

function toggle(): void {
  const currentlyDark = override.value === null ? media.matches : override.value === 'dark';
  override.value = currentlyDark ? 'light' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, override.value);
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — тема переключается только на эту сессию.
  }
  sync();
}

const isDark = computed(() => (override.value === null ? media.matches : override.value === 'dark'));
import { computed } from 'vue';
</script>

<template>
  <button type="button" class="icon-btn" aria-label="Переключить тему" @click="toggle">{{ isDark ? '☾' : '☀' }}</button>
</template>
```

- [ ] **Step 6: `npx tsc --noEmit`, manual check**

Open the dev server, confirm: creating a task via `CreateTaskDialog` works end-to-end; dragging isn't wired yet (Task 8) so trigger a `RequiresDialog` manually for now isn't possible — defer its interactive check to Task 8/9, but confirm it at least renders without errors by temporarily mounting it in a scratch route or via Vue devtools, then remove the scratch wiring before committing. Confirm `ThemeToggle` flips `.tn-dark-theme` on `<html>` and the board's colors actually change (proves Task 1/4's token wiring is correct end-to-end, not just typechecking).

**Verify the `role="dialog"`/`aria-modal`/`aria-label` attributes on `<TNPopup>` actually reach the real DOM element** (open the browser's accessibility tree or inspect the rendered `.tn-popup` node) — planning found `ui/vendor/tn-uikit/components/popup/popup.vue`'s template has no `role`/`aria-*` of its own, and is relying on Vue's default attribute-fallthrough to place ours there. If `popup.vue` sets `inheritAttrs: false` somewhere (not seen during planning, but not exhaustively ruled out either), fallthrough won't work and you'll need `v-bind="$attrs"` isn't the fix here since it's the OTHER side (TNPopup's own script) that would need to opt in — in that case, wrap `<TNPopup>` in a plain `<div role="dialog" aria-modal="true" :aria-label="...">` instead, and say so in the report. Task 9's E2E depends entirely on this working, so don't skip the check.

- [ ] **Step 7: Commit**

```bash
git add ui/src/composables/useDialogStack.ts ui/src/task-panel/CreateTaskDialog.vue ui/src/task-panel/RequiresDialog.vue ui/src/filters/FilterBar.vue ui/src/ui/ThemeToggle.vue
git commit -m "feat: add create-task and requires dialogs, filter bar and theme toggle on tn-uikit"
```
