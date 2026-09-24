<template>
  <div class="tn-popup__block">
    <Overlay class="tn-popup-overlay" :z-index="zIndex" :is-open="isVisible" :transparent="transparentBackground" @click="clickOutside" />
    <transition name="tn-popup" @after-leave="$emit('after-leave')">
      <div v-if="isVisible" tabindex="0" class="tn-popup" :style="{ zIndex }" @keydown.esc.exact="handleEscPress" @vue:mounted="setFocus">
        <div class="tn-popup__container" :class="classes" :style="styles">
          <TNButton v-if="closable" class="tn-popup__close" size="lg" type="white" block icon="close" @click.stop="$emit('close', $event)" />
          <div class="tn-popup__header">
            <TNButton
              v-if="isMobile || back"
              class="tn-popup__back"
              :size="(isMobile && 'md') || 'sm'"
              type="white"
              block
              icon="backto"
              @click.stop="handleBack"
            />
            <div
              v-if="isHeaderExist || $slots.header"
              class="tn-popup__header-container"
              :class="{
                'tn-popup__header-container_disabled': disabled.header,
                'tn-popup__header-container_shadowed': shadow.top
              }"
            >
              <div class="tn-popup__titles" :class="{ 'tn-popup__titles_back': back }">
                <h3 v-if="title" class="tn-popup__title">{{ title }}</h3>
                <p v-if="subtitle" class="tn-popup__subtitle">{{ subtitle }}</p>
                <slot v-if="$slots.header" name="header"></slot>
              </div>
            </div>
          </div>
          <TNScroll ref="scrollElement" class="tn-popup__content" :class="{ 'tn-popup__content_disabled': disabled.content }" @scroll="scrollHandler">
            <slot></slot>
          </TNScroll>
          <div
            class="tn-popup__footer"
            :class="{
              'tn-popup__footer_disabled': disabled.footer,
              'tn-popup__footer_shadowed': shadow.bottom
            }"
          >
            <div v-if="$slots.footer" class="tn-popup__footer_custom">
              <slot name="footer"></slot>
            </div>
            <TNFloatingButtons
              v-else-if="buttons"
              :max-mobile-width="maxMobileWidth"
              :buttons="buttons"
              :disabled="disabled.buttons"
              :position="buttonsPosition"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch, type CSSProperties } from "vue";
import type { VNode } from "vue";
import TNFloatingButtons from "../floating-buttons/floating-buttons.vue";
import TNButton from "../button/button.vue";
import TNScroll from "../scroll/scroll.vue";
import type { ITNFloatingButton, ITNFloatingPosition } from "../floating-buttons/floating-buttons.types";
import type { ITNPopupDisabled } from "./popup.types";
import Overlay from "../overlay/overlay.vue";
import { useViewport } from "../../composables/use-viewport/use-viewport";
import { useLibraryOptions } from "../../composables/library-options";

const props = withDefaults(
  defineProps<{
    /** Заголовок для попапа **/
    title?: string;
    /** Подзаголовок для попапа **/
    subtitle?: string;
    /** Размер попапа **/
    size?: "sm" | "md";
    /** Массив кнопок для попапа **/
    buttons?: ITNFloatingButton[];
    /** Позиция кнопок **/
    buttonsPosition?: ITNFloatingPosition;
    /** Отображение кнопки "назад" **/
    back?: boolean;
    /** Отображение кнопки "закрыть" **/
    closable?: boolean;
    /** Максимальная ширина в мобильном разрешении в px **/
    maxMobileWidth?: number;
    /** Видимость попапа **/
    isVisible: boolean;
    /** Величина z-index **/
    zIndex?: `${number}` | number;
    /** Кастомный класс для контейнера попапа **/
    customClass?: string;
    /** Отключение слотов попапа **/
    disabled?: ITNPopupDisabled;
    /** Убирает затемнение вокруг компонента **/
    transparentBackground?: boolean;
  }>(),
  {
    size: "md",
    closable: true,
    zIndex: 10003,
    customClass: "",
    disabled: () => ({}),
    transparentBackground: false
  }
);

