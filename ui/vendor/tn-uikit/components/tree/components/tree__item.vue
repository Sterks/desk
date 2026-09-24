<template>
  <li class="tree__item">
    <div
      class="tree__item-title"
      :class="{
        'tree__item-title_open': option.isOpen,
        'tree__item-title_disabled': highlightDisable && (option.disabled || option.disableSelect)
      }"
      :style="titleStyle"
    >
      <div
        v-if="(isParent || !option.children || !option.children?.length) && !option.disabled && !(option.isOpen && (!children || !children.length))"
        class="tree__item-title-hidden-button"
        :class="{
          'tree__item-title-hidden-button_small': !multiple,
          'tree__item-title-hidden-button_icon-button': multiple && option.iconButton
        }"
        @click="$emit('handleClickTitle', option)"
      ></div>
      <div
        v-if="!multiple || simple"
        class="tree__item-select-hidden-button"
        :class="{
          'tree__item-select-hidden-button_icon-button': option.iconButton
        }"
        @click="handleCheck(!option.isCheck)"
      ></div>
      <TNIcon
        v-if="!!option.isLoad"
        class="tree__item-icon tree__item-icon_load"
        :class="{
          'tree__item-icon_hidden': option.isOpen && (!children || !children.length)
        }"
        name="load"
      />
      <TNIcon
        v-else-if="isParent"
        class="tree__item-icon tree__item-icon_arrow"
        :class="{
          'tree__item-icon_hidden': option.isOpen && (!children || !children.length)
        }"
        name="right-m"
      />
      <p class="tree__item-title-text" :class="{ 'tree__item-title-text_selected': simple && option.isCheck }">
        {{ option.title }}
      </p>
      <TNCheckbox
        v-if="multiple && !simple"
        :model-value="option.isCheck"
        class="tree__item-checkbox"
        :class="{
          'tree__item-checkbox_indeterminate': isIndeterminate && !option.isCheck
        }"
        :disabled="option.isLoad || option.disabled || option.disableSelect"
        @update:model-value="handleCheck"
      />
      <TNIcon
        v-else
        class="tree__item-icon tree__item-icon_check"
        :class="{
          'tree__item-icon_hidden': !option.isCheck
        }"
        name="check"
      />
      <TNButton
        v-if="option.iconButton"
        class="tree__item-button"
        type="link"
        size="lg"
        :class="{ 'tree__item-button_multiple': multiple }"
        :icon="option.iconButton"
        @click="$emit('iconButtonClick', option.id)"
      />
    </div>
    <TransitionCollapse>
      <template v-if="!!option.isOpen && !option.isLoad">
        <ul v-if="children && children.length" class="tree__list">
          <TNTreeItem
            v-for="(child, index) in children"
            :key="index"
            :multiple="multiple"
            :option="child"
            :is-async="isAsync"
            :is-depends-parent="isDependsParent"
            :children="child.children"
            :nest-level="nestLevel + 1"
            :no-children="isNoChildren"
            :simple="simple"
            :highlight-disable="highlightDisable"
            @load-options="$emit('loadOptions', $event)"
            @handle-click-title="$emit('handleClickTitle', $event)"
            @handle-check="$emit('handleCheck', $event)"
            @icon-button-click="$emit('iconButtonClick', $event)"
          />
        </ul>
      </template>
    </TransitionCollapse>
  </li>
</template>

<script setup lang="ts" generic="TId extends string | number = string | number">
import { computed } from "vue";
import TNCheckbox from "../../checkbox/checkbox.vue";
import TNIcon from "../../icons/icon.vue";
import type { TNTreeProps } from "../tree.types";
import { getIsIndeterminate } from "../helpers";
import TransitionCollapse from "../../transitions/transition-collapse.vue";
import TNButton from "../../button/button.vue";

defineOptions({
  name: "TNTreeItem"
});

const props = withDefaults(
  defineProps<{
    /** Пункт списка дерева. */
    option: TNTreeProps.Option<TId>;
    /** Асинхронное дерево. */
    isAsync?: boolean;
    /** Авто-выбор родителя. */
    isDependsParent?: boolean;
    /** Список вложенных пунктов. */
    children?: TNTreeProps.Option<TId>[];
    /** Опредеяет можно ли выбрать несколько элементов дерерва. */
    multiple?: boolean;
    /** Уровень вложенности. */
    nestLevel?: number;
    /** Признак отсутствия дочерних элементов на текущем уровне. */
    noChildren?: boolean;
    /** Изменяет стиль заголовка элемента, когда элемент выбран. */
    simple?: boolean;
    /** Изменяет стиль заголовка элемента, когда элемент отключен или выбор элемента отключен. */
    highlightDisable?: boolean;
  }>(),
  {
    isAsync: false,
    isDependsParent: true,
    multiple: true,
    nestLevel: 0,
    noChildren: false,
    simple: false,
    highlightDisable: false
  }
);

