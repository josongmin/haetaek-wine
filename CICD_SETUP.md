# CI/CD 설정 완료 체크리스트

이 문서는 AWS CI/CD 설정을 완료하기 위한 단계별 가이드입니다.

## 📋 준비된 파일들

다음 파일들이 생성되었습니다:

### GitHub Actions
- `.github/workflows/deploy.yml` - 배포 워크플로우
- `.github/workflows/test.yml` - 테스트 워크플로우
- `.github/PULL_REQUEST_TEMPLATE.md` - PR 템플릿

### AWS CodeBuild
- `buildspec.yml` - CodeBuild 빌드 스펙

### Docker
- `Dockerfile` - 멀티 스테이지 빌드
- `.dockerignore` - Docker 빌드 제외 파일
- `docker-compose.yml` - 로컬 개발/테스트용
- `task-definition.json` - ECS Fargate 태스크 정의

### 배포 스크립트
- `scripts/deploy.sh` - EC2 배포 스크립트
- `scripts/rollback.sh` - 롤백 스크립트
- `scripts/setup-pm2.sh` - PM2 초기 설정

### 설정 파일
- `ecosystem.config.cjs` - PM2 설정
- `nginx.conf` - Nginx 리버스 프록시 설정
- `env.template` - 환경 변수 템플릿

### 문서
- `AWS_DEPLOYMENT_GUIDE.md` - 상세한 배포 가이드

### 코드 변경
- `server/index.js` - 헬스체크 엔드포인트 추가

---

## 🚀 빠른 시작 (단계별)

### 1단계: 환경 변수 설정

```bash
# 환경 변수 파일 생성
cp env.template .env

# .env 파일을 편집하여 실제 값 입력
# DB 정보, API 키 등을 설정하세요
```

### 2단계: 로컬 테스트

```bash
# 의존성 설치
npm install

# 서버 테스트 실행
npm run test --workspace=server

# 클라이언트 빌드 테스트
npm run build:client

# Docker로 로컬 테스트 (선택사항)
docker-compose up -d
```

### 3단계: GitHub 저장소 설정

#### A. GitHub Secrets 추가

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

**필수 Secrets:**

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

**EC2 배포를 위한 추가 Secrets:**
```
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-2.compute.amazonaws.com
EC2_USER=ubuntu
EC2_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

**S3/CloudFront 배포를 위한 추가 Secrets:**
```
S3_BUCKET_NAME=wine-admin-static
CLOUDFRONT_DISTRIBUTION_ID=E123456789ABC
```

#### B. GitHub Variables 추가

GitHub 저장소 → Settings → Secrets and variables → Actions → Variables

```
DEPLOYMENT_TYPE=ec2  # 또는 s3, eb 중 선택
```

### 4단계: AWS 리소스 준비

#### Option A: EC2 배포

```bash
# 1. EC2 인스턴스 생성 (Ubuntu 20.04 LTS 권장)
# 2. 보안 그룹 설정 (포트 22, 80, 443, 3000 오픈)
# 3. SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-host

# 4. 서버 초기 설정
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git

# 5. Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 6. PM2 설치
sudo npm install -g pm2

# 7. 프로젝트 클론
git clone https://github.com/your-org/wine-admin.git
cd wine-admin

# 8. 환경 변수 설정
cp env.template .env
nano .env  # 실제 값 입력

# 9. 초기 배포
./scripts/setup-pm2.sh
```

#### Option B: S3 + CloudFront 배포

```bash
# 1. S3 버킷 생성
aws s3 mb s3://wine-admin-static --region ap-northeast-2

# 2. 버킷을 정적 웹사이트로 설정
aws s3 website s3://wine-admin-static --index-document index.html --error-document index.html

# 3. 버킷 정책 설정 (public read 허용)
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::wine-admin-static/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket wine-admin-static --policy file://bucket-policy.json

# 4. CloudFront 배포 생성 (AWS Console 또는 CLI)
```

#### Option C: ECS Fargate 배포

```bash
# 1. ECR 리포지토리 생성
aws ecr create-repository --repository-name wine-admin --region ap-northeast-2

# 2. 로컬에서 Docker 이미지 빌드 및 푸시
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com

docker build -t wine-admin .
docker tag wine-admin:latest YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/wine-admin:latest
docker push YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/wine-admin:latest

# 3. task-definition.json 수정 (YOUR_ACCOUNT_ID 교체)

# 4. ECS 클러스터 생성
aws ecs create-cluster --cluster-name wine-admin-cluster --region ap-northeast-2

# 5. 태스크 정의 등록
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 6. 서비스 생성 (VPC, 서브넷, 보안 그룹 필요)
aws ecs create-service \
  --cluster wine-admin-cluster \
  --service-name wine-admin-service \
  --task-definition wine-admin:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### 5단계: AWS Systems Manager에 환경 변수 저장

```bash
# 중요한 환경 변수를 Parameter Store에 저장
aws ssm put-parameter \
  --name /wine-admin/prod/db-host \
  --value "your-rds-endpoint.amazonaws.com" \
  --type String \
  --region ap-northeast-2

aws ssm put-parameter \
  --name /wine-admin/prod/db-user \
  --value "admin" \
  --type String \
  --region ap-northeast-2

aws ssm put-parameter \
  --name /wine-admin/prod/db-name \
  --value "wine_admin" \
  --type String \
  --region ap-northeast-2

# 민감한 정보는 SecureString 또는 Secrets Manager 사용
aws ssm put-parameter \
  --name /wine-admin/prod/db-password \
  --value "your-password" \
  --type SecureString \
  --region ap-northeast-2

# Firebase Admin SDK 키 저장
aws secretsmanager create-secret \
  --name wine-admin-firebase \
  --secret-string file://path/to/firebase-adminsdk.json \
  --region ap-northeast-2
```

