<template>
  <ul v-if="options && options.length" ref="TNTabs" :class="classList">
    <li v-for="(item, key) in options" :key="key" :class="'tn-tabs__item-' + item.id" class="tn-tabs__item">
      <button
        :class="{
          'tn-tabs__item-btn_disabled': item.disabled,
          'tn-tabs__item-btn_active': isActive(item),
          'tn-tabs__item-btn_icon': !!item.icon
        }"
        :disabled="disabled || item.disabled"
        class="tn-tabs__item-btn"
        @click="changeTab(item)"
      >
        <slot :active="isActive(item)" :item="item" name="beforeContent"> </slot>
        <span v-if="item.name" class="tn-tabs__item-btn-text">
          {{ item.name }}
        </span>
        <TNIcon v-if="item.icon" :name="item.icon.name" :style="{ color: item.icon.color }" class="tn-tabs__item-icon" size="20" />
        <span v-if="item.secondaryText" class="tn-tabs__item-btn-secondary-text">
          {{ item.secondaryText }}
        </span>
        <slot :active="isActive(item)" :item="item" name="afterContent"> </slot>
      </button>
    </li>
  </ul>
</template>

<script lang="ts" setup generic="TValue extends string | number | boolean">
import { computed, ref, VNode, watch } from "vue";
import TNIcon from "../icons/icon.vue";
import type { TNTabsOption, TNTabsSlotScope } from "./tabs.types";

defineOptions({
  name: "TNTabs"
});

const props = withDefaults(
  defineProps<{
    /** Варианты выбора табов */
    options: TNTabsOption<TValue>[];
    /** Значение value переменной для компонента */
    modelValue?: TValue;
    /** Стиль компонента */
    type?: "soft" | "accent";
    /** Выключение компонента */
    disabled?: boolean;
    /** Функция скролла к табу */
    scrollIntoView?: boolean;
    /** Размер компонента */
    size?: "sm" | "md" | "lg";
  }>(),
  {
    disabled: false,
    scrollIntoView: false,
    size: "md"
  }
);

const emit = defineEmits<{
  /** Событие вызывается при обновлении modelValue */
  (e: "update:modelValue", value: TValue): void;
}>();

defineSlots<{
  /** Слот контента перед текстом */
  beforeContent?: (props: TNTabsSlotScope<TValue>) => VNode[];
  /** Слот контента после текста */
  afterContent?: (props: TNTabsSlotScope<TValue>) => VNode[];
}>();

const TNTabs = ref<HTMLElement | null>(null);

const isActive = (item: TNTabsOption<TValue>): boolean => {
  return item.id === props.modelValue;
};

const classList = computed<string[]>(() => {
  const tabClasses: string[] = [];
  tabClasses.push("tn-tabs");
  if (props.type) tabClasses.push(`tn-tabs_${props.type}`);
  if (props.size === "lg") tabClasses.push("tn-tabs_large");
  if (props.size === "sm") tabClasses.push("tn-tabs_small");
  if (props.disabled) tabClasses.push("tn-tabs_disabled");
  return tabClasses;
});

function scrollToCurrent() {
  if (props.scrollIntoView) {
    if (TNTabs.value) {
      const currentTab: HTMLElement | null = TNTabs.value?.querySelector(".tn-tabs__item-" + props.modelValue);
      if (currentTab) {
        currentTab.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }
    }
  }
}

function changeTab(item: TNTabsOption<TValue>) {
  emit("update:modelValue", item.id);
  setTimeout(() => {
    scrollToCurrent();
  }, 1);
}

watch(
  () => props.modelValue,
  (newTab, oldTab) => {
    if ((props.modelValue || props.modelValue === 0) && newTab !== oldTab) {
      scrollToCurrent();
    }
  }
);
</script>

<style lang="css">
.tn-tabs {
  margin: 0;
  display: inline-flex;
  border-radius: 12px;
  font-family: var(--font-family-body);
  overflow-x: auto;
  background-color: var(--background-primary-a-enabled);
  align-items: center;
  height: 44px;
  border: 1px solid var(--border-secondary-enabled);
  gap: 4px;
  padding: 0 3px;
}

.tn-tabs::-webkit-scrollbar {
  display: none;
}

.tn-tabs {
  -ms-overflow-style: none;
  scrollbar-width: none;
  max-width: 100%;
}

.tn-tabs,
.tn-tabs * {
  box-sizing: border-box;
}

.tn-tabs__item {
  display: inline-block;
  vertical-align: middle;
  flex: 0 0 auto;
}

.tn-tabs__item-btn {
  transition: all 0.1s ease;
  user-select: none;
  border-radius: 10px;
  background-color: transparent;
  padding: 8px 16px;
  height: 36px;
  font-weight: var(--font-weight-accent);
  color: var(--content-secondary-enabled);
  border: none;
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
}

.tn-tabs__item-btn:hover {
  background-color: var(--background-primary-a-hover);
}

.tn-tabs__item-btn:active {
  background-color: var(--background-primary-a-pressed);
}

.tn-tabs__item-btn_active {
  background-color: var(--background-secondary-b-enabled);
  color: var(--content-primary-b-enabled);
}

