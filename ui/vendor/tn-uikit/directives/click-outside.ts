import clickOutsidePlugin from "click-outside-vue3";

/**
 * Директива `v-click-outside` для компонентов кита.
 *
 * Пакет отдаёт плагин (`{ install, directive }`), а не саму директиву. В `<script setup>` переменная с именем
 * `vClickOutside` объявляет локальную директиву и перекрывает глобальную, поэтому импорт плагина под этим именем
 * молча ломает обработку клика мимо: хуков жизненного цикла у объекта плагина нет.
 */
export const vClickOutside = clickOutsidePlugin.directive;
