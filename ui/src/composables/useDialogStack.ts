import { ref, type Ref } from 'vue';

/** Сколько TNPopup-диалогов сейчас открыто — TaskPanel.vue проверяет это перед закрытием по Escape,
 *  потому что TNPopup сам не глушит всплытие Escape (см. Part 3 README). */
export const dialogsOpen: Ref<number> = ref(0);

export function useDialogStack(): { register(): () => void } {
  return {
    register: () => {
      dialogsOpen.value += 1;
      return () => {
        dialogsOpen.value -= 1;
      };
    },
  };
}
