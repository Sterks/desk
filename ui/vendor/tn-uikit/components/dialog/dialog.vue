<template>
  <TNBottomSheet
    :is-open="isOpen"
    :header="header"
    :teleport-to="teleportTo"
    :custom-class="containerClass"
    :lock-swipe="isLocked"
    @hide="onHide"
    @after-leave="onClosed"
  >
    <div v-if="messageNode" class="tn-dialog__content">
      <component :is="messageNode" />
    </div>
    <template #footer>
      <TNFloatingButtons class="tn-dialog__buttons" :buttons="buttons" />
    </template>
  </TNBottomSheet>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import TNBottomSheet from "../bottom-sheet/bottom-sheet.vue";
import TNFloatingButtons from "../floating-buttons/floating-buttons.vue";

import type { VNode } from "vue";
import type { TNBottomSheetHeader } from "../bottom-sheet/bottom-sheet.types";
import type { ITNFloatingButton } from "../floating-buttons/floating-buttons.types";
import type { ITNDialogConfirmOptions, ITNDialogMessage } from "./dialog.types";

defineOptions({
  name: "TNDialog"
});

const props = defineProps<{
  /** Сообщение диалога */
  message: ITNDialogMessage;
  /** Опции диалога; дефолты кнопок уже разрешены хуком, наличие `cancelText` определяет кнопку отмены */
  options: ITNDialogConfirmOptions & { confirmText: string };
  /** Селектор слоя, созданного композаблом */
  teleportTo: string;
  /** Колбэк завершения: true — подтверждено, false — отказ */
  onDone: (confirmed: boolean) => void;
  /** Колбэк после завершения leave-анимации, когда диалог полностью скрыт */
  onClosed: () => void;
}>();

const isOpen = ref<boolean>(false);
const pending = ref<boolean>(false);

/** Пока true, диалог закрывается только кнопками */
const isLocked = computed<boolean>(() => !props.options.closable || pending.value);

let isClosing = false;

// Телепорт TNBottomSheet появляется только после его onMounted, поэтому enter-анимация сыграет
// лишь на переключении false -> true после этой перерисовки. С `ref(true)` анимации не будет
onMounted(() => {
  nextTick(() => {
    isOpen.value = true;
  });
});

// Анмаунт при открытом диалоге (закрытие через onScopeDispose) минует watch TNPopup,
// и его scroll-lock остаётся на body навсегда
onUnmounted(() => {
  if (isOpen.value) {
    document.body.classList.remove("tn-popup-opened");
  }
});

const startClosing = (confirmed: boolean) => {
  if (isClosing) {
    return;
  }

  isClosing = true;
  isOpen.value = false;
  props.onDone(confirmed);
};

const onHide = () => {
  if (isLocked.value) {
    return;
  }

  startClosing(false);
};

const runConfirm = async () => {
  if (pending.value || isClosing) {
    return;
  }

  if (!props.options.onConfirm) {
    startClosing(true);
    return;
  }

  pending.value = true;

  try {
    await props.options.onConfirm();
    startClosing(true);
  } catch (error) {
    pending.value = false;

    if (props.options.onError) {
      props.options.onError(error);
      return;
    }

    // Диалог остался открытым, внешний Promise ещё не завершён — отдаём ошибку в конвейер Vue
    throw error;
  }
};

const header = computed<TNBottomSheetHeader>(() => ({
  title: props.options.title,
  description: typeof props.message === "string" ? props.message : undefined
}));

const messageNode = computed<VNode | undefined>(() => {
  if (typeof props.message === "string") {
    return undefined;
  }

  return typeof props.message === "function" ? props.message() : props.message;
});

const containerClass = computed<string[]>(() => {
  const locked = isLocked.value ? ["tn-dialog_locked"] : [];
  const custom = [props.options.customClass ?? []].flat();

  return ["tn-dialog", ...locked, ...custom];
});

const buttons = computed<ITNFloatingButton[]>(() => {
  const { confirmText, confirmButtonProps, cancelText, cancelButtonProps } = props.options;

  const confirmButton: ITNFloatingButton = {
    title: confirmText,
    props: { ...confirmButtonProps, loading: pending.value || confirmButtonProps?.loading },
    click: runConfirm
  };

  const cancelButton: ITNFloatingButton | undefined =
    cancelText !== undefined
      ? {
          title: cancelText,
          props: { ...cancelButtonProps, disabled: pending.value || cancelButtonProps?.disabled },
          click: () => startClosing(false)
        }
      : undefined;

  return [...(cancelButton ? [cancelButton] : []), confirmButton];
});
</script>

<style lang="css">
/* Стекинг-контекст слоя поднимает диалог выше standalone TNPopup (10003), не трогая общие компоненты */
.tn-dialog-layer {
  position: relative;
  z-index: 10010;
}

.tn-dialog__content {
  margin-bottom: 24px;
}

/* TNFloatingButtons на мобильном ставит padding инлайном, поэтому !important */
.tn-dialog__buttons {
  padding: 0 !important;
}

/* TNBottomSheet не пробрасывает size в TNPopup, а там дефолт md — 900px */
.tn-popup__container.tn-dialog {
  max-width: 520px;
}

/* Своего `closable` у TNBottomSheet нет, поэтому крестик убираем стилями */
.tn-popup__container.tn-dialog_locked .tn-popup__close {
  display: none;
}
</style>
