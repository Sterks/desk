import { getCurrentInstance, h, onScopeDispose, render } from "vue";

import TNDialog from "./dialog.vue";

import type { AppContext } from "vue";
import type { ITNDialogConfirmOptions, ITNDialogGlobalOptions, ITNDialogMessage, ITNDialogOptions } from "./dialog.types";

const CANCEL_ERROR_NAME = "TNDialogCancelError";

let layerCounter = 0;

const createDialogCancelError = (): Error => {
  const error = new Error("Диалог закрыт без подтверждения");
  error.name = CANCEL_ERROR_NAME;
  return error;
};

/**
 * Проверяет, что пользователь отказался, а не что упал код внутри `try`.
 *
 * @example
 * ```ts
 * try {
 *   await showConfirm("Удалить запись?");
 *   await api.remove(id);
 * } catch (error) {
 *   if (isTNDialogCancel(error)) return;
 *   throw error;
 * }
 * ```
 */
export const isTNDialogCancel = (error: unknown): error is Error =>
  typeof error === "object" && error !== null && (error as { name?: string }).name === CANCEL_ERROR_NAME;

const openDialog = (
  message: ITNDialogMessage,
  options: ITNDialogConfirmOptions & { confirmText: string },
  appContext: AppContext,
  abortHandlers: Set<() => void>
): Promise<void> => {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("[useDialog] недоступен без DOM: диалог нельзя показать при серверном рендеринге"));
  }

  return new Promise<void>((resolve, reject) => {
    const host = (options.teleportTo && document.querySelector(options.teleportTo)) || document.body;

    // Слой на вызов: даёт стекинг-контекст (см. .tn-dialog-layer) и порядок стека диалогов
    const layer = document.createElement("div");
    layer.id = `tn-dialog-layer-${++layerCounter}`;
    layer.className = "tn-dialog-layer";
    host.appendChild(layer);

    // Отдельный контейнер под инстанс: render(vnode, el) заменяет содержимое узла целиком
    const container = document.createElement("div");

    let isClosed = false;
    let confirmedOutcome = false;

    const destroy = () => {
      // При телепорте разметка живёт в слое, и убирает её именно unmount
      render(null, container);
      layer.remove();
    };

    const finish = (confirmed: boolean) => {
      destroy();

      // Диалог без кнопки отмены — уведомление, отказываться не от чего: любое закрытие резолвит
      if (confirmed || options.cancelText === undefined) {
        resolve();
        return;
      }

      reject(createDialogCancelError());
    };

    // Итог фиксируется в момент решения, а промис завершается после leave-анимации (см. onClosed):
    // иначе размонтирование в эти миллисекунды подменило бы уже принятый итог
    const close = (confirmed: boolean, immediate = false) => {
      if (isClosed) {
        return;
      }

      isClosed = true;
      confirmedOutcome = confirmed;
      abortHandlers.delete(abort);

      // Немедленно — при размонтировании родителя: доигрывать анимацию некому
      if (immediate) {
        finish(confirmed);
      }
    };

    const abort = () => close(false, true);

    abortHandlers.add(abort);

    const vNode = h(TNDialog, {
      message,
      options,
      teleportTo: `#${layer.id}`,
      onDone: close,
      // Guard обязателен: after-leave прилетает и без закрытия — при ресайзе через мобильный
      // брейкпоинт десктопный попап скрывается, уступая место боттом-щиту
      onClosed: () => {
        if (isClosed) {
          finish(confirmedOutcome);
        }
      }
    });
    vNode.appContext = appContext;

    try {
      render(vNode, container);
    } catch (error) {
      isClosed = true;
      abortHandlers.delete(abort);
      layer.remove();
      reject(error);
    }
  });
};

/**
 * Composable для программного вызова диалоговых окон.
 * На десктопе диалог отображается модальным окном (TNPopup), на мобильном — боттом-щитом (TNBottomSheet).
 *
 * Вызывать только внутри `setup()` / `<script setup>` — иначе бросает ошибку.
 *
 * `showConfirm` резолвится при подтверждении и отклоняется при отказе — отличить отказ от
 * настоящей ошибки помогает `isTNDialogCancel`. `showAlert` резолвится при любом закрытии.
 * Диалоги закрываются автоматически, когда размонтируется вызвавший их компонент.
 *
 * @example
 * ```ts
 * const { showAlert, showConfirm } = useDialog();
 *
 * await showAlert("Изменения сохранены", { title: "Готово" });
 *
 * try {
 *   await showConfirm("Удалить запись?", { title: "Подтверждение", confirmText: "Удалить" });
 *   await api.remove(id);
 * } catch (error) {
 *   if (isTNDialogCancel(error)) return;
 *   throw error;
 * }
 *
 * // Кнопка подтверждения покажет загрузку, пока идёт запрос
 * await showConfirm("Удалить запись?", { onConfirm: () => api.remove(id), onError: report });
 * ```
 */
export const useDialog = (globalOptions?: ITNDialogGlobalOptions) => {
  const instance = getCurrentInstance();

  if (!instance) {
    throw new Error("[useDialog] должен вызываться внутри setup()");
  }

  const { appContext } = instance;
  const abortHandlers = new Set<() => void>();

  // Диалог рендерится вне дерева приложения, иначе переживал бы навигацию роутера
  onScopeDispose(() => {
    [...abortHandlers].forEach(abort => abort());
  });

  return {
    /** Диалог-уведомление с одной кнопкой. Promise резолвится при любом закрытии */
    showAlert: (message: ITNDialogMessage, options?: ITNDialogOptions): Promise<void> => {
      const merged = { ...globalOptions, ...options };

      // Кнопки отмены у уведомления нет, даже если cancelText задан в глобальных опциях
      return openDialog(message, { ...merged, confirmText: merged.confirmText ?? "Хорошо", cancelText: undefined }, appContext, abortHandlers);
    },
    /** Диалог подтверждения. Promise резолвится при подтверждении, иначе отклоняется */
    showConfirm: (message: ITNDialogMessage, options?: ITNDialogConfirmOptions): Promise<void> => {
      const merged = { ...globalOptions, ...options };

      return openDialog(
        message,
        { ...merged, confirmText: merged.confirmText ?? "Подтвердить", cancelText: merged.cancelText ?? "Отмена" },
        appContext,
        abortHandlers
      );
    }
  };
};
