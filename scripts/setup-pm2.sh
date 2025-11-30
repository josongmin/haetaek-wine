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

# PM2 ecosystem 파일 생성
log_info "PM2 ecosystem 파일 생성..."
cat > "$APP_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: 'admin-api',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

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


