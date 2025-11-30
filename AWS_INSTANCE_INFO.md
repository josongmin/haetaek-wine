# 배포용 AWS 인스턴스 정보

이 문서는 배포 담당자에게 전달할 실제 AWS 리소스 정보입니다.

---

## 📍 EC2 인스턴스 정보

### 기본 정보
- **인스턴스 ID**: `i-0e3df08f16fe1c1b5`
- **인스턴스 유형**: `t2.micro` (1 vCPU, 1GB RAM)
- **상태**: 실행 중 ✅
- **AMI**: Ubuntu Noble 24.04 LTS (amd64)
- **리전**: ap-northeast-2 (서울)

### 네트워크 정보
- **퍼블릭 IPv4 주소**: `13.124.222.92`
- **프라이빗 IPv4 주소**: `172.31.16.204`
- **퍼블릭 DNS**: `ec2-13-124-222-92.ap-northeast-2.compute.amazonaws.com`
- **프라이빗 DNS**: `ip-172-31-16-204.ap-northeast-2.compute.internal`

### VPC 정보
- **VPC ID**: `vpc-4340a97a`
- **서브넷 ID**: `subnet-e3466ca9`
- **보안 그룹**: (확인 필요)

---

## 🔑 SSH 접속 방법

### 접속 명령어
```bash
ssh -i "your-key.pem" ubuntu@13.124.222.92
```

또는

```bash
ssh -i "your-key.pem" ubuntu@ec2-13-124-222-92.ap-northeast-2.compute.amazonaws.com
```

### 필요한 것
- **SSH 키 파일**: `your-key.pem` (해당 키 파일 필요)
- **사용자명**: `ubuntu`
- **포트**: 22

### SSH 키 파일 권한 설정
```bash
chmod 400 your-key.pem
```

---

## 🚀 배포 가이드

### 1단계: SSH 접속

```bash
ssh -i "your-key.pem" ubuntu@13.124.222.92
```

### 2단계: 서버 초기 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git 설치
sudo apt install -y git

# PM2 설치 (프로세스 매니저)
sudo npm install -g pm2

# 버전 확인
node --version  # v20.x
npm --version
pm2 --version
```

### 3단계: 프로젝트 배포

```bash
# 1. 프로젝트 클론 (또는 파일 업로드)
cd ~
git clone https://github.com/your-org/wine-admin.git
cd wine-admin

# 2. 환경 변수 설정
nano .env
# 필요한 환경 변수 입력 (secrets-template.txt 참고)

# 3. Firebase 키 파일 업로드
mkdir -p server/config
# 로컬에서 scp로 업로드:
# scp -i "your-key.pem" firebase-adminsdk.json ubuntu@13.124.222.92:~/wine-admin/server/config/

# 4. 의존성 설치 및 빌드
npm ci
npm run build:client

# 5. PM2로 애플리케이션 시작
./scripts/setup-pm2.sh
# 또는 수동으로:
# pm2 start ecosystem.config.cjs
```

### 4단계: 보안 그룹 설정 (AWS Console)

EC2 → 인스턴스 → 보안 → 보안 그룹 편집

**필요한 인바운드 규칙:**
```
포트 22   - SSH (내 IP만 허용)
포트 80   - HTTP (0.0.0.0/0)
포트 443  - HTTPS (0.0.0.0/0)
포트 3000 - 애플리케이션 (임시, 나중에 제거)
```

### 5단계: Nginx 설치 및 설정 (선택사항, 권장)

```bash
# Nginx 설치
sudo apt install -y nginx

# 설정 파일 복사
sudo cp ~/wine-admin/nginx.conf /etc/nginx/sites-available/wine-admin

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/wine-admin /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 부팅시 자동 시작
sudo systemctl enable nginx
```

### 6단계: 배포 확인

```bash
# 헬스체크
curl http://13.124.222.92/health
# 응답: {"status":"ok","timestamp":"..."}

# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs admin-api
```

---

## 🔄 이후 배포 방법

### 수동 배포
```bash
# SSH 접속
ssh -i "your-key.pem" ubuntu@13.124.222.92

