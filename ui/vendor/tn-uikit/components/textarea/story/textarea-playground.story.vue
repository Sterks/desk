<template>
  <Story title="TNTextarea/Playground" group="form" :layout="{ type: 'grid', width: '80%' }">
    <template #controls="{ state }">
      <ControlFieldText v-model="state.label" title="modelValue" field-type="string" desc="Значение value переменной для компонента" />
      <ControlFieldText v-model="state.label" title="label" field-type="string" desc="Заголовок компонента" />
      <ControlFieldBoolean v-model="state.required" title="required" field-type="boolean" desc="Выводит звездочку после заголовка компонента - лейбла" />
      <ControlFieldText v-model="state.description" title="description" field-type="string" desc="Текст описания компонента" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения (включает «warning» стиль у компонента)" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки (включает «error» стиль у компонента)" />
      <ControlFieldText
        v-model="state.success"
        title="success"
        field-type="string"
        default-value=""
        desc="Текст успеха (включает «success» стиль у компонента)"
      />
      <ControlFieldText v-model="state.placeholder" title="placeholder" field-type="string" default-value="" desc="Плейсхолдер" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" desc="Делает компонент доступным только для чтения" />
      <ControlFieldBoolean v-model="state.readonly" title="readonly" field-type="boolean" desc="Делает компонент доступным только для чтения" />
      <ControlFieldText v-model="state.textareaClass" title="textareaClass" field-type="string" default-value="" desc="Кастомный класс для тега textarea" />
      <ControlFieldNumber v-model="state.rows" title="rows" field-type="number" desc="Минимальное количество строк компонента" default-value="2" />
      <ControlFieldNumber v-model="state.minHeight" title="minHeight" field-type="number" desc="Минимальная высота компонента" default-value="68" />
      <ControlFieldNumber v-model="state.maxHeight" title="maxHeight" field-type="number" desc="Максимальная высота компонента" default-value="248" />
      <ControlFieldBoolean
        v-model="state.smoothMessage"
        title="smoothMessage"
        field-type="boolean"
        desc="Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)"
      />
    </template>
    <Variant id="main" title="TNTextarea" :init-state="() => textAreaDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant title="Описание" :init-state="() => ({ ...textAreaDefaultState, description: 'Description' })" auto-props-disabled>
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant title="Блокировка" :init-state="() => ({ ...textAreaDefaultState, disabled: true })" auto-props-disabled>
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant
      id="class"
      title="Кастомный класс"
      :init-state="
        () => ({
          ...textAreaDefaultState,
          textareaClass: 'my-custom-textarea-class'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant
      id="appearance"
      title="Задание внешнего вида"
      :init-state="
        () => ({
          vModel: 'text',
          label: 'Заголовок компонента',
          description: 'Описание компонента',
          placeholder: 'Плейсхолдер',
          disabled: 'isDisabled',
          required: true,
          rows: 1,
          minHeight: '48',
          maxHeight: '128'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" v-bind="filterState(state)" />
      </template>
    </Variant>
    <Variant id="state-param" title="Параметры состояния">
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" success="Успешно" />
        <br />
        <TNTextarea v-model="state.modelValue" warn="Возможно появление ошибки" />
        <br />
        <TNTextarea v-model="state.modelValue" error="Ошибка исполнения" />
      </template>
    </Variant>
    <Variant
      id="slot"
      title="Доступные слоты"
      :init-state="
        () => ({
          vModel: 'text'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNTextarea v-model="state.modelValue" v-bind="filterState(state)">
          <template #label>
            <span>Кастомный заголовок компонента</span>
          </template>
          <template #description>
            <span>Кастомное описание компонента</span>
          </template>
          <template #header>
            <TNCard> ... // Кастомное наполнение хедера </TNCard>
          </template>
          <template #footer>
            <TNCard> ... // Кастомное наполнение футера </TNCard>
          </template>
        </TNTextarea>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import { filterState } from "../../../consts/consts";
import TNTextarea from "../textarea.vue";
import TNCard from "../../card/card.vue";

const textAreaDefaultState = {
  modelValue: "Textarea",
  label: "Textarea Label",
  placeholder: "Textarea placeholder"
};
</script>

<style>
.my-custom-textarea-class {
  background-color: aquamarine;
}
</style>

<docs lang="md">
[Документация](./textarea.story.md)
</docs>
