// src/api/wineApi.js

import axios from 'axios';
import { buildUserLevelChangedData, getLevelPushText } from '../utils/pushMessage';


const API_BASE_URL = 'https://asommguide.com';
// const API_BASE_URL = 'http://localhost:8080';

// 신규 API는 개발 환경에서 localhost:4000 사용
const EXTERNAL_WINE_SEARCH_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:4000' 
  : 'https://asommguide.com';

/**
 * <named‐parameter 방식> createWinePrice
 * - payloadObj: 객체 한 개만 받는다.
 * - 내부에서 undefined/null/빈 문자열("")인 프로퍼티는 쿼리에서 아예 제외한다.
 */
export const createWinePrice = async (payloadObj) => {
  // 1) undefined, null, ""(빈 문자열)인 키는 걸러내기
  const filteredPayload = {};
  Object.entries(payloadObj).forEach(([key, value]) => {
    // value가 undefined, null, 빈 문자열("") 이면 제외
    if (value !== undefined && value !== null && value !== '') {
      filteredPayload[key] = value;
    }
  });

  // 2) URLSearchParams 생성
  const params = new URLSearchParams(filteredPayload);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/wine/addPrice`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    // response.data.body가 { code, errorMessage, … } 형태라면 .body를 반환
    return response.data.body;
  } catch (error) {
    console.error('createWinePrice 실패:', error);
    throw error;
  }
};


/**
 * <named‐parameter 방식> updateWinePrice
 * - payloadObj: 객체 한 개만 받는다. 내부에서 undefined/null/빈 문자열("")인 프로퍼티는 쿼리에서 아예 제외.
 * - 내부적으로 마지막에 “index” 필드를 추가한다(수정 대상 PK).
 */
export const updateWinePrice = async (payloadObj) => {
  // payloadObj 안에 index 속성(= 수정할 WPR_index)이 반드시 들어있어야 한다.
  // undefined/null/""인 값은 걸러낸다.
  const filteredPayload = {};
  Object.entries(payloadObj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filteredPayload[key] = value;
    }
  });

  const params = new URLSearchParams(filteredPayload);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/wine/price/update`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    // API가 code 필드를 사용해서 에러를 전달하는 경우(예: code !== "0")
    if (response.data?.code && response.data.code !== '0') {
      // errorMessage가 있으면 그걸, 없으면 generic 메시지
      throw new Error(response.data.errorMessage || `Error code ${response.data.code}`);
    }

    return response.data.body;
  } catch (error) {
    console.error('updateWinePrice 실패:', error);
    throw error;
  }
};

