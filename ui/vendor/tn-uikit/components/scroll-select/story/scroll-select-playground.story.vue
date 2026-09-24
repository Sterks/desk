<template>
  <Story title="TNScrollSelect/Playground" group="form" :layout="{ type: 'grid', width: '60%' }">
    <template #controls="{ state }">
      <ControlFieldSelect v-model="state.size" title="size" field-type="'s' | 'm'" default-value="m" desc="Размер компонента" :options="['s', 'm']" />
      <ControlFieldBoolean v-model="state.searchable" title="searchable" field-type="boolean" desc="Включение поисковой строки" />
      <ControlFieldText
        v-model="state.searchPlaceholder"
        title="searchPlaceholder"
        field-type="string"
        default-value="Искать"
        desc="Placeholder для поисковой строки"
      />
      <ControlFieldText v-model="state.placeholder" title="placeholder" field-type="string" default-value="" desc="Placeholder для поля TNScrollSelect" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" default-value="false" desc="Отключение компонента" />
      <ControlFieldBoolean
        v-model="state.clearable"
        title="clearable"
        field-type="boolean"
        default-value="true"
        desc="Функционал очистки содержимого по кнопке"
      />
      <ControlFieldText v-model="state.description" title="description" field-type="string" default-value="" desc="Текст для описания компонента" />
      <ControlFieldText v-model="state.label" title="label" field-type="string" default-value="" desc="Текст для заголовка компонента" />
      <ControlFieldText v-model="state.searchQuery" title="searchQuery" field-type="string" default-value="" desc="Текст из поисковой строки" />
      <ControlFieldJson v-model="state.options" title="options" field-type="TNScrollSelectOption[]" default-value="[]" desc="Массив опций для селектора" />
      <ControlFieldJson
        v-model="state.modelValue"
        title="modelValue"
        field-type="(string | number)[]"
        default-value="[]"
        desc="Значение value переменной для компонента"
      />
      <ControlFieldBoolean v-model="state.isLoading" title="isLoading" field-type="boolean" default-value="false" desc="Состояние загрузки компонента" />
      <ControlFieldBoolean
        v-model="state.required"
        title="required"
        field-type="boolean"
        default-value="false"
        desc="Выводит звездочку после заголовка компонента - лейбла"
      />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки (включает «error» стиль у компонента)" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения (включает «warning» стиль у компонента)" />
      <ControlFieldText v-model="state.success" title="success" field-type="string" desc="Текст успеха (включает «success» стиль у компонента)" />
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
        default-value="false"
        desc="Передача одноименного параметра для боттом-щита"
      />
      <ControlFieldText v-model="state.emptyListHint" title="emptyListHint" field-type="string" desc="Подсказка для пустого списка опций выбора" />
      <ControlFieldBoolean
        v-model="state.scrollSelectedIntoView"
        title="scrollSelectedIntoView"
        field-type="boolean"
        default-value="false"
        desc="Включение функционала скролла к выбранным опциям"
      />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="Placement"
        default-value="bottom-left"
        desc="Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента"
      />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места"
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldJson
        v-model="state.popperOptions"
        title="popperOptions"
        field-type="UseFloatingOptions"
        desc="Опции для всплывающего окна (popper-элемента)"
      />
      <ControlFieldNumber v-model="state.maxHeight" title="maxHeight" field-type="Number | String" default-value="96" desc="Максимальная высота компонента" />
      <ControlFieldBoolean
        v-model="state.deletableChips"
        title="deletableChips"
        field-type="boolean"
        default-value="true"
        desc="Опция удаления чипса (рисует крест рядом в чипсе)"
      />
      <ControlFieldBoolean
        v-model="state.bottomSheetCustomClass"
        title="bottomSheetCustomClass"
        field-type="string"
        desc="Кастомный класс для компонента TNBottomSheet"
      />
    </template>
    <Variant id="main" title="Использование TNScrollSelect" auto-props-disabled>
      <template #default="{ state }">
        <TNScrollSelect
          v-model="selectedOption"
          :options="selectorOptions"
          :popper-options="{
            strategy: 'fixed'
          }"
          v-bind="filterState(state)"
          @update:model-value="
            selectedOption = $event;
            logEvent('update:modelValue', { $event });
          "
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="logEvent('searchHandler', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="search" title="Поиск по опциям" auto-props-disabled>
      <template #default="{ state }">
        <TNScrollSelect
          :model-value="selectedOption"
          :options="selectorOptions"
          :search-query="searchQuery"
          :is-loading="isDataLoading"
          searchable
          :popper-options="{
            strategy: 'fixed'
          }"
          search-placeholder="Найти дополнительные опции"
          v-bind="filterState(state)"
          @update:model-value="
            selectedOption = $event;
            logEvent('update:modelValue', { $event });
          "
          @search-handler="(handleSearch($event), logEvent('searchHandler', { $event }))"
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="height" title="Ограничение высоты компонента" auto-props-disabled>
      <template #default="{ state }">
        <TNScrollSelect
          :model-value="selectedOption"
          :options="selectorOptions"
          max-height="120"
          :popper-options="{
            strategy: 'fixed'
          }"
          v-bind="filterState(state)"
          @update:model-value="
            selectedOption = $event;
            logEvent('update:modelValue', { $event });
          "
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="(handleSearch($event), logEvent('searchHandler', { $event }))"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="delete" title="Удаление элемента" auto-props-disabled>
      <template #default="{ state }">
        <TNScrollSelect
          :model-value="selectedOption"
          :options="selectorOptions"
          :deletable-chips="false"
          :popper-options="{
            strategy: 'fixed'
          }"
          v-bind="filterState(state)"
          @update:model-value="
            selectedOption = $event;
            logEvent('update:modelValue', { $event });
          "
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="(handleSearch($event), logEvent('searchHandler', { $event }))"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="popover" title="Конфигурация TNPopover" auto-props-disabled>
      <template #default="{ state }">
        <TNScrollSelect
          :model-value="selectedOption"
          :options="selectorOptions"
          position="right"
          flip
          shift
          :popper-options="{
            strategy: 'fixed'
          }"
          v-bind="filterState(state)"
          @update:model-value="
            selectedOption = $event;
            logEvent('update:modelValue', { $event });
          "
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="(handleSearch($event), logEvent('searchHandler', { $event }))"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant id="slot" title="Использование слотов" auto-props-disabled>
      <template #default="{ state }">
        <TNScrollSelect
          :model-value="selectedOption"
          :options="selectorOptions"
          :popper-options="{
            strategy: 'fixed'
          }"
          v-bind="filterState(state)"
          @update:model-value="
            selectedOption = $event;
            logEvent('update:modelValue', { $event });
          "
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="(handleSearch($event), logEvent('searchHandler', { $event }))"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        >
          <template #header>Custom header</template>
          <template #label>Custom Label</template>
          <template #description>Custom description</template>
          <template #value="{ id }">
            <div class="custom-option">
              {{ foundOption(id)?.title || "Ошибка" }}
            </div>
          </template>
          <template #items="{ isSelected, option }">
            <div class="custom-option" :class="{ 'custom-option_selected': isSelected }">
              {{ option.title }}
            </div>
          </template>
          <template #footer> Custom footer </template>
        </TNScrollSelect>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { TNScrollSelectOption } from "../scroll-select.types";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";
