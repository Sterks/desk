import type { RouteLocationRaw } from "vue-router";

/** Данные пункта хлебных крошек */
export type BreadcrumbsItem = {
  /** Текст */
  text: string;
  /** Vue-router путь куда ведёт элемент */
  to?: RouteLocationRaw;
  /** Ссылка куда ведёт элемент */
  href?: string;
};
