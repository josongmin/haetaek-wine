# 실행 가이드

## 📋 목차
- [전제 조건](#전제-조건)
- [클라이언트 실행](#클라이언트-실행)
- [서버 실행](#서버-실행)
- [동시 실행](#동시-실행)
- [빌드](#빌드)

---

## 전제 조건

### 1. pnpm 설치 확인
```bash
pnpm --version
# 설치되어 있지 않다면
npm install -g pnpm
```

### 2. 의존성 설치 (최초 1회)
```bash
# 루트 디렉토리에서
pnpm install
```

### 3. 환경 변수 설정 (서버 실행 전 필수)
```bash
# 루트 디렉토리에서
cp env.template .env

# .env 파일을 열어서 실제 값으로 수정
# - DB 연결 정보
# - Firebase 설정
# - 기타 필요한 환경 변수
```

---

## 클라이언트 실행

### 방법 1: 루트에서 실행 (권장)
```bash
# 루트 디렉토리에서
pnpm start:client
```

### 방법 2: 클라이언트 디렉토리에서 직접 실행
```bash
cd client
pnpm dev
```

### 클라이언트 접속
- **개발 서버**: http://localhost:5173 (Vite 기본 포트)
- **포트 변경**: `client/vite.config.ts`에서 설정

### 클라이언트 개발 명령어
```bash
# 타입 체크
pnpm --filter client type-check

# 빌드
pnpm --filter client build

# 테스트
pnpm --filter client test
```

---

## 서버 실행

### 방법 1: 루트에서 실행 (권장)
```bash
# 루트 디렉토리에서
pnpm dev              # 또는
pnpm start:server
```

### 방법 2: 서버 디렉토리에서 직접 실행
```bash
cd server
pnpm start
```

### 서버 접속
- **기본 포트**: http://localhost:4000
- **포트 변경**: `.env` 파일에서 `PORT=원하는포트` 설정

### 서버 개발 명령어
```bash
# 테스트 실행
pnpm --filter server test

# 테스트 감시 모드
pnpm --filter server test:watch

# 테스트 커버리지
pnpm --filter server test:coverage
```

---

## 동시 실행

### 터미널 2개 사용 (권장)

**터미널 1 - 서버**
```bash
pnpm start:server
```

**터미널 2 - 클라이언트**
```bash
pnpm start:client
```

### PM2 사용 (프로덕션/개발)
```bash
# PM2로 서버 실행
pm2 start ecosystem.config.cjs

# PM2로 서버 중지
pm2 stop admin-api

# PM2 상태 확인
pm2 status
```

---

## 빌드

### 클라이언트 빌드
```bash
# 루트에서
pnpm build:client

# 또는 클라이언트 디렉토리에서
cd client
pnpm build
```

### 빌드 결과물
- 클라이언트 빌드 파일: `client/build/`
- 서버에서 정적 파일로 서빙됨

---

## 문제 해결

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :4000  # 서버 포트
lsof -i :5173  # 클라이언트 포트

# 프로세스 종료
kill -9 <PID>
```

### 의존성 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules server/node_modules client/node_modules shared/node_modules
pnpm install
```

### 환경 변수 문제
```bash
# .env 파일 확인
cat .env

# env.template과 비교
diff env.template .env
```

---

## 요약

| 작업 | 명령어 | 위치 |
|------|--------|------|
| **클라이언트 실행** | `pnpm start:client` | 루트 |
| **서버 실행** | `pnpm start:server` | 루트 |
| **클라이언트 빌드** | `pnpm build:client` | 루트 |
| **의존성 설치** | `pnpm install` | 루트 |
| **타입 체크** | `pnpm --filter client type-check` | 루트 |

