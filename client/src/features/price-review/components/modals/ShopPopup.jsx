// src/components/reviewPrice/ShopPopup.jsx
import React from 'react';
import './ShopPopup.css';
import {
  SHOP_STATUS_WAITING,
  SHOP_STATUS_PASS,
  SHOP_STATUS_REJECT,
  SHOP_STATUS_DELETED
} from '@myorg/shared/constants/wineShopStatus';
import {
  SHOP_TYPE_LOADSHOP,
  SHOP_TYPE_MART,
  SHOP_TYPE_GROBAL
} from '@myorg/shared/constants/wineShopType';

export default function ShopPopup({
  item,
  onClose,
  onViewPricesOfShop,
}) {
  const shopName = item.WSH_title || '(이름 없음)';
  const branch = item.WSH_branch || '';
  const status = item.WSH_status;
  const shopType = item.WSH_shopType;

  // 상태 태그 텍스트 & CSS 클래스 결정
  let statusText = '';
  let statusClass = '';
  switch (status) {
    case SHOP_STATUS_WAITING:
      statusText = '심사 대기';
      statusClass = 'status-waiting';
      break;
    case SHOP_STATUS_PASS:
      statusText = '등록';
      statusClass = 'status-pass';
      break;
    case SHOP_STATUS_REJECT:
      statusText = '거절';
      statusClass = 'status-reject';
      break;
    case SHOP_STATUS_DELETED:
      statusText = '삭제됨';
      statusClass = 'status-deleted';
      break;
    default:
      statusText = '알 수 없음';
      statusClass = 'status-unknown';
  }

  // 샵 타입 텍스트 결정
  let typeText = '';
  switch (shopType) {
    case SHOP_TYPE_LOADSHOP:
      typeText = '로드샵';
      break;
    case SHOP_TYPE_MART:
      typeText = '마트·백화점·편의점';
      break;
    case SHOP_TYPE_GROBAL:
      typeText = '해외 직구';
      break;
    default:
      typeText = '(타입 없음)';
  }

  // “등록한 가격 보기” 버튼 핸들러
  const handleViewPrices = () => {
    if (typeof onViewPricesOfShop === 'function') {
      onViewPricesOfShop(item.WPR_shopIndex);
    }
  };

  return (
    <div className="shop-popup-overlay" onClick={onClose}>
      <div className="shop-popup-container" onClick={e => e.stopPropagation()}>
        <button className="shop-popup-close" onClick={onClose}>×</button>

        <div className="shop-popup-content">
          {/* 왼쪽 플레이스홀더 */}
          <div className="shop-thumbnail-placeholder" />

          {/* 오른쪽 정보 */}
          <div className="shop-info">
            <div className="shop-name-line">
              <span className="shop-name">{shopName}</span>
            </div>
            {/* ── subtitle: 인덱스 정보 ── */}
            {(item.WSH_index || item.WSH_headShopIndex) && (
              <div className="shop-subtitle">
                ({item.WSH_index})
                {item.WSH_headShopIndex ? ` / ${item.WSH_headShopIndex}` : ''}
              </div>
            )}
            {branch && (
              <div className="shop-branch-line">{branch}</div>
            )}
            {/* 상태 태그 */}
            <span className={`shop-status-tag ${statusClass}`}>{statusText}</span>
            <div className="shop-type-line">{typeText}</div>
          </div>
        </div>

        {/* 하단: “전체 가격 보기” 버튼 (UserPopup과 동일 UI) */}
        <div className="shop-popup-footer">
          <button
            type="button"
            className="user-popup-button prices-button"
            onClick={handleViewPrices}
          >
            전체 가격 보기
          </button>
        </div>
      </div>
    </div>
  );
}