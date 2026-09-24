import type { ITNScrollOptions } from "./components/scroll/scroll.types";

/**
 * Функция получения объекта опций для скроллбара
 *
 * @param options - настройки скроллбара
 * @returns - сформированный объект настроек
 */
export function setScrollbarsOptions(options?: ITNScrollOptions) {
  return {
    scrollbars: {
      theme: "tn-scroll__theme",
      autoHide: options?.autoHide === true ? "scroll" : typeof options?.autoHide === "string" ? options.autoHide : "never",
      autoHideDelay: typeof options?.autoHideDelay === "number" ? options.autoHideDelay : 1300,
      autoHideSuspend: true,
      dragScroll: !options?.disabled,
      pointers: options?.disabled ? [] : ["mouse", "touch", "pen"],
      clickScroll: !options?.disabled
    }
  };
}

/**
 * Откладывает вызов `callback` на `delay` мс от последнего обращения; повторное обращение сбрасывает отсчёт.
 * При `delay <= 0` вызывает сразу, синхронно. У возвращаемой функции есть `cancel()` — отменяет отложенный вызов.
 *
 * @param callback - функция, вызываемая по истечении задержки
 * @param delay - длительность задержки в мс
 */
export function debounce<T extends (...args: never[]) => void>(callback: T, delay: number) {
  let timeoutID: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => clearTimeout(timeoutID);

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    cancel();
    if (delay <= 0) {
      callback.apply(this, args);
      return;
    }
    timeoutID = setTimeout(() => callback.apply(this, args), delay);
  };

  return Object.assign(debounced, { cancel });
}

/**
 * Установка тёмной темы. Добавленный класс меняет цвета css-переменных на их цветопару тёмной темы.
 *
 * @param dark { "dark" | "light" } Тёмная тема
 */
export function setDarkTheme(dark: "dark" | "light") {
  document.body.classList.add("tn-dark-theme_no-transition");
  setTimeout(() => {
    document.body.classList.remove("tn-dark-theme_no-transition");
  }, 10);
  if (dark === "dark") {
    document.body.classList.add("tn-dark-theme");
  } else if (dark === "light") {
    document.body.classList.remove("tn-dark-theme");
  }
}

export function generateElementID(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}