export const mergeWine = async (wineIndexFrom, wineIndexTo, user) => {
  const params = new URLSearchParams();
  params.append('wineIndexFrom', wineIndexFrom);
  params.append('wineIndexTo', wineIndexTo);
  //params.append('countryCode', countryCode);
  params.append('accessToken', user.accessToken);

  try {
    const response = await axios.post(`${API_BASE_URL}/wine/merge`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error('병합 오류:', error);
    throw error;
  }
};

// post 로 보낼 경우
// export const fetchWinePrices = async (filters) => {
//   try {
//     const res = await axios.post('/wine/priceList', filters);
//     return res.data.mapped;
//   } catch (e) {
//     console.error('API fetch error', e);
//     return [];
//   }
// };

export const searchWines = async (user, cleanedSearchText, loadRowCount = 40) => {
  try {
    const params = new URLSearchParams();
    params.append('requesterIndex', user.index);
    params.append('accessToken', user.accessToken);
    params.append('searchText', cleanedSearchText);
    params.append('loadRowCount', loadRowCount);

    const response = await axios.post(`${API_BASE_URL}/wine/search`, params, {
      withCredentials: true,
    });
    return response.data.body || [];
  } catch (error) {
    console.error('Error searching wines:', error);
    throw error;
  }
};

export const loadRegionOptions = async (inputValue, grapes = null) => {
  const params = new URLSearchParams();
  params.append('searchText', inputValue);
  params.append('device', 'web'); // 디바이스 정보

  if (grapes) {
    params.append('grapes', grapes);
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/wine/searchRegion`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data.body.map(region => ({
      value: region,
      label: region,
    }));
  } catch (error) {
    console.error('지역 검색 오류:', error);
    return [];
  }
};

export const addWine = async (formData, user) => {
  const dataToSend = new FormData();
  dataToSend.append('title', formData.title);
  dataToSend.append('titleKR', formData.titleKR);
  dataToSend.append('region', formData.region);
  dataToSend.append('grape', formData.grape);
  if (formData.wineryIndex.length > 1) {
    dataToSend.append('wineryIndex', formData.wineryIndex);
  }
  dataToSend.append('thumbnailURL', formData.thumbnailURL);
  dataToSend.append('searchField', formData.searchField);
  dataToSend.append('status', formData.status);
  dataToSend.append('type', formData.type);
  dataToSend.append('device', 'web'); // 혹은 디바이스 정보를 가져와 설정
  dataToSend.append('accessToken', user.accessToken);
  dataToSend.append('writerIndex', user.index);

  try {
    const response = await axios.post(`${API_BASE_URL}/wine/add`, dataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (userId, password) => {
  const params = new URLSearchParams();
  params.append('id', userId);
  params.append('password', password);

  try {
    const response = await axios.post(`${API_BASE_URL}/user/signIn`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const updateWine = async (index, wineData, user) => {
  const params = new URLSearchParams();
  params.append('wineIndex', index);
  Object.entries(wineData).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await axios.post(`${API_BASE_URL}/wine/update`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Authorization header 필요 시 여기에 추가
    },
  });

  return response.data;
};


export async function fetchWineByIndex(wineIndex, user) {
  const params = new URLSearchParams();
  params.append('wineIndex', wineIndex);
  params.append('needsSearchField', true);
  params.append('device', 'web');
  params.append('accessToken', user?.accessToken ?? '');

  try {
    const response = await axios.post(`${API_BASE_URL}/wine/object`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data.body; // 실제 wine 객체
  } catch (error) {
    console.error('와인 불러오기 오류:', error);
    throw error;
  }
}


export const fetchWinePrices = async (filters) => {
  try {
    const res = await axios.get('/wine/priceList', { params: filters });
    return res.data.mapped;  // 서버에서 mapped로 리턴함
  } catch (e) {
    console.error('API fetch error', e);
    return [];
  }
};

/**
 * 사진의 공개/비공개 상태를 변경합니다.
 * @param {number} photoIndex - WinePhoto.WPH_index 값
 * @param {number} newType - 새로 적용할 WPH_type (0~4 또는 10~14)
 * @param {string} accessToken - 관리자 accessToken (검증 문자열 포함)
 */
export const updatePhotoType = async (photoIndex, newType, accessToken = 'admin:1234qwer') => {
  try {
    const params = new URLSearchParams();
    params.append('photoIndex', photoIndex);
    params.append('status', newType);
    params.append('accessToken', accessToken);

    const response = await axios.post('/wine/changePhotoStatus', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data?.success === true;
  } catch (err) {
    console.error('사진 상태 변경 중 오류 발생', err);
    return false;
  }
};

export const updateWinePriceStatus = async (status, winePriceIndex, point) => {
  const response = await axios.post('/wine/price/changeStatus', {
    status,
    winePriceIndex,
    point,
  });
  return response.data;
};
export const updateWinePriceWriter = async (winePriceIndex, writerIndex) => {
  const response = await axios.post('/wine/price/changeWriter', {
    winePriceIndex,
    writerIndex,
  });
  return response.data;
};

export const insertPointForWritePrice = async (userIndex, itemIndex, point, reason) => {
  try {
    const response = await axios.post('/point/insert/writePrice', {
      itemIndex,
      userIndex,
      point,
      reason,
    });
    return response.data.newIndex;
  } catch (e) {
    console.error('포인트 등록 실패:', e);
    throw e;
  }
};
export const updatePointForWritePrice = async (userIndex, index, point, reason) => {
  try {
    const response = await axios.post('/point/update/writePrice', {
      userIndex,
      index,
      point,
      reason,
    });
    return response.data;
  } catch (e) {
    console.error('포인트 수정 실패:', e);
    throw e;
  }
};
export const deletePointHistoryWithSyncUserPoint = async (userIndex, index) => {
  try {
    const response = await axios.post('/point/delete', {
      userIndex,
      index,
    });
    return response.data;
  } catch (e) {
    console.error('포인트 삭제 실패:', e);
    throw e;
  }
};

export const insertReportForPrice = async (reporterIndex, winePriceIndex, reason) => {
  try {
    const response = await axios.post('/wine/price/report/insert', {
      reporterIndex,
      winePriceIndex,
      reason
    });
    return response.data.newIndex;
  } catch (e) {
    console.error('신고 등록 실패:', e);
    throw e;
  }
};

export const updateReportForPrice = async (reportIndex, reason) => {
  try {
    const response = await axios.post('/wine/price/report/update', {
      reportIndex,
      reason
    });
    return response.data;
  } catch (e) {
    console.error('신고 수정 실패:', e);
    throw e;
  }
};

export const deleteReportForPrice = async (reportIndex) => {
  try {
    const response = await axios.post('/wine/price/report/delete', {
      reportIndex
    });
    return response.data;
  } catch (e) {
    console.error('신고 삭제 실패:', e);
    throw e;
  }
};


export const setShowInSpecialPricePage = async (show, winePriceIndex) => {
  try {
    const response = await axios.post('/wine/price/setShowInSpecialPricePage', {
      show, winePriceIndex
    });
    return response.data;
  } catch (e) {
    console.error('업데이트 실패:', e);
    throw e;
  }
};
export const setShowInWineDetailPage = async (show, winePriceIndex) => {
  try {
    const response = await axios.post('/wine/price/setShowInWineDetailPage', {
      show, winePriceIndex
    });
    return response.data;
  } catch (e) {
    console.error('업데이트 실패:', e);
    throw e;
  }
};

export const setStockCountOfPrice = async (stockCount, winePriceIndex) => {
  try {
    const response = await axios.post('/wine/price/setStockCountOfPrice', {
      stockCount, winePriceIndex
    });
    return response.data;
  } catch (e) {
    console.error('업데이트 실패:', e);
    throw e;
  }
};

export const setNeededPointForShowOfPrice = async (point, winePriceIndex) => {
  try {
    const response = await axios.post('/wine/price/setNeededPointForShowOfPrice', {
      point, winePriceIndex
    });
    return response.data;
  } catch (e) {
    console.error('업데이트 실패:', e);
    throw e;
  }
};

export const setHasReceiptOfPrice = async (hasReceipt, winePriceIndex) => {
  try {
    const response = await axios.post('/wine/price/setHasReceiptOfPrice', {
      hasReceipt, winePriceIndex
    });
    return response.data;
  } catch (e) {
    console.error('업데이트 실패:', e);
    throw e;
  }
};


export const updateUserLevel = async (userIndex, level) => {
  try {
    const response = await axios.post('/user/updateLevel', {
      userIndex, level
    });
    return response.data;
  } catch (e) {
    console.error('업데이트 실패:', e);
    throw e;
  }
};

export const deletePriceWithRelatedData = async (priceIndex, wineIndex) => {
  try {
    const response = await axios.post('/wine/price/deletePriceWithRelatedData', {
      priceIndex,
      wineIndex,
    });
    return response.data;
  } catch (e) {
    console.error('삭제 실패:', e);
    throw e;
  }
};


export const getWineShopList = async (searchText) => {
  try {
    const response = await axios.post('/shop/list', {
      searchText,
    });
    return response.data.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }
};
export const getUsedDiscountHistoryListOfShop = async (shopIndex) => {
  try {
    const response = await axios.post('/shop/getUsedDiscountHistoryList', {
      shopIndex,
    });
    return response.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }
};

export const getHotDealCountOfUser = async (userIndex, days) => {
  try {
    const response = await axios.post('/user/hotDealCount', {
      userIndex, days
    });
    return response.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }
};

export const getCommentHistoryListOfShop = async (shopIndex) => {
  try {
    const response = await axios.post('/shop/getCommentHistoryList', {
      shopIndex,
    });
    return response.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }
};


/**
 * <crawl 기반 와인 가격 정보 조회>
 * - GET http://13.124.222.92:1279/crawl?wine_name=…
 * - status가 'done'일 때 result.results 배열을 반환
 */
export const crawlWinePrices = async (wineName) => {
  try {
    const response = await axios.get('/crawl', {
      // nginx 에서 admin.asommguide.com 에서 처리하도록 함
    //const response = await axios.get('http://13.124.222.92:1279/crawl', {
      params: { wine_name: wineName },
      timeout: 600000, //600초
    });
    const data = response.data;

    // 상태 체크
    if (data.status !== 'done') {
      throw new Error(`Crawl API status is ${data.status}`);
    }

    // 결과 배열 추출
    const items = data.result.results;

    return items.map(item => ({
      // 기존 컴포넌트가 기대하는 WPR_ 필드들
      WPR_index: item.index,
      WPR_writerIndex: item.writerIndex,
      WPR_wineIndex: item.wineIndex,
      WPR_vintage: item.vintage,
      WPR_bottleSize: item.bottleSize,
      WPR_datetime: item.datetime,
      WPR_price: item.price,
      WPR_finalPrice: item.finalPrice,
      WPR_saleInfo: item.saleInfo,
      WPR_purchaseLink: item.purchaseLink,
      WPR_originalPriceUnitCode: item.originalPriceUnitCode,
      WPR_hideWriter: item.hideWriter,
      WPR_stockCount: item.stockCount,
      WPR_comment: item.comment,
      WPR_thumbnailURL: item.thumbnailURL,
      WPR_wineTitle: item.wineTitle,

      // 상태 점(cell)용 플래그, API에 없으면 0으로
      WPR_showSpecialPricePage: item.showSpecialPricePage ?? 0,
      WPR_showWineDetailPage: item.showWineDetailPage ?? 0,
    }));

  } catch (error) {
    console.error('crawlWinePrices 실패:', error);
    throw error;
  }
};


export async function sendPushToToken({ token, title, body, data }) {
  try {
    const response = await axios.post('/push/send-to-token', {
      token, title, body, data
    });
    return response.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }
}

export async function sendPushToUsers({ userIds, title, body, data }) {
  try {
    const response = await axios.post('/push/send-to-users', {
      userIds, title, body, data
    });
    return response.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }
}

export async function sendPushToTopic({ topic, title, body, data }) {
  try {
    const response = await axios.post('/push/send-to-topic', {
      topic, title, body, data
    });
    return response.data;
  } catch (e) {
    console.error('불러오기 실패:', e);
    throw e;
  }

}

export async function pushUserLevelChanged({ token, userIndex, level }) {
  const { title, message } = getLevelPushText(level);
  if (!title && !message) return { skipped: true };

  const data = buildUserLevelChangedData({ userIndex, level });

  // 기존 전송기(sendPushToToken) 재사용
  return await sendPushToToken({
    token,
    title,
    body: message,
    data,
  });
}

// 자바 상수와 동일한 의미로 맞춤
// FCMNotification.PriceReviewResult.TYPE === "1"
// data 키: notificationType, priceIndex, userIndex (+ 구버전 호환 alertType)
export async function pushPriceReview({ token, userIndex, priceIndex, title, message }) {
  const data = {
    notificationType: "1",
    alertType: "1",           // 구버전(iOS 1.3.3 이하) 호환용
    priceIndex: String(priceIndex),
    userIndex: String(userIndex),
  };

  const res = await axios.post('/push/send-to-token', {
    token,
    title,            // ex) "가격 등록 완료" / "가격 등록 실패"
    body: message,    // ex) 와인이름KR 또는 실패사유
    data,
  });
  return res.data;
}

export const getUserByIndex = async (userIndex) => {
  try {
    const res = await axios.post('/user/getUserByIndex', { userIndex });
    // 컨트롤러가 { success, data } 형태로 응답한다고 가정
    if (!res.data?.success) throw new Error(res.data?.message || '조회 실패');
    return res.data.data; // { index, deviceToken, ... }
  } catch (e) {
    console.error('getUserByIndex 실패:', e);
    throw e;
  }
};

export const updateWineStatus = async (wineIndex, status) => {
  const response = await axios.post('/wine/status/update', {
    status,
    wineIndex,
  });
  return response.data;
};

export const updateWineStatusToIncompleteIfNotPass = async (wineIndex) => {
  const response = await axios.post('/wine/status/updateToIncompleteIfNotPass', {
    wineIndex,
  });
  return response.data;
};

export const keywordSuggestion = async (keyword) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/keyword_suggesion`, {
      keyword,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('키워드 제안 실패:', error);
    throw error;
  }
};

export const deleteSearchCache = async (keyword) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/cache/delete`, {
      keyword,
    });
    return response.data;
  } catch (error) {
    console.error('캐시 삭제 실패:', error);
    throw error;
  }
};

export const getWineDetails = async (wine) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/get_wine_details`, {
      wine,
    });
    // 서버에서 { success: true, wineDetails: ... } 형태로 반환
    return response.data.wineDetails || response.data;
  } catch (error) {
    console.error('와인 상세정보 조회 실패:', error);
    throw error;
  }

};

