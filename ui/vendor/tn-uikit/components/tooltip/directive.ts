import { createApp } from "vue";
import type { DirectiveBinding } from "vue";
import TNTooltip from "./tooltip.vue";

type TooltipBindingValue =
  | string
  | {
      text: string;
      position?: "top" | "bottom" | "left" | "right";
      light?: boolean;
      indent?: number;
    };

// Объявляем WeakMap для хранения функций очистки, чтобы была возможность удалить листенеры при размонтировании
const cleanupFunctions = new WeakMap<HTMLElement, () => void>();

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<TooltipBindingValue>) {
    const { text, position = "top", light = false, indent = 0 } = typeof binding.value === "object" ? binding.value : { text: binding.value };

    const tooltipElement = document.createElement("div");
    //Родителю не обязательно использовать position: relative, чтобы тултип работал корректно
    // вычисление позиции происходит за счет getBoundingClientRect()
    Object.assign(tooltipElement.style, {
      position: "absolute",
      visibility: "hidden",
      transition: "opacity 0.3s",
      opacity: "0"
    });

    document.body.appendChild(tooltipElement);

    const app = createApp(TNTooltip, {
      text,
      light,
      arrowPosition: {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
      }[position]
    });

    app.mount(tooltipElement);

    //TODO: переделать на props position => TNTooltip после рефакторинга TNTooltip и TNPopover
    const calculatePosition = () => {
      const rect = el.getBoundingClientRect();
      // отступ от элемента в пикселях 6 - это высота стрелки ее оставляем
      const offset = 6 + indent;

      const positions = {
        top: {
          top: rect.top - tooltipElement.offsetHeight - offset,
          left: rect.left + (rect.width - tooltipElement.offsetWidth) / 2
        },
        bottom: {
          top: rect.bottom + offset,
          left: rect.left + (rect.width - tooltipElement.offsetWidth) / 2
        },
        left: {
          top: rect.top + (rect.height - tooltipElement.offsetHeight) / 2,
          left: rect.left - tooltipElement.offsetWidth - offset
        },
        right: {
          top: rect.top + (rect.height - tooltipElement.offsetHeight) / 2,
          left: rect.right + offset
        }
      };

      const pos = positions[position];
      tooltipElement.style.top = `${pos.top}px`;
      tooltipElement.style.left = `${pos.left}px`;
    };

    const toggleTooltip = (event: MouseEvent, show: boolean) => {
      if (show) {
        calculatePosition();
        tooltipElement.style.visibility = "visible";
        tooltipElement.style.opacity = "1";
      } else {
        //определяем куда перешел курсор  после элемента
        const relatedTarget = event.relatedTarget as Node;
        if (
          // если курсор не на элементе и не на тултипе
          //это нужно для того чтобы тултип не скрывался если курсор перешел на элемент тултипа
          !el.contains(relatedTarget) &&
          !tooltipElement.contains(relatedTarget)
        ) {
          tooltipElement.style.visibility = "hidden";
          tooltipElement.style.opacity = "0";
        }
      }
    };

    const elEnterHandler = (event: MouseEvent) => toggleTooltip(event, true);
    const elLeaveHandler = (event: MouseEvent) => toggleTooltip(event, false);
    const tooltipEnterHandler = (event: MouseEvent) => toggleTooltip(event, true);
    const tooltipLeaveHandler = (event: MouseEvent) => toggleTooltip(event, false);

    el.addEventListener("mouseenter", elEnterHandler);
    el.addEventListener("mouseleave", elLeaveHandler);
    tooltipElement.addEventListener("mouseenter", tooltipEnterHandler);
    tooltipElement.addEventListener("mouseleave", tooltipLeaveHandler);

    cleanupFunctions.set(el, () => {
      el.removeEventListener("mouseenter", elEnterHandler);
      el.removeEventListener("mouseleave", elLeaveHandler);
      tooltipElement.removeEventListener("mouseenter", tooltipEnterHandler);
      tooltipElement.removeEventListener("mouseleave", tooltipLeaveHandler);
      document.body.removeChild(tooltipElement);
    });
  },

  unmounted(el: HTMLElement) {
    const cleanup = cleanupFunctions.get(el);
    if (cleanup) {
      cleanup();
      cleanupFunctions.delete(el);
    }
  }
};
