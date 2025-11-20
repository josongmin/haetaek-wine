// PriceList.jsx
import React from 'react';
import PriceCell from './PriceCell';

export default function PriceList({ data, onItemClick, onItemChange }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {data.map(item => (
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