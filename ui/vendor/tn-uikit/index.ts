import vClickOutside from "click-outside-vue3";
import vTouchEvents from "vue3-touch-events";

import { TNBottomSheet } from "./components/bottom-sheet";
import { TNBreadcrumbs } from "./components/breadcrumbs";
import { TNButton } from "./components/button";
import { TNCard } from "./components/card";
import { TNCell } from "./components/cell";
import { TNCheckbox } from "./components/checkbox";
import { TNCheckboxRadioGroup } from "./components/checkbox-radio-group";
import { TNDatepicker, TNRangeDatepicker } from "./components/datepicker";
import { TNDropdown } from "./components/dropdown";
import { TNEmptyContent } from "./components/empty-content";
import { TNFileIcon } from "./components/file-icon";
import { TNFloatingButtons } from "./components/floating-buttons";
import { TNIcon } from "./components/icons";
import { TNIllustration } from "./components/illustration";
import { TNInput } from "./components/input";
import { TNMenuBar } from "./components/menu-bar";
import { TNMultiSelector } from "./components/multiselect";
import { TNPagination } from "./components/pagination";
import { TNPopover } from "./components/popover";
import { TNPopup } from "./components/popup";
import { TNProgressBar } from "./components/progress-bar";
import { TNRadio } from "./components/radiobutton";
import { TNScroll } from "./components/scroll";
import { TNScrollSelect } from "./components/scroll-select";
import { TNSearch } from "./components/search";
import { TNSelector } from "./components/select";
import { TNSelectV2 } from "./components/select_v2";
import { TNTable } from "./components/table";
import { TNTabs } from "./components/tabs";
import { TNTag } from "./components/tag";
import { TNTextarea } from "./components/textarea";
import { TNToaster } from "./components/toaster";
import { TNTooltip } from "./components/tooltip";
import { TNTree } from "./components/tree";
import { TNTumbler } from "./components/tumbler";
import { TNUserPicture } from "./components/user-picture";
import TNScrollDirective from "./components/scroll/directive";
import TNTooltipDirective from "./components/tooltip/directive";

import { addSVGSpriteToBody } from "./components/icons";

import type { App } from "vue";
import type { ITNLibraryOptions } from "./types";

export default {
  install: (app: App, options: ITNLibraryOptions = {}) => {
    app.use(vClickOutside);
    app.use<{ dragFrequency: number }>(vTouchEvents, { dragFrequency: 5 });
    app.directive("tn-scroll", TNScrollDirective);
    app.directive("tn-tooltip", TNTooltipDirective);
    addSVGSpriteToBody();

    app.component("TNBottomSheet", TNBottomSheet);
    app.component("TNBreadcrumbs", TNBreadcrumbs);
    app.component("TNButton", TNButton);
    app.component("TNCheckbox", TNCheckbox);
    app.component("TNCheckboxRadioGroup", TNCheckboxRadioGroup);
    app.component("TNIcon", TNIcon);
    app.component("TNInput", TNInput);
    app.component("TNProgressBar", TNProgressBar);
    app.component("TNRadio", TNRadio);
    app.component("TNSelector", TNSelector);
    app.component("TNSelectV2", TNSelectV2);
    app.component("TNMultiSelector", TNMultiSelector);
    app.component("TNTabs", TNTabs);
    app.component("TNTag", TNTag);
    app.component("TNTextarea", TNTextarea);
    app.component("TNToaster", TNToaster);
    app.component("TNTree", TNTree);
    app.component("TNTumbler", TNTumbler);
    app.component("TNDatepicker", TNDatepicker);
    app.component("TNRangeDatepicker", TNRangeDatepicker);
    app.component("TNSearch", TNSearch);
    app.component("TNTooltip", TNTooltip);
    app.component("TNUserPicture", TNUserPicture);
    app.component("TNCell", TNCell);
    app.component("TNFileIcon", TNFileIcon);
    app.component("TNCard", TNCard);
    app.component("TNDropdown", TNDropdown);
    app.component("TNPagination", TNPagination);
    app.component("TNMenuBar", TNMenuBar);
    app.component("TNTable", TNTable);
    app.component("TNScroll", TNScroll);
    app.component("TNPopup", TNPopup);
    app.component("TNPopover", TNPopover);
    app.component("TNFloatingButtons", TNFloatingButtons);
    app.component("TNEmptyContent", TNEmptyContent);
    app.component("TNScrollSelect", TNScrollSelect);
    app.component("TNIllustration", TNIllustration);

    /**
     * Значения конфигураций по умолчанию
     * @type { ITNLibraryOptions }
     */
    const defaultOptions = {
      mobileBreakPoint: 768
    };

    app.provide("libraryOptions", {
      ...defaultOptions,
      ...options
    });
  }
};

// Экспорт composables
export { useToaster } from "./components/toaster";
export { useDialog, isTNDialogCancel } from "./components/dialog";

// Экспорт компонентов
export { debounce, setDarkTheme, setScrollbarsOptions } from "./helpers";
export { recursive, getOptionsTree, recursiveArray, recursiveParents, getIsDependsParent, getIsIndeterminate } from "./components/tree/helpers";
export { initCustomScroll } from "./components/scroll/directive";

// Экспорт всех типов
export * from "./types";
export * from "./components/icons/icon-names";
export * from "./helpers";
export * from "./components/tree/helpers";
export * from "./components/scroll/directive";
export { TransitionCollapse } from "./components/transitions";