.tn-tabs__item-btn_active:hover {
  background-color: var(--background-secondary-b-hover);
}

.tn-tabs__item-btn_active:active {
  background-color: var(--background-secondary-b-pressed);
}

.tn-tabs_disabled {
  pointer-events: none;
}

.tn-tabs_disabled .tn-tabs__item-btn {
  color: var(--content-primary-a-disabled);
}

.tn-tabs__item-icon {
  display: block;
  position: relative;
  text-align: center;
}

.tn-tabs__item-btn-text ~ .tn-tabs__item-icon {
  margin-left: 4px;
}

.tn-tabs__item-btn-text,
.tn-tabs__item-btn-secondary-text {
  display: block;
}

.tn-tabs__item-btn-secondary-text {
  color: var(--content-primary-a-disabled);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  font-weight: var(--font-weight-accent);
  margin-left: 4px;
  transition: color 0.1s linear;
}

.tn-tabs__item-btn_disabled {
  pointer-events: none;
}

/**
 Large
 */
.tn-tabs:not(.tn-tabs_soft).tn-tabs_large {
  height: 48px;
}

.tn-tabs_large .tn-tabs__item-btn {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  padding: 9px 16px;
  height: 40px;
}

.tn-tabs_large .tn-tabs__item-btn-secondary-text {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
}

/**
 Small
 */
.tn-tabs:not(.tn-tabs_soft).tn-tabs_small {
  height: 32px;
  border-radius: 8px;
}

.tn-tabs_small .tn-tabs__item-btn {
  padding: 2px 12px;
  border-radius: 5px;
  height: 24px;
}

/**
 * Soft
 */

.tn-tabs_soft {
  background-color: transparent;
  border-radius: 0;
  border: none;
  height: 40px;
  background-image: linear-gradient(
    0deg,
    transparent 0px,
    transparent 1px,
    var(--border-secondary-enabled) 1px,
    var(--border-secondary-enabled) 2px,
    transparent 2px
  );
  background-position: bottom;
  gap: 24px;
}

.tn-tabs_soft .tn-tabs__item-btn {
  color: var(--content-primary-a-enabled);
  border-radius: 0;
  font-weight: var(--font-weight-heading);
  position: relative;
  padding: 10px 0;
  height: unset;
}

.tn-tabs_soft.tn-tabs_large .tn-tabs__item-btn {
  padding: 13px 0;
}

.tn-tabs_soft.tn-tabs_large {
  gap: 16px;
  height: 48px;
}

.tn-tabs_soft .tn-tabs__item-btn::after {
  content: "";
  position: absolute;
  transition: background-color 0.1s linear;
  background-color: transparent;
  height: 2px;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 2px;
}

.tn-tabs_soft .tn-tabs__item-btn:hover {
  color: var(--content-primary-a-hover);
  background-color: transparent;
}

.tn-tabs_soft .tn-tabs__item-btn:active {
  color: var(--content-primary-a-pressed);
  background-color: transparent;
}

.tn-tabs_soft .tn-tabs__item-btn_active {
  box-shadow: none;
  background-color: transparent;
  color: var(--content-accent-enabled);
}

.tn-tabs_soft .tn-tabs__item-btn_active.tn-tabs__item-btn_active::after {
  background-color: var(--content-accent-enabled);
}

.tn-tabs_soft .tn-tabs__item-btn_active:hover {
  color: var(--content-accent-hover);
  background-color: transparent;
}

.tn-tabs_soft .tn-tabs__item-btn_active:hover::after {
  background-color: var(--content-accent-hover);
}

.tn-tabs_soft .tn-tabs__item-btn_active:active {
  color: var(--content-accent-pressed);
  background-color: transparent;
}

.tn-tabs_soft .tn-tabs__item-btn_active:active::after {
  background-color: var(--content-accent-pressed);
}

.tn-tabs__item-btn_active .tn-tabs__item-icon {
  opacity: 1;
}

.tn-tabs_soft.tn-tabs_disabled .tn-tabs__item-btn {
  color: var(--content-accent-disabled);
}

.tn-tabs_soft.tn-tabs_disabled .tn-tabs__item-btn_active {
  border-bottom-color: var(--content-accent-disabled);
}

.tn-tabs_soft.tn-tabs_disabled .tn-tabs__item-btn_active::after {
  background-color: var(--content-accent-disabled);
}

/**
 * Accent
 */

.tn-tabs_accent .tn-tabs__item-btn_active {
  background-color: var(--content-accent-enabled);
  color: var(--content-primary-b-enabled);
}

.tn-tabs_accent .tn-tabs__item-btn_active .tn-tabs__item-btn-secondary-text {
  color: var(--content-primary-b-enabled);
}

.tn-tabs_accent .tn-tabs__item-btn_active:hover {
  background-color: var(--content-accent-hover);
}

.tn-tabs_accent .tn-tabs__item-btn_active:active {
  background-color: var(--content-accent-enabled);
}

.tn-tabs_accent.tn-tabs_disabled .tn-tabs__item-btn {
  color: var(--content-primary-a-disabled);
}

.tn-tabs_accent.tn-tabs_disabled .tn-tabs__item-btn_active {
  background-color: var(--background-secondary-a-enabled);
}
</style>