# 배포 스크립트 실행
cd ~/wine-admin
./scripts/deploy.sh --pull
```

### GitHub Actions 자동 배포

`.github/workflows/deploy.yml`에서 다음 Secrets 필요:

```
EC2_HOST=13.124.222.92
EC2_USER=ubuntu
EC2_SSH_KEY=[SSH 키 내용 전체]
```

설정 후 main 브랜치에 푸시하면 자동 배포됨.

---

## 📊 파일 업로드 방법

### SCP 사용
```bash
# 로컬 → EC2
scp -i "your-key.pem" local-file.txt ubuntu@13.124.222.92:~/wine-admin/

# 폴더 업로드
scp -i "your-key.pem" -r local-folder ubuntu@13.124.222.92:~/wine-admin/
```

### rsync 사용 (더 효율적)
```bash
rsync -avz -e "ssh -i your-key.pem" \
  --exclude 'node_modules' \
  --exclude '.git' \
  ./ ubuntu@13.124.222.92:~/wine-admin/
```

---

## 🗄️ 데이터베이스 연결

### RDS 연결 확인
```bash
# MySQL 클라이언트 설치
sudo apt install -y mysql-client

# RDS 연결 테스트
mysql -h your-rds-endpoint.rds.amazonaws.com \
      -u admin \
      -p \
      wine_admin
```

### RDS 보안 그룹 설정
RDS 보안 그룹에서 다음 인바운드 규칙 추가:
```
Type: MySQL/Aurora (3306)
Source: EC2 보안 그룹 (sg-xxxxx)
```

---

## 🌐 도메인 연결

### Route 53 설정
1. Route 53 → 호스팅 영역 → 도메인 선택
2. 레코드 생성:
   - **레코드 이름**: admin (또는 원하는 서브도메인)
   - **레코드 타입**: A
   - **값**: `13.124.222.92`
   - **TTL**: 300

### SSL 인증서 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# 인증서 발급 (도메인 연결 후)
sudo certbot --nginx -d admin.asommguide.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## 📝 중요 체크리스트

배포 전:
- [ ] SSH 키 파일 확보
- [ ] 환경 변수 정보 확보 (.env)
- [ ] Firebase Admin SDK JSON 파일 확보
- [ ] RDS 엔드포인트 및 접속 정보 확보
- [ ] 도메인 DNS 접근 권한 확보

배포 후:
- [ ] 보안 그룹 설정 (포트 22, 80, 443)
- [ ] RDS 보안 그룹에 EC2 허용
- [ ] Nginx 설치 및 설정
- [ ] SSL 인증서 설정
- [ ] PM2 부팅시 자동 시작 설정
- [ ] CloudWatch 로그 설정 (선택)
- [ ] 백업 스크립트 설정 (선택)

---

## 🆘 트러블슈팅

### 접속 안됨
```bash
# 보안 그룹 확인
# AWS Console → EC2 → 보안 그룹 → 인바운드 규칙

# SSH 포트 22가 내 IP에 열려있는지 확인
```

### 애플리케이션 시작 안됨
```bash
# 로그 확인
pm2 logs admin-api

# 환경 변수 확인
cat .env

# 포트 확인
sudo lsof -i :3000
```

### 데이터베이스 연결 안됨
```bash
# RDS 엔드포인트 ping 테스트
ping your-rds-endpoint.rds.amazonaws.com

# 텔넷으로 포트 확인
telnet your-rds-endpoint.rds.amazonaws.com 3306

# RDS 보안 그룹 확인 필요
```

---

## 💰 비용 정보

현재 설정:
- **EC2 t2.micro**: 월 약 $10 (프리티어면 무료)
- **데이터 전송**: 사용량에 따라
- **RDS** (별도 설정시): 추가 비용 발생

---

## 📞 추가 정보 필요

배포 담당자가 다음 정보를 추가로 요청할 수 있습니다:

1. **SSH 키 파일** (.pem) - 안전하게 전달 필요
2. **RDS 엔드포인트 및 접속 정보**
3. **Firebase Admin SDK JSON 파일**
4. **환경 변수 전체 내용** (secrets-template.txt 작성)
5. **도메인 DNS 접근 권한**

이 정보들은 안전한 방법으로 전달해주세요:
- 1Password / Bitwarden 공유
- 암호화된 파일
- 직접 전달 (USB)

---

이 문서와 함께 전달할 파일:
- DEPLOYMENT_INFO.md (전체 가이드)
- CICD_SETUP.md (상세 설정)
- secrets-template.txt (작성 완료본)
- SSH 키 파일 (.pem)


