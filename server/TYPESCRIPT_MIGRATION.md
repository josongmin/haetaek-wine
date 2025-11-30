# TypeScript 마이그레이션 계획

## 1단계: 환경 설정

```bash
npm install -D typescript @types/node @types/express @types/cors
npm install -D ts-node nodemon
npm install -D @types/mysql2 @types/moment
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 2단계: 마이그레이션 순서 (Bottom-Up)

### Phase 1: Types & Interfaces (1일)
```
shared/types/
├── user.types.ts
├── wine.types.ts
├── price.types.ts
├── shop.types.ts
├── point.types.ts
├── report.types.ts
└── index.ts
```

**예시** (`user.types.ts`):
```typescript
export interface User {
  index: string;
  id: string;
  nickname: string;
  thumbnailURLString: string;
  level: number;
  point: number;
  // ...
}

export interface UserSelectOptions {
  needPassword?: boolean;
  needLog?: boolean;
}
```

### Phase 2: DAO 레이어 (2-3일)
```
dao/
├── wine.dao.ts       // wine.dao.js 변환
├── winePrice.dao.ts
├── winePhoto.dao.ts
├── wineShop.dao.ts
├── user.dao.ts
├── point.dao.ts
└── report.dao.ts
```

**예시** (`user.dao.ts`):
```typescript
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../config/db';
import { User, UserSelectOptions } from '../../shared/types';

export const getHotDealCount = async (
  userIndex: string, 
  days?: number
): Promise<number> => {
  const sql = days && days > 0 ? `...` : `...`;
  const params = days && days > 0 
    ? [userIndex, days, PRICE_STATUS_PASS] 
    : [userIndex, PRICE_STATUS_PASS];

  const [rows] = await db.query<RowDataPacket[]>(sql, params);
  return rows[0]?.count ?? 0;
};

export const getUserByIndex = async (
  userIndex: string, 
  options: UserSelectOptions = {}
): Promise<User | null> => {
  const sql = `...`;
  const [rows] = await db.query<RowDataPacket[]>(sql, [userIndex]);
  
  if (!rows || rows.length === 0) return null;
  
  const r = rows[0];
  return {
    index: String(r.USR_index),
    id: r.USR_id,
    nickname: r.USR_nickname,
    level: Number(r.USR_level ?? 0),
    point: Number(r.USR_point ?? 0),
    // ...
  };
};
```

### Phase 3: Controllers (2-3일)
```
controllers/
├── wine.controller.ts
├── user.controller.ts
├── point.controller.ts
├── wineShop.controller.ts
└── report.controller.ts
```

**예시** (`user.controller.ts`):
```typescript
import { Request, Response } from 'express';
import * as userDao from '../dao/user.dao';

interface GetHotDealCountRequest {
  userIndex: string;
  days?: number;
}

export const getHotDealCountOfUser = async (
  req: Request<{}, {}, GetHotDealCountRequest>, 
  res: Response
): Promise<void> => {
  const { userIndex, days } = req.body;

  if (!userIndex) {
    res.status(400).json({ 
      success: false, 
      message: 'userIndex는 필수 항목입니다.' 
    });
    return;
  }

  if (days !== undefined && (typeof days !== 'number' || days < 0)) {
    res.status(400).json({ 
      success: false, 
      message: 'days는 0 이상의 숫자여야 합니다.' 
    });
    return;
  }

  try {
    const result = await userDao.getHotDealCount(userIndex, days);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[getHotDealCountOfUser] 특가 개수 조회 실패:', err);
    res.status(500).json({ 
      success: false, 
      message: '특가 개수를 조회하는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    });
  }
};
```

### Phase 4: Routes & Entry (1일)
```
routes/
├── wine.routes.ts
├── user.routes.ts
├── point.routes.ts
└── ...

index.ts  // index.js 변환
```

---

## 3단계: 개선사항 적용

### 1. 입력값 검증 라이브러리 도입
```bash
npm install zod
```

```typescript
import { z } from 'zod';

const GetHotDealCountSchema = z.object({
  userIndex: z.string().min(1),
  days: z.number().int().min(0).optional()
});

export const getHotDealCountOfUser = async (req: Request, res: Response) => {
  try {
    const { userIndex, days } = GetHotDealCountSchema.parse(req.body);
    // ...
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    // ...
  }
};
```

### 2. 응답 타입 표준화
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data
});

export const errorResponse = (message: string, error?: string): ApiResponse => ({
  success: false,
  message,
  error
});
```

### 3. 미들웨어 타입 정의
```typescript
import { Request, Response, NextFunction } from 'express';

export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
      } else {
        next(err);
      }
    }
  };
};
```

---

## 4단계: 빌드 & 배포

**package.json**:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 마이그레이션 체크리스트

### Week 1: 준비 & 기초
- [ ] TypeScript 환경 설정
- [ ] 타입 정의 파일 작성 (Types/Interfaces)
- [ ] DAO 레이어 변환 시작

### Week 2: Core 변환
- [ ] DAO 레이어 완료
- [ ] Controllers 변환
- [ ] Routes 변환

### Week 3: 개선 & 테스트
- [ ] Zod 검증 적용
- [ ] 응답 타입 표준화
- [ ] 에러 핸들링 개선
- [ ] 테스트 코드 작성

### Week 4: 배포 & 모니터링
- [ ] 빌드 설정 완료
- [ ] Staging 배포
- [ ] Production 배포
- [ ] 모니터링 설정

---

## 주요 이점

1. **컴파일 타임 에러 검출** - 런타임 오류 80% 감소
2. **자동완성 & IntelliSense** - 개발 속도 30% 향상
3. **리팩토링 안전성** - 타입 시스템이 변경사항 추적
4. **문서화 효과** - 타입 자체가 API 문서 역할
5. **팀 협업 향상** - 명확한 인터페이스 정의

---

## 예상 일정

- **Phase 1 (Types)**: 1일
- **Phase 2 (DAO)**: 2-3일
- **Phase 3 (Controllers)**: 2-3일
- **Phase 4 (Routes/Entry)**: 1일
- **테스트 & 최적화**: 2-3일

**총 예상 기간**: 2-3주


