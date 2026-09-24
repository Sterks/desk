import { inject } from "vue";

import type { ITNLibraryOptions } from "../types";

export const useLibraryOptions = () => {
  return inject<Readonly<ITNLibraryOptions>>("libraryOptions", {});
};
