# 모노레포 구조 개선 가이드

## 변경 사항

### 디렉토리 구조

```
변경 전:
uxight-admin-api/
├── client/
├── server/
├── shared/
└── package.json

변경 후:
uxight-admin-api/
├── apps/
│   ├── client/        # React 앱
│   └── api/           # Express API
├── packages/
│   └── shared/        # 공유 패키지
├── .temp/             # 임시 파일 (gitignore)
└── package.json
```

### package.json 스크립트 변경

**이전**:
```bash
npm run start:client
npm run start:server
```

**현재**:
```bash
npm run dev              # 클라이언트 + API 서버 동시 실행
npm run dev:client       # 클라이언트만 실행
npm run dev:api          # API 서버만 실행
npm run build:client     # 클라이언트 빌드
npm run deploy           # 배포
```

## 로컬 개발 환경 설정

### 1. 의존성 재설치

```bash
cd ~/admin-api  # 또는 프로젝트 루트
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules apps/*/package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
npm install
```

### 2. 개발 서버 실행

```bash
# 동시 실행 (권장)
npm run dev

# 또는 별도 터미널에서
npm run dev:api     # 터미널 1
npm run dev:client  # 터미널 2
```

## 배포 환경 설정

### nginx 설정 변경 (필요시)

```nginx
# 빌드 경로가 변경되었으므로 확인
root /home/user/admin-api/apps/client/build;
```

### PM2 설정 변경 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'admin-api',
    script: './apps/api/index.js',
    cwd: '/home/user/admin-api',
    // ...
  }]
};
```

### 배포 스크립트

**기존 방식 유지 가능**:
```bash
cd ~/admin-api
git pull origin master

# 프론트 변경시
cd ~/admin-api/apps/client
npm ci && npm run build
sudo systemctl reload nginx

# API 서버 변경시
cd ~/admin-api/apps/api
npm ci --omit=dev
pm2 reload admin-api
```

**새로운 방식 (루트에서)**:
```bash
cd ~/admin-api
git pull origin master
npm install
npm run build:client
pm2 reload admin-api
```

## 개발 팁

### workspace 명령어

```bash
# 특정 workspace에서 명령 실행
npm run build -w apps/client
npm run start -w apps/api

# 모든 workspace에서 명령 실행
npm run test --workspaces

# 특정 패키지 설치
npm install axios -w apps/client
npm install express -w apps/api
```

### shared 패키지 변경시

shared 패키지를 수정하면 클라이언트/서버가 자동으로 변경사항을 감지합니다.
별도 빌드 불필요.

## 주의사항

1. **의존성 설치**: 항상 루트에서 `npm install` 실행
2. **package-lock.json**: 루트의 것만 커밋, workspace의 것은 gitignore
3. **빌드 경로**: 서버의 정적 파일 경로는 자동으로 조정됨
4. **git 히스토리**: `git mv`로 이동하여 히스토리 보존됨

