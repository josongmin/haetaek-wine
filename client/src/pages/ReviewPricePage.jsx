// pages/ReviewPricePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';
import { toast } from 'react-hot-toast';
import PriceFilterForm from '../components/reviewPrice/PriceFilterForm';
import PriceList from '../components/reviewPrice/PriceList';
import AddWinePopup from '../components/reviewPrice/AddWinePopup';
import EditWineShopPricePopup from '../components/reviewPrice/EditWineShopPricePopup';
import UserPopup from '../components/reviewPrice/UserPopup';
import ShopPopup from '../components/reviewPrice/ShopPopup';
import WineSearchPopup from '../components/reviewPrice/WineSearchPopup';
import AiTextRecognitionModal from '../components/reviewPrice/AiTextRecognitionModal';
import { fetchWinePrices } from '../api/wineApi';
import SingleModalContainer from '../components/containers/SingleModalContainer';
import TwinModalStage from '../components/containers/TwinModalStage';
import PriceHistoryContent from '../components/common/PriceHistoryContent';
import IdealAuctionContent from '../components/common/IdealAuctionContent';
import { getDefaultFiltersForUser } from '../components/reviewPrice/PriceFilterForm'
import { ROLE_OPTIONS } from '../components/reviewPrice/SelectAdminWriterPopup';

