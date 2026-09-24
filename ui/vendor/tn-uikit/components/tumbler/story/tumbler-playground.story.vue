<template>
  <Story title="TNTumbler/Playground" group="form" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldBoolean v-model="state.modelValue" title="modelValue" field-type="boolean" desc="Значение value переменной для компонента" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" default-value="false" desc="Отключение элемента" />
      <ControlFieldBoolean v-model="state.block" title="block" field-type="boolean" default-value="false" desc="Элемент на всю ширину" />
      <ControlFieldSelect v-model="state.size" title="size" field-type="md | lg" default-value="md" desc="Размер компонента" :options="['md', 'lg']" />
      <ControlFieldText v-model="state.icon" title="icon" field-type="string" default-value="Тумблер" desc="Название иконки" />
      <ControlFieldText v-model="state.innerIcon" title="icon" field-type="string" default-value="Тумблер" desc="Название иконки" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" default-value="" desc="Текст ошибки (включает «error» стиль у компонента)" />
      <ControlFieldText
        v-model="state.warn"
        title="warn"
        field-type="string"
        default-value=""
        desc="Текст предупреждения (включает «warning» стиль у компонента)"
      />
      <ControlFieldText v-model="state.label" title="label" field-type="string" default-value="Тумблер" desc="Текст заголовка компонента" />
      <ControlFieldText v-model="state.description" title="description" field-type="string" default-value="" desc="Текст описания компонента" />
      <ControlFieldBoolean
        v-model="state.leftLabel"
        title="leftLabel"
        field-type="boolean"
        default-value="false"
        desc="Расположение лейбла слева от компонента"
      />
    </template>
    <Variant title="Лейбл" :init-state="() => ({ label: 'Тумблер' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant title="Иконка" :init-state="() => ({ label: 'Тумблер', icon: 'star' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          :icon="state.icon"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant title="Иконка внутри кружочка" :init-state="() => ({ label: 'Тумблер', innerIcon: 'star' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          :inner-icon="state.innerIcon"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant id="disabled" title="Блокировка" :init-state="() => ({ label: 'Тумблер', disabled: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant id="description" title="Описание" :init-state="() => ({ label: 'Тумблер', description: 'Описание' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant id="error" title="Текст ошибки" :init-state="() => ({ label: 'Тумблер', error: 'Описание ошибки' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant id="warn" title="Текст предупреждения" :init-state="() => ({ label: 'Тумблер', warn: 'Описание предупреждения' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant id="block" title="Отображение как блок" :init-state="() => ({ label: 'Тумблер', block: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant id="left-label" title="Отображение лейбла слева" :init-state="() => ({ label: 'Тумблер', leftLabel: true })">
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
    <Variant title="Задание размера" :init-state="() => ({ label: 'Тумблер', size: 'lg' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTumbler
          v-model="state.modelValue"
          :label="state.label"
          :disabled="state.disabled"
          :block="state.block"
          :description="state.description"
          :error="state.error"
          :warn="state.warn"
          :left-label="state.leftLabel"
          :size="state.size"
          @update:model-value="logEvent('update:modelValue', { $event })"
        />
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import { logEvent } from "histoire/client";
</script>

<docs lang="md">
[Документация](./tumbler.story.md)
</docs>
