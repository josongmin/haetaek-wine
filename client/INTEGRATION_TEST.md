# 통합 테스트 가이드

## 🧪 수동 통합 테스트

### 사전 준비
1. 백엔드 서버 실행 (터미널 1)
```bash
cd /Users/harry/code/wine-admin
npm run start:server
```

2. 프론트엔드 서버 실행 (터미널 2)
```bash
cd /Users/harry/code/wine-admin/client
npm run dev
```

---

## Test Suite 1: 라우팅 테스트

### 1.1 로그인 페이지 접근
```
URL: http://localhost:3001/login
예상: ✅ 로그인 폼 표시
확인: [ ] 페이지 렌더링
      [ ] 입력 필드 존재
      [ ] 버튼 작동
      [ ] 콘솔 에러 없음
```

### 1.2 보호된 라우트 접근 (비로그인)
```
URL: http://localhost:3001/
예상: ✅ /login으로 리다이렉트
확인: [ ] 자동 리다이렉트
      [ ] ProtectedRoute 작동
```

### 1.3 로그인 후 메인 페이지
```
단계:
1. 로그인 성공
2. 메인 페이지 접근

예상: ✅ 앱 메인 화면 표시
확인: [ ] TabNavigation 렌더링
      [ ] UserBadge 표시
      [ ] 탭 전환 가능
```

---

## Test Suite 2: API 연동 테스트

### 2.1 프록시 설정 확인
```bash
# 개발자 도구 Network 탭에서 확인
# /api 요청이 localhost:4000으로 프록시되는지

예상 동작:
- Request URL: http://localhost:3001/api/wines/prices
- Actual Target: http://localhost:4000/api/wines/prices
- CORS: No error
```

### 2.2 가격 목록 조회
```
단계:
1. 로그인
2. 가격 검수 탭 클릭
3. 필터 적용

확인: [ ] API 호출 성공
      [ ] 데이터 로딩
      [ ] 리스트 렌더링
      [ ] 에러 핸들링
```

### 2.3 와인 검색
```
확인: [ ] 검색 API 호출
      [ ] 결과 표시
      [ ] 빈 결과 처리
```

---

## Test Suite 3: 상태 관리 테스트

### 3.1 Zustand Store (useStore)
```javascript
// 브라우저 콘솔에서 실행
// React DevTools → Components → Store 확인

확인 항목:
[ ] isAiModalOpen 상태
[ ] filters 상태
[ ] isLoading 상태
```

### 3.2 User Context
```
확인: [ ] 로그인 시 user 저장
      [ ] localStorage 동기화
      [ ] 로그아웃 시 초기화
```

---

## Test Suite 4: 모달 시스템 테스트

### 4.1 모달 열기/닫기
```
테스트 순서:
1. 가격 추가 버튼 클릭
2. 모달 열림 확인
3. ESC 또는 닫기 버튼
4. 모달 닫힘 확인

확인: [ ] 모달 렌더링
      [ ] body overflow hidden
      [ ] 닫기 동작
      [ ] 배경 스크롤 방지
```

### 4.2 TwinModalStage
```
테스트:
1. 가격 히스토리 모달 열기
2. 경매 가격 버튼 클릭
3. 두 번째 모달 오버레이

확인: [ ] 두 모달 동시 표시
      [ ] Z-index 계층
      [ ] 닫기 순서
```

---

## Test Suite 5: 성능 테스트

### 5.1 HMR (Hot Module Replacement)
```
테스트:
1. App.jsx 파일 수정
2. 저장
3. 브라우저 자동 업데이트 확인

측정: [ ] 업데이트 속도 < 100ms
      [ ] 상태 유지
      [ ] 콘솔 에러 없음
```

### 5.2 메모리 누수 체크
```
테스트:
1. Chrome DevTools → Memory
2. 모달 10회 열고 닫기
3. Heap Snapshot 비교

확인: [ ] 메모리 증가 < 5MB
      [ ] Event listener 정리
```

---

## Test Suite 6: 반응형 테스트

### 6.1 모바일 뷰
```
크기: 375px × 667px (iPhone SE)
확인: [ ] 레이아웃 정상
      [ ] 터치 이벤트
      [ ] 모달 화면 크기
```

### 6.2 태블릿 뷰
```
크기: 768px × 1024px (iPad)
확인: [ ] 탭 네비게이션
      [ ] 리스트 그리드
```

---

## Test Suite 7: 에러 핸들링

### 7.1 네트워크 에러
```
테스트:
1. 백엔드 서버 중지
2. API 호출 시도

예상: [ ] 에러 메시지 표시
      [ ] Toast 알림
      [ ] 재시도 옵션
```

### 7.2 잘못된 데이터
```
테스트:
1. 빈 응답
2. null 데이터
3. 잘못된 형식

확인: [ ] 에러 경계 작동
      [ ] 폴백 UI
      [ ] 콘솔 에러 로깅
```

---

## 🎯 성공 기준

### Critical (반드시 통과)
- ✅ 빌드 성공
- ✅ 개발 서버 실행
- ✅ 로그인/로그아웃
- ✅ API 호출
- ✅ 라우팅

### Important (중요)
- [ ] 모든 모달 작동
- [ ] 상태 관리 정상
- [ ] HMR 작동
- [ ] 성능 기준 충족

### Nice to Have (선택)
- [ ] 반응형 완벽
- [ ] 메모리 최적화
- [ ] 에러 핸들링 완벽

---

## 🐛 버그 트래킹

### 발견된 이슈
1. ~~TypeScript strict 모드 에러~~ ✅ 해결 (점진적 마이그레이션)
2. ~~빌드 시 ! operator 에러~~ ✅ 해결
3. [ ] (추가 테스트 후 기록)

### 알려진 제한사항
- .jsx/.js 파일은 any 타입 (Phase 2에서 해결 예정)
- 일부 Legacy 코드 존재
- CSS Module 미적용 (순차 적용 예정)

---

## 📝 테스트 결과 기록

### 테스트 일시: [기록 필요]
### 테스터: [이름]
### 환경:
- Node: v24.1.0
- npm: v11.3.0
- 브라우저: [기록]

### 결과:
- 통과: __ / __
- 실패: __ / __
- 스킵: __ / __

### 추가 코멘트:
[테스트 결과를 자유롭게 기록]

