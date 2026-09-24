import { VNode } from "vue";

export interface TNFormItemProps {
  /** Выводит звездочку после заголовка компонента. */
  required?: boolean;
  /** Текст заголовка компонента. */
  label?: string;
  /** Текст описания компонента. */
  description?: string;
  /** Текст ошибки. Включает error-стиль компонента. */
  error?: string;
  /** Текст предупреждения. Включает warning-стиль компонента. */
  warn?: string;
  /** Текст успеха. Включает success-стиль компонента. */
  success?: string;
  /** Добавляет плавную анимацию появления текста ошибки, предупреждения или успеха. */
  smoothMessage?: boolean;
}

export interface TNFormItemSlots {
  /** Слот для кастомного заголовка компонента. */
  label?: () => VNode[];
  /** Слот для кастомного описания компонента. */
  description?: () => VNode[];
  /** Слот для кастомного footer-блока. */
  footer?: () => VNode[];
  /** Слот для кастомного header-блока над полем ввода. */
  header?: () => VNode[];
}
