<template>
  <Story title="TNMultiSelector/Playground" group="form" :layout="{ type: 'grid', width: '60%' }">
    <template #controls="{ state }">
      <ControlFieldSelect v-model="state.size" title="size" field-type="'s' | 'm'" default-value="m" desc="Размер компонента" :options="['s', 'm']" />
      <ControlFieldBoolean v-model="state.required" title="required" field-type="boolean" desc="Выводит звездочку после заголовка компонента - лейбла" />
      <ControlFieldText v-model="state.placeholder" title="placeholder" field-type="string" default-value="" desc="Placeholder для поля компонента" />
      <ControlFieldJson
        v-model="state.modelValue"
        title="modelValue"
        field-type="(string | number)[]"
        default-value="[]"
        desc="Значение value переменной для компонента"
      />
      <ControlFieldText v-model="state.label" title="label" field-type="string" default-value="" desc="Текст для заголовка компонента" />
      <ControlFieldText v-model="state.description" title="description" field-type="string" default-value="" desc="Текст для описания компонента" />
      <ControlFieldBoolean v-model="state.disabled" title="disabled" field-type="boolean" desc="Отключение компонента" />
      <ControlFieldBoolean
        v-model="state.clearable"
        title="clearable"
        field-type="boolean"
        default-value="true"
        desc="Функционал очистки содержимого по кнопке"
      />
      <ControlFieldText v-model="state.searchQuery" title="searchQuery" field-type="string" default-value="" desc="Текст из поисковой строки" />
      <ControlFieldText v-model="state.searchError" title="searchError" field-type="string" default-value="" desc="Текст ошибки поиска" />
      <ControlFieldBoolean v-model="state.searchable" title="searchable" field-type="boolean" desc="Включение поисковой строки" />
      <ControlFieldBoolean v-model="state.isLoading" title="isLoading" field-type="boolean" desc="Состояние загрузки компонента" />
      <ControlFieldText
        v-model="state.searchPlaceholder"
        title="searchPlaceholder"
        field-type="string"
        default-value="Искать"
        desc="Placeholder для поисковой строки"
      />
      <ControlFieldJson v-model="state.options" title="options" field-type="TNTreeProps.Option[]" default-value="[]" desc="Массив опций для селектора" />
      <ControlFieldText v-model="state.emptyListHint" title="emptyListHint" field-type="string" desc="Подсказка для пустого списка опций выбора" />
      <ControlFieldText v-model="state.error" title="error" field-type="string" desc="Текст ошибки (включает «error» стиль у компонента)" />
      <ControlFieldText v-model="state.warn" title="warn" field-type="string" desc="Текст предупреждения (включает «warning» стиль у компонента)" />
      <ControlFieldText v-model="state.success" title="success" field-type="string" desc="Текст успеха (включает «success» стиль у компонента)" />
      <ControlFieldBoolean
        v-model="state.scrollSelectedIntoView"
        title="scrollSelectedIntoView"
        field-type="boolean"
        desc="Включение функционала скролла к выбранным опциям"
      />
      <ControlFieldText
        v-model="state.position"
        title="position"
        field-type="Placement"
        default-value="bottom-left"
        desc="Позиционирование всплывающего окна (popper-элемента) относительно «триггер»-элемента"
      />
      <ControlFieldText
        v-model="state.teleportTo"
        title="teleportTo"
        field-type="string"
        default-value="main"
        desc="Силами teleport Vue вставляет компонент в нужный контейнер DOM-дерева"
      />
      <ControlFieldBoolean
        v-model="state.flip"
        title="flip"
        field-type="boolean"
        default-value="true"
        desc="Отображать всплывающее окно с другой стороны, если с нужной не хватает места"
      />
      <ControlFieldBoolean v-model="state.shift" title="shift" field-type="boolean" desc="Сдвигать всплывающее окно, чтобы оно не выходило за пределы экрана" />
      <ControlFieldJson v-model="state.popperOptions" title="popperOptions" field-type="IPopoverOptions" desc="Опции для всплывающего окна" />
      <ControlFieldText
        v-model="state.bottomSheetCustomClass"
        title="bottomSheetCustomClass"
        field-type="string"
        default-value=""
        desc="Кастомный класс для компонента TNBottomSheet"
      />
      <ControlFieldBoolean
        v-model="state.isMobileMiniApp"
        title="isMobileMiniApp"
        field-type="boolean"
        desc="Передача одноименного параметра для боттом-щита"
      />
      <ControlFieldBoolean
        v-model="state.smoothMessage"
        title="smoothMessage"
        field-type="boolean"
        desc="Добавляет мягкую анимацию для появления текста ошибки/предупреждения/успеха (при этом добавляет отступ снизу компонента)"
      />
      <ControlFieldBoolean
        v-model="state.searchFocus"
        title="searchFocus"
        field-type="boolean"
        desc="Установить фокус на поле ввода при открытии селектора (при включенном searchable)"
      />
      <ControlFieldBoolean
        v-model="state.chipsUnderWrapper"
        title="chipsUnderWrapper"
        field-type="boolean"
        desc="Отрисовывает выбранные чипсины под компонентом"
      />
    </template>
    <Variant id="main" title="TNMultiSelector" :init-state="() => selectDefaultState" auto-props-disabled>
      <template #default="{ state }">
        <TNMultiSelector
          v-model="state.modelValue"
          v-bind="filterState(state)"
          @update:model-value="logEvent('update:modelValue', { $event })"
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="logEvent('searchHandler', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant
      id="info-param"
      title="Информативные параметры"
      :init-state="
        () => ({
          options: [
            {
              id: 0,
              deep: 0,
              title: 'Option 1',
              isCheck: false
            },
            {
              id: 1,
              deep: 0,
              title: 'Option 2',
              isCheck: false
            },
            {
              id: 2,
              deep: 0,
              title: 'Option 3',
              isCheck: false
            }
          ],
          label: 'Заголовок компонента',
          description: 'Описание компонента',
          placeholder: 'Плейсхолдер при пустом выборе',
          searchable: 'isSearchMode',
          searchPlaceholder: 'Плейсхолдер при пустом поле поиска (если поле поиска включено)',
          searchError: 'Выводимый текст при ошибке поиска',
          warn: 'Текст предупреждения',
          error: 'Текст ошибки',
          success: 'Текст успеха',
          emptyListHint: 'Подсказка, которая будет видна при пустом списке опций',
          popperOptions: {
            strategy: 'fixed'
          }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNMultiSelector
          v-model="state.modelValue"
          v-bind="filterState(state)"
          @update:model-value="logEvent('update:modelValue', { $event })"
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="logEvent('searchHandler', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant
      id="appearance"
      title="Внешний вид"
      :init-state="
        () => ({
          size: 's',
          disabled: 'isDisabled',
          required: true,
          flip: false,
          shift: true,
          position: 'leftTop',
          popperOptions: { strategy: 'fixed' },
          isLoading: 'isLoading'
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNMultiSelector
          v-model="state.modelValue"
          v-bind="filterState(state)"
          @update:model-value="logEvent('update:modelValue', { $event })"
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="logEvent('searchHandler', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        />
      </template>
    </Variant>
    <Variant
      id="slot"
      title="Использование слотов"
      :init-state="
        () => ({
          options: [
            {
              id: 0,
              deep: 0,
              title: 'Option 1',
              isCheck: false
            },
            {
              id: 1,
              deep: 0,
              title: 'Option 2',
              isCheck: false
            },
            {
              id: 2,
              deep: 0,
              title: 'Option 3',
              isCheck: false
            }
          ],
          popperOptions: { strategy: 'fixed' }
        })
      "
      auto-props-disabled
    >
      <template #default="{ state }">
        <TNMultiSelector
          v-model="state.modelValue"
          v-bind="filterState(state)"
          @update:model-value="logEvent('update:modelValue', { $event })"
          @open="logEvent('open', { $event })"
          @close="logEvent('close', { $event })"
          @search-handler="logEvent('searchHandler', { $event })"
          @icon-button-click="logEvent('iconButtonClick', { $event })"
        >
          <template #description>
            <span>Новое описание</span>
          </template>
          <template #value>
            <div>Новый компонент для отображения выделенных опций</div>
          </template>
          <template #items>
            <div>Новый компонент для отображения опций в списке</div>
          </template>
        </TNMultiSelector>
      </template>
    </Variant>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { TNTreeProps } from "../tree/tree.types";

import ControlFieldBoolean from "../../../.histoire/components/controls/control-field-boolean/control-field-boolean.vue";
import ControlFieldSelect from "../../../.histoire/components/controls/control-field-select/control-field-select.vue";
import { filterState } from "../../../consts/consts";
import { logEvent } from "histoire/client";
import ControlFieldText from "../../../.histoire/components/controls/control-field-text/control-field-text.vue";
import ControlFieldJson from "../../../.histoire/components/controls/control-field-json/control-field-json.vue";

const treeOnlySelect = ref<TNTreeProps.Option[]>([
  {
    id: 0,
    deep: 0,
    title: "Category 1",
    isCheck: false,
    isOpen: false,
    children: [
      {
        id: 11,
        deep: 1,
        title: "Category 1.1",
        isCheck: false
      },
      {
        id: 12,
        deep: 1,
        title: "Category 1.2",
        isCheck: false
      }
    ]
  },
  {
    id: 1,
    deep: 0,
    title: "Category 2",
    isCheck: false,
    isOpen: false,
    isLoad: false,
    children: [
      {
        id: 21,
        deep: 1,
        title: "Category 2.1",
        isCheck: false
      },
      {
        id: 22,
        deep: 1,
        title: "Category 2.2",
        isCheck: false
      }
    ]
  },
  {
    id: 3,
    deep: 0,
    title: "Category 3",
    isCheck: false,
    isOpen: false,
    isLoad: false,
    children: []
  }
]);

const selectDefaultState = {
  label: "Select label",
  placeholder: "Select placeholder",
  options: treeOnlySelect,
  popperOptions: { strategy: "fixed" }
};
</script>

<style scoped></style>

<docs lang="md">
[Документация](./multiselect.story.md)
</docs>
