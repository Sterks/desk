import { onMounted, onUnmounted, readonly, ref } from "vue";

export const useViewport = (mobileBreakpoint: number) => {
  const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);

  const isMobile = ref(mediaQuery.matches);
  const isDesktop = ref(!isMobile.value);

  const update = (event: MediaQueryListEvent) => {
    isMobile.value = event.matches;
    isDesktop.value = !isMobile.value;
  };

  onMounted(() => {
    mediaQuery.addEventListener("change", update);
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener("change", update);
  });

  return {
    isMobile: readonly(isMobile),
    isDesktop: readonly(isDesktop)
  };
};
