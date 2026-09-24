<template>
  <Story title="TNDatepicker/Диапозон" group="form" :layout="{ type: 'grid', width: '80%' }">
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
      <ControlFieldText v-model="state.minuteStep" title="minuteStep" default-value="1" field-type="number" desc="Шаг минут" />
      <ControlFieldText
        v-model="state.maxDaysRange"
        title="maxDaysRange"
        default-value="0"
        field-type="string | number"
        desc="Максимальная длина диапазона в днях"
      />
      <ControlFieldBoolean v-model="state.confirm" title="confirm" field-type="boolean" desc="Включает ожидание подтверждения выбора" />
      <ControlFieldBoolean v-model="state.required" title="required" field-type="boolean" desc="Отображение звездочки после заголовка компонента" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения" />
      <ControlFieldText v-model="state.success" title="success" field-type="string" desc="Текст успеха" />
      <ControlFieldText v-model="state.yearRange" title="yearRange" field-type="string | number" desc="Количество лет доступное для выбора" />
      <ControlFieldBoolean v-model="state.clearable" title="clearable" field-type="boolean" default-value="true" desc="Добавляет кнопку очистки выбора" />
      <ControlFieldJson v-model="state.customLocale" title="customLocale" field-type="IDatepickerLocateConfig" desc="Ручная настройка локализации" />
      <ControlFieldText v-model="state.teleportTo" title="teleportTo" field-type="string" default-value="main" desc="Контейнер для teleport" />
      <ControlFieldBoolean
        v-model="state.isMobileMiniApp"
        title="isMobileMiniApp"
        field-type="boolean"
        desc="Передача одноименного параметра для bottom-sheet"
      />
      <ControlFieldBoolean v-model="state.hideInput" title="hideInput" field-type="boolean" desc="Скрыть trigger-элемент инпут" />
      <ControlFieldBoolean v-model="state.showPicker" title="showPicker" field-type="boolean" desc="Показать всплывающее окно компонента" />
      <ControlFieldUnavailable title="disabledDates" field-type="Date[] | IDisableDates" default-value="[]" desc="Запрещенные для выбора даты" />
      <ControlFieldJson v-model="state.disabledHours" title="disabledHours" field-type="Number[]" default-value="[]" desc="Запрещенные для выбора часы" />
      <ControlFieldText
        v-model="state.bottomSheetCustomClass"
        title="bottomSheetCustomClass"
        field-type="string"
        default-value=""
        desc="Кастомный класс для bottom-sheet"
      />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="Placement"
        default-value="bottom-left"
        desc="Позиционирование всплывающего окна относительно trigger-элемента"
      />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Менять сторону отображения, если не хватает места"
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="UseFloatingOptions" desc="Опции для всплывающего окна" />
      <ControlFieldBoolean v-model="state.smoothMessage" title="smoothMessage" field-type="boolean" desc="Добавляет плавное появление текста состояния" />
    </template>

    <Variant id="main" title="TNRangeDatepicker" :init-state="() => ({ ...defaultState })" auto-props-disabled>
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNRangeDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
          <pre class="datepicker-modelValue">modelValue: {{ state.modelValue }}</pre>
        </div>
      </template>
    </Variant>

    <Variant id="max-days-range" title="Ограничение длины диапазона" :init-state="() => ({ ...defaultState, maxDaysRange: 5 })" auto-props-disabled>
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNRangeDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
          <pre class="datepicker-modelValue">modelValue: {{ state.modelValue }}</pre>
        </div>
      </template>
    </Variant>

    <Variant id="locale" title="Локализация" :init-state="() => ({ ...defaultState, locale: 'en' })" auto-props-disabled>
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNRangeDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
        </div>
        <pre class="datepicker-modelValue">modelValue: {{ state.modelValue }}</pre>
      </template>
    </Variant>

    <Variant
      id="custom-locale"
      title="Кастомная локализация"
      :init-state="
        () => ({
          ...defaultState,
          customLocale: {
            monthLabelList: ['Januar', 'Februar', 'Marz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            shortWeekdayLabels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
            doneButtonLabel: 'Erledigt'
          }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNRangeDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
        </div>
        <pre class="datepicker-modelValue">modelValue: {{ state.modelValue }}</pre>
      </template>
    </Variant>

    <Variant id="disabled-dates" title="Блокировка дат" :init-state="() => ({ ...defaultState, maxDaysRange: 7 })" auto-props-disabled>
      <template #default="{ state }">
        <div class="datepicker-wrapper">
          <TNRangeDatepicker
            v-model="state.modelValue"
            v-bind="filterState(state)"
            :disabled-dates="disabledDates"
            @update:model-value="logEvent('update:modelValue', { $event })"
            @close="logEvent('close', { $event })"
            @open="logEvent('open', { $event })"
          />
        </div>
        <pre class="datepicker-modelValue">modelValue: {{ state.modelValue }}</pre>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldUnavailable from "../../../.histoire/components/controls/control-field-unavailable/control-field-unavailable.vue";
import TNRangeDatepicker from "../range-datepicker.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";

const defaultState = {
  clearable: true,
  locale: "ru",
  minuteStep: 1,
  maxDaysRange: 0,
  popperOptions: { strategy: "fixed" }
};

const disabledDates = (date: Date): boolean => {
  const weekDay = date.getDay();
  return [0, 6].includes(weekDay);
};
</script>

<style scoped>
.datepicker-modelValue {
  margin: 0.5rem 0;
  font-family: monospace;
}
</style>
