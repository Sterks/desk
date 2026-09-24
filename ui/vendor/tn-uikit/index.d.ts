/// <reference path="./extend-types.d.ts" />

import type { App, Directive } from "vue";
import type { ITNLibraryOptions } from "./types";

// Импортируем типы компонентов из index файлов
import type { TNBottomSheet } from "./components/bottom-sheet";
import type { TNBreadcrumbs } from "./components/breadcrumbs";
import type { TNButton } from "./components/button";
import type { TNCheckbox } from "./components/checkbox";
import type { TNCheckboxRadioGroup } from "./components/checkbox-radio-group";
import type { TNIcon } from "./components/icons";
import type { TNInput } from "./components/input";
import type { TNProgressBar } from "./components/progress-bar";
import type { TNRadio } from "./components/radiobutton";
import type { TNSelector } from "./components/select";
import type { TNSelectV2 } from "./components/select_v2";
import type { TNMultiSelector } from "./components/multiselect";
import type { TNTabs } from "./components/tabs";
import type { TNTag } from "./components/tag";
import type { TNTextarea } from "./components/textarea";
import type { TNToaster } from "./components/toaster";
import type { TNTree } from "./components/tree";
import type { TNTumbler } from "./components/tumbler";
import type { TNDatepicker, TNRangeDatepicker } from "./components/datepicker";
import type { TNSearch } from "./components/search";
import type { TNTooltip } from "./components/tooltip";
import type { TNUserPicture } from "./components/user-picture";
import type { TNCell } from "./components/cell";
import type { TNFileIcon } from "./components/file-icon";
import type { TNCard } from "./components/card";
import type { TNDropdown } from "./components/dropdown";
import type { TNPagination } from "./components/pagination";
import type { TNMenuBar } from "./components/menu-bar";
import type { TNTable } from "./components/table";
import type { TNScroll } from "./components/scroll";
import type { TNPopup } from "./components/popup";
import type { TNPopover } from "./components/popover";
import type { TNFloatingButtons } from "./components/floating-buttons";
import type { TNEmptyContent } from "./components/empty-content";
import type { TNScrollSelect } from "./components/scroll-select";
import type { TNIllustration } from "./components/illustration";

// Плагин
declare const TNLifeUIKit: Plugin<ITNLibraryOptions | undefined>;

export default TNLifeUIKit;

/** Настройки директивы `v-click-outside`. */
export interface ITNClickOutsideOptions {
  /** Вызывается при клике за пределами элемента. */
  handler: (event: Event) => void;
  /**
   * Фильтр события: обработчик срабатывает, только когда middleware вернул `true`.
   * @default (event) => event — пропускает все события
   */
  middleware?: (event: Event) => boolean;
  /**
   * События, которые слушает директива — либо одно, либо другое, не оба сразу.
   * Значение по умолчанию выбирается один раз при загрузке пакета: если браузер сообщает о поддержке тача,
   * это `["touchstart"]`, и тогда клик мышью директива не отслеживает.
   */
  events?: string[];
  /**
   * Отключение обработки без снятия директивы: выключает только явное `false`.
   * @default true
   */
  isActive?: boolean;
  /**
   * Считать переход фокуса в iframe кликом снаружи.
   * @default true
   */
  detectIframe?: boolean;
  /**
   * Слушать события на фазе перехвата.
   * @default false
   */
  capture?: boolean;
}

/** Значение директивы `v-click-outside`: сам обработчик либо объект с настройками. */
export type ITNClickOutsideValue = ((event: Event) => void) | ITNClickOutsideOptions;

// Глобальная регистрация для template-автодополнения
declare module 'vue' {
  export interface GlobalComponents {
    TNBottomSheet: typeof TNBottomSheet;
    TNBreadcrumbs: typeof TNBreadcrumbs;
    TNButton: typeof TNButton;
    TNCheckbox: typeof TNCheckbox;
    TNCheckboxRadioGroup: typeof TNCheckboxRadioGroup;
    TNIcon: typeof TNIcon;
    TNInput: typeof TNInput;
    TNProgressBar: typeof TNProgressBar;
    TNRadio: typeof TNRadio;
    TNSelector: typeof TNSelector;
    TNSelectV2: typeof TNSelectV2;
    TNMultiSelector: typeof TNMultiSelector;
    TNTabs: typeof TNTabs;
    TNTag: typeof TNTag;
    TNTextarea: typeof TNTextarea;
    TNToaster: typeof TNToaster;
    TNTree: typeof TNTree;
    TNTumbler: typeof TNTumbler;
    TNDatepicker: typeof TNDatepicker;
    TNRangeDatepicker: typeof TNRangeDatepicker;
    TNSearch: typeof TNSearch;
    TNTooltip: typeof TNTooltip;
    TNUserPicture: typeof TNUserPicture;
    TNCell: typeof TNCell;
    TNFileIcon: typeof TNFileIcon;
    TNCard: typeof TNCard;
    TNDropdown: typeof TNDropdown;
    TNPagination: typeof TNPagination;
    TNMenuBar: typeof TNMenuBar;
    TNTable: typeof TNTable;
    TNScroll: typeof TNScroll;
    TNPopup: typeof TNPopup;
    TNPopover: typeof TNPopover;
    TNFloatingButtons: typeof TNFloatingButtons;
    TNEmptyContent: typeof TNEmptyContent;
    TNScrollSelect: typeof TNScrollSelect;
    TNIllustration: typeof TNIllustration;
  }

  export interface GlobalDirectives {
    /** Регистрируется плагином кита — потребителю объявлять её у себя не нужно. */
    vClickOutside: Directive<HTMLElement, ITNClickOutsideValue>;
  }
}

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
