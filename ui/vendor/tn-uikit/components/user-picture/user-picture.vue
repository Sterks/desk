<template>
  <div
    class="tn-user-picture"
    :class="{
      'tn-user-picture_s': size === 's',
      'tn-user-picture_l': size === 'l',
      'tn-user-picture_square': square
    }"
  >
    <div class="tn-user-picture__container">
      <img v-if="showImg" class="tn-user-picture__image" :src="image" :alt="text" @error="handleImgError" />
      <p v-else-if="text" class="tn-user-picture__text">{{ text }}</p>
      <TNIcon v-else-if="icon" class="tn-user-picture__icon" :size="iconSizeValue" :name="icon" />
    </div>
    <TNIcon v-if="status" name="status-filled" :size="statusIconSize" class="tn-user-picture__status" :class="statusClass" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import TNIcon from "../icons/icon.vue";
import type { IconNames } from "../icons/icon-names";

defineOptions({
  name: "TNUserPicture"
});

const props = withDefaults(
  defineProps<{
    /** Ссылка на изображение */
    image?: string;
    /** Текст внутри компонента */
    text?: string;
    /** Название иконки  */
    icon?: IconNames;
    /** Размер компонента */
    size?: "s" | "m" | "l";
    /** Размер иконки внутри компонента */
    iconSize?: string | number;
    /** Сделать компонент квадратным */
    square?: boolean;
    /** Рисует индикатор статуса указанного цвета */
    status?: "green" | "yellow" | "red" | "gray";
    /** Скрывает стандартную иконку ошибки изображения при ошибке */
    hideOnError?: boolean;
  }>(),
  {
    size: "m",
    square: false
  }
);

const emits = defineEmits<{
  /** Событие вызывается при возникновении ошибки с тегом [img](https://developer.mozilla.org/ru/docs/Web/HTML/Element/img#%D0%BE%D1%88%D0%B8%D0%B1%D0%BA%D0%B8_%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B7%D0%BA%D0%B8_%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F) */
  (e: "error", error: Event): void;
}>();

const iconSizeValue = computed<number>(() => {
  return props.iconSize ? Number(props.iconSize) : props.size === "s" ? 16 : props.size === "l" ? 78 : 24;
});

const statusIconSize = computed<number>(() => (props.size === "s" ? 14 : props.size === "l" ? 32 : 20));

const statusClass = computed<string>(() => (props.status ? "tn-user-picture__status_" + props.status : ""));

const isImgError = ref<boolean>(false);
const handleImgError = (error: Event) => {
  isImgError.value = true;
  emits("error", error);
};
const showImg = computed(() => (isImgError.value && props.hideOnError ? "" : props.image));
</script>

<style lang="css">
.tn-user-picture {
  font-family: var(--font-family-body);
  background-color: var(--background-tertiary-enabled);
  border: 1px solid var(--border-primary-b-enabled);
  width: 56px;
  height: 56px;
  box-sizing: border-box;
  position: relative;
  user-select: none;
  border-radius: 50%;
}

.tn-user-picture__container {
  overflow: hidden;
  border-radius: 50%;
  position: relative;
  height: 100%;
}

.tn-user-picture_s {
  width: 22px;
  height: 22px;
}

.tn-user-picture_l {
  width: 141px;
  height: 141px;
  border: 2px solid var(--content-primary-b-enabled);
}

.tn-user-picture_square,
.tn-user-picture_square .tn-user-picture__container {
  border-radius: 4px;
}

.tn-user-picture_s.tn-user-picture_square,
.tn-user-picture_square.tn-user-picture_s .tn-user-picture__container {
  border-radius: 2px;
}

.tn-user-picture_l.tn-user-picture_square,
.tn-user-picture_square.tn-user-picture_l .tn-user-picture__container {
  border-radius: 8px;
}

.tn-user-picture__image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tn-user-picture__text {
  font-weight: var(--font-weight-accent);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  text-transform: uppercase;
  position: absolute;
  white-space: nowrap;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.tn-user-picture_s .tn-user-picture__text {
  font-size: var(--font-size-label-medium);
  line-height: var(--font-lineHeight-label-medium);
}

.tn-user-picture_l .tn-user-picture__text {
  font-weight: var(--font-weight-heading);
  font-size: 32px;
  line-height: 44px;
}

.tn-user-picture__icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: block;
}

.tn-user-picture__status {
  color: var(--content-system-neutral);
  z-index: 1;
  position: absolute;
  top: -2px;
  right: -2px;
  background-image: radial-gradient(var(--background-primary-a-enabled) 0px, var(--background-primary-a-enabled) 7.75px, transparent 7.75px, transparent);
}

.tn-user-picture_s .tn-user-picture__status {
  top: -3px;
  right: -3px;
  background-image: radial-gradient(var(--background-primary-a-enabled) 0px, var(--background-primary-a-enabled) 5.75px, transparent 5.75px, transparent);
}

.tn-user-picture_l .tn-user-picture__status {
  top: 4px;
  right: 4px;
  background-image: radial-gradient(white 0px, white 13px, transparent 13px, transparent);
}

.tn-user-picture__status_green {
  color: var(--content-system-positive);
}

.tn-user-picture__status_yellow {
  color: var(--content-system-warning);
}

.tn-user-picture__status_red {
  color: var(--content-system-negative);
}
</style>