import ControlFieldNumber from "../../../.histoire/components/controls/control-field-number/control-field-number.vue";
import TNScrollSelect from "../scroll-select.vue";

const options = ref<TNScrollSelectOption[]>([]);

for (let i = 0; i < 20; i++) {
  options.value.push({
    title: `Option ${i}`,
    id: i
  });
}

const selectedOption = ref<(string | number)[]>();
const selectorOptions = ref<TNScrollSelectOption[]>([
  {
    id: "firstOptionID",
    title: "Опция #1"
  },
  {
    id: "secondOptionID",
    title: "Опция #2"
  },
  {
    id: "thirdOptionID",
    title: "Опция #3"
  }
]);

const searchQuery = ref<string>("");
const isDataLoading = ref<boolean>(false);
const searchOptions = async (): Promise<TNScrollSelectOption[]> => {
  isDataLoading.value = true;
  return new Promise<TNScrollSelectOption[]>(resolve => {
    setTimeout(() => {
      resolve(selectorOptions.value);
      isDataLoading.value = false;
    }, 2000);
  });
};

const handleSearch = async (query: string) => {
  searchQuery.value = query;
  selectorOptions.value = await searchOptions();
};

const foundOption = (id: string | number): TNScrollSelectOption | undefined => {
  return options.value?.find(item => item.id === id);
};
</script>

<style scoped>
.custom-option_selected {
  color: var(--content-accent-enabled);
}
.custom-option_selected:after {
  content: "✔";
  margin-left: 5px;
}
</style>

<docs lang="md">
[Документация](./scroll-select.story.md)
</docs>
