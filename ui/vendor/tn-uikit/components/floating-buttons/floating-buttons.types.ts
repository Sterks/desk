import { TNButton } from "../button";

export type ITNFloatingButton = {
  title: string;
  props?: InstanceType<typeof TNButton>["$props"];
  click: (event: MouseEvent) => Promise<void> | void;
};

export type ITNFloatingPosition =
  | "vertical"
  | "horizontal"
  | {
      mobile?: "vertical" | "horizontal";
      desktop?: "vertical" | "horizontal";
    };
