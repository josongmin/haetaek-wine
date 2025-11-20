# 모노레포 구조 개선 완료

## 완료된 작업

### 1. 디렉토리 구조 변경

```
변경 전:
├── client/
├── server/
├── shared/
└── index.js (불필요)

변경 후:
├── apps/
│   ├── client/      # React 앱
│   └── api/         # Express API
├── packages/
│   └── shared/      # 공유 패키지
└── .temp/           # 임시 문서
```

### 2. package.json 업데이트

**루트 package.json**
- workspace 경로: `apps/*`, `packages/*`
- 새 스크립트: `npm run dev` (동시 실행)
- devDependencies에 concurrently 추가

**apps/client/package.json**
- shared 경로: `../../packages/shared`

**apps/api/package.json**
- shared 경로: `../../packages/shared`

### 3. .gitignore 업데이트

- `.temp/` 추가
- workspace lockfile 패턴 업데이트
- `.DS_Store` 오타 수정

### 4. Git 히스토리 보존

모든 파일을 `git mv`로 이동하여 히스토리 유지됨
(git status에서 renamed로 표시)

### 5. 불필요한 파일 제거

- 루트의 `index.js` 삭제 (API 서버는 apps/api/index.js 사용)

## 다음 단계

### 즉시 필요한 작업

1. **Git 커밋**
```bash
cd ~/admin-api
git add -A
git commit -m "refactor: 모노레포 구조 개선 (apps/, packages/)"
```

2. **로컬 테스트**
```bash
npm run dev              # 클라이언트 + 서버 동시 실행
# 또는
npm run dev:server &     # 백그라운드 실행
npm run dev:client
```

3. **기존 변경사항 처리**
```bash
# Untracked files 추가
git add apps/client/src/stores/
git add apps/api/prompts/

# 기존 변경사항 확인 및 커밋
git add apps/client/src/api/wineApi.js
git add apps/client/src/components/reviewPrice/*.jsx
git add apps/api/controllers/external_wine_search.controller.js
# ... 등
git commit -m "feat: 이전 작업 내용"
```

### 배포 전 확인사항

**서버 환경 (~/admin-api)**

1. PM2 설정 업데이트 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'admin-api',
    script: './apps/api/index.js',  // ← 경로 변경
    cwd: '/home/user/admin-api',
    // ...
  }]
};
```

2. nginx 설정 확인 (nginx.conf 또는 sites-available)
```nginx
server {
    # ...
    root /home/user/admin-api/apps/client/build;  # ← 경로 변경
    
    location /wine {
        proxy_pass http://localhost:4000;
    }
    # ...
}
```

3. 배포 스크립트 업데이트 (필요시)
```bash
# 기존
cd ~/admin-api/client
npm ci && npm run build

# 새로운 방식
cd ~/admin-api
npm install
npm run build:client
```

## 장점

1. **개발 편의성**: `npm run dev` 한 번에 실행
2. **명확한 구조**: apps (실행), packages (공유)
3. **Git 히스토리 보존**: 모든 파일 이력 유지
4. **확장성**: 새로운 앱/패키지 추가 용이
5. **workspace 활용**: 의존성 중복 최소화

## 참고 문서

- 마이그레이션 가이드: `.temp/MIGRATION_GUIDE.md`
- 프로젝트 README: `README.md`

