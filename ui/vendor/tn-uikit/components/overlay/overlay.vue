<template>
  <transition name="tn-background">
    <div v-if="isOpen" class="tn-overlay" :class="{ 'tn-overlay_transparent': transparent }" :style="{ zIndex }"></div>
  </transition>
</template>

<script lang="ts" setup>
defineOptions({
  name: "TNOverlay"
});

withDefaults(
  defineProps<{
    /** Состояние открытие/закрытие оверлея **/
    isOpen?: boolean;
    /** Возможность сделать оверлей прозрачным **/
    transparent?: boolean;
    /** Значение z-index **/
    zIndex?: `${number}` | number;
  }>(),
  {
    isOpen: false,
    transparent: false,
    zIndex: 30
  }
);
</script>

<style lang="css">
.tn-overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--background-primary-b-enabled);
  opacity: 0.4;
  transition: 0.2s ease;
}

.tn-overlay_transparent {
  background-color: transparent;
}

body:has(.tn-overlay) > .os-scrollbar,
#app:has(.tn-overlay) > .os-scrollbar {
  display: none;
}

body .tn-background-enter-active,
body .tn-background-leave-active {
  transition: opacity 0.2s ease;
}

body .tn-background-enter-from {
  opacity: 0;
}

body .tn-background-enter {
  opacity: 0.4;
}

body .tn-background-leave-to {
  opacity: 0;
}

body .tn-background-enter-to,
body .tn-background-leave {
  opacity: 0.4;
}

.tn-dark-theme {
  .tn-overlay {
    background-color: var(--neutral-black);
  }
}
</style>