export default function ReviewPricePage() {
  const { user } = useContext(UserContext);

  const [filter, setFilter] = useState(null);

  const preset = React.useMemo(() => getDefaultFiltersForUser(user), [user?.index]);
  
  // 2) (선택) 페이지 상태인 filter와 병합해서 폼에 내려줄 최종 초기값 결정
  //    - filter가 있으면 그걸 우선 (사용자가 이미 검색/필터를 바꿨을 때 유지)
  //    - 없으면 preset 사용
  const effectiveInitialFilters = React.useMemo(() => {
    if (!filter) return preset;
    return {
      ...preset,
      ...filter,
      count: filter.loadRowCount ?? preset.count,
    };
  }, [preset, filter]);

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 페이지에서 관리할 팝업 상태들
  const [showAddWinePopup, setShowAddWinePopup] = useState(false);
  const [addWineParams, setAddWineParams] = useState({ wineIndex: '', priceIndex: '', initialData: null });

  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [historyParams, setHistoryParams] = useState({ wineIndex: '', highlightPrice: null });

  const [showEditPricePopup, setShowEditPricePopup] = useState(false);
  const [editPriceParams, setEditPriceParams] = useState(null); // { item: PriceItem }
  const [addPriceFromOtherPrice, setAddPriceFromOtherPrice] = useState(false);
  const [writerForOverwrite, setWriterForOverwrite] = useState(null);

  const [showUserPopup, setShowUserPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [showShopPopup, setShowShopPopup] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState(null);

  const [showAuctionPopup, setShowAuctionPopup] = useState(false);
  const [showWineSearchPopup, setShowWineSearchPopup] = useState(false);
  const [showAiWineModal, setShowAiWineModal] = useState(false);


  // ✨ 뒤로가기 차단을 켤지 여부 (예: 항상 켬)
  const shouldConfirmOnLeave = true;
  // 예) 팝업 열려 있을 때만 막고 싶다면:
  // const shouldConfirmOnLeave =
  //   showAddWinePopup || showHistoryPopup || showEditPricePopup ||
  //   showUserPopup || showShopPopup || showAuctionPopup;
  useEffect(() => {
    if (!shouldConfirmOnLeave) return;

    // 1) 새로고침/탭 닫기 방지 (브라우저 기본 확인창)
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // 크롬/사파리 표준
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2) 트랙패드 뒤로가기(=popstate) 차단
    const push = () => {
      // 현재 URL로 더미 state를 하나 쌓아 뒤로가기가 먼저 이 state를 pop 하게 함
      window.history.pushState({ _block: true }, '', window.location.href);
    };

    // 마운트 시 한 번 더미 state 넣기
    push();

    const handlePopState = () => {
      // 사용자가 '뒤로가기' 제스쳐를 시도한 시점
      const ok = window.confirm('이 페이지에서 나가시겠어요? (작성/검토 중 변경사항이 사라질 수 있어요)');
      if (ok) {
        // 확인 → 리스너 해제 후 실제 이전 페이지로 이동
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        window.history.back(); // 진짜 이전 페이지로
      } else {
        // 취소 → 다시 현재 페이지에 더미 state를 쌓아 체류
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
    setAddPriceFromOtherPrice(true);  // 폼 주입 루틴 활성화
    setEditPriceParams(cloned);       // item으로 넘김 (WPR_index=null 이므로 새등록)
    setShowEditPricePopup(true);
  };

  const lastExists = (() => {
    try {
      if (typeof window === 'undefined') return false; // SSR 대비
      return !!localStorage.getItem('REVIEW_PRICE_LAST_SUBMITTED');
    } catch {
      return false;
    }
  })();


  // ① "팝업이 하나라도 열리면 body 스크롤을 막고, 아니면 다시 풀어주기"
  useEffect(() => {
    const anyPopupOpen =
      showAddWinePopup ||
      showHistoryPopup ||
      showEditPricePopup ||
      showUserPopup ||
      showShopPopup ||
      showAuctionPopup ||
      showWineSearchPopup ||
      showAiWineModal;

    document.body.style.overflow = anyPopupOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    showAddWinePopup,
    showHistoryPopup,
    showEditPricePopup,
    showUserPopup,
    showShopPopup,
    showAuctionPopup,
    showAiWineModal,
  ]);


  // 필터 제출 및 데이터 로드
  const handleFilterSubmit = async (filters) => {
    setIsLoading(true);
    setFilter(filters);
    const response = await fetchWinePrices(filters);
    setData(response);
    setIsLoading(false);
  };

  // PriceCell에서 어떤 액션을 요청했는지 감지
  const handleItemClick = (item, action) => {
    switch (action) {
      case 'openAddWine':
        setAddWineParams({ wineIndex: String(item.WPR_wineIndex), priceIndex: String(item.WPR_index) });
        setShowAddWinePopup(true);
        break;
      case 'openHistory':
        setHistoryParams({ wineIndex: String(item.WPR_wineIndex), highlightPrice: item });
        setShowHistoryPopup(true);
        break;
      case 'editPrice':
        setWriterForOverwrite(null);
        setEditPriceParams(item);
        setShowEditPricePopup(true);
        break;
      case 'cloneFromItem':
        setWriterForOverwrite(null);
        handleCloneFromItem(item);
        break;
      case 'openUser':
        setSelectedItem(item);
        setShowUserPopup(true);
        break;
      case 'openShop':
        setSelectedShopItem(item);
        setShowShopPopup(true);
        break;
      default:
        break;
    }
  };

  // "팝업 닫힘" 이벤트 처리
  const handleCloseAddWine = (modifiedWine) => {
    setShowAddWinePopup(false);
    setAddWineParams({ wineIndex: '', priceIndex: '', initialData: null }); // 초기화
    if (!modifiedWine?.WPR_index) return;
    // 변경된 내용을 data에 반영
    setData(prev =>
      prev.map(x =>
        Number(x.WPR_index) === Number(modifiedWine.WPR_index)
          ? { ...x, ...modifiedWine }
          : x
      )
    );
  };


  const handleSelectHistoryPrice = (priceItem) => {
    setWriterForOverwrite(null);
    setAddPriceFromOtherPrice(false);
    setEditPriceParams(priceItem);       // Edit 팝업에 넘길 item 세팅
    setShowEditPricePopup(true);         // Edit 팝업 열기
  };
  const handleSelectIdealAuctionPrice = (priceItem) => {
    setAddPriceFromOtherPrice(true);

    // 조건: 로그인된 사용자가 250일 때만 작성자를 6530로 덮어쓰기
    const ADMIN_INDEXES = [250, 3, 152, 195];
    const WRITER_INDEX_6530 = 6530;
    if (ADMIN_INDEXES.includes(Number(user?.index))) {
      const targetWriter = ROLE_OPTIONS.find(role => role.index === WRITER_INDEX_6530);
      if (targetWriter) {
        setWriterForOverwrite(targetWriter);
      }
    }

    const cloned = {
      ...priceItem,
      // WPR_writerIndex: ADMIN_INDEXES.includes(Number(user?.index)) ? WRITER_INDEX_6530 : priceItem.WPR_writerIndex,
    };

    setEditPriceParams(cloned);       // Edit 팝업에 넘길 item 세팅
    setShowEditPricePopup(true);         // Edit 팝업 열기
  };

  const handleCloseEditPrice = (modifiedItem) => {
    setShowEditPricePopup(false);
    // if (modifiedItem?.WPR_index) {
    //   setData(prev =>
    //     prev.map(x =>
    //       Number(x.WPR_index) === Number(modifiedItem.WPR_index)
    //         ? { ...x, ...modifiedItem }
    //         : x
    //     )
    //   );
    // }
  };
  const handleUpdateEditPrice = (modifiedItem) => {
    if (modifiedItem?.WPR_index) {
      setData(prev =>
        prev.map(x =>
          Number(x.WPR_index) === Number(modifiedItem.WPR_index)
            ? { ...x, ...modifiedItem }
            : x
        )
      );
    }
  };

  // 팝업 닫을 때 호출
  const handleCloseUserPopup = () => {
    setShowUserPopup(false);
    setSelectedItem(null);
  };

  // “등록한 가격 보기” 콜백: userIndex로 필터 다시 설정
  const handleViewPricesOfUser = async (userIndex) => {
    // 예: USER_INDEX로 재조회
    const newFilter = { ...filter, writerIndex: userIndex };
    setFilter(newFilter);
    setIsLoading(true);
    const response = await fetchWinePrices(newFilter);
    setData(response);
    setIsLoading(false);
    // 팝업 닫기
    setShowUserPopup(false);
  };

  const handleCloseShopPopup = () => {
    setShowShopPopup(false);
    setSelectedShopItem(null);
  };
  const handleViewPricesOfShop = async (shopIndex) => {
    // shopIndex와 shopName(지점 포함)을 같이 필터에 넣어줍니다.
    // selectedShopItem은 ShopPopup을 띄운 item(= PriceCell의 item)이고,
    // 여기에 WSH_title과 WSH_branch가 들어 있습니다.

    const newFilter = {
      ...filter,
      shopIndex: String(shopIndex),
      shopTitle: selectedShopItem.WSH_title,
      shopBranch: selectedShopItem.WSH_branch || '',
    };
    setFilter(newFilter);
    setIsLoading(true);
    const response = await fetchWinePrices(newFilter);
    setData(response);
    setIsLoading(false);
    // 팝업 닫기
    setShowShopPopup(false);
  };

  // ② “가격 추가” 버튼 클릭 시 호출
  const handleOpenAddPrice = () => {
    setWriterForOverwrite(null);
    setAddPriceFromOtherPrice(false); // ← 기본 새 등록 흐름
    setEditPriceParams({});
    setShowEditPricePopup(true);
  };


  // “직전 데이터 복제” 버튼
  const handleCloneLast = () => {
    try {
      const raw = localStorage.getItem('REVIEW_PRICE_LAST_SUBMITTED');
      if (!raw) {
        toast.error('직전에 저장한 데이터가 없습니다.');
        return;
      }
      const last = JSON.parse(raw);
      const cloned = buildCloneItem(last);
      if (!cloned) return;
      // 새 등록 모드로 열되, 폼은 last로 채우기
      setAddPriceFromOtherPrice(true);   // 폼 주입 루틴 활성화
      setEditPriceParams(cloned);        // item으로 넘김 (WPR_index=null 이므로 새등록)
      setShowEditPricePopup(true);
    } catch (e) {
      console.error(e);
      toast.error('복제할 데이터를 불러오지 못했습니다.');
    }
  };

  // PriceHistoryPopup 우측에 경매 팝업 띄우기 위한 핸들러
  const handleOpenAuctionPopup = () => setShowAuctionPopup(true);
  const handleCloseAuctionPopup = () => setShowAuctionPopup(false);

  // AI 와인 등록 핸들러
  const handleAiWineSearch = (wine) => {
    // 선택된 와인으로 가격 추가 팝업 열기
    // wine은 searchWines 결과이므로 index 필드를 사용
    if (wine && wine.index) {
      setWriterForOverwrite(null);
      setAddPriceFromOtherPrice(false);
      setEditPriceParams({
        WPR_wineIndex: wine.index,
      });
      setShowEditPricePopup(true);
    }
    setShowAiWineModal(false);
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
        initialFilters={effectiveInitialFilters}
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
          onClick={() => setShowAiWineModal(true)}
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
        onItemChange={(wprIndex, changes) => {
          if (changes.WPR_index === null) {
            setData(prev => prev.filter(item => Number(item.WPR_index) !== Number(wprIndex)));
          } else {
            setData(prev =>
              prev.map(item =>
                Number(item.WPR_index) === Number(wprIndex) ? { ...item, ...changes } : item
              )
            );
          }
        }}
      />

      {showAddWinePopup && (
        <AddWinePopup
          wineIndex={addWineParams.wineIndex}
          priceIndex={addWineParams.priceIndex}
          initialWineName={addWineParams.initialData?.titleKR}
          initialData={addWineParams.initialData}
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

      {showEditPricePopup && (
        <EditWineShopPricePopup
          item={editPriceParams}
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
          writerForOverwrite={writerForOverwrite}
          addPriceFromOtherPrice={addPriceFromOtherPrice}
        />
      )}

      {showUserPopup && selectedItem && (
        <UserPopup
          item={selectedItem}
          onClose={handleCloseUserPopup}
          onViewPrices={handleViewPricesOfUser}
        />
      )}

      {showShopPopup && selectedShopItem && (
        <ShopPopup
          item={selectedShopItem}
          onClose={handleCloseShopPopup}
          onViewPricesOfShop={handleViewPricesOfShop}
        />
      )}

      {showWineSearchPopup && (
        <WineSearchPopup
          isOpen={showWineSearchPopup}
          onClose={() => setShowWineSearchPopup(false)}
          onSelectWine={(wine) => {
            console.log('선택된 와인:', wine);
            // 필요시 추가 처리 로직
          }}
        />
      )}

      <AiTextRecognitionModal
        isOpen={showAiWineModal}
        onClose={() => setShowAiWineModal(false)}
        onSearch={handleAiWineSearch}
        onRegisterWine={(wineData) => {
          // 와인 등록 팝업 열기
          setAddWineParams({
            wineIndex: '',
            priceIndex: '',
            initialData: wineData // 카드에서 가져온 정보 전달
          });
          setShowAddWinePopup(true);
        }}
      />

      {/* 단독 가격비교 */}
      {showHistoryPopup && !showAuctionPopup && (
        <SingleModalContainer
          isOpen
          onClose={() => setShowHistoryPopup(false)}
          widthPx={480}
          contentLabel="Price History"
        >
          <PriceHistoryContent
            wineIndex={historyParams.wineIndex}
            count={15}
            highlightPrice={historyParams.highlightPrice}
            onClose={() => setShowHistoryPopup(false)}
            onSelectPrice={handleSelectHistoryPrice}
            onOpenAuctionPopup={() => setShowAuctionPopup(true)}
          />
        </SingleModalContainer>
      )}

      {/* 좌/우 동시 */}
      {showHistoryPopup && showAuctionPopup && (
        <TwinModalStage
          isOpen
          onCloseBoth={() => {
            setShowAuctionPopup(false);
            setShowHistoryPopup(false);
          }}
          boxWidthPx={400}
          boxMinWidthPx={360}
          contentLabel="Compare"
          left={
            <PriceHistoryContent
              wineIndex={historyParams.wineIndex}
              count={15}
              highlightPrice={historyParams.highlightPrice}
              onClose={() => { setShowAuctionPopup(false); setShowHistoryPopup(false); }}
              onSelectPrice={handleSelectHistoryPrice}
              onOpenAuctionPopup={() => setShowAuctionPopup(true)}
            />
          }
          right={
            <IdealAuctionContent
              wine={{
                title: historyParams?.highlightPrice?.WIN_title || '',
                titleKR: historyParams?.highlightPrice?.WIN_titleKR || '',
                thumbnailURLString: historyParams?.highlightPrice?.WIN_thumbnailURL || '',
                index: historyParams?.highlightPrice?.WPR_wineIndex || null,
              }}
              count={15}
              onClose={() => setShowAuctionPopup(false)}
              onSelectPrice={handleSelectIdealAuctionPrice}
              highlightPrice={historyParams.highlightPrice}
            />
          }
        />
      )}
    </div>
  );
}