import type { IconNames } from "../icons/icon-names";

export interface TNScrollSelectOption<TId extends string | number = string | number> {
  id: TId;
  title: string;
  isLoad?: boolean;
  disableSelect?: boolean;
  iconButton?: IconNames;
}
