<template>
  <div class="tn-toaster" :class="{ 'tn-toaster_bottom': bottom }">
    <transition-group name="tn-toast" tag="div" class="tn-toaster__container">
      <div
        v-for="(toast, index) in toastList"
        :key="toast.creationTime"
        class="tn-toaster__element"
        :class="'tn-toaster__element_' + toast.type"
        @click="toastClick(toast)"
      >
        <TNIcon v-if="toast.icon" class="tn-toaster__icon" :name="toast.icon" />
        <div v-else class="tn-toaster__countdown">
          <svg width="20px" height="20px">
            <circle
              transform="rotate(-90, 10, 10)"
              r="8.5"
              cx="10"
              cy="10"
              fill="transparent"
              stroke="#1E2228"
              stroke-width="1.5"
              stroke-linecap="round"
              :style="{
                animationDuration: toast.duration + 'ms'
              }"
            />
          </svg>
          <p class="tn-toaster__countdown-text">
            {{ countdownArray[index] + 1 }}
          </p>
        </div>
        <p class="tn-toaster__text">
          <template v-if="isVNode(toast.text)">
            <component :is="toast.text" />
          </template>
          <template v-else>
            {{ toast.text }}
          </template>
        </p>
        <button v-if="toast.cancelButtonText" class="tn-toaster__cancel-button" @click.stop="closeToast(toast)">
          {{ toast.cancelButtonText }}
        </button>
        <button v-else class="tn-toaster__close-button" @click.stop="closeToast(toast)"></button>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts" setup>
import { isVNode, onMounted, ref } from "vue";
import type { ITNToast } from "./toaster.types";
import TNIcon from "../icons/icon.vue";

defineOptions({
  name: "TNToaster"
});

const props = withDefaults(
  defineProps<{
    /** Список тостов **/
    toastList?: ITNToast[];
    /** Размещение тоста снизу экрана **/
    bottom?: boolean;
  }>(),
  {
    toastList: () => [],
    bottom: false
  }
);

const emit = defineEmits<{
  /** Событие вызывается при закрытии тоста **/
  (e: "closeToast", toast: ITNToast): void;
}>();

const countdownArray = ref<number[]>([]);

onMounted(() => {
  setInterval(() => {
    calculateDigits();
  }, 100);
  calculateDigits();
});

const calculateDigits = () => {
  countdownArray.value = props.toastList.map(toast => {
    const time = Math.floor((toast.duration - (new Date().getTime() - toast.creationTime)) / 1000);
    if (time <= -1) {
      if (toast.timeOutCallback) {
        toast.timeOutCallback();
      }
      emit("closeToast", toast);
    }
    return time;
  });
};
const closeToast = (toast: ITNToast) => {
  if (toast.canceledCallback) {
    toast.canceledCallback();
  }
  emit("closeToast", toast);
};
const toastClick = (toast: ITNToast) => {
  if (toast.onClick) {
    toast.onClick();
    emit("closeToast", toast);
  }
};
</script>

<style lang="css">
.tn-toaster {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 32;
  padding: 0;
  font-family: var(--font-family-body);
  pointer-events: none;
  --transform-direction: translateY(-150%);
}

.tn-toaster_bottom {
  --transform-direction: translateY(150%);
}

.tn-toaster__container {
  display: flex;
  flex-flow: column;
  align-items: flex-end;
}

.tn-toaster_bottom .tn-toaster__container {
  flex-direction: column-reverse;
}

.tn-toaster__element {
  --toast-color: var(--content-secondary-enabled);
  opacity: 1;
  background-color: var(--toast-color);
  transform: translate(0);
  overflow: hidden;
  display: flex;
  align-items: center;
  border-radius: 16px;
  padding: 8px 12px;
  max-width: 480px;
  min-width: 360px;
  margin-bottom: 0;
  position: relative;
  pointer-events: initial;
}

.tn-toaster__element_success {
  --toast-color: var(--content-system-positive);
}

.tn-toaster__element_warn {
  --toast-color: var(--content-system-warning);
}

.tn-toaster__element_error {
  --toast-color: var(--content-system-negative);
}

.tn-toaster__text {
  text-overflow: ellipsis;
  width: 100%;
  flex-grow: 1;
  overflow: hidden;
  font-weight: var(--font-weight-accent);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-lineHeight-body-medium);
  color: var(--neutral-white);
  margin: 0 16px;
}

.tn-toaster__element:not(:last-child) {
  margin-bottom: 10px;
}

.tn-toaster_bottom .tn-toaster__element:not(:last-child) {
  margin-bottom: 0;
  margin-top: 10px;
}

.tn-toaster__cancel-button {
  background-color: transparent;
  color: var(--neutral-white);
  font-weight: var(--font-weight-accent);
  border: none;
  padding: 4px 8px;
  line-height: 24px;
  transition: background-color 0.1s linear;
  border-radius: 8px;
  cursor: pointer;
}

.tn-toaster__cancel-button:hover {
  background-color: #ffffff33;
}

.tn-toaster__cancel-button:active {
  background-color: #ffffff19;
}

.tn-toaster__close-button {
  width: 24px;
  cursor: pointer;
  height: 24px;
  flex-shrink: 0;
  flex-grow: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289Z' fill='%23ffffff'/%3E%3C/svg%3E%0A");
  background-position: center;
  background-color: transparent;
  border: none;
  padding: 0;
}

.tn-toaster__icon {
  color: var(--content-primary-b-enabled);
}

.tn-toaster__countdown {
  background-color: var(--neutral-white);
  display: block;
  padding: 2px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  flex-grow: 0;
}

.tn-toaster__countdown svg {
  display: block;
}

.tn-toaster__countdown circle {
  animation-name: progress;
  animation-timing-function: linear;
  stroke-dasharray: 53 53;
}

.tn-toaster__countdown-text {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  font-weight: var(--font-weight-accent);
  font-size: var(--font-size-body-small);
  color: var(--neutral-100);
}

.tn-toast-enter-active,
.tn-toast-leave-active {
  transition-property: transform, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

.tn-toast-leave-active {
  transform: translateY(0);
  opacity: 1;
}

.tn-toast-enter,
.tn-toast-leave-to {
  transform: var(--transform-direction);
  opacity: 0;
}

.tn-toast-enter-active {
  transform: var(--transform-direction);
  opacity: 0;
}

.tn-toast-enter-from {
  transform: var(--transform-direction);
  opacity: 0;
}

.tn-toast-enter-to,
.tn-toast-leave {
  transform: translateY(0);
  opacity: 1;
}

@media screen and (max-width: 769px) {
  .tn-toaster {
    top: 7px;
    right: 7px;
    left: 7px;
  }

  .tn-toaster__element {
    width: 100%;
    min-width: unset;
    max-width: unset;
  }
}

@keyframes progress {
  from {
    stroke-dasharray: 0 53;
  }

  to {
    stroke-dasharray: 53 53;
  }
}
</style>
