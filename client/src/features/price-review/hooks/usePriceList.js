import { useState } from 'react';
import { fetchWinePrices } from '../../../api/wineApi';

/**
 * 가격 리스트 데이터를 관리하는 커스텀 훅
 */
export function usePriceList() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 데이터 로드
  const loadPrices = async (filters) => {
    setIsLoading(true);
    try {
      const response = await fetchWinePrices(filters);
      setData(response);
    } catch (error) {
      console.error('가격 데이터 로드 실패:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 개별 아이템 업데이트
  const updateItem = (wprIndex, changes) => {
    if (changes.WPR_index === null) {
      // 삭제
      setData(prev => prev.filter(item => Number(item.WPR_index) !== Number(wprIndex)));
    } else {
      // 업데이트
      setData(prev =>
        prev.map(item =>
          Number(item.WPR_index) === Number(wprIndex) 
            ? { ...item, ...changes } 
            : item
        )
      );
    }
  };

  // 데이터 초기화
  const clearData = () => {
    setData([]);
  };

  return {
    data,
    isLoading,
    loadPrices,
    updateItem,
    clearData,
    setData, // 직접 설정이 필요한 경우
  };
}