const emit = defineEmits<{
  /** Срабатывает при клике на кнопку закрытия **/
  (e: "back"): void;
  /** Срабатывает при клике на кнопку назад **/
  (e: "close", event: TouchEvent | MouseEvent): void;
  /** Срабатывает после завершения leave-анимации, когда попап полностью скрыт **/
  (e: "after-leave"): void;
  /** Событие вызывается при скролле **/
  (e: "scroll", event: Event): void;
}>();

defineSlots<{
  /** Слот для кастомного хедера **/
  header?: () => VNode[];
  /** Слот для контента **/
  default?: () => VNode[];
  /** Слот для кастомного футера **/
  footer?: () => VNode[];
}>();

const { mobileBreakPoint } = useLibraryOptions();
const { isMobile } = useViewport(props.maxMobileWidth ?? mobileBreakPoint ?? 0);

const shadow = ref<Record<"top" | "bottom", boolean>>({
  top: false,
  bottom: false
});
const scrollElement = ref<InstanceType<typeof TNScroll> | null>(null);

const styles = computed<CSSProperties | undefined>(() =>
  !isMobile.value
    ? {
        maxHeight: "calc(100dvh - 64px)"
      }
    : undefined
);

const isHeaderExist = computed<boolean>(() => !!(props.title || props.subtitle || isMobile.value));

const setShadow = (event?: Event) => {
  const element: HTMLDivElement | null = event?.target || scrollElement.value?.$el || null;

  if (!element) return;

  const isScrollable = element.scrollHeight > element.clientHeight;

  shadow.value.top = !isMobile.value && isScrollable && element.scrollTop !== 0;
  shadow.value.bottom = isScrollable && element.scrollHeight !== element.clientHeight + element.scrollTop;
};

const handleEscPress = () => props.closable && emit("close", new MouseEvent("click"));

watch(
  () => props.isVisible,
  value => {
    if (value) {
      nextTick().then(() => {
        setShadow();
      });
      document.body.classList.add("tn-popup-opened");
    } else {
      document.body.classList.remove("tn-popup-opened");
    }
  }
);

const setFocus = (ref?: VNode) => {
  nextTick().then(() => (ref?.el as HTMLElement)?.focus());
};

const handleBack = (event: MouseEvent | TouchEvent) => {
  if (isMobile.value) {
    emit("close", event);
  } else {
    emit("back");
  }
};

const clickOutside = (event: MouseEvent) => {
  if (props.closable) {
    emit("close", event);
  }
};

const classes = computed<string[]>(() => {
  const list: string[] = [props.customClass, `tn-popup__container_${props.size}`];

  if (isMobile.value) {
    list.push("tn-popup__container_mobile");
  }

  return list;
});
const scrollHandler = (event: Event) => {
  setShadow(event);
  emit("scroll", event);
};
</script>

<style lang="css">
.tn-popup {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  outline: none;
  pointer-events: none;
}

.tn-popup__header-container,
.tn-popup__footer {
  transition: box-shadow 0.3s linear;
}

.tn-popup__header-container_shadowed,
.tn-popup__footer_shadowed {
  box-shadow: var(--shadow-large);
}

.tn-popup-opened {
  overflow: hidden;
}

.tn-popup__container {
  border-radius: 16px;
  background-color: var(--background-primary-a-enabled);
  color: var(--content-primary-a-enabled);
  display: flex;
  flex-direction: column;
  width: calc(100% - 30px);
  position: relative;
  overflow: hidden;
  pointer-events: initial;
  box-shadow: var(--shadow-small);
}

.tn-popup__content_disabled:after,
.tn-popup__header-container_disabled:after,
.tn-popup__footer_disabled:after {
  content: "";
  background-color: var(--background-primary-a-enabled);
  opacity: 0.6;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
}

