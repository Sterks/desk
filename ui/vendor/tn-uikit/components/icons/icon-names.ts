import { DefaultIconNames } from "./default-icons";
import { CustomIconNames } from "./custom-icons";

export type IconNames = (typeof DefaultIconNames)[number] | (typeof CustomIconNames)[number];
