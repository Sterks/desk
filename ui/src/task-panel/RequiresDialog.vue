<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import TNButton from '@life_uikit/uikit/components/button/button.vue';
import TNPopup from '@life_uikit/uikit/components/popup/popup.vue';
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

// See the identical note in CreateTaskDialog.vue: TNPopup never stops its own Escape keydown from
// bubbling, and useDialogStack's `dialogsOpen` counter is racy against Vue's microtask-scheduled
// unmount (verified in a real browser) — stopping propagation here is the actual fix that keeps
// TaskPanel's window listener from also closing on the same Escape press.
function stopEscapeBubbling(e: KeyboardEvent): void {
  e.stopPropagation();
}

async function submit(): Promise<void> {
  if (!complete.value || saving.value) return;
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
  <div @keydown.esc="stopEscapeBubbling">
    <TNPopup
      is-visible
      :title="`${task.id} → ${target}`"
      subtitle="Этот переход требует заполнить поля."
      role="dialog"
      aria-modal="true"
      :aria-label="`${task.id} → ${target}`"
      @close="emit('cancel')"
    >
      <!-- Тот же приём, что и в CreateTaskDialog: форма не обрабатывает submit сама (у TNButton нет
           способа задать нативный HTML type, поэтому обе кнопки — implicit type=submit), действие
           запускает явный @click на кнопке "Перенести". -->
      <form @submit.prevent>
        <div class="fields-grid">
          <template v-for="id in missing" :key="id">
            <FieldInput v-if="fieldInfo(board, id)" :def="fieldInfo(board, id)!" :value="values[id] ?? undefined" @update:value="(v) => (values = { ...values, [id]: v })" />
          </template>
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <!--
          Primary action button placed BEFORE Cancel in DOM order — see the identical note in
          CreateTaskDialog.vue: TNButton has no native `type` attribute, so every TNButton inside a
          <form> is an implicit type="submit", and the HTML implicit-submission algorithm activates
          the FIRST submit button in tree order on Enter. With Cancel first (as it was before this
          fix), Enter in a focused field fired Cancel's handler instead of submitting. `.modal-foot`'s
          `flex-direction: row-reverse` (panel.css) keeps Cancel visually on the left, unchanged.
        -->
        <footer class="modal-foot">
          <TNButton type="action" :disabled="!complete || saving" @click="submit">Перенести</TNButton>
          <TNButton type="outline" @click="emit('cancel')">Отмена</TNButton>
        </footer>
      </form>
    </TNPopup>
  </div>
</template>
