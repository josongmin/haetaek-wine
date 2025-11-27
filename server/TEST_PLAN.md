# 테스트 계획

## 설치

```bash
npm install --save-dev jest @jest/globals
```

## 테스트 실행

```bash
npm test                # 전체 테스트
npm run test:watch      # 파일 변경 감지
npm run test:coverage   # 커버리지 리포트
```

---

## 테스트 구조

```
tests/
├── setup.js                    # 환경 설정
├── controllers/
│   ├── user.controller.test.js
│   ├── point.controller.test.js
│   ├── wine.controller.test.js
│   ├── report.controller.test.js
│   └── wineShop.controller.test.js
├── dao/
│   ├── user.dao.test.js
│   ├── point.dao.test.js
│   ├── wine.dao.test.js
│   └── winePrice.dao.test.js
└── integration/
    └── api.integration.test.js
```

---

## 현재 완료된 테스트

### ✅ Controllers
- `user.controller.test.js` (9개 테스트)
  - getHotDealCountOfUser: 성공/실패 케이스 5개
  - updateUserLevel: 성공/실패 케이스 3개
  - getUserByIndex: 성공/실패 케이스 2개

- `point.controller.test.js` (8개 테스트)
  - insertPointForWritePrice: 3개
  - updatePointForWritePrice: 2개
  - deletePointHistoryWithSyncUserPoint: 2개

### ✅ DAO
- `user.dao.test.js` (6개 테스트)
  - getHotDealCount: 4개
  - updateUserLevel: 1개
  - getUserByIndex: 2개

---

## 다음 작성할 테스트

### 1. wine.controller.test.js (우선순위: 높음)
```javascript
describe('Wine Controller', () => {
  describe('getWinePriceList', () => {
    test('성공 - 기본 조회');
    test('성공 - 필터 적용');
    test('성공 - 페이지네이션');
    test('실패 - DB 에러');
  });
  
  describe('updatePriceStatus', () => {
    test('성공 - 상태 변경');
    test('실패 - 잘못된 status');
  });
});
```

### 2. report.controller.test.js
```javascript
describe('Report Controller', () => {
  describe('insertPriceReport', () => {
    test('성공 - 신고 등록');
    test('실패 - reporterIndex 누락');
    test('실패 - winePriceIndex 누락');
    test('실패 - reason 누락');
  });
});
```

### 3. wineShop.controller.test.js
```javascript
describe('WineShop Controller', () => {
  describe('getWineShopList', () => {
    test('성공 - 전체 조회');
    test('성공 - 검색 필터');
  });
});
```

### 4. Integration Tests
```javascript
describe('API Integration', () => {
  describe('POST /user/hotDealCount', () => {
    test('E2E - 성공 케이스');
  });
});
```

---

## 커버리지 목표

| 레이어 | 목표 | 현재 |
|--------|------|------|
| Controllers | 90% | ~30% |
| DAO | 80% | ~20% |
| 전체 | 85% | ~25% |

---

## 테스트 작성 가이드

### 1. AAA 패턴 사용
```javascript
test('설명', () => {
  // Arrange - 준비
  const input = { ... };
  
  // Act - 실행
  const result = await function(input);
  
  // Assert - 검증
  expect(result).toBe(expected);
});
```

### 2. Mock 사용
```javascript
import { jest } from '@jest/globals';

jest.mock('../../dao/user.dao.js');

beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. 에러 케이스 필수
```javascript
test('실패 - 필수값 누락', async () => {
  req.body = {};
  await controller(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});
```

---

## TypeScript 마이그레이션 전략

1. **테스트 작성** ← 현재 단계
2. **테스트 통과 확인**
3. **TS 파일 하나씩 변환**
4. **테스트로 동작 검증**
5. **반복**

### 이점
- 리팩토링 안전성 보장
- 회귀 테스트 자동화
- 버그 사전 발견
- 문서화 효과

---

## 체크리스트

### Phase 1: 기초 테스트 (현재)
- [x] Jest 설정
- [x] user.controller 테스트
- [x] point.controller 테스트
- [x] user.dao 테스트
- [ ] wine.controller 테스트
- [ ] report.controller 테스트
- [ ] wineShop.controller 테스트

### Phase 2: DAO 완성
- [ ] wine.dao 테스트
- [ ] winePrice.dao 테스트
- [ ] winePhoto.dao 테스트
- [ ] point.dao 테스트

### Phase 3: 통합 테스트
- [ ] API 통합 테스트
- [ ] E2E 시나리오

### Phase 4: TS 마이그레이션
- [ ] Types 정의
- [ ] DAO 변환 (테스트로 검증)
- [ ] Controller 변환 (테스트로 검증)
- [ ] 최종 테스트 통과

