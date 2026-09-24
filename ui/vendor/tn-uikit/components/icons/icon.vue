<template>
  <i class="tn-icon" :style="style">
    <svg :width="svgSize + 'px'" :height="svgSize + 'px'" :viewBox="`0 0 ${svgSize} ${svgSize}`" xmlns="http://www.w3.org/2000/svg" fill="none">
      <use :xlink:href="`#icon--${name}`" />
    </svg>
  </i>
</template>

<script lang="ts" setup>
import { computed, CSSProperties } from "vue";
import type { IconNames } from "./icon-names";

defineOptions({
  name: "TNIcon"
});

const props = withDefaults(
  defineProps<{
    /** Название иконки **/
    name: IconNames;
    /** Размер иконки в пикселях **/
    size?: `${number}` | number;
  }>(),
  {
    size: 24
  }
);

const svgSize = computed<number>(() => (+props.size > 0 ? +props.size : 24));

const style = computed<CSSProperties>(() => ({
  height: +props.size > 0 ? props.size + "px" : "24px",
  width: +props.size > 0 ? props.size + "px" : "24px",
  lineHeight: +props.size > 0 ? props.size + "px" : "24px"
}));
</script>

<style lang="css">
.tn-icon {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  width: 1em;
  height: 1em;
}

.tn-icon svg {
  display: inline-block;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  pointer-events: none;
}
</style>
