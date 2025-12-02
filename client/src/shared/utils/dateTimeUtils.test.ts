import { describe, it, expect } from 'vitest';
import { toLocalInputValue, toLocalDisplay, parseDateSafe, formatRelative } from './dateTimeUtils';

describe('dateTimeUtils', () => {
  describe('toLocalInputValue', () => {
    it('null이나 undefined일 때 빈 문자열을 반환해야 함', () => {
      expect(toLocalInputValue(null)).toBe('');
      expect(toLocalInputValue(undefined)).toBe('');
    });

    it('ISO 형식 문자열을 변환해야 함', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = toLocalInputValue(date.toISOString());
      expect(result).toMatch(/2024-01-15T\d{2}:\d{2}/);
    });

    it('공백이 포함된 날짜 문자열을 변환해야 함', () => {
      const result = toLocalInputValue('2024-01-15 10:30:00');
      expect(result).toMatch(/2024-01-15T\d{2}:\d{2}/);
    });

    it('잘못된 날짜 형식일 때 빈 문자열을 반환해야 함', () => {
      expect(toLocalInputValue('invalid-date')).toBe('');
    });
  });

  describe('toLocalDisplay', () => {
    it('null이나 undefined일 때 빈 문자열을 반환해야 함', () => {
      expect(toLocalDisplay(null)).toBe('');
      expect(toLocalDisplay(undefined)).toBe('');
    });

    it('날짜를 표시 형식으로 변환해야 함', () => {
      const date = new Date('2024-01-15T10:30:45');
      const result = toLocalDisplay(date.toISOString());
      expect(result).toMatch(/2024\.01\.15 \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('parseDateSafe', () => {
    it('null이나 undefined일 때 null을 반환해야 함', () => {
      expect(parseDateSafe(null)).toBeNull();
      expect(parseDateSafe(undefined)).toBeNull();
    });

    it('올바른 날짜 형식을 파싱해야 함', () => {
      const result = parseDateSafe('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // 0-based
      expect(result?.getDate()).toBe(15);
    });

    it('시간이 포함된 날짜도 파싱해야 함', () => {
      const result = parseDateSafe('2024-01-15 10:30:00');
      expect(result).toBeInstanceOf(Date);
    });

    it('잘못된 형식일 때 null을 반환해야 함', () => {
      expect(parseDateSafe('25:07:25')).toBeNull();
      expect(parseDateSafe('invalid')).toBeNull();
    });

    it('문자열이 아닐 때 null을 반환해야 함', () => {
      expect(parseDateSafe(123 as any)).toBeNull();
    });
  });

  describe('formatRelative', () => {
    it('null이나 undefined일 때 빈 문자열을 반환해야 함', () => {
      expect(formatRelative(null)).toBe('');
      expect(formatRelative(undefined)).toBe('');
    });

    it('오늘 날짜는 "오늘"을 반환해야 함', () => {
      const today = new Date();
      expect(formatRelative(today, today)).toBe('오늘');
    });

    it('1일 전은 "1일 전"을 반환해야 함', () => {
      const now = new Date('2024-01-15');
      const past = new Date('2024-01-14');
      expect(formatRelative(past, now)).toBe('1일 전');
    });

    it('60일 미만은 "N일 전"을 반환해야 함', () => {
      const now = new Date('2024-01-15');
      const past = new Date('2024-01-01');
      const result = formatRelative(past, now);
      expect(result).toMatch(/\d+일 전/);
    });

    it('문자열 날짜도 처리할 수 있어야 함', () => {
      const now = new Date('2024-01-15');
      const result = formatRelative('2024-01-14', now);
      expect(result).toBe('1일 전');
    });
  });
});

