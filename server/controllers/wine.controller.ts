// controllers/wine.controller.ts
import type { Request, Response } from 'express';
import { getWinePriceListContainWineInfo as fetchWinePriceList, deleteWithRelatedData, changeWriter } from '../dao/winePrice.service.js';
import { getAttachedPhotosByWinePriceIndex, getAttachedPhotosByWinePriceIndices } from '../dao/winePhoto.service.js';
import { changeWineStatus, changeWineStatusToIncompleteIfNotPass } from '../dao/wine.service.js';
import { changePhotoType } from '../dao/winePhoto.service.js';
import { changeReviewStatus, setShowInSpecialPricePage, setShowInWineDetailPage, setStockCount, setNeededPointForShow, setHasReceipt } from '../dao/winePrice.service.js';
import {
  PRICE_STATUS_WAITING,
  PRICE_STATUS_PASS,
  PRICE_STATUS_PASS_BEFORE,
  PRICE_STATUS_REJECT,
  PRICE_STATUS_DELETED
} from '@myorg/shared/constants/winePriceStatusMap';

interface WinePriceListQuery {
  status?: string | string[];
  'status[]'?: string | string[];
  wineIndex?: string;
  shopIndex?: string;
  writerIndex?: string;
  writerIsNotAdmin?: string | boolean;
  showReportedByUser?: string | boolean;
  searchText?: string;
  lastRowIndex?: string;
  loadRowCount?: string | number;
  showPassed?: string | boolean;
  showInReview?: string | boolean;
  showReported?: string | boolean;
  showDeleted?: string | boolean;
  showPassBeforeReview?: string | boolean;
}

interface ChangePhotoStatusBody {
  photoIndex: number;
  status: number;
  accessToken: string;
}

interface UpdatePriceStatusBody {
  status: number;
  winePriceIndex: number;
  point?: number;
}

interface UpdatePriceWriterBody {
  winePriceIndex: number;
  writerIndex: number;
}

interface SetShowBody {
  show: boolean;
  winePriceIndex: number;
}

interface SetStockCountBody {
  stockCount: number;
  winePriceIndex: number;
}

interface SetNeededPointBody {
  point: number;
  winePriceIndex: number;
}

interface SetHasReceiptBody {
  hasReceipt: boolean;
  winePriceIndex: number;
}

interface DeletePriceBody {
  priceIndex: number;
  wineIndex: number;
}

interface UpdateWineStatusBody {
  status: number;
  wineIndex: number;
}

interface UpdateWineStatusToIncompleteBody {
  wineIndex: number;
}

const isTrue = (v: any): boolean => v === true || v === 'true';

