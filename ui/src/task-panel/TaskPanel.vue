<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, FieldValue, TaskFull, TaskItem, UnreadableTask } from '../api/types';
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
import { dialogsOpen } from '../composables/useDialogStack';
import Markdown from '../ui/Markdown.vue';
import FieldInput from './FieldInput.vue';

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

// React-версия читала `!e.defaultPrevented`: окно поверх панели (Modal) само помечает Escape и
// останавливает событие. TNPopup (Task 6) не делает preventDefault на своём Escape-обработчике
// (`@keydown.esc.exact="handleEscPress"` в popup.vue просто эмитит `close`, событие продолжает
// всплывать) — поэтому здесь используется общий счётчик открытых диалогов (useDialogStack):
// пока хотя бы один TNPopup открыт, Escape не должен закрывать панель под ним.
function onWindowEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape' && dialogsOpen.value === 0) emit('close');
}
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
            <div v-for="key in stale" :key="key" class="stale-field">
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
