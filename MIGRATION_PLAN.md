# TypeScript + Vite 마이그레이션 계획

## 🎯 목표
JavaScript + CRA → TypeScript + Vite + Feature-Sliced Design

## 📅 타임라인: 6개월

---

## Phase 0: 사전 준비 (1-2주)

### ✅ 체크리스트
- [ ] `main.js` 파일 용도 확인 및 삭제
- [ ] `client/README.md` 정리
- [ ] 현재 코드 전체 백업 (Git 태그)
- [ ] 마이그레이션 브랜치 생성
- [ ] 팀원들과 계획 공유

### 🔧 작업
```bash
# 백업 태그 생성
git tag -a v1.0.0-pre-migration -m "마이그레이션 시작 전 스냅샷"

# 마이그레이션 브랜치
git checkout -b migration/typescript-vite
```

---

## Phase 1: TypeScript + Vite 환경 구축 (2주)

### Step 1.1: Vite 설정

**새 `client/vite.config.ts` 생성:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});
```

**`client/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/assets/*": ["./src/assets/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**`client/tsconfig.node.json`:**
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Step 1.2: package.json 업데이트

**`client/package.json`:**
```json
{
  "name": "@myorg/client",
  "version": "2.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@myorg/shared": "file:../shared",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "zustand": "^5.0.8",
    "axios": "^1.9.0",
    "react-hot-toast": "^2.5.2",
    "react-icons": "^5.5.0",
    "react-select": "^5.10.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/node": "^22.0.0",
    "typescript": "^5.6.3",
    "vite": "^6.0.1",
    "@vitejs/plugin-react-swc": "^3.7.1",
    "eslint": "^9.15.0",
    "@typescript-eslint/eslint-plugin": "^8.13.0",
    "@typescript-eslint/parser": "^8.13.0",
    "prettier": "^3.3.3"
  }
}
```

### Step 1.3: 진입점 마이그레이션

**1. `src/main.tsx` 생성 (기존 index.js 대체):**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './app/providers/AuthProvider';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
```

**2. `public/index.html` 수정:**
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>와인 관리자 도구</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 1.4: 의존성 설치 및 테스트

```bash
cd client
npm install

# 개발 서버 실행 테스트
npm run dev

# 타입 체크
npm run type-check
```

---

## Phase 2: 공용 모듈 타입 정의 (1주)

### Step 2.1: shared 패키지 TypeScript 변환

**`shared/tsconfig.json` 생성:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["constants/**/*", "index.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**`shared/constants/wineType.ts` (기존 .js → .ts):**
```typescript
export const WINE_TYPE = {
  RED: 'RED',
  WHITE: 'WHITE',
  ROSE: 'ROSE',
  SPARKLING: 'SPARKLING',
  DESSERT: 'DESSERT',
  FORTIFIED: 'FORTIFIED',
} as const;

export type WineType = typeof WINE_TYPE[keyof typeof WINE_TYPE];
```

**`shared/constants/wineStatusMap.ts`:**
```typescript
export const WINE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type WineStatus = typeof WINE_STATUS[keyof typeof WINE_STATUS];

export const WINE_STATUS_MAP: Record<WineStatus, string> = {
  [WINE_STATUS.PENDING]: '대기 중',
  [WINE_STATUS.APPROVED]: '승인됨',
  [WINE_STATUS.REJECTED]: '거부됨',
};
```

**모든 constants 파일 마이그레이션:**
- `pointTypes.js` → `pointTypes.ts`
- `winePriceStatusMap.js` → `winePriceStatusMap.ts`
- `wineShopStatus.js` → `wineShopStatus.ts`
- `wineShopType.js` → `wineShopType.ts`

### Step 2.2: shared 타입 정의 파일 생성

**`shared/types/index.ts` 생성:**
```typescript
export interface Wine {
  W_index: number;
  W_name_kor: string;
  W_name_eng: string;
  W_type: WineType;
  W_vintage?: string;
  W_grape?: string;
  W_country?: string;
  W_region?: string;
  W_status: WineStatus;
  created_at: string;
  updated_at: string;
}

export interface WinePrice {
  WPR_index: number;
  W_index: number;
  WS_index: number;
  price: number;
  vintage: string;
  volume: number;
  status: PriceStatus;
  U_index: number;
  created_at: string;
  updated_at: string;
}

export interface WineShop {
  WS_index: number;
  WS_name: string;
  WS_type: WineShopType;
  WS_status: WineShopStatus;
  WS_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  U_index: number;
  U_email: string;
  U_nickname: string;
  U_level: number;
  U_point: number;
  created_at: string;
}
```

