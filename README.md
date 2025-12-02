# Wine Admin 🍷

와인 가격 및 리뷰 검수를 위한 관리자 도구입니다.

## 📚 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [개발 가이드](#개발-가이드)
- [배포](#배포)
- [문서](#문서)

## 🛠 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **Vitest** - 테스트 프레임워크
- **Zustand** - 상태 관리

### Backend
- **Node.js 20.x** + **TypeScript**
- **Express** - 웹 프레임워크
- **MySQL** - 데이터베이스
- **Firebase Admin** - 푸시 알림
- **PM2** - 프로세스 관리

### DevOps
- **pnpm** - 패키지 매니저 (monorepo)
- **GitHub Actions** - CI/CD
- **nginx** - 리버스 프록시
- **AWS** - 인프라 (EC2, RDS, S3, CloudFront)

## 📁 프로젝트 구조

```
wine-admin/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── api/           # API 클라이언트
│   │   ├── features/      # 기능별 모듈
│   │   │   └── price-review/  # 가격 검수 기능
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── shared/        # 공통 컴포넌트 & 유틸
│   │   └── store/         # 전역 상태
│   └── vite.config.ts
│
├── server/                 # Express 백엔드
│   ├── controllers/       # 비즈니스 로직
│   ├── routes/            # API 라우트
│   ├── dao/               # 데이터 액세스 레이어
│   ├── services/          # 외부 서비스 (Firebase 등)
│   └── index.ts
│
├── shared/                 # 공통 상수 및 타입
├── scripts/               # 배포 스크립트
└── .github/workflows/     # CI/CD 파이프라인
```

## 🚀 시작하기

### 1. 사전 요구사항

- **Node.js** 20.x 이상
- **pnpm** 8.x 이상
- **MySQL** 8.0 이상

```bash
# pnpm 설치
npm install -g pnpm
```

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/josongmin/haetaek-wine.git
cd wine-admin

# 의존성 설치
pnpm install
```

### 3. 환경 변수 설정

```bash
# 환경 변수 파일 생성
cp env.template .env

# .env 파일 수정 (DB, Firebase 등)
nano .env
```

**필수 환경 변수:**
```bash
NODE_ENV=development
PORT=4000
CLIENT_PORT=3001

# 데이터베이스
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wine_admin

# Firebase (선택사항 - 푸시 알림용)
FIREBASE_ADMIN_SDK_PATH=./server/config/firebase-adminsdk.json
```

### 4. 실행

**개발 모드 (권장):**

터미널 2개를 사용하여 서버와 클라이언트를 각각 실행:

```bash
# 터미널 1 - 서버
pnpm dev:server

# 터미널 2 - 클라이언트
pnpm dev:client
```

**접속:**
- 클라이언트: http://localhost:3001
- 서버 API: http://localhost:4000
- Health Check: http://localhost:4000/health

## 💻 개발 가이드

### 빌드

```bash
# 전체 빌드
pnpm build

# 서버만 빌드
pnpm build:server

# 클라이언트만 빌드
pnpm build:client
```

### 테스트

```bash
# 서버 테스트
pnpm --filter server test

# 클라이언트 테스트
pnpm --filter client test

# 커버리지
pnpm --filter server test:coverage
```

### 타입 체크

```bash
# 서버 타입 체크
pnpm type-check:server

# 클라이언트 타입 체크
pnpm --filter client type-check
```

### 코드 스타일

```bash
# 클라이언트 린트
pnpm --filter client lint
```

## 🚢 배포

### GitHub Actions 자동 배포

`main` 브랜치에 푸시하면 자동으로 배포됩니다:

1. **Backend** → EC2 (PM2로 관리)
2. **Frontend** → S3 + CloudFront

**필요한 GitHub Secrets:**
```
EC2_SSH_KEY                    # SSH 개인 키
EC2_USER                       # ubuntu
EC2_HOST                       # EC2 IP 또는 도메인
AWS_ACCESS_KEY_ID              # AWS 액세스 키
AWS_SECRET_ACCESS_KEY          # AWS 시크릿 키
AWS_REGION                     # ap-northeast-2
S3_BUCKET_NAME                 # S3 버킷 이름
CLOUDFRONT_DISTRIBUTION_ID     # CloudFront ID
```

### 수동 배포 (EC2)

```bash
# SSH 접속
ssh ubuntu@your-ec2-host

# 프로젝트 디렉토리로 이동
cd /var/www/wine-admin

# 배포 스크립트 실행
./scripts/deploy.sh --pull
```

자세한 배포 가이드는 [DEPLOYMENT_INFO.md](./DEPLOYMENT_INFO.md)를 참고하세요.

## 📖 문서

- [실행 가이드](./RUN.md) - 로컬 개발 환경 실행 방법
- [배포 가이드](./DEPLOYMENT_INFO.md) - AWS 배포 상세 가이드
- [GitHub Actions 설정](./GITHUB_ACTIONS_SETUP.md) - CI/CD 파이프라인 설정
- [TypeScript 마이그레이션](./server/TYPESCRIPT_MIGRATION.md) - TS 전환 가이드

## 🔧 문제 해결

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인 및 종료
lsof -ti:4000 | xargs kill -9  # 서버
lsof -ti:3001 | xargs kill -9  # 클라이언트
```

### 의존성 문제

```bash
# 전체 재설치
rm -rf node_modules **/node_modules pnpm-lock.yaml
pnpm install
```

### Firebase 초기화 실패

Firebase는 선택사항입니다. 푸시 알림이 필요 없다면:
- `.env`에서 `FIREBASE_ADMIN_SDK_PATH` 제거
- 서버는 Firebase 없이도 정상 작동합니다

## 📝 라이선스

Private Project

## 👥 기여자

- [@josongmin](https://github.com/josongmin)

---

**문의사항이 있으시면 이슈를 등록해주세요.**