.tn-popup__container_sm {
  max-width: 520px;
}

.tn-popup__container_md {
  max-width: 900px;
}

.tn-popup__header {
  position: relative;
}

.tn-popup__header-container {
  padding: 24px;
  display: flex;
  align-items: baseline;
}

.tn-popup__back {
  margin-right: 12px;
  position: absolute;
  z-index: 1;
  top: 24px;
  left: 24px;
}

.tn-popup__titles {
  display: inline-block;
}

.tn-popup__titles_back {
  margin-left: 44px;
}

.tn-popup__title {
  font-weight: var(--font-weight-heading);
  font-size: var(--font-size-headline-medium);
  line-height: var(--font-lineHeight-headline-medium);
  margin-right: 62px;
  word-break: break-word;
}

.tn-popup__title:not(:has(+ .tn-popup__subtitle)) {
  min-height: 48px;
}

.tn-popup__subtitle {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  margin-top: 4px;
  margin-right: 50px;
  word-break: break-word;
}

.tn-popup__close {
  line-height: 24px;
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 1;
}

.tn-popup__content {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  padding: 0 24px;
  overflow: auto;
  overscroll-behavior: contain;
}

.tn-popup__container:not(:has(.tn-popup__header-container)) .tn-popup__content {
  padding-top: 32px;
  border-radius: 16px;
}

.tn-popup__footer {
  position: relative;
  border-radius: 0 0 16px 16px;
  background-color: var(--background-primary-a-enabled);
}

.tn-popup__footer_custom {
  padding: 12px 24px 24px;
}

.tn-popup__container_mobile {
  top: 0;
  bottom: 0;
  width: 100%;
  border-radius: 0;
  position: fixed;
  max-width: 100%;
}

.tn-popup__container_mobile .tn-popup__subtitle,
.tn-popup__container_mobile .tn-popup__close {
  display: none;
}

.tn-popup__container_mobile .tn-popup__header-container {
  min-height: 57px;
  padding: 16px;
  border-bottom: 1px solid var(--border-secondary-enabled);
}

.tn-popup__container_mobile .tn-popup__titles {
  margin: 0 auto;
  align-self: center;
}

.tn-popup__container_mobile .tn-popup__title {
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  text-align: center;
  margin-right: 0;
  min-height: unset;
}

.tn-popup__container_mobile .tn-popup__content {
  padding: 16px;
}

.tn-popup__container_mobile .tn-popup__back {
  top: 50%;
  transform: translateY(-50%);
  left: 6px;
  font-size: 24px;
  margin-top: 0;
}

.tn-popup__container_mobile .tn-popup__footer {
  border-radius: unset;
  overflow: unset;
}

.tn-popup__container_mobile .tn-popup__footer_custom {
  padding: 12px 16px 16px;
}

.tn-popup__content > [data-overlayscrollbars-viewport] {
  z-index: auto !important;
}

/*Transition*/

.tn-popup-enter-active,
.tn-popup-leave-active {
  transition: opacity 0.2s ease;
}

.tn-popup-enter-from,
.tn-popup-leave-to {
  opacity: 0;
}

.tn-popup-enter,
.tn-popup-enter-to,
.tn-popup-leave {
  opacity: 1;
}

.tn-popup-enter-active .tn-popup__container:not(.tn-popup__container_mobile),
.tn-popup-leave-active .tn-popup__container:not(.tn-popup__container_mobile) {
  transition: transform 0.3s ease;
}

.tn-popup-enter-from .tn-popup__container:not(.tn-popup__container_mobile),
.tn-popup-leave-to .tn-popup__container:not(.tn-popup__container_mobile) {
  transform: scale(0.9);
}

.tn-popup-enter-to .tn-popup__container:not(.tn-popup__container_mobile),
.tn-popup-leave .tn-popup__container:not(.tn-popup__container_mobile),
.tn-popup-enter .tn-popup__container:not(.tn-popup__container_mobile) {
  transform: scale(1);
}
</style>