---

## Phase 3: API 레이어 타입 안정화 (2주)

### Step 3.1: API 클라이언트 생성

**`client/src/shared/api/client.ts`:**
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response.data,
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || '요청 실패',
          code: error.response?.status?.toString(),
          details: error.response?.data,
        };
        return Promise.reject(apiError);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<any, T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<any, T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<any, T>(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch<any, T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<any, T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

### Step 3.2: Feature별 API 분리

**기존:**
```
client/src/api/wineApi.js (812줄, 모든 API가 한 파일에)
```

**마이그레이션 후:**
```
client/src/features/
├── auth/
│   └── api/authApi.ts
├── price-review/
│   └── api/priceApi.ts
├── shop-review/
│   └── api/shopApi.ts
└── wine-review/
    └── api/wineApi.ts
```

**예시: `features/price-review/api/priceApi.ts`:**
```typescript
import { apiClient } from '@/shared/api/client';
import type { WinePrice } from '@myorg/shared';
import type { PriceFilters } from '../types/price.types';

export const priceApi = {
  // 가격 목록 조회
  fetchPrices: (filters: PriceFilters) =>
    apiClient.get<WinePrice[]>('/wine-prices', { params: filters }),

  // 가격 생성
  createPrice: (data: Omit<WinePrice, 'WPR_index' | 'created_at' | 'updated_at'>) =>
    apiClient.post<WinePrice>('/wine-prices', data),

  // 가격 수정
  updatePrice: (id: number, data: Partial<WinePrice>) =>
    apiClient.patch<WinePrice>(`/wine-prices/${id}`, data),

  // 가격 삭제
  deletePrice: (id: number) =>
    apiClient.delete<void>(`/wine-prices/${id}`),

  // 가격 승인
  approvePrice: (id: number) =>
    apiClient.post<WinePrice>(`/wine-prices/${id}/approve`),

  // 가격 거부
  rejectPrice: (id: number, reason?: string) =>
    apiClient.post<WinePrice>(`/wine-prices/${id}/reject`, { reason }),
};
```

---

## Phase 4: Feature 모듈 구조 재구성 (3주)

### Step 4.1: price-review Feature 마이그레이션

**목표 구조:**
```
features/price-review/
├── components/
│   ├── PriceList/
│   │   ├── PriceList.tsx
│   │   ├── PriceList.module.css
│   │   ├── PriceCell.tsx
│   │   └── index.ts
│   ├── PhotoGallery/
│   │   ├── PhotoGallery.tsx
│   │   ├── PhotoGallery.module.css
│   │   └── index.ts
│   └── PriceFilterForm/
├── modals/
│   ├── AddWineModal/
│   ├── EditPriceModal/
│   └── PriceHistoryModal/
├── hooks/
│   ├── usePriceList.ts
│   ├── usePriceFilters.ts
│   └── index.ts
├── stores/
│   ├── priceStore.ts
│   └── modalStore.ts
├── types/
│   └── price.types.ts
├── api/
│   └── priceApi.ts
├── pages/
│   └── PriceReviewPage.tsx
└── index.ts (Public API)
```

**Step 4.1.1: 타입 정의**

`features/price-review/types/price.types.ts`:
```typescript
import type { WinePrice, WineStatus } from '@myorg/shared';

export type PriceStatus = WineStatus;

export interface PriceFilters {
  status?: PriceStatus;
  dateFrom?: string;
  dateTo?: string;
  wineType?: string;
  shopType?: string;
  userId?: number;
}

export interface PriceListItem extends WinePrice {
  // 조인된 데이터
  wine_name_kor?: string;
  wine_name_eng?: string;
  shop_name?: string;
  user_nickname?: string;
}
```

**Step 4.1.2: Zustand Store 생성**

`features/price-review/stores/priceStore.ts`:
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PriceListItem, PriceFilters } from '../types/price.types';
import { priceApi } from '../api/priceApi';

interface PriceState {
  prices: PriceListItem[];
  isLoading: boolean;
  error: string | null;
  filters: PriceFilters;
}

