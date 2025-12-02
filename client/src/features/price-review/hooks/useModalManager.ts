import { useState, useEffect } from 'react';

export interface AddWineParams {
  wineIndex?: string;
  priceIndex?: string;
  initialData?: any;
}

export interface HistoryParams {
  wineIndex?: string;
  highlightPrice?: any;
}

export interface EditPriceParams {
  [key: string]: any;
}

/**
 * 여러 모달의 상태를 관리하는 커스텀 훅
 */
export function useModalManager() {
  // 모달 상태들
  const [showAddWinePopup, setShowAddWinePopup] = useState(false);
  const [addWineParams, setAddWineParams] = useState<AddWineParams>({ 
    wineIndex: '', 
    priceIndex: '', 
    initialData: null 
  });

  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [historyParams, setHistoryParams] = useState<HistoryParams>({ 
    wineIndex: '', 
    highlightPrice: null 
  });

  const [showEditPricePopup, setShowEditPricePopup] = useState(false);
  const [editPriceParams, setEditPriceParams] = useState<EditPriceParams | null>(null);
  const [addPriceFromOtherPrice, setAddPriceFromOtherPrice] = useState(false);
  const [writerForOverwrite, setWriterForOverwrite] = useState<any>(null);

  const [showUserPopup, setShowUserPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [showShopPopup, setShowShopPopup] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<any>(null);

  const [showAuctionPopup, setShowAuctionPopup] = useState(false);
  const [showWineSearchPopup, setShowWineSearchPopup] = useState(false);
  const [showAiWineModal, setShowAiWineModal] = useState(false);

  // body 스크롤 제어
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
    showWineSearchPopup,
    showAiWineModal,
  ]);

  // 모달 열기 함수들
  const openAddWinePopup = (params: AddWineParams) => {
    setAddWineParams(params);
    setShowAddWinePopup(true);
  };

  const openHistoryPopup = (params: HistoryParams) => {
    setHistoryParams(params);
    setShowHistoryPopup(true);
  };

  const openEditPricePopup = (item: EditPriceParams, fromOtherPrice: boolean = false, writer: any = null) => {
    setWriterForOverwrite(writer);
    setAddPriceFromOtherPrice(fromOtherPrice);
    setEditPriceParams(item);
    setShowEditPricePopup(true);
  };

  const openUserPopup = (item: any) => {
    setSelectedItem(item);
    setShowUserPopup(true);
  };

  const openShopPopup = (item: any) => {
    setSelectedShopItem(item);
    setShowShopPopup(true);
  };

  const openAiWineModal = () => {
    setShowAiWineModal(true);
  };

  // 모달 닫기 함수들
  const closeAddWinePopup = () => {
    setShowAddWinePopup(false);
    setAddWineParams({ wineIndex: '', priceIndex: '', initialData: null });
  };

  const closeHistoryPopup = () => {
    setShowHistoryPopup(false);
  };

  const closeEditPricePopup = () => {
    setShowEditPricePopup(false);
  };

  const closeUserPopup = () => {
    setShowUserPopup(false);
    setSelectedItem(null);
  };

  const closeShopPopup = () => {
    setShowShopPopup(false);
    setSelectedShopItem(null);
  };

  const closeAuctionPopup = () => {
    setShowAuctionPopup(false);
  };

  const closeAiWineModal = () => {
    setShowAiWineModal(false);
  };

  const closeBoth = () => {
    setShowAuctionPopup(false);
    setShowHistoryPopup(false);
  };

  return {
    // 상태들
    showAddWinePopup,
    addWineParams,
    showHistoryPopup,
    historyParams,
    showEditPricePopup,
    editPriceParams,
    addPriceFromOtherPrice,
    writerForOverwrite,
    showUserPopup,
    selectedItem,
    showShopPopup,
    selectedShopItem,
    showAuctionPopup,
    setShowAuctionPopup,
    showWineSearchPopup,
    setShowWineSearchPopup,
    showAiWineModal,
    
    // 열기 함수들
    openAddWinePopup,
    openHistoryPopup,
    openEditPricePopup,
    openUserPopup,
    openShopPopup,
    openAiWineModal,
    
    // 닫기 함수들
    closeAddWinePopup,
    closeHistoryPopup,
    closeEditPricePopup,
    closeUserPopup,
    closeShopPopup,
    closeAuctionPopup,
    closeAiWineModal,
    closeBoth,
    
    // setter (필요한 경우)
    setAddWineParams,
    setEditPriceParams,
    setAddPriceFromOtherPrice,
    setWriterForOverwrite,
  };
}

