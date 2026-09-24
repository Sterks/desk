<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from 'vue';
import TNInput from '@life_uikit/uikit/components/input/input.vue';
import TNFormItem from '@life_uikit/uikit/components/form-item/form-item.vue';
import type { FieldInfo, FieldValue } from '../api/types';
import { readNumberInput } from '../lib/fields';

const props = defineProps<{ def: FieldInfo; value: FieldValue | undefined | null }>();
const emit = defineEmits<{
  'update:value': [FieldValue | null];
  /** Текст поля сейчас нельзя сохранить (только number): форма должна заблокировать сохранение. */
  invalid: [boolean];
}>();

const textValue = computed(() => (typeof props.value === 'string' ? props.value : ''));
const boolValue = computed(() => props.value === true);
const listValue = computed(() => (Array.isArray(props.value) ? props.value : []));
const orNull = (text: string): string | null => (text === '' ? null : text);
// useId: окно requires открывается поверх панели с теми же полями — id не должны совпадать.
const selectId = `field-${props.def.id}-${useId()}`;
const checkboxId = `field-${props.def.id}-${useId()}`;
const textareaId = `field-${props.def.id}-${useId()}`;

/*
 * number: TNInput — это `<input type="text">`, браузер не отсеивает `1,5`, `-` или `5x`. Поэтому
 * сырой текст живёт здесь, а наружу уходит только то, что readNumberInput признал: конечное число
 * или `null` для пустой строки («очистить поле»). Невалидный текст НЕ эмитится вовсе — раньше он
 * становился NaN, NaN сериализовался в JSON как null, и сохранение молча стирало значение. Вместо
 * этого поле показывает ошибку, а форма через событие `invalid` блокирует сохранение.
 */
const numberToText = (v: FieldValue | undefined | null): string => (typeof v === 'number' ? String(v) : '');
const numberText = ref(numberToText(props.value));
const numberInvalid = computed(() => props.def.type === 'number' && !readNumberInput(numberText.value).ok);
// Новое значение пришло снаружи (сохранение, свежая версия задачи): текст синхронизируется, если
// он валиден и означает другое число. Невалидный текст человека не затираем — ошибка остаётся видна.
watch(
  () => props.value,
  (v) => {
    const current = readNumberInput(numberText.value);
    const incoming = typeof v === 'number' ? v : null;
    if (current.ok && current.value !== incoming) numberText.value = numberToText(v);
  },
);
watch(numberInvalid, (isInvalid) => emit('invalid', isInvalid));
onUnmounted(() => {
  if (numberInvalid.value) emit('invalid', false);
});

function onNumberInput(text: string): void {
  numberText.value = text;
  const parsed = readNumberInput(text);
  if (parsed.ok) emit('update:value', parsed.value);
}

function toggleMultiValue(v: string, checked: boolean): void {
  const next = checked ? [...listValue.value, v] : listValue.value.filter((x) => x !== v);
  emit('update:value', next.length > 0 ? next : null);
}
</script>

<template>
  <!-- :label="def.id" ниже TNFormItem/TNInput рендерит через v-html. Безопасно только потому, что id
       поля — не пользовательский текст: board-schema.ts (src/core) пропускает лишь ^[a-z][a-z0-9_]*$.
       Ослабите это правило — замените label на слот #label с текстовой интерполяцией. -->
  <div class="field-row">
    <!-- enum — нативный <select> внутри TNFormItem (тот же лейбл/описание/звёздочка, что у TNInput),
         а не TNSelectV2: у TNSelectV2 триггер — <div> с click-обработчиком, без role, tabindex и
         клавиатуры (select_v2-control.vue), поле недоступно ни с клавиатуры, ни скринридеру.
         item-id связывает <label for> TNFormItem с этим <select>. Пустой вариант «—» = очистить поле. -->
    <TNFormItem
      v-if="def.type === 'enum'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :item-id="selectId"
    >
      <select
        :id="selectId"
        class="control"
        :value="textValue"
        @change="emit('update:value', orNull(($event.target as HTMLSelectElement).value))"
      >
        <option value="">—</option>
        <option v-for="v in def.values ?? []" :key="v" :value="v">{{ v }}</option>
      </select>
    </TNFormItem>
    <!-- multi_enum — нативный `<fieldset>`+`<legend>` вместо TNMultiSelector: тот рисует триггер и
         список вариантов на голых `<div>`/`<li>` с click-обработчиками (multiselect.vue), без role,
         tabindex и клавиатуры — поле было полностью недоступно с клавиатуры и скринридеру (R6).
         `<legend>`, а не TNFormItem's `label[for]`, потому что `for` требует «labelable» цели
         (input/select/textarea/…) — fieldset в этот список не входит, и внешний `<label for>` на нём
         не создал бы у ассистивных технологий связь группы с именем; `<legend>` — единственный
         элемент, который HTML/ARIA признают названием fieldset-группы. Пустой массив = очистить поле. -->
    <fieldset v-else-if="def.type === 'multi_enum'" class="field-fieldset">
      <legend class="field-legend">
        {{ def.id }}<span v-if="def.required" class="field-required" aria-label="обязательное"> *</span>
      </legend>
      <p v-if="def.guide" class="field-guide-inline">{{ def.guide }}</p>
      <div class="checkbox-list">
        <label v-for="v in def.values ?? []" :key="v" class="checkbox-item">
          <input
            type="checkbox"
            class="checkbox-control"
            :value="v"
            :checked="listValue.includes(v)"
            @change="toggleMultiValue(v, ($event.target as HTMLInputElement).checked)"
          />
          {{ v }}
        </label>
      </div>
    </fieldset>
    <!-- bool — нативный `<input type="checkbox">` вместо TNCheckbox: тот кит рисует `<button
         type="button">` с классами, отражающими состояние только визуально (checkbox.vue) — ни
         role="checkbox", ни aria-checked, ни нативной семантики чекбокса, так что ассистивные
         технологии не видят его состояние (R6). item-id связывает TNFormItem's `<label for>` с этим
         `<input>`, как у enum-поля выше — input входит в число labelable-элементов, association
         работает штатно. -->
    <TNFormItem
      v-else-if="def.type === 'bool'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :item-id="checkboxId"
    >
      <input
        :id="checkboxId"
        type="checkbox"
        class="checkbox-control"
        :checked="boolValue"
        @change="emit('update:value', ($event.target as HTMLInputElement).checked)"
      />
    </TNFormItem>
    <TNInput
      v-else-if="def.type === 'number'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      numeric-keyboard="decimal"
      :error="numberInvalid ? 'Не число. Дробную часть отделяйте точкой: 1.5' : undefined"
      :model-value="numberText"
      @update:model-value="onNumberInput"
    />
    <!-- text — нативный `<textarea>` внутри TNFormItem с item-id, а не TNTextarea: тот генерирует
         свой id, но не передаёт его в TNFormItem как item-id, и `<label>` остаётся без `for` (поле без
         доступного имени). Та же замена, что для description в CreateTaskDialog.vue: тот же
         `<label for class="tn-form-item__label">` + `<textarea id class="tn-textarea__textarea">`, только
         label рисует TNFormItem — чтобы у поля остались guide и звёздочка required, как у enum/bool выше. -->
    <TNFormItem
      v-else-if="def.type === 'text'"
      :label="def.id"
      :description="def.guide ?? undefined"
      :required="def.required"
      :item-id="textareaId"
    >
      <textarea
        :id="textareaId"
        class="tn-textarea__textarea"
        rows="4"
        :value="textValue"
        @input="emit('update:value', orNull(($event.target as HTMLTextAreaElement).value))"
      ></textarea>
    </TNFormItem>
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
