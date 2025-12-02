#!/bin/bash

# PM2 초기 설정 스크립트

set -e

GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM2_APP_NAME="admin-api"

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    log_info "PM2 설치 중..."
    npm install -g pm2
fi

# PM2 ecosystem 파일은 이미 존재하므로 스킵
log_info "기존 ecosystem.config.cjs 사용..."

# 서버 빌드
log_info "서버 빌드 중..."
cd "$APP_DIR"
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build:server
pnpm run build:client

# 로그 디렉토리 생성
mkdir -p "$APP_DIR/logs"

# PM2 시작
log_info "PM2로 애플리케이션 시작..."
cd "$APP_DIR"
pm2 start ecosystem.config.cjs

# PM2 저장
pm2 save

# PM2 부팅시 자동 시작 설정
log_info "PM2 부팅시 자동 시작 설정..."
pm2 startup

log_info "PM2 설정 완료!"
log_info "상태 확인: pm2 status"
log_info "로그 확인: pm2 logs $PM2_APP_NAME"
log_info "모니터링: pm2 monit"


