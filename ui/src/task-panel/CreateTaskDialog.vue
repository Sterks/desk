<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import TNInput from '@life_uikit/uikit/components/input/input.vue';
import TNFormItem from '@life_uikit/uikit/components/form-item/form-item.vue';
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
            <!-- Нативный <select>, не TNSelectV2 (у того триггер — <div> без role и клавиатуры), см. FieldInput.vue. -->
            <TNFormItem label="column" item-id="new-column">
              <select id="new-column" v-model="column" class="control">
                <option v-for="c in board.columns" :key="c.id" :value="c.id">{{ c.title }}</option>
              </select>
            </TNFormItem>
          </div>
          <FieldInput :def="ASSIGNEE_FIELD" :value="assignee || undefined" @update:value="(v) => (assignee = typeof v === 'string' ? v : '')" />
          <FieldInput v-for="f in board.fields" :key="f.id" :def="f" :value="fields[f.id] ?? undefined" @update:value="(v) => (fields = { ...fields, [f.id]: v })" />
          <div class="field-row">
            <!--
              TNTextarea (vendor) generates its own internal id and wires it to TextareaAutosize,
              but never forwards that id as `item-id` to TNFormItem — so TNFormItem's rendered
              `<label>` never gets a `for` attribute (unfixable from here: TNTextarea exposes no
              prop to override or read back that internal id, and passing extra attrs like
              `aria-label` externally would fall through to TNFormItem's own root `<div>`, not to
              the real `<textarea>`, since TNFormItem's slot content is not part of that fallthrough
              chain). Falling back to a plain, hand-labelled `<textarea>` (same fallback already used
              for `TNSearch` in FilterBar.vue) is the only way to get a real `for`/`id` pairing
              without touching vendor code. `.tn-form-item__label`/`.tn-textarea__textarea` are the
              kit's own global style classes (form-item.vue/textarea.vue), reused here only to keep
              the visual appearance identical to the TNTextarea-rendered markup.
            -->
            <label for="new-description" class="tn-form-item__label">description</label>
            <textarea id="new-description" v-model="description" rows="5" class="tn-textarea__textarea"></textarea>
          </div>
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <!--
          Primary action button is placed BEFORE Cancel in DOM order (footer still displays Cancel
          on the left visually via `.modal-foot`'s `flex-direction: row-reverse`, see panel.css).
          Reason: TNButton renders a plain `<button>` with no `type` attribute at all (see
          button.vue), so inside a `<form>` every TNButton is an implicit native `type="submit"`.
          Per the HTML implicit-submission algorithm, pressing Enter in a focused text field submits
          the form via the FIRST submit button in tree order — with Cancel first in the DOM (as it
          was before this fix), Enter fired Cancel's `@click` handler (`emit('close')`) instead of
          `submit()`, discarding the user's input. Reordering so "Создать" comes first in the DOM
          makes it the implicit-submit target, matching user expectation, while the CSS keeps the
          on-screen layout exactly as before.
        -->
        <footer class="modal-foot">
          <TNButton type="action" :disabled="saving || title.trim() === ''" @click="submit">Создать</TNButton>
          <TNButton type="outline" @click="emit('close')">Отмена</TNButton>
        </footer>
      </form>
    </TNPopup>
  </div>
</template>
