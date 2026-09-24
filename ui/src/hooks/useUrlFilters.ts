import { useCallback, useEffect, useState } from 'react';
import { filtersFromSearch, filtersToSearch, type Filters } from '../lib/filters';

export function useUrlFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearch(window.location.search));

  useEffect(() => {
    const onPop = (): void => setFilters(filtersFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const search = filtersToSearch(filters);
    if (search !== window.location.search) window.history.replaceState(null, '', `${window.location.pathname}${search}`);
  }, [filters]);

  const update = useCallback((patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch })), []);
  return [filters, update];
}
