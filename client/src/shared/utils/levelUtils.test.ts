import { describe, it, expect } from 'vitest';
import { levelTitle, MIN_LEVEL_ADMIN } from './levelUtils';

describe('levelUtils', () => {
  describe('levelTitle', () => {
    it('관리자 레벨은 "관리자"를 반환해야 함', () => {
      expect(levelTitle(MIN_LEVEL_ADMIN)).toBe('관리자');
      expect(levelTitle(9999999)).toBe('관리자');
    });

    it('레벨 0은 "레벨 없음"을 반환해야 함', () => {
      expect(levelTitle(0)).toBe('레벨 없음');
    });

    it('레벨 3은 "가격 업로드 인증 완료"를 반환해야 함', () => {
      expect(levelTitle(3)).toBe('가격 업로드 인증 완료');
    });

    it('레벨 4는 "실구매 인증 + 가격 업로드"를 반환해야 함', () => {
      expect(levelTitle(4)).toBe('실구매 인증 + 가격 업로드');
    });

    it('레벨 200 이상은 "소믈리에"를 포함해야 함', () => {
      const result = levelTitle(200);
      expect(result).toContain('소믈리에');
    });

    it('레벨 400 이상은 "어드밴스드 소믈리에"를 포함해야 함', () => {
      const result = levelTitle(400);
      expect(result).toContain('어드밴스드 소믈리에');
    });

    it('레벨 600 이상은 "마스터 소믈리에"를 포함해야 함', () => {
      const result = levelTitle(600);
      expect(result).toContain('마스터 소믈리에');
    });

    it('레벨 1000 이상은 "추천 상위"를 포함해야 함', () => {
      const result = levelTitle(1200);
      expect(result).toContain('추천 상위');
    });

    it('복합 레벨을 올바르게 표시해야 함', () => {
      // 예: 소믈리에 + WSET L4
      const result = levelTitle(260);
      expect(result).toMatch(/소믈리에/);
    });
  });

  describe('MIN_LEVEL_ADMIN', () => {
    it('상수 값이 올바르게 정의되어 있어야 함', () => {
      expect(MIN_LEVEL_ADMIN).toBe(999999);
    });
  });
});

