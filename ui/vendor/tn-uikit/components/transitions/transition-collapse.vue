<template>
  <transition
    enter-active-class="enter-active"
    leave-active-class="leave-active"
    @enter="enter"
    @leave="leave"
    @before-enter="beforeEnter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @after-leave="afterLeave"
  >
    <slot />
  </transition>
</template>

<script lang="ts" setup>
import { VNode } from "vue";

defineOptions({
  name: "TransitionCollapse"
});

defineSlots<{
  /** Слот для контента */
  default?: () => VNode[];
}>();

const beforeEnter = (element: Element) => {
  requestAnimationFrame(() => {
    if (element instanceof HTMLElement) {
      if (!element.style.maxHeight) {
        element.style.maxHeight = "0px";
      }

      element.style.display = "";
    }
  });
};

const enter = (element: Element) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (element instanceof HTMLElement) {
        element.style.maxHeight = `${element.scrollHeight || window.innerHeight}px`;
      }
    });
  });
};
const afterEnter = (element: Element) => {
  if (element instanceof HTMLElement) {
    element.style.maxHeight = "";
  }
};

const beforeLeave = (element: Element) => {
  requestAnimationFrame(() => {
    if (element instanceof HTMLElement && !element.style.maxHeight) {
      element.style.maxHeight = `${element.offsetHeight > window.innerHeight ? window.innerHeight : element.offsetHeight}px`;
    }
  });
};

const leave = (element: Element) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (element instanceof HTMLElement) {
        element.style.maxHeight = "0px";
      }
    });
  });
};

const afterLeave = (element: Element) => {
  if (element instanceof HTMLElement) {
    element.style.maxHeight = "";
  }
};
</script>

<style scoped>
.enter-active,
.leave-active {
  overflow: hidden;
  transition: max-height 0.3s ease;
}
</style>
