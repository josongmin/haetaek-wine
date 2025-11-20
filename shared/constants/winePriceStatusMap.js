// shared/constants/wineStatusMap.js

// export const WinePriceStatusMap = {
//   0: '심사 대기',
//   1: '등록',
//   2: '신고 (심사 거절, 잘못된 정보 신고)',
//   3: '숨김 (중복 등)', // 현재 안쓰이는듯?
//   4: '선등록',
// };

export const PRICE_STATUS_WAITING = 0;
export const PRICE_STATUS_PASS = 1;
export const PRICE_STATUS_PASS_BEFORE = 4;
export const PRICE_STATUS_REJECT = 2;
export const PRICE_STATUS_DELETED = 3;

export const winePriceStatusOptions = [
  { code: PRICE_STATUS_WAITING, label: '대기' },
  { code: PRICE_STATUS_PASS, label: '등록' },
  { code: PRICE_STATUS_PASS_BEFORE, label: '선등록' },
  { code: PRICE_STATUS_REJECT, label: '거절' },
  { code: PRICE_STATUS_DELETED, label: '삭제' },
];