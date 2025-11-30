#!/bin/bash

# Wine Admin 롤백 스크립트

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups"
PM2_APP_NAME="admin-api"

# 백업 파일 목록 표시
log_info "사용 가능한 백업:"
ls -lht "$BACKUP_DIR"/build_*.tar.gz | head -n 5

# 최신 백업 파일 찾기
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/build_*.tar.gz 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    log_error "백업 파일을 찾을 수 없습니다!"
    exit 1
fi

# 사용자 확인
echo -e "${YELLOW}다음 백업으로 롤백하시겠습니까?${NC}"
echo "$LATEST_BACKUP"
read -p "계속하려면 'yes'를 입력하세요: " confirm

if [ "$confirm" != "yes" ]; then
    log_info "롤백 취소됨"
    exit 0
fi

# 현재 빌드 삭제
log_info "현재 빌드 제거 중..."
rm -rf "$APP_DIR/client/build"

# 백업 복원
log_info "백업 복원 중..."
tar -xzf "$LATEST_BACKUP" -C "$APP_DIR/client"

# PM2 재시작
log_info "서버 재시작 중..."
pm2 reload "$PM2_APP_NAME"

log_info "롤백 완료!"
pm2 status


