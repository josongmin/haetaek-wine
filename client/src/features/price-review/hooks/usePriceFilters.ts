import { useState, useMemo } from 'react';

export interface User {
  index?: string | number;
  [key: string]: any;
}

export interface PriceFilter {
  writerIndex?: string;
  writerIsNotAdmin?: boolean;
  showReportedByUser?: boolean;
  showPassed?: boolean;
  showInReview?: boolean;
  showDeleted?: boolean;
  showReported?: boolean;
  showPassBeforeReview?: boolean;
  count?: number;
  loadRowCount?: number;
  [key: string]: any;
}

export type GetDefaultFiltersForUser = (user: User | null) => PriceFilter;

/**
 * 가격 필터 상태를 관리하는 커스텀 훅
 */
export function usePriceFilters(
  user: User | null,
  getDefaultFiltersForUser: GetDefaultFiltersForUser
) {
  const [filter, setFilter] = useState<PriceFilter | null>(null);

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

