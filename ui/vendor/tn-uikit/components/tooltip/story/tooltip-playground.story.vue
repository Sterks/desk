<template>
  <Story title="TNTooltip/Playground" group="data" :layout="{ type: 'grid', width: '40%' }">
    <template #controls="{ state }">
      <ControlFieldText v-model="state.nextButton" title="nextButton" field-type="string" default-value="" desc="Текст для кнопки 'Далее'" />
      <ControlFieldText v-model="state.previousButton" title="previousButton" field-type="string" default-value="" desc="Текст для кнопки 'Назад'" />
      <ControlFieldText v-model="state.currentStep" title="currentStep" field-type="string | number" default-value="" desc="Текущий шаг в тултипе" />
      <ControlFieldText v-model="state.totalSteps" title="totalSteps" field-type="string | number" default-value="" desc="Количество шагов в тултипе" />
      <ControlFieldText v-model="state.text" title="text" field-type="string" default-value="" desc="Текст в тултипе" />
      <ControlFieldBoolean
        v-model="state.showCloseButton"
        title="showCloseButton"
        field-type="boolean"
        default-value="false"
        desc="Видимость кнопки закрытия"
      />
      <ControlFieldBoolean v-model="state.light" title="light" field-type="boolean" default-value="false" desc="Светлая тема" />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="ITNPopoverPosition"
        default-value="bottom-left"
        desc="Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента"
      />
      <ControlFieldText
        v-model="state.customClass"
        title="customClass"
        field-type="string"
        default-value=""
        desc="Добавляет кастомный класс в контент тултипа"
      />
      <ControlFieldSelect
        v-model="state.arrowPosition"
        title="arrowPosition"
        field-type="ITNPopoverArrowPosition"
        desc="Позиционирование стрелки"
        :options="arrowOptions"
      />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места."
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldBoolean v-model="state.visible" title="visible" field-type="boolean" default-value="true" desc="Видимость тултипа" />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="IPopoverOptions" desc="Опции для всплывающего окна (popper-элемента)" />
      <ControlFieldBoolean
        v-model="state.oneLine"
        title="oneLine"
        field-type="boolean"
        default-value="false"
        desc="Текст в тултипе всегда будет однострочным"
      />
      <ControlFieldBoolean v-model="state.noScroll" title="noScroll" field-type="boolean" default-value="false" desc="Отключить скролл" />
      <ControlFieldUnavailable
        title="offset"
        field-type="number | { crossAxis?: number; mainAxis?: number }"
        default-value="{ mainAxis: 0, crossAxis: 0 }"
        desc="Настроить отступ всплывающего окна относительно триггер-элемента"
      />
    </template>
    <Variant title="Отображение кнопки закрытия" auto-props-disabled :init-state="() => ({ showCloseButton: true })">
      <template #default="{ state }">
        <div class="tooltip-wrapper">
          <TNTooltip
            v-bind="filterState(state)"
            @close="logEvent('close', { $event })"
            @next="(stepHandler(1), logEvent('next', { $event }))"
            @previous="(stepHandler(-1), logEvent('previous', { $event }))"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ut tortor purus. Phasellus tristique congue nisi non pharetra. Suspendisse
            congue.
          </TNTooltip>
        </div>
      </template>
    </Variant>
    <Variant title="Светлое оформление, индикатор шагов и кнопки" :init-state="() => ({ ...defaultStateObject, light: true })" auto-props-disabled>
      <template #default="{ state }">
        <div class="tooltip-wrapper">
          <TNTooltip
            v-bind="filterState(state)"
            @close="logEvent('close', { $event })"
            @next="(stepHandler(1), logEvent('next', { $event }))"
            @previous="(stepHandler(-1), logEvent('previous', { $event }))"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ut tortor purus. Phasellus tristique congue nisi non pharetra. Suspendisse
            congue.
          </TNTooltip>
        </div>
      </template>
    </Variant>
    <Variant
      title="Отображение стрелки, индикатор шагов и кнопки"
      :init-state="() => ({ ...defaultStateObject, arrowPosition: 'right-bottom' })"
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="tooltip-wrapper">
          <TNTooltip
            v-bind="filterState(state)"
            @close="logEvent('close', { $event })"
            @next="(stepHandler(1), logEvent('next', { $event }))"
            @previous="(stepHandler(-1), logEvent('previous', { $event }))"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ut tortor purus. Phasellus tristique congue nisi non pharetra. Suspendisse
            congue.
          </TNTooltip>
        </div>
      </template>
    </Variant>
    <Variant title="Отображение текста в одну строку и кнопки" :init-state="() => ({ oneLine: true })" auto-props-disabled>
      <template #default="{ state }">
        <div class="tooltip-wrapper">
          <TNTooltip
            v-bind="filterState(state)"
            @close="logEvent('close', { $event })"
            @next="(stepHandler(1), logEvent('next', { $event }))"
            @previous="(stepHandler(-1), logEvent('previous', { $event }))"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ut tortor purus. Phasellus tristique congue nisi non pharetra. Suspendisse
            congue.
          </TNTooltip>
        </div>
      </template>
    </Variant>

    <Variant title="Пример использования директивы тултипа" auto-props-disabled>
      <div style="margin-bottom: 20px">
        <TNButton v-tn-tooltip="'Отображение тултипа с помощью строки'"> Наведи на меня (String) </TNButton>
      </div>

      <div>
        <TNButton
          v-tn-tooltip="{
            text: 'Отображение тултипа с помощью объекта',
            position: 'right',
            light: true,
            indent: 20
          }"
        >
          Наведи на меня (Object)
        </TNButton>
      </div>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";
import vTnTooltip from "../directive";

const arrowOptions = [
  "top",
  "top-left",
  "top-right",
  "bottom",
  "bottom-left",
  "bottom-right",
  "left",
  "left-top",
  "left-bottom",
  "right",
  "right-top",
  "right-bottom"
];
const defaultStateObject = {
  currentStep: "1",
  totalSteps: "2",
  nextButton: "Далее",
  previousButton: "Назад"
};

const currentStep = ref<string | number>("1");

function stepHandler(step: number): void {
  currentStep.value = Number(currentStep.value) + step;
}
</script>

<style scoped>
.tooltip-wrapper {
  padding: 20px;
}
</style>

<docs lang="md">
## Стрелка

Компонент предусматривает отображение стрелочки с помощью параметра
`arrow-position`, значением которого является его положение.

доступные значения:

- top
- bottom
- left
- right
- top-left
- top-right
- bottom-left
- bottom-right
- right-top
- right-bottom
- left-top
- left-bottom

```vue
<TNTooltip arrow-position="bottom">
  Подсказка
</TNTooltip>
```
</docs>
