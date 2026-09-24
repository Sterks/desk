<template>
  <Story title="TNSelectorV2/Playground" group="form" :layout="{ type: 'grid', width: '30%' }">
    <template #controls="{ state }">
      <ControlFieldSelect v-model="state.size" title="size" field-type="'s' | 'm'" default-value="m" desc="Размер компонента" :options="['s', 'm']" />
      <ControlFieldJson v-model="state.modelValue" title="modelValue" field-type="TOption | TOption[valueKey]" desc="Значение компонента" />
      <ControlFieldJson v-model="state.options" title="options" field-type="TOption[]" default-value="[]" desc="Массив опций для выбора" />
      <ControlFieldText v-model="state.label" title="label" field-type="string" default-value="" desc="Текст заголовка компонента" />
      <ControlFieldText v-model="state.description" title="description" field-type="string" default-value="" desc="Текст описания компонента" />
      <ControlFieldText v-model="state.placeholder" title="placeholder" field-type="string" default-value="" desc="Текст-заглушка, когда ничего не выбрано" />
      <ControlFieldText v-model="state.labelKey" title="labelKey" field-type="string" default-value="title" desc="Поле опции для отображаемого текста" />
      <ControlFieldText v-model="state.valueKey" title="valueKey" field-type="string" desc="Поле опции, значение которого попадает в modelValue" />
      <ControlFieldText v-model="state.disabledKey" title="disabledKey" field-type="string" default-value="disabled" desc="Поле-признак недоступной опции" />
      <ControlFieldBoolean v-model="state.searchable" title="searchable" field-type="boolean" desc="Включение поисковой строки" />
      <ControlFieldBoolean
        v-model="state.localFilter"
        title="localFilter"
        field-type="boolean"
        default-value="true"
        desc="Фильтровать опции внутри компонента"
      />
      <ControlFieldText
        v-model="state.searchPlaceholder"
        title="searchPlaceholder"
        field-type="string"
        default-value="Искать"
        desc="Placeholder поисковой строки"
      />
      <ControlFieldBoolean v-model="state.searchFocus" title="searchFocus" field-type="boolean" desc="Фокус на поиск при открытии" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" default-value="false" desc="Отключение компонента" />
      <ControlFieldBoolean v-model="state.clearable" title="clearable" field-type="boolean" default-value="true" desc="Кнопка очистки значения" />
      <ControlFieldBoolean v-model="state.isLoading" title="isLoading" field-type="boolean" default-value="false" desc="Состояние загрузки списка" />
      <ControlFieldText
        v-model="state.emptyListHint"
        title="emptyListHint"
        field-type="string"
        default-value="Нет данных"
        desc="Подсказка для пустого списка опций"
      />
      <ControlFieldText v-model="state.notFoundHint" title="notFoundHint" field-type="string" desc="Подсказка, когда по запросу ничего не найдено" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки (включает «error» стиль)" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения (включает «warning» стиль)" />
      <ControlFieldText v-model="state.success" title="success" field-type="string" desc="Текст успеха (включает «success» стиль)" />
      <ControlFieldBoolean v-model="state.required" title="required" field-type="boolean" default-value="false" desc="Выводит звездочку после заголовка" />
    </template>

    <Variant id="main" title="TNSelectorV2" :init-state="() => ({ ...selectDefaultState })" auto-props-disabled>
      <template #default="{ state }">
        <div class="selector-wrapper">
          <TNSelectV2
            v-model="state.modelValue"
            v-bind="filterState(state)"
            @select:open="logEvent('select:open', { $event })"
            @select:close="logEvent('select:close', { $event })"
            @search:update="logEvent('search:update', { $event })"
            @update:model-value="logEvent('update:modelValue', { $event })"
          />
          <p style="margin-top: 12px">modelValue: {{ JSON.stringify(state.modelValue) }}</p>
        </div>
      </template>
    </Variant>

    <Variant id="value-key" title="С valueKey (в modelValue уходит id)" :init-state="() => ({ ...selectDefaultState, valueKey: 'id' })" auto-props-disabled>
      <template #default="{ state }">
        <div class="selector-wrapper">
          <TNSelectV2 v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
          <p style="margin-top: 12px">modelValue: {{ JSON.stringify(state.modelValue) }}</p>
        </div>
      </template>
    </Variant>

    <Variant id="slots" title="Кастомные слоты value / option" :init-state="() => ({ ...selectDefaultState, searchable: true })" auto-props-disabled>
      <template #default="{ state }">
        <div class="selector-wrapper">
          <TNSelectV2 v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })">
            <template #value="{ option }">
              <strong class="custom-option">★ {{ option?.title }}</strong>
            </template>
            <template #option="{ label, isSelected, isDisabled }">
              <TNIcon v-if="isSelected" name="check-light" />
              <span class="custom-option" :class="{ 'custom-option_selected': isSelected, 'custom-option_disabled': isDisabled }">{{ label }}</span>
            </template>
          </TNSelectV2>
          <p style="margin-top: 12px">modelValue: {{ JSON.stringify(state.modelValue) }}</p>
        </div>
      </template>
    </Variant>

    <Variant
      id="string-options"
      title="Простой массив строк"
      :init-state="() => ({ modelValue: undefined, options: stringOptions, label: 'Город', placeholder: 'Выберите город', searchable: true, clearable: true })"
      auto-props-disabled
    >
      <template #default="{ state }">
        <div class="selector-wrapper">
          <TNSelectV2 v-model="state.modelValue" v-bind="filterState(state)" @update:model-value="logEvent('update:modelValue', { $event })" />
          <p style="margin-top: 12px">modelValue: {{ JSON.stringify(state.modelValue) }}</p>
        </div>
      </template>
    </Variant>

    <Variant id="external-search" title="Внешний поиск (запрос на бек)" auto-props-disabled>
      <template #default>
        <div class="selector-wrapper">
          <TNSelectV2
            v-model="externalModel"
            :options="externalOptions"
            :is-loading="externalLoading"
            :local-filter="false"
            id-key="id"
            searchable
            search-focus
            :search-debounce="300"
            label="Город"
            placeholder="Начните вводить название"
            search-placeholder="Введите минимум 2 символа"
            :empty-list-hint="externalHint"
            @search:update="handleExternalSearch"
            @update:model-value="logEvent('update:modelValue', { $event })"
          />
          <p style="margin-top: 12px">modelValue: {{ JSON.stringify(externalModel) }}</p>
        </div>
      </template>
    </Variant>

    <Variant id="expose" title="Управление через ref (defineExpose)" auto-props-disabled>
      <template #default>
        <div class="selector-wrapper">
          <!-- Кнопки над селектом, чтобы раскрытый список их не перекрывал. -->
          <div class="expose-actions">
            <TNButton type="outline" @click="selectRef?.open()">open()</TNButton>
            <TNButton type="outline" @click="selectRef?.close()">close()</TNButton>
            <TNButton type="outline" @click="selectRef?.toggle()">toggle()</TNButton>
            <TNButton type="outline" @click="selectRef?.clearSearch()">clearSearch()</TNButton>
          </div>
          <p class="expose-state">isOpen: {{ selectRef?.isOpen }}</p>
          <TNSelectV2
            ref="selectRef"
            v-model="exposeModel"
            :options="options"
            id-key="id"
            searchable
            label="Город"
            placeholder="Выберите город"
            @select:open="logEvent('select:open', { $event })"
            @select:close="logEvent('select:close', { $event })"
            @search:update="logEvent('search:update', { $event })"
          />
          <!-- Запас высоты под раскрытый список: иначе popover в тесной карточке Histoire перевернётся вверх и накроет кнопки. -->
          <div class="expose-spacer" />
        </div>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import TNSelectV2 from "../select_v2.vue";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import TNIcon from "../../icons/icon.vue";
