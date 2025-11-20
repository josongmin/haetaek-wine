// features/price-review/ReviewPricePage.jsx
import React, { useEffect, useContext } from 'react';
import { UserContext } from '../../UserContext';
import PriceFilterForm from './components/PriceFilterForm';
import PriceList from './components/PriceList';
import AddWinePopup from './components/modals/AddWinePopup';
import EditWineShopPricePopup from './components/EditWineShopPricePopup';
import UserPopup from './components/modals/UserPopup';
import ShopPopup from './components/modals/ShopPopup';
import WineSearchPopup from './components/modals/WineSearchPopup';
import AiTextRecognitionModal from './components/modals/AiTextRecognitionModal';
import { SingleModalContainer, TwinModalStage } from '../../shared/components/Modal';
import { PriceHistoryContent, IdealAuctionContent } from '../../shared/components/Content';
import { getDefaultFiltersForUser } from './components/PriceFilterForm';
import { ROLE_OPTIONS } from './components/modals/SelectAdminWriterPopup';
import { useModalManager, usePriceList, usePriceFilters } from './hooks';

export default function ReviewPricePage() {
  const { user } = useContext(UserContext);

  // Custom hooks
  const { filter, setFilter, effectiveFilters } = usePriceFilters(user, getDefaultFiltersForUser);
  const { data, isLoading, loadPrices, updateItem, setData } = usePriceList();
  const modals = useModalManager();


  // 뒤로가기 차단
  const shouldConfirmOnLeave = true;
  useEffect(() => {
    if (!shouldConfirmOnLeave) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const push = () => {
      window.history.pushState({ _block: true }, '', window.location.href);
    };

    push();

    const handlePopState = () => {
      const ok = window.confirm('이 페이지에서 나가시겠어요? (작성/검토 중 변경사항이 사라질 수 있어요)');
      if (ok) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      } else {
        push();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldConfirmOnLeave]);


  // 복제용으로 다듬은 item을 만들어주는 헬퍼
  const buildCloneItem = (lastItem) => {
    if (!lastItem) return null;
    return {
      ...lastItem,
      // ❗서버 PK/연결키는 제거해서 "새 등록" 흐름으로
      WPR_index: null,
      // 복제 시 기본값 가공 예시(원하면 비울 필드 비우기)
      //WPR_purchaseLink: '',
      //WPR_comment: '',
      // 날짜는 지금 시각으로
      //WPR_datetime: new Date().toISOString(),
      // 첨부사진은 새 등록에선 보통 비움
      //attachedPhotos: [],
    };
  };

  // 셀의 item을 바로 복제해서 팝업 열기
  const handleCloneFromItem = (priceItem) => {
    const cloned = buildCloneItem(priceItem);
    if (!cloned) return;
    modals.openEditPricePopup(cloned, true, null);
  };

  const lastExists = (() => {
    try {
      if (typeof window === 'undefined') return false; // SSR 대비
      return !!localStorage.getItem('REVIEW_PRICE_LAST_SUBMITTED');
    } catch {
      return false;
    }
  })();


  // body 스크롤 제어는 useModalManager에서 처리


  // 필터 제출 및 데이터 로드
  const handleFilterSubmit = async (filters) => {
    setFilter(filters);
    await loadPrices(filters);
  };

  // PriceCell에서 어떤 액션을 요청했는지 감지
  const handleItemClick = (item, action) => {
    switch (action) {
      case 'openAddWine':
        modals.openAddWinePopup({ wineIndex: String(item.WPR_wineIndex), priceIndex: String(item.WPR_index) });
        break;
      case 'openHistory':
        modals.openHistoryPopup({ wineIndex: String(item.WPR_wineIndex), highlightPrice: item });
        break;
      case 'editPrice':
        modals.openEditPricePopup(item);
        break;
      case 'cloneFromItem':
        handleCloneFromItem(item);
        break;
      case 'openUser':
        modals.openUserPopup(item);
        break;
      case 'openShop':
        modals.openShopPopup(item);
        break;
      default:
        break;
    }
  };

  // "팝업 닫힘" 이벤트 처리
  const handleCloseAddWine = (modifiedWine) => {
    modals.closeAddWinePopup();
    if (modifiedWine?.WPR_index) {
      updateItem(modifiedWine.WPR_index, modifiedWine);
    }
  };


  const handleSelectHistoryPrice = (priceItem) => {
    modals.openEditPricePopup(priceItem, false, null);
  };
  const handleSelectIdealAuctionPrice = (priceItem) => {
    const ADMIN_INDEXES = [250, 3, 152, 195];
    const WRITER_INDEX_6530 = 6530;
    
    let targetWriter = null;
    if (ADMIN_INDEXES.includes(Number(user?.index))) {
      targetWriter = ROLE_OPTIONS.find(role => role.index === WRITER_INDEX_6530);
    }

    const cloned = { ...priceItem };
    modals.openEditPricePopup(cloned, true, targetWriter);
  };

  const handleCloseEditPrice = () => {
    modals.closeEditPricePopup();
  };
  
  const handleUpdateEditPrice = (modifiedItem) => {
    if (modifiedItem?.WPR_index) {
      updateItem(modifiedItem.WPR_index, modifiedItem);
    }
  };

  // "등록한 가격 보기" 콜백: userIndex로 필터 다시 설정
  const handleViewPricesOfUser = async (userIndex) => {
    const newFilter = { ...filter, writerIndex: userIndex };
    setFilter(newFilter);
    await loadPrices(newFilter);
    modals.closeUserPopup();
  };

  const handleViewPricesOfShop = async (shopIndex) => {
    const newFilter = {
      ...filter,
      shopIndex: String(shopIndex),
      shopTitle: modals.selectedShopItem.WSH_title,
      shopBranch: modals.selectedShopItem.WSH_branch || '',
    };
    setFilter(newFilter);
    await loadPrices(newFilter);
    modals.closeShopPopup();
  };

  // "가격 추가" 버튼 클릭 시 호출
  const handleOpenAddPrice = () => {
    modals.openEditPricePopup({}, false, null);
  };


  // “직전 데이터 복제” 버튼
  const handleCloneLast = () => {
    try {
      const raw = localStorage.getItem('REVIEW_PRICE_LAST_SUBMITTED');
      if (!raw) {
        alert('직전에 저장한 데이터가 없습니다.');
        return;
      }
      const last = JSON.parse(raw);
      const cloned = buildCloneItem(last);
      if (!cloned) return;
      modals.openEditPricePopup(cloned, true, null);
    } catch (e) {
      console.error(e);
      alert('복제할 데이터를 불러오지 못했습니다.');
    }
  };

  // AI 와인 등록 핸들러
  const handleAiWineSearch = (wine) => {
    if (wine && wine.index) {
      modals.openEditPricePopup({ WPR_wineIndex: wine.index }, false, null);
    }
    modals.closeAiWineModal();
  };


  return (
    <div style={{
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box', // ★ 추가: 패딩 포함 너비 계산
      minHeight: '100vh',
      overflow: 'visible',
      position: 'static',
      height: 'auto'
    }}>
      <PriceFilterForm
        onSubmit={handleFilterSubmit}
        isLoading={isLoading}
        initialFilters={effectiveFilters}
      />
      {/* ── (2) 필터 바로 아래 "가격 추가" 버튼 ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleOpenAddPrice}
          style={{
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + 가격 추가
        </button>
        <button
          type="button"
          onClick={() => modals.openAiWineModal()}
          style={{
            backgroundColor: '#7c4dff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c4dff 0%, #9c27ff 100%)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            {/* 별 모양 */}
            <path 
              d="M8 1L9.5 5.5L14 6.5L10.5 9.5L11.5 14L8 11.5L4.5 14L5.5 9.5L2 6.5L6.5 5.5L8 1Z" 
              fill="currentColor"
            />
            {/* 막대기 */}
            <rect 
              x="7.5" 
              y="11" 
              width="1" 
              height="5" 
              rx="0.5" 
              fill="currentColor"
            />
          </svg>
          <span>AI 와인 등록</span>
        </button>

        {lastExists && (
          <button
            type="button"
            onClick={handleCloneLast}
            style={{
              marginLeft: 8,
              backgroundColor: lastExists ? '#198754' : '#a8b3a9',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            title={lastExists ? '직전에 저장한 데이터로 새 등록' : '직전 저장 데이터가 없습니다'}
          >
            직전 데이터 복제
          </button>
        )}
      </div>

      <PriceList
        data={data}
        onItemClick={handleItemClick}
        onItemChange={updateItem}
      />

      {modals.showAddWinePopup && (
        <AddWinePopup
          wineIndex={modals.addWineParams.wineIndex}
          priceIndex={modals.addWineParams.priceIndex}
          initialWineName={modals.addWineParams.initialData?.titleKR}
          initialData={modals.addWineParams.initialData}
          onClose={handleCloseAddWine}
        />
      )}

      {/* {showHistoryPopup && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: 500,
          width: '100%',
          marginTop: 40,
          gap: 32,
          overflow: 'visible',
          position: 'static',
          height: 'auto',
        }}>
          <div style={{ zIndex: 1000, marginRight: 0 }}>
            <PriceHistoryPopup
              wineIndex={historyParams.wineIndex}
              count={15}
              highlightPrice={historyParams.highlightPrice}
              onClose={handleCloseHistory}
              onSelectPrice={handleSelectHistoryPrice}
              onOpenAuctionPopup={handleOpenAuctionPopup}
              onSelectIdealAuctionPrice={handleSelectIdealAuctionPrice}
            />
          </div>
        </div>
      )} */}

      {modals.showEditPricePopup && (
        <EditWineShopPricePopup
          item={modals.editPriceParams}
          onClose={handleCloseEditPrice}
          onUpdateItem={handleUpdateEditPrice}
          initialShop={
            filter && filter.shopIndex
              ? {
                WSH_index: filter?.shopIndex || '',
                WSH_title: filter?.shopTitle || '',
                WSH_branch: filter?.shopBranch || '',
                WSH_headShopIndex: filter?.headShopIndex || '',
                WSH_priceUnitCode: filter?.priceUnitCode || '',
              }
              : null
          }
          initialWine={
            filter && filter.wineIndex
              ? {
                index: filter?.wineIndex || '',
                titleKR: filter?.wineName || '',
                thumbnailURLString: filter?.wineThumbnailURLString || '',
              }
              : null
          }
          writerForOverwrite={modals.writerForOverwrite}
          addPriceFromOtherPrice={modals.addPriceFromOtherPrice}
        />
      )}

      {modals.showUserPopup && modals.selectedItem && (
        <UserPopup
          item={modals.selectedItem}
          onClose={modals.closeUserPopup}
          onViewPrices={handleViewPricesOfUser}
        />
      )}

      {modals.showShopPopup && modals.selectedShopItem && (
        <ShopPopup
          item={modals.selectedShopItem}
          onClose={modals.closeShopPopup}
          onViewPricesOfShop={handleViewPricesOfShop}
        />
      )}

      {modals.showWineSearchPopup && (
        <WineSearchPopup
          isOpen={modals.showWineSearchPopup}
          onClose={() => modals.setShowWineSearchPopup(false)}
          onSelectWine={(wine) => {
            console.log('선택된 와인:', wine);
          }}
        />
      )}

      <AiTextRecognitionModal
        isOpen={modals.showAiWineModal}
        onClose={modals.closeAiWineModal}
        onSearch={handleAiWineSearch}
        onRegisterWine={(wineData) => {
          modals.openAddWinePopup({
            wineIndex: '',
            priceIndex: '',
            initialData: wineData
          });
        }}
      />

      {/* 단독 가격비교 */}
      {modals.showHistoryPopup && !modals.showAuctionPopup && (
        <SingleModalContainer
          isOpen
          onClose={modals.closeHistoryPopup}
          widthPx={480}
          contentLabel="Price History"
        >
          <PriceHistoryContent
            wineIndex={modals.historyParams.wineIndex}
            count={15}
            highlightPrice={modals.historyParams.highlightPrice}
            onClose={modals.closeHistoryPopup}
            onSelectPrice={handleSelectHistoryPrice}
            onOpenAuctionPopup={() => modals.setShowAuctionPopup(true)}
          />
        </SingleModalContainer>
      )}

      {/* 좌/우 동시 */}
      {modals.showHistoryPopup && modals.showAuctionPopup && (
        <TwinModalStage
          isOpen
          onCloseBoth={modals.closeBoth}
          boxWidthPx={400}
          boxMinWidthPx={360}
          contentLabel="Compare"
          left={
            <PriceHistoryContent
              wineIndex={modals.historyParams.wineIndex}
              count={15}
              highlightPrice={modals.historyParams.highlightPrice}
              onClose={modals.closeBoth}
              onSelectPrice={handleSelectHistoryPrice}
              onOpenAuctionPopup={() => modals.setShowAuctionPopup(true)}
            />
          }
          right={
            <IdealAuctionContent
              wine={{
                title: modals.historyParams?.highlightPrice?.WIN_title || '',
                titleKR: modals.historyParams?.highlightPrice?.WIN_titleKR || '',
                thumbnailURLString: modals.historyParams?.highlightPrice?.WIN_thumbnailURL || '',
                index: modals.historyParams?.highlightPrice?.WPR_wineIndex || null,
              }}
              count={15}
              onClose={modals.closeAuctionPopup}
              onSelectPrice={handleSelectIdealAuctionPrice}
              highlightPrice={modals.historyParams.highlightPrice}
            />
          }
        />
      )}
    </div>
  );
}