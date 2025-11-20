import { useState, useMemo } from 'react';

/**
 * 가격 필터 상태를 관리하는 커스텀 훅
 */
export function usePriceFilters(user, getDefaultFiltersForUser) {
  const [filter, setFilter] = useState(null);

  // 사용자 기반 기본 필터 프리셋
  const preset = useMemo(() => 
    getDefaultFiltersForUser(user), 
    [user?.index, getDefaultFiltersForUser]
  );
  
  // 현재 적용될 필터 (페이지 상태 또는 프리셋)
  const effectiveFilters = useMemo(() => {
    if (!filter) return preset;
    return {
      ...preset,
      ...filter,
      count: filter.loadRowCount ?? preset.count,
    };
  }, [preset, filter]);

  return {
    filter,
    setFilter,
    preset,
    effectiveFilters,
  };
}