import TNButton from "../../button/button.vue";
import type { TNSelectV2Expose } from "../select_v2.types";

interface Option {
  id: number;
  title: string;
  disabled?: boolean;
}

const options: Option[] = [
  { id: 1, title: "Москва" },
  { id: 2, title: "Санкт-Петербург" },
  { id: 3, title: "Новосибирск" },
  { id: 4, title: "Екатеринбург", disabled: true },
  { id: 5, title: "Казань" }
];

const stringOptions: string[] = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"];

const selectDefaultState = {
  modelValue: undefined,
  options,
  label: "Город",
  placeholder: "Выберите город",
  searchable: true,
  clearable: true
};

// --- Вариант с внешним (серверным) поиском ---
// "База на беке": список, по которому имитируем поиск.
const citiesDatabase: Option[] = [
  { id: 1, title: "Москва" },
  { id: 2, title: "Санкт-Петербург" },
  { id: 3, title: "Новосибирск" },
  { id: 4, title: "Екатеринбург" },
  { id: 5, title: "Казань" },
  { id: 6, title: "Нижний Новгород" },
  { id: 7, title: "Челябинск" },
  { id: 8, title: "Самара" },
  { id: 9, title: "Омск" },
  { id: 10, title: "Ростов-на-Дону" },
  { id: 11, title: "Уфа" },
  { id: 12, title: "Красноярск" },
  { id: 13, title: "Воронеж" },
  { id: 14, title: "Волгоград" },
  { id: 15, title: "Краснодар" }
];

const externalModel = ref<Option>();
const externalOptions = ref<Option[]>([]);
const externalLoading = ref<boolean>(false);
const externalHint = ref<string>("Введите минимум 2 символа для поиска");
let searchTimer: ReturnType<typeof setTimeout> | undefined;

// Имитация запроса на бек: пока пользователь не ищет — список пуст; ответ наполняет options.
const handleExternalSearch = (query: string) => {
  logEvent("search:update", { query });
  clearTimeout(searchTimer);

  const search = query.trim().toLowerCase();
  if (search.length < 2) {
    externalOptions.value = [];
    externalLoading.value = false;
    externalHint.value = "Введите минимум 2 символа для поиска";
    return;
  }

  externalLoading.value = true;
  externalHint.value = "";

  // Задержка ответа "сервера".
  searchTimer = setTimeout(() => {
    externalOptions.value = citiesDatabase.filter(city => city.title.toLowerCase().includes(search));
    externalLoading.value = false;
    externalHint.value = "Ничего не найдено";
  }, 700);
};

const selectRef = ref<TNSelectV2Expose | null>(null);
const exposeModel = ref<Option>();
</script>

<style scoped>
.custom-option {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-option_selected {
  color: var(--content-accent-enabled);
}

.custom-option_disabled {
  text-decoration: line-through;
}

.expose-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.expose-state {
  margin: 12px 0 16px;
}

.expose-spacer {
  height: 260px;
}
</style>

<docs lang="md">
[Документация](./select_v2.story.md)
</docs>
