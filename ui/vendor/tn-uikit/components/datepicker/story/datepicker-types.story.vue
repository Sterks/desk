<template>
  <Story title="TNDatepicker/Типы" group="form" :layout="{ type: 'grid', width: '80%' }">
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
      <ControlFieldText
        v-model="state.defaultTime"
        title="defaultTime"
        field-type="`${number}:${number}`"
        desc='Время по умолчанию при первом выборе даты в формате "HH:mm" (работает в режиме time)'
      />
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
    <Variant id="main" title="TNDatepicker" auto-props-disabled>
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
    <Variant id="time" title="Выбор часов и минут" :init-state="() => ({ time: true, minuteStep: 5 })" auto-props-disabled>
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
    <Variant id="default-time" title="Время по умолчанию" :init-state="() => ({ time: true, defaultTime: '12:30' })" auto-props-disabled>
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
    <Variant id="time-confirm" title="Потверждение выбора времени" :init-state="() => ({ time: true, minuteStep: 5, confirm: true })" auto-props-disabled>
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
    <Variant id="year-range" title="Промежуток лет для выбора года" :init-state="() => ({ yearRange: '50' })" auto-props-disabled>
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
    <Variant id="locale" title="Локализация" :init-state="() => ({ time: true, locale: 'en' })" auto-props-disabled>
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
      id="custom-locale"
      title="Кастомная локализация"
      :init-state="
        () => ({
          time: true,
          customLocale: {
            monthLabelList: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            shortWeekdayLabels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
            doneButtonLabel: 'Erledigt'
          }
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
</script>

<style>
.__histoire-render-story:not(.__histoire-render-custom-controls) {
  overflow: unset;
}
</style>

<docs lang="md">
## Использование

Компонент может взаимодействовать силами v-model и задаёт значение в
виде объекта типа `Date`:

```vue
<TNDatepicker v-model="date" />
```

```js

const date: Date | null = null;
```

## Задание промежутка дат

Компонент поддерживает выбор промежутка дат с помощью параметра `range`.
В таком случае компонент возвращает массив с двумя объектами типа `Date`:
первый элемент массива это начало, второй - конец промежутка:

```vue
<TNDatepicker v-model="dateRange" range />
```

```js

const dateRange: Date[] | null = null;
```

## Указание времени

Для указания времени используется булевый параметр `time`:

```vue
<TNDatepicker v-model="dateWithTime" time />
```

Чтобы задать шаг выбора минут (0, 15, 30, 45) используется
параметр `minuteStep`:

```vue
<TNDatepicker v-model="dateWithTime" time :minute-step="15" />
```

Пока значение не выбрано, селекторы времени можно предзаполнить с помощью
параметра `defaultTime` в формате `"HH:mm"` — первый выбор даты сразу
вернёт дату с этим временем:

```vue
<TNDatepicker v-model="dateWithTime" time default-time="12:30" />
```

## Подтверждение выбора

По умолчанию при выборе даты календарь закрывается автоматически но для
некоторых случаев можно добавить кнопку подтверждения с помощью
артибута `confirm`.

Для выбора времени `time`:

```vue
<TNDatepicker v-model="dateWithTime" time confirm />
```

Для выбора промежутка дат `range`. Подтверждение выбора
только для мобильного пикера внутри боттом-щита:

```vue
<TNDatepicker v-model="dateRange" range confirm />
```
</docs>
