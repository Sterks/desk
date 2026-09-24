import type { ScrollbarsAutoHideBehavior } from "overlayscrollbars";

export type ITNScrollOptions = {
  disabled?: boolean;
  offset?: boolean;
  autoHide?: boolean | ScrollbarsAutoHideBehavior;
  autoHideDelay?: number;
};
