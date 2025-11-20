// src/components/reviewPrice/UserPopup.jsx
import React, { useState } from 'react';
import './UserPopup.css';
import { getHotDealCountOfUser } from '../../../../api/wineApi'

export default function UserPopup({
  item,
  onClose,
  onViewPrices,    // “등록한 가격 보기” 클릭 시 호출
}) {
  const user = item.writer || {};
  const avatarUrl = user.thumbnailURL || '';

    // “특가 등록 이력”용 state
    const [hotCountLast3, setHotCountLast3] = useState(null);
    const [hotCountAll, setHotCountAll] = useState(null);
    const [loadingHot, setLoadingHot] = useState(false);
    const [errorHot, setErrorHot] = useState(null);
  //  “특가 등록 이력 보기” 클릭 핸들러
  const handleViewHistory = async () => {
    setLoadingHot(true);
    setErrorHot(null);

    try {
      // 최근 3개월: days = 90
      const res3 = await getHotDealCountOfUser(user.index, 90);
      const count3 = res3?.success ? res3.data : Number(res3);

      // 전체 기간: days = null
      const resAll = await getHotDealCountOfUser(user.index, null);
      const countAll = resAll?.success ? resAll.data : Number(resAll);

      setHotCountLast3(count3);
      setHotCountAll(countAll);
    } catch (e) {
      console.error(e);
      setErrorHot('이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingHot(false);
    }
  };

  // “등록한 가격 보기” 버튼 클릭 시
  const handleViewPrices = () => {
    if (typeof onViewPrices === 'function') {
      onViewPrices(user.index);
    }
  };

  return (
    <div className="user-popup-overlay" onClick={onClose}>
      <div className="user-popup-container" onClick={e => e.stopPropagation()}>
        <button className="user-popup-close" onClick={onClose}>×</button>

        <div className="user-popup-content">
          {/* 좌측: 섬네일 */}
          <div className="user-thumbnail">
            {avatarUrl
              ? <img src={avatarUrl} alt="User Thumbnail" />
              : <div className="user-thumbnail-placeholder" />
            }
          </div>

          {/* 우측: 정보 */}
          <div className="user-info">
            {/* 첫 번째 줄: 닉네임(Index) */}
            <div className="user-name-line">
              <span className="user-nickname">{user.nickname}</span>
              <span className="user-index">({user.index})</span>
            </div>

            {/* 두 번째 줄: 아이디 */}
            <div className="user-id-line">
              {item.USR_id || '(아이디 정보 없음)'}
            </div>

            {/* 세 번째 줄: 레벨 45 (16 포인트) */}
            <div className="user-level-line">
              레벨 {user.level} ({user.point?.toLocaleString() ?? 0} 포인트)
            </div>

            {/* “특가 등록 이력 보기” 버튼 */}
            <div className="user-info-row">
              <button
                className="history-button"
                onClick={handleViewHistory}
                disabled={loadingHot}
              >
                {loadingHot ? '불러오는 중…' : '특가 등록 이력 보기'}
              </button>
            </div>

            {/* 이력 결과 */}
            {errorHot && (
              <div className="user-error">{errorHot}</div>
            )}
            {hotCountLast3 != null && hotCountAll != null && (
              <div className="history-results">
                <div>최근 3개월: {hotCountLast3}건</div>
                <div>전체 기간: {hotCountAll}건</div>
              </div>
            )}
          </div>
        </div>

        {/* 팝업 하단: “등록한 가격 보기” 버튼 */}
        <div className="user-popup-footer">
          <button
            type="button"
            className="user-popup-button prices-button"
            onClick={handleViewPrices}
          >
            등록한 가격 보기
          </button>
        </div>
      </div>
    </div>
  );
}