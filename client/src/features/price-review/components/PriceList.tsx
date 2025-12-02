// PriceList.tsx
import React from 'react';
import PriceCell from './PriceCell';

interface PriceListProps {
  data: any[];
  onItemClick: (item: any, action: string) => void;
  onItemChange: (index: string | number, changes: any) => void;
}

export default function PriceList({ data, onItemClick, onItemChange }: PriceListProps) {
  // data가 없거나 배열이 아닌 경우 빈 배열로 처리
  const safeData = Array.isArray(data) ? data : [];
  
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {safeData.map(item => (
        <PriceCell
          key={item.WPR_index}
          item={item}
          onClickWineSection={() => onItemClick(item, 'openAddWine')}
          onClickSeeHistory={() => onItemClick(item, 'openHistory')}
          onClickPriceEdit={() => onItemClick(item, 'editPrice')}
          onClickUser={() => onItemClick(item, 'openUser')}
          onClickShop={() => onItemClick(item, 'openShop')}
          onClickClone={() => onItemClick(item, 'cloneFromItem')}
          onItemChange={onItemChange}
        />
      ))}
    </div>
  );
}

