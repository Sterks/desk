<template>
  <Story title="TNDatepicker/Состояния" group="form" :layout="{ type: 'grid', width: '40%' }">
    <template #controls="{ state }">
      <ControlFieldSelect v-model="state.size" title="size" :options="['s', 'm']" default-value="m" field-type='"s" | "m"' desc="Размер компонента" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" desc="Отключение компонента" />
      <ControlFieldSelect
        v-model="state.locale"
        title="locale"
        :options="['ru', 'en']"
        field-type='"ru" | "en"'
        default-value="ru"
        desc="Выбор предустановленной локализации"
      />
      <ControlFieldText v-model="state.label" title="label" field-type="string" desc="Текст заголовка компонента" />
      <ControlFieldText v-model="state.description" title="description" field-type="string" desc="Текст описания компонента" />
      <ControlFieldBoolean v-model="state.time" title="time" field-type="boolean" desc="Возможность ввода времени для выбора даты" />
      <ControlFieldText v-model="state.minuteStep" title="minuteStep" default-value="1" field-type="number" desc="Шаг минут" />
      <ControlFieldBoolean v-model="state.confirm" title="confirm" field-type="boolean" desc="Включает ожидание потверждения при выборе даты" />
      <ControlFieldBoolean v-model="state.required" title="required" field-type="boolean" desc="Отображение звездочки после заголовка компонента - лейбла" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки (включает «error» стиль у компонента)" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения (включает «warning» стиль у компонента)" />
      <ControlFieldText v-model="state.success" title="success" field-type="string" desc="Текст успеха (включает «success» стиль у компонента)" />
      <ControlFieldText v-model="state.yearRange" title="yearRange" field-type="string | number" desc="Количество лет доступное для выбора" />
      <ControlFieldBoolean
        v-model="state.clearable"
        title="clearable"
        field-type="boolean"
        default-value="true"
        desc="Добавляет кнопку с крестиком для возможности очистить выбор"
      />
      <ControlFieldJson v-model="state.customLocale" title="customLocale" field-type="IDatepickerLocateConfig" desc="Ручная настройка локализации" />
      <ControlFieldText
        v-model="state.teleportTo"
        title="teleportTo"
        field-type="string"
        default-value="main"
        desc="Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева"
      />
      <ControlFieldBoolean
        v-model="state.isMobileMiniApp"
        title="isMobileMiniApp"
        field-type="boolean"
        desc="Передача одноименного параметра для боттом-щита"
      />
      <ControlFieldBoolean v-model="state.hideInput" title="hideInput" field-type="boolean" desc="Скрыть триггер-элемент инпут" />
      <ControlFieldBoolean v-model="state.showPicker" title="showPicker" field-type="boolean" desc="Показать всплывающее окно компонента" />
      <ControlFieldUnavailable title="disabledDates" field-type="Date[] | IDisableDates" default-value="[]" desc="Запрещенные для выбора даты" />
      <ControlFieldJson v-model="state.disabledHours" title="disabledHours" field-type="Number[]" default-value="[]" desc="Запрещенные для выбора часы" />
      <ControlFieldJson v-model="state.disabledMinutes" title="disabledMinutes" field-type="Number[]" default-value="[]" desc="Запрещенные для выбора минуты" />
      <ControlFieldText
        v-model="state.bottomSheetCustomClass"
        title="bottomSheetCustomClass"
        field-type="string"
        default-value=""
        desc="Задание кастомного класса для боттом-щита"
      />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="Placement"
        default-value="bottom-left"
        desc='Позиционирование всплывающего окна компонента относительно "триггер" элемента'
      />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места"
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="UseFloatingOptions" desc="Опции для всплывающего окна" />
      <ControlFieldBoolean
        v-model="state.smoothMessage"
        title="smoothMessage"
        field-type="boolean"
        desc="Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)"
      />
      <ControlFieldNumber v-model="state.maxYear" title="maxYear" field-type="string | number" desc="Ограничивает верхнее значение выбора года" />
    </template>
    <Variant
      id="state-param"
      title="Параметры текста состояний"
      auto-props-disabled
      :init-state="
        () => ({
          label: 'Datepicker label'
        })
      "
    >
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNDatepicker
            v-bind="filterState(state)"
            v-model="state.modelValue"
            error="Datepicker error"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
          <TNDatepicker
            v-bind="filterState(state)"
            v-model="state.modelValue"
            warn="Datepicker error"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
          <TNDatepicker
            v-bind="filterState(state)"
            v-model="state.modelValue"
            success="Datepicker success"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
        </div>
      </template>
    </Variant>
    <Variant id="disabled" title="Блокировка" :init-state="() => ({ disabled: true })" auto-props-disabled>
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
        </div>
      </template>
    </Variant>
    <Variant
      id="required"
      title="Обязательность"
      :init-state="
        () => ({
          label: 'Datepicker label',
          description: 'Datepicker description',
          required: true
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
        </div>
      </template>
    </Variant>

    <Variant
      id="slots"
      title="Использование слотов"
      :init-state="
        () => ({
          label: undefined
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          >
            <template #header>
              <div>Custom header</div>
            </template>
            <template #label>
              <h3>Custom label</h3>
            </template>
            <template #description>
              <span> Custom description</span>
            </template>
            <template #footer>
              <div>Custom footer</div>
            </template>
          </TNDatepicker>
        </div>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";
import TNDatepicker from "../datepicker.vue";

const now = new Date();

now.setHours(0);
now.setMinutes(0);
now.setSeconds(0);
now.setMilliseconds(0);

const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
</script>

<style>
.__histoire-render-story:not(.__histoire-render-custom-controls) {
  overflow: unset;
}
</style>

<docs lang="md">
## Datepicker disabled

Компонент `Datepicker` можно отключить с помощью параметра `disabled`.

## Datepicker required

Компонент `Datepicker` можно пометить обязательным с помощью параметра `required`.

## Параметры состояния

Состояние компонента `Datepicker` можно отображать с помощью параметров:

- `error` - параметр для отображения текста ошибки
- `warn` - параметр для отображения текста предупреждения
- `success` - параметр для отображения текста успеха
</docs>
