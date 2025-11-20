# 보안 설정 가이드

## 환경변수 설정

### 개발 환경

`apps/api/.env` 파일 생성:

```bash
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# API Keys
PERPLEXITY_API_KEY=pplx-your-actual-key

# 기타 설정
PORT=4000
```

### Firebase Admin SDK 설정

1. Firebase Console에서 서비스 계정 키 다운로드
2. `apps/api/config/firebase-adminsdk.json`에 저장
3. 이 파일은 .gitignore에 포함되어 있어 커밋되지 않음

## 프로덕션 환경

### 환경변수 설정

```bash
# PM2 사용시
pm2 start apps/api/index.js --name admin-api --env production

# 또는 ecosystem.config.js에 환경변수 설정
module.exports = {
  apps: [{
    name: 'admin-api',
    script: './apps/api/index.js',
    env_production: {
      NODE_ENV: 'production',
      PERPLEXITY_API_KEY: 'pplx-your-production-key',
      DB_HOST: 'production-db-host',
      // ... 기타 환경변수
    }
  }]
};
```

### Firebase 설정

서버에 `apps/api/config/firebase-adminsdk.json` 파일 배치

```bash
scp firebase-adminsdk.json user@server:~/admin-api/apps/api/config/
```

## 주의사항

절대 커밋하지 말 것:
- `.env` 파일
- `firebase-adminsdk.json`
- API 키, 비밀번호 등 민감정보

이미 .gitignore에 포함되어 있습니다.

