import { computed, ref, type ComputedRef } from 'vue';

const STORAGE_KEY = 'desk-theme';
type ThemeOverride = 'light' | 'dark' | null;

function readOverride(): ThemeOverride {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

/*
 * Состояние темы — на уровне модуля, одно на всё приложение. initTheme() вызывается из main.ts ДО
 * монтирования, поэтому класс `tn-dark-theme` стоит уже на экране «Загрузка доски…», на экране ошибки
 * данных и на аварийном экране AppRoot — раньше его ставил ThemeToggle в onMounted, а тот живёт
 * только в загруженной доске. systemDark — ref, который обновляет слушатель matchMedia, поэтому
 * иконка переключателя тоже следует за сменой темы ОС (media.matches сам по себе не реактивен).
 */
const override = ref<ThemeOverride>(null);
const systemDark = ref(false);
const isDark = computed(() => (override.value === null ? systemDark.value : override.value === 'dark'));
let initialized = false;

function apply(): void {
  document.documentElement.classList.toggle('tn-dark-theme', isDark.value);
}

export function initTheme(): void {
  if (initialized) return;
  initialized = true;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  override.value = readOverride();
  systemDark.value = media.matches;
  apply();
  // Слушатель живёт столько же, сколько страница: снимать его некому и незачем.
  media.addEventListener('change', (e) => {
    systemDark.value = e.matches;
    apply();
  });
}

function toggle(): void {
  override.value = isDark.value ? 'light' : 'dark';
  try {
    localStorage.setItem(STORAGE_KEY, override.value);
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — тема переключается только на эту сессию.
  }
  apply();
}

export function useTheme(): { isDark: ComputedRef<boolean>; toggle: () => void } {
  initTheme();
  return { isDark, toggle };
}
