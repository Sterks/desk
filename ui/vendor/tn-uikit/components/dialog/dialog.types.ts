import type { VNode } from "vue";
import type { TNButton } from "../button";

/**
 * Сообщение диалога. Строка отображается описанием в шапке под заголовком, `VNode` — в теле диалога.
 * Фабрика `() => VNode` предпочтительнее готового `VNode`:
 * `VNode` одноразовый, поэтому переиспользовать один и тот же объект между вызовами нельзя
 */
export type ITNDialogMessage = string | VNode | (() => VNode);

/** Опции диалога */
export interface ITNDialogOptions {
  /** Заголовок в шапке диалога */
  title?: string;
  /** Текст кнопки подтверждения. По умолчанию "Хорошо" у showAlert и "Подтвердить" у showConfirm */
  confirmText?: string;
  /** Пропсы TNButton для кнопки подтверждения */
  confirmButtonProps?: InstanceType<typeof TNButton>["$props"];
  /**
   * Обработчик подтверждения. Пока возвращённый Promise в полёте, кнопка подтверждения показывает
   * загрузку, а остальные способы закрытия заблокированы. Reject оставляет диалог открытым
   */
  onConfirm?: () => Promise<unknown> | unknown;
  /**
   * Обработчик ошибки `onConfirm`. Настоятельно рекомендуется передавать вместе с `onConfirm`:
   * диалог при ошибке остаётся открытым, поэтому внешний Promise ещё не завершён и сообщить
   * об ошибке через него нельзя.
   *
   * Без обработчика ошибка отдаётся в конвейер ошибок Vue: попадёт в `app.config.errorHandler`,
   * если он задан, иначе Vue выведет предупреждение и перебросит ошибку — в dev-режиме
   * это видно как unhandled rejection
   */
  onError?: (error: unknown) => void;
  /**
   * Разрешает закрыть диалог крестиком, затемнением, ESC и свайпом — всё это равнозначно отмене.
   * По умолчанию `false`: диалог закрывается только кнопками, то есть выбор обязателен.
   * Внимание: у `TNPopup` одноимённый проп по умолчанию `true`
   */
  closable?: boolean;
  /** Селектор контейнера, куда добавляется слой диалога. По умолчанию `body` */
  teleportTo?: string;
  /** Добавляет кастомный класс в контейнер диалога (рядом с классом `tn-dialog`) */
  customClass?: string | string[];
}

/** Опции диалога подтверждения */
export interface ITNDialogConfirmOptions extends ITNDialogOptions {
  /** Текст кнопки отмены. По умолчанию "Отмена" */
  cancelText?: string;
  /** Пропсы TNButton для кнопки отмены */
  cancelButtonProps?: InstanceType<typeof TNButton>["$props"];
}

/** Опции по умолчанию для всех диалогов, созданных одним вызовом `useDialog` */
export type ITNDialogGlobalOptions = Omit<ITNDialogConfirmOptions, "onConfirm">;
