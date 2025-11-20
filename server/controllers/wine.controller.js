// controllers/wine.controller.js
import { getWinePriceListContainWineInfo as fetchWinePriceList, deleteWithRelatedData, changeWriter } from '../dao/winePrice.dao.js';
import { getAttachedPhotosByWinePriceIndex } from '../dao/winePhoto.dao.js';
import { changeWineStatus, changeWineStatusToIncompleteIfNotPass } from '../dao/wine.dao.js';
import { changePhotoType } from '../dao/winePhoto.dao.js';
import { changeReviewStatus, setShowInSpecialPricePage, setShowInWineDetailPage, setStockCount, setNeededPointForShow, setHasReceipt } from '../dao/winePrice.dao.js';
import {
  PRICE_STATUS_WAITING,
  PRICE_STATUS_PASS,
  PRICE_STATUS_PASS_BEFORE,
  PRICE_STATUS_REJECT,
  PRICE_STATUS_DELETED
} from '@myorg/shared/constants/winePriceStatusMap'


const isTrue = v => v === true || v === 'true';

// export const getWinePriceList = async (req, res) => {
//   try {
//     const data = await fetchWinePriceList(req.query);

//     const mapped = await Promise.all(
//       data.map(async (row) => {
//         const photos = await getAttachedPhotosByWinePriceIndex(row.WPR_index);
//         return {
//           ...row,
//           writer: {
//             index: row.USR_index,
//             nickname: row.USR_nickname,
//             level: row.USR_level,
//             point: row.USR_point,
//             thumbnailURL: row.USR_thumbnailURL,
//           },
//           attachedPhotos: photos || [],
//         };
//       })
//     );

//     res.json({ success: true, mapped });
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
export const getWinePriceList = async (req, res) => {
  try {
    // 1) status 파라미터 파싱
    // axios가 보내는 status[] 키 혹은 status 키 모두 지원
    let rawStatus = req.query.status ?? req.query['status[]'];
    let statusArray = [];

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

    const mapped = await Promise.all(
      data.map(async (row) => {
        const photos = await getAttachedPhotosByWinePriceIndex(row.WPR_index);
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
          attachedPhotos: photos || [],
        };
      })
    );

    res.json({ success: true, mapped });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const changePhotoStatus = async (req, res) => {
  try {
    const { photoIndex, status, accessToken } = req.body;

    if (!accessToken || !accessToken.includes('1234qwer')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await changePhotoType(status, photoIndex);
    res.json({ success: result > 0 });
  } catch (err) {
    console.error('changePhotoStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePriceStatus = async (req, res) => {
  const { status, winePriceIndex, point } = req.body;
  try {
    const result = await changeReviewStatus(status, winePriceIndex, point);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};
export const updatePriceWriter = async (req, res) => {
  const { winePriceIndex, writerIndex } = req.body;
  try {
    const result = await changeWriter(winePriceIndex, writerIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};

export const setShowInSpecialPricePageOfPrice = async (req, res) => {
  const { show, winePriceIndex } = req.body;
  try {
    const result = await setShowInSpecialPricePage(show, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};
export const setShowInWineDetailPageOfPrice = async (req, res) => {
  const { show, winePriceIndex } = req.body;
  try {
    const result = await setShowInWineDetailPage(show, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};
export const setStockCountOfPrice = async (req, res) => {
  const { stockCount, winePriceIndex } = req.body;
  try {
    const result = await setStockCount(stockCount, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};
export const setNeededPointForShowOfPrice = async (req, res) => {
  const { point, winePriceIndex } = req.body;
  try {
    const result = await setNeededPointForShow(point, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};
export const setHasReceiptOfPrice = async (req, res) => {
  const { hasReceipt, winePriceIndex } = req.body;
  try {
    const result = await setHasReceipt(hasReceipt, winePriceIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};

export const deletePriceWithRelatedData = async (req, res) => {
  const { priceIndex, wineIndex } = req.body;
  try {
    const result = await deleteWithRelatedData(priceIndex, wineIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
};
// export const updatePrice = async (req, res) => {
//   const { status, winePriceIndex, point } = req.body;
//   try {
//     const result = await changeReviewStatus(status, winePriceIndex, point);
//     res.json({ success: true, updated: result });
//   } catch (err) {
//     res.status(500).json({ success: false, message: '업데이트 실패' });
//   }
// };

export const updateWineStatus = async (req, res) => {
  const { status, wineIndex } = req.body;
  try {
    const result = await changeWineStatus(wineIndex, status);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};

export const updateWineStatusToIncompleteIfNotPass = async (req, res) => {
  const { wineIndex } = req.body;
  try {
    const result = await changeWineStatusToIncompleteIfNotPass(wineIndex);
    res.json({ success: true, updated: result });
  } catch (err) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
};