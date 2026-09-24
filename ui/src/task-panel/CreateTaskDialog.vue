<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import TNInput from '@life_uikit/uikit/components/input/input.vue';
import TNTextarea from '@life_uikit/uikit/components/textarea/textarea.vue';
import TNSelectV2 from '@life_uikit/uikit/components/select_v2/select_v2.vue';
import TNButton from '@life_uikit/uikit/components/button/button.vue';
import TNPopup from '@life_uikit/uikit/components/popup/popup.vue';
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

// TNPopup's own `@keydown.esc.exact="handleEscPress"` (popup.vue) only emits `close` — it never
// calls `stopPropagation()`, so the same native Escape keydown keeps bubbling past the popup and
// reaches `window`. Relying on `dialogsOpen` alone (useDialogStack) to guard TaskPanel's window
// listener is NOT enough: verified in a real browser that Vue flushes this component's unmount
// (and therefore its `register()` unregister callback, which decrements `dialogsOpen`) via a
// microtask checkpoint that runs BETWEEN this element's own bubble-phase listener and window's —
// so by the time TaskPanel's handler reads `dialogsOpen.value`, it has already dropped back to 0
// and the panel closes too. Stopping propagation here, deterministically, on the wrapper that is
// this dialog's own event-dispatch ancestor, is what actually keeps the Escape from reaching
// `window` at all — timing-independent, unlike the counter check.
function stopEscapeBubbling(e: KeyboardEvent): void {
  e.stopPropagation();
}

async function submit(): Promise<void> {
  if (saving.value || title.value.trim() === '') return;
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
  <div @keydown.esc="stopEscapeBubbling">
    <TNPopup is-visible title="Новая задача" role="dialog" aria-modal="true" aria-label="Новая задача" @close="emit('close')">
      <!--
        `@submit.prevent` без обработчика: TNButton не даёт способа задать нативный HTML `type`
        кнопки (`type` у него занят под визуальный стиль action/outline/…, см. button.types.ts) —
        значит рендерится обычный `<button>` без атрибута `type`, а такой `<button>` внутри формы
        браузер по умолчанию считает `type="submit"`. И "Отмена", и "Создать" были бы submit-кнопками
        одновременно — клик по "Отмена" тоже вызывал бы отправку формы. Поэтому submit форму не
        обрабатывает вовсе (только гасит нативную отправку/перезагрузку), а создание задачи запускает
        явный `@click="submit"` только на кнопке "Создать".
      -->
      <form @submit.prevent>
        <div class="fields-grid">
          <div class="field-row">
            <TNInput label="title" required v-model="title" />
          </div>
          <div class="field-row">
            <TNSelectV2 label="column" value-key="id" :options="board.columns" v-model="column" />
          </div>
          <FieldInput :def="ASSIGNEE_FIELD" :value="assignee || undefined" @update:value="(v) => (assignee = typeof v === 'string' ? v : '')" />
          <FieldInput v-for="f in board.fields" :key="f.id" :def="f" :value="fields[f.id] ?? undefined" @update:value="(v) => (fields = { ...fields, [f.id]: v })" />
          <div class="field-row">
            <TNTextarea label="description" :rows="5" v-model="description" />
          </div>
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <footer class="modal-foot">
          <TNButton type="outline" @click="emit('close')">Отмена</TNButton>
          <TNButton type="action" :disabled="saving || title.trim() === ''" @click="submit">Создать</TNButton>
        </footer>
      </form>
    </TNPopup>
  </div>
</template>
