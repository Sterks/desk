import type { UseFloatingOptions } from "@floating-ui/vue";

export type ITNPopoverPosition =
  "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "right" | "right-left" | "right-right" | "left" | "left-left" | "left-right";

export interface IPopoverOptions extends UseFloatingOptions {
  teleport?: string;
  zIndex?: number;
  offset?: number | { crossAxis?: number; mainAxis?: number };
  trigger?: "default" | "hover";
}

export type ITNPopoverArrowPosition = "auto" | ITNPopoverPosition;
