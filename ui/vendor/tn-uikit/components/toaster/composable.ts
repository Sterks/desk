import type { ITNToastOptions, ITNToast } from "./toaster.types";
import { createVNode, reactive, ref, render } from "vue";
import type { VNode } from "vue";
import TNToaster from "./toaster.vue";

const toastList = ref<ITNToast[]>([]);
let vNode: VNode | undefined;

/**
 * Composable для управления toast-уведомлениями
 *
 * @example
 * ```ts
 * const { showToast } = useToaster();
 * showToast('Успешно!', { toast: { type: 'success', duration: 1000, icon: 'check' } });
 * ```
 */
export const useToaster = (element = document.body) => {
  return (message: string | VNode, payload?: ITNToastOptions) => {
    const creationTime = new Date().getTime();

    const pushToast = () => {
      toastList.value.push({
        ...(payload?.toast || {}),
        text: message,
        duration: payload?.toast?.duration || 1000,
        creationTime,
        type: payload?.toast?.type || "info",
        timeOutCallback: () => {
          const ti = toastList.value.findIndex(t => t.creationTime === creationTime);

          if (ti !== -1 && vNode) {
            toastList.value.splice(ti, 1);
            if (payload?.toast?.timeOutCallback) {
              payload.toast.timeOutCallback();
            }
          }
        },
        canceledCallback: () => {
          const ti = toastList.value.findIndex(t => t.creationTime === creationTime);

          if (ti !== -1 && vNode) {
            toastList.value.splice(ti, 1);
            if (payload?.toast?.canceledCallback) {
              payload.toast.canceledCallback();
            }
          }
        },
        onClick: payload?.toast?.onClick
          ? () => {
              const ti = toastList.value.findIndex(t => t.creationTime === creationTime);

              if (ti !== -1 && vNode) {
                toastList.value.splice(ti, 1);
                if (payload?.toast?.onClick) {
                  payload.toast.onClick();
                }
              }
            }
          : undefined
      });
    };

    if (vNode) {
      pushToast();
    } else {
      const props: {
        toastList: ITNToast[];
        compose: boolean;
        bottom?: boolean;
      } = reactive({
        toastList: toastList.value,
        bottom: payload?.bottom,
        compose: true
      });
      setTimeout(pushToast);
      vNode = createVNode(TNToaster, props);
      render(vNode, element);
    }
  };
};
