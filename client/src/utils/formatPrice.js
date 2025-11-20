// utils/formatPrice.js
export function formatPrice(price, unitCode = 'KRW') {
    if (price == null) return '-';
    const formatted = price?.toLocaleString();
    switch (unitCode) {
        // case 'JPY':
        //   return `${formatted}`;
        // case 'HKD':
        //   return `${formatted}`;
        // case 'USD':
        //   return `${formatted}`;
        // case 'EUR':
        //   return `${formatted}`;
        case null:
          return `${formatted}원`;
        case 'KRW':
          return `${formatted}원`;
        default:
          return `${formatted}${unitCode}`;
      }
  }