/**
 * AI 와인 텍스트 인식 제안 API
 * POST /ai/suggestion_fulltext
 */
export const aiSuggestionFulltext = async (text) => {
  try {
    // 개발 환경에서는 로컬 서버 사용
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:4000' 
      : API_BASE_URL;
    
    const response = await axios.post(`${baseUrl}/ai/suggestion_fulltext`, {
      text: text.trim(),
    }, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('AI suggestion 오류:', error);
    throw error;
  }
};

/**
 * Candidate들을 Perplexity API로 동시 검색하고 스코어링하여 정렬
 * POST /external_wine_search/search_candidates_with_perplexity
 */
export const searchCandidatesWithPerplexity = async (candidates, originalKo) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/search_candidates_with_perplexity`, {
      candidates,
      original_ko: originalKo,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Candidate Perplexity 검색 실패:', error);
    throw error;
  }
};

/**
 * Candidate들을 하나의 프롬프트로 Perplexity API 검색 (Ver2)
 * POST /external_wine_search/search_candidates_with_perplexity_v2
 */
export const searchCandidatesWithPerplexityV2 = async (candidates, originalKo) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/search_candidates_with_perplexity_v2`, {
      candidates,
      original_ko: originalKo,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Candidate Perplexity V2 검색 실패:', error);
    throw error;
  }
};

/**
 * 단일 Candidate를 Perplexity API로 검색
 * POST /external_wine_search/search_single_candidate
 */
export const searchSingleCandidate = async (candidate, originalKo) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/search_single_candidate`, {
      candidate,
      original_ko: originalKo,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Single Candidate Perplexity 검색 실패:', error);
    throw error;
  }
};

/**
 * 단일 Candidate를 구글 검색 스크래핑으로 검색 (Ver3)
 * POST /external_wine_search/search_single_candidate_v3
 */
export const searchSingleCandidateV3 = async (candidate, originalKo, searchMetadata = null) => {
  try {
    const response = await axios.post(`${EXTERNAL_WINE_SEARCH_BASE_URL}/external_wine_search/search_single_candidate_v3`, {
      candidate,
      original_ko: originalKo,
      search_metadata: searchMetadata,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Single Candidate Google 검색 실패:', error);
    throw error;
  }
};