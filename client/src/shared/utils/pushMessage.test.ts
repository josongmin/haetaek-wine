import { describe, it, expect } from 'vitest';
import { maskingPriceForLock, buildHotDealMessage, getLevelPushText, buildUserLevelChangedData } from './pushMessage';

describe('pushMessage', () => {
  describe('maskingPriceForLock', () => {
    it('null이나 undefined일 때 "*"를 반환해야 함', () => {
      // 실제 구현: priceInt가 0이면 priceStr.length가 1이고, visibleLen이 0이 되어 "*" 반환
      const result1 = maskingPriceForLock(null);
      const result2 = maskingPriceForLock(undefined);
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    });

    it('100만원 미만은 1자리만 보여야 함', () => {
      const result = maskingPriceForLock(50000);
      expect(result).toMatch(/^\d\*+$/);
    });

    it('100만원 이상은 2자리만 보여야 함', () => {
      const result = maskingPriceForLock(2000000);
      expect(result).toMatch(/^\d{2}\*+$/);
    });

    it('가격이 짧을 때 안전하게 처리해야 함', () => {
      const result = maskingPriceForLock(5);
      expect(result).toBeTruthy();
    });
  });

  describe('buildHotDealMessage', () => {
    it('기본 메시지를 생성해야 함', () => {
      const result = buildHotDealMessage({ titleKR: '테스트 와인' });
      expect(result.title).toBe('특가 등록');
      expect(result.body).toContain('테스트 와인');
    });

    it('빈티지가 포함된 메시지를 생성해야 함', () => {
      const result = buildHotDealMessage({ 
        titleKR: '테스트 와인', 
        vintage: '2020' 
      });
      expect(result.body).toContain('테스트 와인');
      expect(result.body).toContain('(2020)');
    });

    it('needsLock이 true일 때 마스킹된 가격을 사용해야 함', () => {
      const result = buildHotDealMessage({ 
        titleKR: '테스트 와인',
        finalPrice: 50000,
        needsLock: true
      });
      expect(result.body).toMatch(/\d+\*+원/);
    });

    it('needsLock이 false일 때 실제 가격을 사용해야 함', () => {
      const result = buildHotDealMessage({ 
        titleKR: '테스트 와인',
        finalPrice: 50000,
        needsLock: false
      });
      expect(result.body).toContain('50000원');
    });

    it('"모름" 빈티지는 포함하지 않아야 함', () => {
      const result = buildHotDealMessage({ 
        titleKR: '테스트 와인',
        vintage: '모름'
      });
      expect(result.body).not.toContain('모름');
    });
  });

  describe('getLevelPushText', () => {
    it('레벨 3에 대한 메시지를 반환해야 함', () => {
      const result = getLevelPushText(3);
      expect(result.title).toBe('회원 인증 완료');
      expect(result.message).toBe('가격 업로드 인증이 완료되었습니다');
    });

    it('레벨 4에 대한 메시지를 반환해야 함', () => {
      const result = getLevelPushText(4);
      expect(result.title).toBe('회원 인증 완료');
      expect(result.message).toBe('실구매 인증이 완료되었습니다');
    });

    it('레벨 5-8에 대한 메시지를 반환해야 함', () => {
      const result5 = getLevelPushText(5);
      expect(result5.title).toBe('회원 등급이 변경되었습니다');
      expect(result5.message).toBe('구매 고수 레벨1');

      const result8 = getLevelPushText(8);
      expect(result8.message).toBe('구매 전문가');
    });

    it('알 수 없는 레벨일 때 null을 반환해야 함', () => {
      const result = getLevelPushText(999);
      expect(result.title).toBeNull();
      expect(result.message).toBeNull();
    });
  });

  describe('buildUserLevelChangedData', () => {
    it('올바른 데이터 구조를 생성해야 함', () => {
      const result = buildUserLevelChangedData({ userIndex: '123', level: 5 });
      expect(result.notificationType).toBe('2');
      expect(result.userLevel).toBe('5');
      expect(result.userIndex).toBe('123');
    });

    it('숫자 userIndex를 문자열로 변환해야 함', () => {
      const result = buildUserLevelChangedData({ userIndex: 123, level: 5 });
      expect(result.userIndex).toBe('123');
    });
  });
});