export const getWinePriceList = async (req: Request<{}, {}, {}, WinePriceListQuery>, res: Response): Promise<void> => {
  try {
    // 1) status 파라미터 파싱
    // axios가 보내는 status[] 키 혹은 status 키 모두 지원
    let rawStatus = req.query.status ?? req.query['status[]'];
    let statusArray: string[] = [];

    if (Array.isArray(rawStatus)) {
      statusArray = rawStatus;
    } else if (typeof rawStatus === 'string') {
      statusArray = rawStatus.split(',');
    }
    // 이제 statusArray는 ["1"] 등 문자열 배열이 됨
    const useStatusArray = statusArray.length > 0;

    // 2) 전체 쿼리 복사
    const raw = { ...req.query };

     // 3) 기본 필터 객체: raw 에서 타입 변환이 필요한 것들만 덮어쓰기
    const filters = {
      ...raw,
      // 숫자로 파싱
      loadRowCount: Number(raw.loadRowCount ?? 40),
      lastRowIndex: raw.lastRowIndex ? Number(raw.lastRowIndex) : undefined,

      // boolean 변환
      writerIsNotAdmin: isTrue(raw.writerIsNotAdmin),
      showReportedByUser: isTrue(raw.showReportedByUser),

      // status 플래그: statusArray 우선, 없으면 구 플래그
      showPassed: useStatusArray
        ? statusArray.includes(String(PRICE_STATUS_PASS))
        : isTrue(raw.showPassed),
      showInReview: useStatusArray
        ? statusArray.includes(String(PRICE_STATUS_WAITING))
        : isTrue(raw.showInReview),
      showReported: useStatusArray
        ? statusArray.includes(String(PRICE_STATUS_REJECT))
        : isTrue(raw.showReported),
      showDeleted: useStatusArray
        ? statusArray.includes(String(PRICE_STATUS_DELETED))
        : isTrue(raw.showDeleted),
      showPassBeforeReview: useStatusArray
        ? statusArray.includes(String(PRICE_STATUS_PASS_BEFORE))
        : isTrue(raw.showPassBeforeReview),
    };

    const data = await fetchWinePriceList(filters);

    // N+1 문제 해결: 모든 사진을 한 번에 조회
    const priceIndices = data.map((row: any) => row.WPR_index);
    const photosByPriceIndex = await getAttachedPhotosByWinePriceIndices(priceIndices);

    const mapped = data.map((row: any) => {
      return {
        ...row,
        writer: {
          index: row.USR_index,
          id: row.USR_id,
          nickname: row.USR_nickname,
          level: row.USR_level,
          point: row.USR_point,
          thumbnailURL: row.USR_thumbnailURL,
        },
        attachedPhotos: photosByPriceIndex[row.WPR_index] || [],
      };
    });

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('[getWinePriceList] 가격 목록 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '가격 목록을 불러오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const changePhotoStatus = async (req: Request<{}, {}, ChangePhotoStatusBody>, res: Response): Promise<void> => {
  try {
    const { photoIndex, status, accessToken } = req.body;

    if (!accessToken || !accessToken.includes('1234qwer')) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const result = await changePhotoType(status, photoIndex);
    res.json({ success: result > 0 });
  } catch (err) {
    console.error('[changePhotoStatus] 사진 상태 변경 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '사진 상태를 변경하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updatePriceStatus = async (req: Request<{}, {}, UpdatePriceStatusBody>, res: Response): Promise<void> => {
  const { status, winePriceIndex, point } = req.body;
  try {
    const result = await changeReviewStatus(status, winePriceIndex, point);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[updatePriceStatus] 가격 상태 업데이트 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '가격 상태를 업데이트하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updatePriceWriter = async (req: Request<{}, {}, UpdatePriceWriterBody>, res: Response): Promise<void> => {
  const { winePriceIndex, writerIndex } = req.body;
  try {
    const result = await changeWriter(winePriceIndex, writerIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[updatePriceWriter] 작성자 변경 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '작성자를 변경하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const setShowInSpecialPricePageOfPrice = async (req: Request<{}, {}, SetShowBody>, res: Response): Promise<void> => {
  const { show, winePriceIndex } = req.body;
  try {
    const result = await setShowInSpecialPricePage(show, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[setShowInSpecialPricePageOfPrice] 특가 페이지 노출 설정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '특가 페이지 노출 설정에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const setShowInWineDetailPageOfPrice = async (req: Request<{}, {}, SetShowBody>, res: Response): Promise<void> => {
  const { show, winePriceIndex } = req.body;
  try {
    const result = await setShowInWineDetailPage(show, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[setShowInWineDetailPageOfPrice] 상세 페이지 노출 설정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '상세 페이지 노출 설정에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const setStockCountOfPrice = async (req: Request<{}, {}, SetStockCountBody>, res: Response): Promise<void> => {
  const { stockCount, winePriceIndex } = req.body;
  try {
    const result = await setStockCount(stockCount, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[setStockCountOfPrice] 재고 수량 설정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '재고 수량을 설정하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const setNeededPointForShowOfPrice = async (req: Request<{}, {}, SetNeededPointBody>, res: Response): Promise<void> => {
  const { point, winePriceIndex } = req.body;
  try {
    const result = await setNeededPointForShow(point, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[setNeededPointForShowOfPrice] 필요 포인트 설정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '필요 포인트를 설정하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const setHasReceiptOfPrice = async (req: Request<{}, {}, SetHasReceiptBody>, res: Response): Promise<void> => {
  const { hasReceipt, winePriceIndex } = req.body;
  try {
    const result = await setHasReceipt(hasReceipt, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[setHasReceiptOfPrice] 영수증 여부 설정 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '영수증 여부를 설정하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const deletePriceWithRelatedData = async (req: Request<{}, {}, DeletePriceBody>, res: Response): Promise<void> => {
  const { priceIndex, wineIndex } = req.body;
  try {
    const result = await deleteWithRelatedData(priceIndex, wineIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[deletePriceWithRelatedData] 가격 및 관련 데이터 삭제 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '가격 및 관련 데이터를 삭제하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updateWineStatus = async (req: Request<{}, {}, UpdateWineStatusBody>, res: Response): Promise<void> => {
  const { status, wineIndex } = req.body;
  try {
    const result = await changeWineStatus(wineIndex, status);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[updateWineStatus] 와인 상태 업데이트 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '와인 상태를 업데이트하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

export const updateWineStatusToIncompleteIfNotPass = async (req: Request<{}, {}, UpdateWineStatusToIncompleteBody>, res: Response): Promise<void> => {
  const { wineIndex } = req.body;
  try {
    const result = await changeWineStatusToIncompleteIfNotPass(wineIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    console.error('[updateWineStatusToIncompleteIfNotPass] 와인 상태를 미완료로 변경 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '와인 상태를 미완료로 변경하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};

