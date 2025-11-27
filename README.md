# haetaek-wine

관리자용 와인 리뷰/가격 검수 도구입니다. 현재는 클라이언트 웹 애플리케이션 구조 중심으로 설명합니다.

## 클라이언트 웹 프로젝트 구조

```
client/
├── package.json           # CRA 기반 프런트엔드 설정
├── public/                # 정적 자원 (favicon, manifest 등)
└── src/
    ├── api/
    │   └── wineApi.js     # 백엔드 연동 REST 래퍼 (단일 엔드포인트 모음)
    ├── App.jsx, App.css   # 루트 앱 셸
    ├── features/
    │   └── price-review/  # 가격·리뷰 검수 주요 화면/훅/모달
    ├── pages/             # 공용 페이지 템플릿
    ├── routes/            # `ProtectedRoute` 등 라우팅 가드
    ├── shared/
    │   ├── components/    # 레이아웃·모달·컨텐츠 공용 컴포넌트
    │   └── utils/         # 날짜/가격/메시지 등 범용 유틸
    ├── store/             # 전역 상태 관리 훅 (`useStore`)
    ├── styles/            # 글로벌 스타일과 디자인 토큰
    ├── resources/         # UI에서 쓰이는 정적 이미지
    └── UserContext.js     # 사용자 정보 컨텍스트
```

### 주요 폴더 설명

- `src/api`: 단일 `wineApi.js`에서 axios 기반 호출을 모아 백엔드 엔드포인트를 캡슐화합니다.
- `src/features/price-review`: 가격 검증 워크플로의 페이지, 훅(`usePriceList`, `useModalManager`)과 모달 컴포넌트를 계층적으로 관리합니다.
- `src/pages`: 인증과 각 리뷰 도메인 화면을 라우트 단위로 분리합니다.
- `src/shared/components`: 모달 스테이지(`TwinModalStage`), 레이아웃(`TabNavigation`), 컨텐츠 블록 등 재사용 가능한 UI 레이어를 제공합니다.
- `src/shared/utils`: 날짜 포맷, 가격 포맷, 알림 전송, 드래그 가드 등 전역 유틸 함수가 위치합니다.
- `src/store`: `useStore`를 통해 전역 상태를 zustand 스타일 훅으로 노출합니다.
- `src/styles`: `tokens.css`와 `global.css`로 디자인 토큰과 글로벌 리셋을 정의합니다.
- `src/routes/ProtectedRoute.jsx`: 인증된 사용자만 접근 가능한 페이지 가드를 구현합니다.

> 참고: 서버(`server/`)와 공용 패키지(`shared/`)도 존재하지만, 본 문서는 사용자 요청에 따라 클라이언트 웹 구조에 집중합니다.
