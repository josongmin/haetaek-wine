// constants/wineStatusMap.js

export const WINE_STATUS_WAITING = 0;
export const WINE_STATUS_PASS = 1;
export const WINE_STATUS_INCOMPLETE = 2;
export const WINE_STATUS_DISABLED = 3;

export const WineStatusMap = {
  [WINE_STATUS_WAITING]: '심사 대기',
  [WINE_STATUS_PASS]: '등록',
  [WINE_STATUS_INCOMPLETE]: '보충 필요',
  [WINE_STATUS_DISABLED]: '비활성화',
};

export const WineStatusOptions = Object.entries(WineStatusMap).map(([code, label]) => ({
  code: parseInt(code),
  label,
}));
