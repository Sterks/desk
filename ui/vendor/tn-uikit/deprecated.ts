import { watch, onMounted } from "vue";

export function useDeprecated(prop: () => unknown, text: string) {
  function installConstantPropWatch() {
    // eslint-disable-next-line no-console
    watch(prop, () => console.warn(text));
  }
  // eslint-disable-next-line no-console
  onMounted(() => console.warn(text));

  return { installConstantPropWatch };
}