### 6단계: 첫 배포

#### GitHub Actions 자동 배포
```bash
# main 브랜치에 푸시
git add .
git commit -m "Setup CI/CD"
git push origin main

# GitHub Actions 탭에서 워크플로우 진행 상황 확인
```

#### 수동 배포 (EC2)
```bash
# EC2에 SSH 접속 후
cd ~/wine-admin
./scripts/deploy.sh --pull
```

---

## ✅ 배포 후 확인사항

### 1. 헬스체크 확인
```bash
curl http://your-server/health
# 응답: {"status":"ok","timestamp":"2024-..."}
```

### 2. 애플리케이션 접속
브라우저에서 `http://your-server` 접속하여 정상 작동 확인

### 3. 로그 확인

**PM2 (EC2):**
```bash
pm2 logs admin-api
pm2 monit
```

**CloudWatch (ECS):**
```bash
aws logs tail /ecs/wine-admin --follow
```

### 4. 모니터링 설정

**PM2 모니터링:**
```bash
# PM2 Plus (선택사항)
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
```

**CloudWatch 알람:**
- CPU 사용률 > 80%
- 메모리 사용률 > 80%
- 5xx 에러 발생
- 헬스체크 실패

---

## 🔄 일상적인 배포 워크플로우

### 개발 → 배포 프로세스

1. **개발 브랜치에서 작업**
```bash
git checkout -b feature/new-feature
# 코드 작성...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

2. **Pull Request 생성**
- GitHub에서 PR 생성
- 자동으로 테스트 실행 (`.github/workflows/test.yml`)
- 코드 리뷰 진행

3. **main 브랜치에 머지**
- PR 승인 후 머지
- 자동으로 배포 워크플로우 실행 (`.github/workflows/deploy.yml`)

4. **배포 확인**
- GitHub Actions 탭에서 배포 진행 상황 확인
- 배포 완료 후 프로덕션 환경 테스트

### 긴급 롤백

```bash
# EC2에 SSH 접속
ssh -i key.pem ubuntu@your-ec2-host
cd ~/wine-admin
./scripts/rollback.sh
```

---

## 📊 모니터링 및 유지보수

### PM2 명령어

```bash
pm2 status              # 프로세스 상태 확인
pm2 logs admin-api      # 로그 확인
pm2 monit               # 실시간 모니터링
pm2 restart admin-api   # 재시작
pm2 reload admin-api    # 무중단 재시작
pm2 stop admin-api      # 중지
pm2 delete admin-api    # 삭제
```

### Docker 명령어

```bash
docker-compose ps       # 컨테이너 상태 확인
docker-compose logs -f  # 로그 확인
docker-compose restart  # 재시작
docker-compose down     # 중지 및 삭제
docker-compose up -d    # 시작
```

### AWS CLI 명령어

```bash
# ECS 서비스 상태
aws ecs describe-services --cluster wine-admin-cluster --services wine-admin-service

# ECS 태스크 목록
aws ecs list-tasks --cluster wine-admin-cluster --service-name wine-admin-service

# CloudWatch 로그
aws logs tail /ecs/wine-admin --follow

# Parameter Store 값 조회
aws ssm get-parameter --name /wine-admin/prod/db-host
```

---

## 🐛 트러블슈팅

### 빌드 실패

**증상:** GitHub Actions에서 빌드 실패

**해결:**
1. 로컬에서 `npm run build:client` 실행하여 재현
2. 의존성 문제인 경우: `npm ci` 실행
3. TypeScript 오류: `npm run type-check --workspace=client`

### 배포 실패

**증상:** 배포 스크립트 실패 또는 서버 시작 안됨

**해결:**
1. SSH로 서버 접속
2. `pm2 logs admin-api` 로그 확인
3. 환경 변수 확인: `cat .env`
4. 데이터베이스 연결 확인
5. 포트 충돌 확인: `lsof -i :3000`

### Docker 빌드 실패

**증상:** Docker 이미지 빌드 중 에러

**해결:**
1. `.dockerignore` 확인
2. 빌드 로그 확인: `docker build -t wine-admin . --progress=plain`
3. 캐시 없이 빌드: `docker build -t wine-admin . --no-cache`

---

## 📚 추가 자료

- [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md) - 상세한 AWS 배포 가이드
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

## 🔐 보안 체크리스트

- [ ] AWS IAM 권한 최소화
- [ ] 환경 변수에 민감 정보 절대 커밋하지 않기
- [ ] SSH 키 보안 관리
- [ ] 데이터베이스 보안 그룹 설정
- [ ] HTTPS 설정 (SSL/TLS)
- [ ] API 레이트 리미팅 설정
- [ ] 정기적인 의존성 업데이트
- [ ] 보안 패치 적용

---

## 🎯 다음 단계

1. [ ] RDS 데이터베이스 설정
2. [ ] SSL 인증서 설정 (Let's Encrypt)
3. [ ] CloudWatch 알람 설정
4. [ ] 백업 자동화
5. [ ] 로그 로테이션 설정
6. [ ] 성능 모니터링 도구 연동
7. [ ] Staging 환경 구축

---

궁금한 점이 있으면 팀에 문의하거나 이슈를 생성해주세요!


