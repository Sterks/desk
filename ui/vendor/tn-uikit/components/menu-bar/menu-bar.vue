<template>
  <nav class="tn-menu-bar">
    <ul class="tn-menu-bar__container">
      <li
        v-for="menuItem in menu"
        :key="menuItem.value"
        class="tn-menu-bar__item"
        :class="{ 'tn-menu-bar__item_current': current === menuItem.value }"
        @click="handleSelect(menuItem.value)"
      >
        <TNIcon class="tn-menu-bar__icon" :name="menuItem.icon" />
        <p class="tn-menu-bar__title">{{ menuItem.title }}</p>
        <template v-if="menuItem.notification">
          <div v-if="typeof menuItem.notification === 'boolean'" class="tn-menu-bar__notification-mark"></div>
          <div v-else-if="menuItem.notification > 0" class="tn-menu-bar__notification-counter">
            {{ menuItem.notification }}
          </div>
        </template>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup generic="TValue extends string | number = string">
import type { ITNMenuItem } from "./menu-bar.types";
import TNIcon from "../icons/icon.vue";

defineOptions({
  name: "TNMenuBar"
});

defineProps<{
  /** Элементы меню **/
  menu: ITNMenuItem<TValue>[];
  /** Выбранный элемент меню **/
  current: TValue;
}>();

const emit = defineEmits<{
  /** Событие вызывается при выборе элемента меню **/
  (e: "select", value: TValue): void;
}>();

const handleSelect = (value: TValue) => {
  emit("select", value);
};
</script>

<style>
.tn-menu-bar {
  background-color: var(--background-primary-a-enabled);
  border-top: 1px solid var(--border-secondary-enabled);
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-family-body);
}

.tn-menu-bar__container {
  margin: 0;
  padding: 0;
  display: flex;
  width: 100%;
}

.tn-menu-bar__item {
  cursor: pointer;
  padding-top: 4px;
  flex: 1 0;
  display: flex;
  flex-flow: column;
  align-items: center;
  color: var(--content-secondary-enabled);
  transition: color 0.1s linear;
  position: relative;
}

.tn-menu-bar__item_current {
  color: var(--content-accent-enabled);
}

.tn-menu-bar__title {
  margin-top: 2px;
  font-size: var(--font-size-label-small);
  line-height: 14px;
}

.tn-menu-bar__notification-mark,
.tn-menu-bar__notification-counter {
  position: absolute;
  border-radius: 7px;
  background-color: var(--background-accent-enabled);
}

.tn-menu-bar__notification-mark {
  top: 1px;
  width: 6px;
  height: 6px;
  left: calc(50% + 12px);
  transform: translateX(-50%);
}

.tn-menu-bar__notification-counter {
  padding: 0 4px;
  color: var(--content-primary-b-enabled);
  font-size: var(--font-size-label-small);
  line-height: 14px;
  font-weight: var(--font-weight-text);
  top: 0;
  left: 50%;
}
</style>
