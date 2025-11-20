# Client 폴더 구조 개선 제안

## 현재 문제점

### 1. 일관성 없는 컴포넌트 분류
- feature 기반(`reviewPrice/`)과 역할 기반(`common/`, `containers/`, `layout/`) 혼재
- `components/reviewPrice/`에 18개 파일이 집중되어 있음

### 2. ReviewPricePage의 복잡도
- 660줄이 넘는 단일 파일
- 8개 이상의 팝업 상태 관리
- 페이지 로직과 비즈니스 로직 혼재

### 3. 스타일 관리
- `.css`와 `.module.css` 혼용
- 일관성 없는 스타일 규칙

### 4. 재사용성 부족
- feature별 컴포넌트가 다른 feature에서 재사용 불가능한 구조

## 제안하는 구조

```
src/
├── features/
│   ├── price-review/
│   │   ├── components/
│   │   │   ├── PriceList/
│   │   │   ├── PriceCell/
│   │   │   ├── PriceFilterForm/
│   │   │   └── modals/
│   │   │       ├── AddWineModal/
│   │   │       ├── EditPriceModal/
│   │   │       ├── PriceHistoryModal/
│   │   │       ├── AiTextRecognitionModal/
│   │   │       └── WineCandidateBottomSheet/
│   │   ├── hooks/
│   │   │   ├── usePriceFilters.js
│   │   │   ├── usePriceList.js
│   │   │   └── useModalManager.js
│   │   ├── utils/
│   │   │   └── priceHelpers.js
│   │   └── ReviewPricePage.jsx
│   │
│   ├── shop-review/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ReviewShopPage.jsx
│   │
│   └── wine-review/
│       ├── components/
│       ├── hooks/
│       └── ReviewWinePage.jsx
│
├── shared/
│   ├── components/
│   │   ├── Modal/
│   │   │   ├── HeadlessModal/
│   │   │   ├── SingleModalContainer/
│   │   │   └── TwinModalStage/
│   │   ├── Layout/
│   │   │   ├── TabNavigation/
│   │   │   └── UserBadge/
│   │   ├── Content/
│   │   │   ├── PriceHistoryContent/
│   │   │   └── IdealAuctionContent/
│   │   └── Form/
│   │       └── (공통 폼 컴포넌트)
│   │
│   ├── hooks/
│   │   ├── useBackNavigation.js
│   │   ├── useDragClickGuard.js
│   │   └── useModalBodyLock.js
│   │
│   └── utils/
│       ├── dateTimeUtils.js
│       ├── formatPrice.js
│       ├── levelUtils.js
│       └── pushMessage.js
│
├── api/
│   ├── wineApi.js
│   └── (추가 API 파일)
│
├── store/
│   └── useStore.js
│
├── routes/
│   └── ProtectedRoute.jsx
│
├── styles/
│   ├── global.css
│   └── tokens.css
│
└── App.jsx
```

## 주요 개선사항

### 1. Feature-First 구조
- 각 feature는 독립적인 폴더로 분리
- feature 내부에 components, hooks, utils 포함
- feature 간 의존성 최소화

### 2. 공통 컴포넌트 체계화
- `shared/components/` 아래 역할별로 재분류
- Modal, Layout, Content, Form 등 명확한 카테고리

### 3. 컴포넌트 폴더 구조
```
ComponentName/
├── index.js          // export만
├── ComponentName.jsx // 컴포넌트 로직
└── ComponentName.module.css // 스타일
```

### 4. Hooks 분리
- 페이지 로직을 custom hooks으로 추출
- 재사용 가능한 로직 공유
- 테스트 용이성 증가

### 5. 스타일 통일
- 모든 컴포넌트 CSS Module 사용
- `tokens.css`에 디자인 토큰 정의
- 일관된 스타일 규칙 적용

## 마이그레이션 우선순위

### Phase 1: 기반 작업
1. `shared/` 폴더 생성 및 공통 컴포넌트 이동
2. CSS Module로 통일
3. 디자인 토큰 파일 생성

### Phase 2: Feature 분리
1. `features/price-review/` 생성 및 컴포넌트 이동
2. ReviewPricePage hooks 분리
3. Modal 관리 로직 리팩토링

### Phase 3: 확장
1. shop-review, wine-review feature 구성
2. 공통 패턴 추출
3. 문서화

## 예상 효과

### 가독성
- 파일 위치를 직관적으로 파악 가능
- feature별 독립성으로 코드 이해도 향상

### 유지보수성
- 변경 영향 범위 명확화
- 기능 추가/삭제 용이

### 재사용성
- 공통 컴포넌트 명확한 분리
- hooks를 통한 로직 재사용

### 확장성
- 새로운 feature 추가가 용이한 구조
- 팀원 간 작업 영역 분리 명확

## 주의사항

- 기존 코드가 정상 동작 중이므로 점진적 마이그레이션 필요
- 각 단계마다 테스트 후 다음 단계 진행
- import 경로 변경 시 전체 검색 후 수정
- git에서 파일 이동 추적을 위해 `git mv` 사용 권장
