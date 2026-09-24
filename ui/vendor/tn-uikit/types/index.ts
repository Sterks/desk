import type { MaskTokens } from "maska";

// Опции настройки плагина UI Kit
export interface ITNLibraryOptions {
  // Определяет точку перехода для мобильного вида. Значение по умолчанию: 768
  mobileBreakPoint?: number;
  // Кастомные шаблоны маскирования
  inputMaskTemplates?: MaskTokens;
}

export * from "../components/toaster/toaster.types";
export * from "../components/dialog/dialog.types";
export * from "../components/breadcrumbs/breadcrumbs.types";
export * from "../components/tree/tree.types";
export * from "../components/dropdown/dropdown.types";
export * from "../components/tabs/tabs.types";
export * from "../components/datepicker/datepicker.types";
export * from "../components/cell/cell.types";
export * from "../components/file-icon/file-icon.types";
export * from "../components/menu-bar/menu-bar.types";
export * from "../components/search/search.types";
export * from "../components/table/table.types";
export * from "../components/floating-buttons/floating-buttons.types";
export * from "../components/popup/popup.types";
export * from "../components/scroll/scroll.types";
export * from "../components/checkbox-radio-group/checkbox-radio-group.types";
export * from "../components/popover/popover.types";
export * from "../components/scroll-select/scroll-select.types";
export * from "../components/illustration/illustration.types";
export * from "../components/button/button.types";
export * from "../components/select_v2/select_v2.types";
