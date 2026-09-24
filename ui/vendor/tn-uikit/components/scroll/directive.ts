import type { DirectiveBinding } from "vue";
import { OverlayScrollbars, ClickScrollPlugin } from "overlayscrollbars";
import type { ITNScrollOptions } from "./scroll.types";
import { setScrollbarsOptions } from "../../helpers";

OverlayScrollbars.plugin(ClickScrollPlugin);

const handleScroll = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

const clearEventListeners = (el: HTMLElement) => {
  el.removeEventListener("wheel", handleScroll);
  el.removeEventListener("touchmove", handleScroll);
  el.removeEventListener("keydown", handleScroll);
};

const setAttributes = (el: HTMLElement, options?: ITNScrollOptions) => {
  const disabled = options?.disabled;
  const offset = options?.offset ?? true;

  el.classList.add("tn-scroll");

  if (offset) {
    el.classList.add("tn-scroll_offset");
  }

  if (disabled) {
    el.classList.add("tn-scroll_disabled");
  } else {
    el.classList.remove("tn-scroll_disabled");
  }

  if (disabled) {
    ["wheel", "touchmove", "keydown", "scroll"].forEach(event => el.addEventListener(event, handleScroll, { passive: false }));
  } else {
    clearEventListeners(el);
  }
};

export const initCustomScroll = (el: HTMLElement, options?: ITNScrollOptions): OverlayScrollbars => {
  el.setAttribute("data-overlayscrollbars-initialize", "");
  el.classList.add("tn-scroll");

  const offset = options?.offset ?? true;

  if (offset) {
    el.classList.add("tn-scroll_offset");
  }

  return OverlayScrollbars({ target: el }, setScrollbarsOptions(options));
};

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<ITNScrollOptions>) {
    el.setAttribute("data-overlayscrollbars-initialize", "");
    setAttributes(el, binding.value);
    OverlayScrollbars({ target: el }, setScrollbarsOptions(binding.value));
  },
  updated(el: HTMLElement, binding: DirectiveBinding<ITNScrollOptions>) {
    setAttributes(el, binding.value);
  },
  beforeUnmount(el: HTMLElement) {
    clearEventListeners(el);
  }
};
