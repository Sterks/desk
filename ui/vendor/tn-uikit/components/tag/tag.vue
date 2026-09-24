<template>
  <div
    class="tn-tag"
    :class="{
      'tn-tag_inline': inline,
      'tn-tag_icon-only': isIconOnly,
      'tn-tag_icon': icon,
      'tn-tag_right-icon': rightIcon,
      'tn-tag_interactive': interactive,
      'tn-tag_disabled': disabled
    }"
  >
    <TNIcon v-if="icon" size="20" class="tn-tag__icon" :style="{ color: iconColor }" :name="icon" />
    <span v-if="$slots.default" class="tn-tag__slot-text"><slot></slot></span>
    <span v-else-if="text" class="tn-tag__text">{{ text }}</span>
    <span v-else class="tn-tag__text">&#8203;</span>
    <TNIcon v-if="rightIcon" size="20" class="tn-tag__right-icon" :style="{ color: rightIconColor }" :name="rightIcon" />
  </div>
</template>

<script lang="ts" setup>
import { computed, CSSProperties, VNode } from "vue";
import TNIcon from "../icons/icon.vue";
import type { IconNames } from "../icons/icon-names";

defineOptions({
  name: "TNTag"
});

const props = withDefaults(
  defineProps<{
    /** Текст внутри тега **/
    text?: string;
    /** Иконка тега слева **/
    icon?: IconNames;
    /** Цвет иконки слева **/
    iconColor?: CSSProperties["color"];
    /** Иконка тега справа **/
    rightIcon?: IconNames;
    /** Цвет иконки справа **/
    rightIconColor?: CSSProperties["color"];
    /** Добавляет стиль display: inline-block **/
    inline?: boolean;
    /** Добавляет стили для отображение кликабельности **/
    interactive?: boolean;
    /** Отключение тега **/
    disabled?: boolean;
  }>(),
  {
    text: "",
    iconColor: "var(--content-secondary-enabled)",
    rightIconColor: "var(--content-secondary-enabled)",
    inline: false,
    interactive: false,
    disabled: false
  }
);

const slots = defineSlots<{
  /** Слот для контента	 **/
  default?: () => VNode[];
}>();

const isIconOnly = computed<boolean>(() => {
  return !(slots.default || props.text);
});
</script>

<style lang="css">
.tn-tag {
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: fit-content;
  font-weight: var(--font-weight-text);
  font-size: var(--font-size-body-small);
  line-height: var(--font-lineHeight-body-small);
  padding: 4px 8px;
  border-radius: 8px;
  color: var(--content-secondary-enabled);
  max-width: 320px;
  font-family: var(--font-family-body);
  border: 1px solid var(--content-tertiary-enabled);
  position: relative;
  transition-property: border-color, color;
  transition-duration: 0.1s;
  transition-timing-function: linear;
}

.tn-tag_icon.tn-tag_icon-only {
  padding: 4px 0 4px 36px;
}

.tn-tag_interactive {
  cursor: pointer;
}

.tn-tag_icon {
  padding-left: 32px;
}

.tn-tag_right-icon {
  padding-right: 32px;
}

.tn-tag__icon {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  position: absolute;
}

.tn-tag__right-icon {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  position: absolute;
}

.tn-tag.tn-tag_icon-only .tn-tag__icon {
  margin-right: 0;
}

.tn-tag.tn-tag_inline {
  display: inline-block;
}

.tn-tag.tn-tag_interactive:hover {
  border-color: var(--content-tertiary-hover);
  color: var(--content-secondary-hover);
}

.tn-tag.tn-tag_interactive:active {
  border-color: var(--content-secondary-pressed);
  color: var(--content-secondary-pressed);
}

.tn-tag.tn-tag_disabled {
  border-color: var(--content-primary-a-disabled);
  color: var(--content-primary-a-disabled);
}
</style>
