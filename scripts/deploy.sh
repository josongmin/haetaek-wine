#!/bin/bash

# Wine Admin 배포 스크립트
# EC2 또는 온프레미스 서버에서 실행

set -e  # 에러 발생시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정
APP_NAME="wine-admin"
PM2_APP_NAME="admin-api"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log_info "배포 시작: $APP_NAME"
log_info "디렉토리: $APP_DIR"

# 1. 백업 생성
log_info "현재 빌드 백업 중..."
mkdir -p "$BACKUP_DIR"
if [ -d "$APP_DIR/client/build" ]; then
    tar -czf "$BACKUP_DIR/build_$TIMESTAMP.tar.gz" -C "$APP_DIR/client" build
    log_info "백업 완료: build_$TIMESTAMP.tar.gz"
fi

# 오래된 백업 삭제 (30일 이상)
find "$BACKUP_DIR" -name "build_*.tar.gz" -mtime +30 -delete

# 2. Git pull (옵션)
if [ "$1" == "--pull" ]; then
    log_info "최신 코드 가져오기..."
    git pull origin main
fi

# 3. pnpm 설치 확인
if ! command -v pnpm &> /dev/null; then
    log_info "pnpm 설치 중..."
    npm install -g pnpm
fi

# 4. 의존성 설치
log_info "의존성 설치 중..."
pnpm install --frozen-lockfile --ignore-scripts

# 5. 서버 빌드 (TypeScript)
log_info "서버 빌드 중..."
pnpm run build:server

# 6. 클라이언트 빌드
log_info "클라이언트 빌드 중..."
pnpm run build:client

# 7. PM2로 서버 재시작
log_info "서버 재시작 중..."
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    log_info "기존 프로세스 재시작..."
    pm2 reload "$PM2_APP_NAME" --update-env
else
    log_info "새 프로세스 시작..."
    # TypeScript 빌드 결과물 실행
    if [ -f "server/dist/index.js" ]; then
        pm2 start server/dist/index.js --name "$PM2_APP_NAME" --time --log-date-format "YYYY-MM-DD HH:mm:ss Z"
    else
        pm2 start ecosystem.config.cjs
    fi
fi

# 8. PM2 설정 저장
pm2 save

# 9. 헬스 체크
log_info "헬스 체크 중..."
sleep 3

HEALTH_URL="http://localhost:4000/health"
if curl -f -s "$HEALTH_URL" > /dev/null; then
    log_info "서버 정상 작동 확인"
else
    log_error "서버 헬스 체크 실패!"
    log_warn "로그 확인: pm2 logs $PM2_APP_NAME"
    exit 1
fi

# 10. 배포 완료
log_info "배포 완료!"
log_info "상태 확인: pm2 status"
log_info "로그 확인: pm2 logs $PM2_APP_NAME"
log_info "모니터링: pm2 monit"

# PM2 상태 출력
pm2 status