const emit = defineEmits<{
  /** Пробрасывает изменение выбранного состояния пункта дерева. */
  (event: "handleCheck", option: TNTreeProps.Option<TId>): void;
  /** Пробрасывает событие загрузки при открытии асинхронного дерева. */
  (event: "loadOptions", option: TNTreeProps.Option<TId>): void;
  /** Пробрасывает клик по заголовку элемента дерева. */
  (event: "handleClickTitle", option: TNTreeProps.Option<TId>): void;
  /** Пробрасывает клик по иконке действия. */
  (event: "iconButtonClick", optionId: TId): void;
}>();

const isParent = computed<boolean>(() => !!(props.children && props.children.length) || props.isAsync);

const isIndeterminate = computed<boolean>(() => {
  return getIsIndeterminate(props.option);
});

const titleStyle = computed<{ paddingLeft: string }>(() => {
  return {
    paddingLeft: props.nestLevel * 8 + 12 + (!isParent.value && !props.noChildren ? 32 : 0) + "px"
  };
});

const isNoChildren = computed<boolean>(() => !props.children || props.children.every(o => !o.children));

const handleCheck = (value?: boolean) => {
  if (!props.option.disableSelect && !props.option.disabled) {
    // eslint-disable-next-line vue/no-mutating-props
    props.option.isCheck = Boolean(value);
  }
  emit("handleCheck", props.option);
};
</script>

<style lang="css">
.tree__item:not(:last-child) {
  margin-bottom: 4px;
}

.tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
  transition: margin 0.3s ease;
}

.tree__item-title {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  color: var(--content-primary-a-enabled);
  background-color: var(--background-primary-a-enabled);
  border-radius: 8px;
  padding: 4px 12px;
  height: 32px;
  transition:
    margin-bottom 0.3s ease,
    background-color 0.1s linear,
    color 0.1s linear;
  margin-bottom: 0;
}

.tree__item-title:hover {
  background-color: var(--background-primary-a-hover);
}

.tree__item-title:active {
  background-color: var(--background-primary-a-pressed);
}

.tree__item-title:disabled {
  background-color: var(--background-primary-a-disabled);
  color: var(--content-primary-a-disabled);
}

.tree__item-icon_load .tree__item-icon_arrow {
  order: 0;
}

.tree__item-title:disabled .tree__item-icon_load,
.tree__item-title:disabled .tree__item-icon_arrow {
  color: var(--content-primary-a-disabled);
}

.tree__item-title_open:not(:last-child) {
  margin-bottom: 4px;
}

.tree__item-title-text {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  flex: 1 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  order: 1;
  transition: color 0.1s linear;
}

.tree__item-title-text_selected {
  color: var(--content-accent-enabled);
}

.tree__item-title_disabled .tree__item-title-text {
  color: var(--content-primary-a-disabled);
}

.tree__item-select-hidden-button,
.tree__item-title-hidden-button {
  position: absolute;
  z-index: 1;
  top: 0;
  height: 100%;
  background-color: transparent;
  width: calc(100% - 44px);
}

.tree__item-title-hidden-button {
  left: 0;
}

.tree__item-select-hidden-button {
  right: 0;
}

.tree__item-title-hidden-button_small {
  width: 44px;
}

.tree__item-title-hidden-button_icon-button {
  width: calc(100% - 70px);
}

.tree__item-select-hidden-button_icon-button {
  right: 42px;
  width: calc(100% - 86px);
}

.tree__item-checkbox {
  flex: 0 0;
  width: auto;
  order: 3;
}

.tree__item-checkbox_indeterminate .tn-checkbox__btn {
  background-color: var(--background-accent-enabled);
  border-color: var(--border-accent-enabled);
}

.tree__item-checkbox_indeterminate:disabled .tn-checkbox__btn {
  background-color: var(--content-accent-disabled);
  border-color: var(--content-accent-disabled);
}

.tree__item-checkbox_indeterminate .tn-checkbox__btn::after {
  width: 16px;
  border-radius: 2px;
  left: 1px;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='2.8' y1='7.86797' x2='13.2' y2='7.86797' stroke='white' stroke-width='1.6' stroke-linecap='round'/%3e%3c/svg%3e ");
}

.tree__item-icon {
  transition:
    transform 0.1s ease,
    color 0.1s linear,
    opacity 0.1s linear;
  color: var(--content-secondary-enabled);
  flex: 0 0 24px;
  opacity: 1;
}

.tree__item-icon_hidden {
  opacity: 0;
}

.tree__item-title_open .tree__item-icon_arrow {
  transform: rotate(90deg);
}

.tree__item-icon_check {
  color: var(--content-accent-enabled);
  order: 4;
}

.tn-button.tree__item-button {
  color: var(--content-tertiary-enabled);
  order: 5;
  width: 24px;
  height: 24px;
  flex-basis: 24px;
  border-radius: 0;
  padding: 0;
}

.tn-button.tree__item-button_multiple {
  order: 2;
}

.tn-button.tree__item-button:hover {
  color: var(--content-tertiary-hover);
}

.tn-button.tree__item-button:active {
  color: var(--content-tertiary-pressed);
}
</style>
<style src="../../../app.css"></style>
