// utils/formatPrice.ts
export function formatPrice(price: number | null | undefined, unitCode: string | null = 'KRW'): string {
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

