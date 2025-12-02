import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatPrice';

describe('formatPrice', () => {
  it('null이나 undefined일 때 "-"를 반환해야 함', () => {
    expect(formatPrice(null)).toBe('-');
    expect(formatPrice(undefined)).toBe('-');
  });

  it('기본값으로 KRW 단위를 사용해야 함', () => {
    expect(formatPrice(1000)).toBe('1,000원');
    expect(formatPrice(1000000)).toBe('1,000,000원');
  });

  it('KRW 단위를 명시적으로 지정할 수 있어야 함', () => {
    expect(formatPrice(5000, 'KRW')).toBe('5,000원');
  });

  it('null 단위도 "원"을 붙여야 함', () => {
    expect(formatPrice(1000, null)).toBe('1,000원');
  });

  it('다른 단위 코드를 사용할 수 있어야 함', () => {
    expect(formatPrice(1000, 'USD')).toBe('1,000USD');
    expect(formatPrice(500, 'EUR')).toBe('500EUR');
  });

  it('0도 올바르게 포맷되어야 함', () => {
    expect(formatPrice(0)).toBe('0원');
  });

  it('큰 숫자도 올바르게 포맷되어야 함', () => {
    expect(formatPrice(1234567890)).toBe('1,234,567,890원');
  });
});