interface PriceActions {
  fetchPrices: (filters?: PriceFilters) => Promise<void>;
  updatePrice: (id: number, data: Partial<PriceListItem>) => void;
  deletePrice: (id: number) => void;
  approvePrice: (id: number) => Promise<void>;
  rejectPrice: (id: number, reason?: string) => Promise<void>;
  setFilters: (filters: PriceFilters) => void;
  reset: () => void;
}

const initialState: PriceState = {
  prices: [],
  isLoading: false,
  error: null,
  filters: {},
};

export const usePriceStore = create<PriceState & PriceActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      fetchPrices: async (filters?: PriceFilters) => {
        set({ isLoading: true, error: null });
        try {
          const finalFilters = filters || get().filters;
          const data = await priceApi.fetchPrices(finalFilters);
          set({ prices: data, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      updatePrice: (id, data) => {
        set((state) => {
          const index = state.prices.findIndex((p) => p.WPR_index === id);
          if (index !== -1) {
            state.prices[index] = { ...state.prices[index], ...data };
          }
        });
      },

      deletePrice: (id) => {
        set((state) => {
          state.prices = state.prices.filter((p) => p.WPR_index !== id);
        });
      },

      approvePrice: async (id) => {
        try {
          const updated = await priceApi.approvePrice(id);
          get().updatePrice(id, updated);
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      rejectPrice: async (id, reason) => {
        try {
          const updated = await priceApi.rejectPrice(id, reason);
          get().updatePrice(id, updated);
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      setFilters: (filters) => {
        set({ filters });
      },

      reset: () => {
        set(initialState);
      },
    })),
    { name: 'PriceStore' }
  )
);
```

`features/price-review/stores/modalStore.ts`:
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ModalType =
  | 'addWine'
  | 'editPrice'
  | 'priceHistory'
  | 'userInfo'
  | 'shopInfo'
  | 'wineSearch'
  | 'auctionHistory'
  | 'aiTextRecognition'
  | null;

interface ModalState {
  activeModal: ModalType;
  modalData: Record<string, any>;
}

interface ModalActions {
  openModal: (type: ModalType, data?: Record<string, any>) => void;
  closeModal: () => void;
  updateModalData: (data: Record<string, any>) => void;
}

export const useModalStore = create<ModalState & ModalActions>()(
  devtools(
    (set) => ({
      activeModal: null,
      modalData: {},

      openModal: (type, data = {}) => {
        set({ activeModal: type, modalData: data });
        document.body.style.overflow = 'hidden';
      },

      closeModal: () => {
        set({ activeModal: null, modalData: {} });
        document.body.style.overflow = '';
      },

      updateModalData: (data) => {
        set((state) => ({
          modalData: { ...state.modalData, ...data },
        }));
      },
    }),
    { name: 'ModalStore' }
  )
);
```

**Step 4.1.3: Hook 마이그레이션**

`features/price-review/hooks/usePriceList.ts`:
```typescript
import { useEffect } from 'react';
import { usePriceStore } from '../stores/priceStore';
import type { PriceFilters } from '../types/price.types';

export function usePriceList(filters?: PriceFilters) {
  const {
    prices,
    isLoading,
    error,
    fetchPrices,
    updatePrice,
    deletePrice,
    approvePrice,
    rejectPrice,
  } = usePriceStore();

  useEffect(() => {
    fetchPrices(filters);
  }, [filters]);

  return {
    prices,
    isLoading,
    error,
    refetch: () => fetchPrices(filters),
    updatePrice,
    deletePrice,
    approvePrice,
    rejectPrice,
  };
}
```

**Step 4.1.4: 컴포넌트 마이그레이션**

`features/price-review/components/PriceList/PriceList.tsx`:
```typescript
import React from 'react';
import { PriceCell } from './PriceCell';
import { usePriceList } from '../../hooks/usePriceList';
import { useModalStore } from '../../stores/modalStore';
import type { PriceFilters } from '../../types/price.types';
import styles from './PriceList.module.css';

interface PriceListProps {
  filters?: PriceFilters;
}

export function PriceList({ filters }: PriceListProps) {
  const { prices, isLoading, error, approvePrice, rejectPrice } = usePriceList(filters);
  const { openModal } = useModalStore();

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error) {
    return <div className={styles.error}>에러: {error}</div>;
  }

  if (prices.length === 0) {
    return <div className={styles.empty}>가격 정보가 없습니다.</div>;
  }

  return (
    <div className={styles.container}>
      {prices.map((price) => (
        <PriceCell
          key={price.WPR_index}
          price={price}
          onEdit={() => openModal('editPrice', { price })}
          onApprove={() => approvePrice(price.WPR_index)}
          onReject={() => rejectPrice(price.WPR_index)}
          onShowHistory={() => openModal('priceHistory', { wineIndex: price.W_index })}
        />
      ))}
    </div>
  );
}
```

---

## Phase 5: 레거시 코드 제거 및 최적화 (2주)

### Step 5.1: 중복 코드 제거
- 기존 `useModalManager` 175줄 → Zustand `modalStore` 40줄로 대체
- 기존 `wineApi.js` 812줄 → Feature별 API 분리

### Step 5.2: CSS 모듈화
- 기존 `.css` → `.module.css`로 전환
- CSS 토큰 체계 정비

### Step 5.3: 번들 최적화
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-hot-toast', 'react-icons', 'react-select'],
          'vendor-state': ['zustand'],
        },
      },
    },
  },
});
```

---

## Phase 6: 문서화 및 배포 (1주)

### Step 6.1: README 업데이트
- 새로운 프로젝트 구조 문서화
- 개발 가이드 작성
- 마이그레이션 히스토리 기록

### Step 6.2: CI/CD 파이프라인 업데이트
```yaml
# .github/workflows/deploy.yml
- name: Type Check
  run: npm run type-check

