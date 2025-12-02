# GitHub Actions 자동 배포 설정 가이드

## 📋 개요

이 프로젝트는 GitHub Actions를 사용하여 자동 배포를 설정할 수 있습니다.

## 🚀 빠른 설정

### 1단계: GitHub Secrets 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### 필수 Secrets:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

#### EC2 배포를 위한 추가 Secrets:

```
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-2.compute.amazonaws.com
EC2_USER=ubuntu
EC2_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

#### S3/CloudFront 배포를 위한 추가 Secrets:

```
S3_BUCKET_NAME=wine-admin-static
CLOUDFRONT_DISTRIBUTION_ID=E123456789ABC
```

### 2단계: GitHub Variables 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **Variables** → **New repository variable**

```
DEPLOYMENT_TYPE=ec2  # 또는 s3, eb 중 선택
```

### 3단계: Environment 설정 (선택사항)

프로덕션 환경 보호를 위해:

GitHub 저장소 → **Settings** → **Environments** → **New environment**

- Environment name: `production`
- Protection rules: 필요시 브랜치 보호 규칙 설정

## 🔄 배포 워크플로우

### 자동 배포 트리거

- `main` 또는 `production` 브랜치에 push 시 자동 배포
- GitHub Actions 탭에서 수동 실행 가능 (`workflow_dispatch`)

### 배포 프로세스

1. **테스트 실행** (`test.yml`)
   - 서버 테스트
   - 클라이언트 빌드 테스트
   - 린트 검사

2. **빌드** (`deploy.yml`)
   - 서버 TypeScript 빌드
   - 클라이언트 빌드

3. **배포** (`deploy.yml`)
   - EC2: SSH를 통한 파일 전송 및 PM2 재시작
   - S3: 클라이언트 빌드 파일 업로드 및 CloudFront 무효화
   - Elastic Beanstalk: EB CLI를 통한 배포

## 📝 배포 타입별 설정

### Option 1: EC2 배포

**필요한 Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`

**Variables:**
- `DEPLOYMENT_TYPE=ec2`

**EC2 서버 준비:**
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm 설치
npm install -g pnpm

# PM2 설치
npm install -g pm2

# 프로젝트 클론
git clone https://github.com/your-org/wine-admin.git
cd wine-admin

# 환경 변수 설정
cp env.template .env
# .env 파일 편집

# 초기 배포
pnpm install --frozen-lockfile
pnpm run build
pm2 start ecosystem.config.cjs
```

### Option 2: S3 + CloudFront 배포

**필요한 Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

**Variables:**
- `DEPLOYMENT_TYPE=s3`

**S3 버킷 설정:**
```bash
# S3 버킷 생성
aws s3 mb s3://wine-admin-static --region ap-northeast-2

# 버킷을 정적 웹사이트로 설정
aws s3 website s3://wine-admin-static \
  --index-document index.html \
  --error-document index.html
```

### Option 3: Elastic Beanstalk 배포

**필요한 Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EB_APPLICATION_NAME`
- `EB_ENVIRONMENT_NAME`

**Variables:**
- `DEPLOYMENT_TYPE=eb`

## ✅ 배포 확인

배포 완료 후:

1. **헬스체크 확인**
   ```bash
   curl http://your-server/health
   ```

2. **GitHub Actions 로그 확인**
   - Actions 탭에서 워크플로우 실행 상태 확인
   - 실패 시 로그 확인하여 문제 해결

## 🔧 트러블슈팅

### 빌드 실패

- 로컬에서 `pnpm run build` 실행하여 재현
- 의존성 문제: `pnpm install --frozen-lockfile` 재실행
- TypeScript 오류: `pnpm --filter server type-check` 확인

### 배포 실패

- SSH 키 권한 확인: `chmod 600 private_key.pem`
- EC2 보안 그룹에서 GitHub Actions IP 허용
- PM2 프로세스 확인: `pm2 list`

### 환경 변수 문제

- `.env` 파일이 EC2에 올바르게 설정되었는지 확인
- AWS Systems Manager Parameter Store 사용 권장

## 📚 추가 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [AWS CLI 설정](https://docs.aws.amazon.com/cli/)
- [PM2 문서](https://pm2.keymetrics.io/)

