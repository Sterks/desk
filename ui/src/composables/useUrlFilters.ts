import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { filtersFromSearch, filtersToSearch, type Filters } from '../lib/filters';

export interface UrlFilters {
  filters: Ref<Filters>;
  setFilters(patch: Partial<Filters>): void;
}

export function useUrlFilters(): UrlFilters {
  const filters = ref<Filters>(filtersFromSearch(window.location.search)) as Ref<Filters>;

  const onPop = (): void => {
    filters.value = filtersFromSearch(window.location.search);
  };

  onMounted(() => window.addEventListener('popstate', onPop));
  onUnmounted(() => window.removeEventListener('popstate', onPop));

  watch(
    filters,
    (next) => {
      const search = filtersToSearch(next);
      if (search !== window.location.search) window.history.replaceState(null, '', `${window.location.pathname}${search}`);
    },
    { deep: true, immediate: true },
  );

  const setFilters = (patch: Partial<Filters>): void => {
    filters.value = { ...filters.value, ...patch };
  };

  return { filters, setFilters };
}