- name: Build
  run: npm run build
```

---

## 📊 진행 상황 체크리스트

### Phase 0: 사전 준비
- [ ] 백업 태그 생성
- [ ] 마이그레이션 브랜치 생성
- [ ] main.js 삭제
- [ ] 팀 공유

### Phase 1: 환경 구축
- [ ] Vite 설정 파일 작성
- [ ] TypeScript 설정
- [ ] package.json 업데이트
- [ ] 의존성 설치
- [ ] 개발 서버 실행 확인

### Phase 2: 공용 모듈
- [ ] shared 패키지 TS 변환
- [ ] 타입 정의 파일 생성
- [ ] 빌드 확인

### Phase 3: API 레이어
- [ ] API 클라이언트 생성
- [ ] Feature별 API 분리
- [ ] 타입 안정성 확보

### Phase 4: Feature 재구성
- [ ] price-review 마이그레이션
- [ ] shop-review 마이그레이션
- [ ] wine-review 마이그레이션
- [ ] auth 모듈 마이그레이션

### Phase 5: 최적화
- [ ] 레거시 코드 제거
- [ ] CSS 모듈화
- [ ] 번들 최적화

### Phase 6: 배포
- [ ] 문서 업데이트
- [ ] CI/CD 파이프라인
- [ ] 프로덕션 배포

---

## 🚨 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 것을 바꾸지 않고 feature 단위로 진행
2. **하위 호환성**: 마이그레이션 중에도 기존 코드가 동작하도록 유지
3. **테스트**: 각 단계마다 수동 테스트 필수
4. **커밋 단위**: 작은 단위로 자주 커밋
5. **롤백 계획**: 문제 발생 시 이전 단계로 롤백 가능하도록

---

## 📝 예상 소요 시간

| Phase | 예상 기간 | 난이도 |
|-------|----------|--------|
| 0. 사전 준비 | 1-2주 | ⭐ |
| 1. 환경 구축 | 2주 | ⭐⭐ |
| 2. 공용 모듈 | 1주 | ⭐⭐ |
| 3. API 레이어 | 2주 | ⭐⭐⭐ |
| 4. Feature 재구성 | 3주 | ⭐⭐⭐⭐ |
| 5. 최적화 | 2주 | ⭐⭐⭐ |
| 6. 배포 | 1주 | ⭐⭐ |

**총 예상 기간: 약 6개월** (주 40시간 기준)

---

## 다음 단계

어떤 Phase부터 시작할까요?
1. Phase 0부터 차근차근 진행
2. Phase 1 환경 구축부터 바로 시작
3. 특정 Phase만 선택해서 진행

선택하시면 해당 Phase의 실제 파일 생성부터 시작하겠습니다!

