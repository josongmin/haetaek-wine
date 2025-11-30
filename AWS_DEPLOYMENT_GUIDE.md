# AWS CI/CD 배포 가이드

이 가이드는 wine-admin 프로젝트를 AWS에 배포하는 다양한 방법을 설명합니다.

## 목차

1. [사전 준비](#사전-준비)
2. [배포 방법 선택](#배포-방법-선택)
3. [GitHub Actions 설정](#github-actions-설정)
4. [AWS CodePipeline 설정](#aws-codepipeline-설정)
5. [Docker 배포](#docker-배포)
6. [환경 변수 관리](#환경-변수-관리)
7. [모니터링 및 로깅](#모니터링-및-로깅)

---

## 사전 준비

### 1. AWS 계정 및 IAM 설정

```bash
# AWS CLI 설치 (macOS)
brew install awscli

# AWS 자격 증명 설정
aws configure
```

필요한 IAM 권한:
- EC2 (배포 대상이 EC2인 경우)
- S3 (정적 파일 호스팅)
- CloudFront (CDN)
- RDS (데이터베이스)
- Systems Manager Parameter Store (환경 변수 관리)
- CodeBuild, CodePipeline (CI/CD)

### 2. 로컬 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env
# .env 파일을 편집하여 실제 값 입력

# 로컬 테스트
npm run dev
```

---

## 배포 방법 선택

### Option 1: EC2 + PM2 (전통적인 방법)

**장점:**
- 간단한 설정
- PM2로 프로세스 관리
- 비용 효율적

**단점:**
- 수동 스케일링
- 서버 관리 필요

### Option 2: S3 + CloudFront (정적 사이트)

**장점:**
- 클라이언트만 배포시 최적
- 자동 스케일링
- 저렴한 비용

**단점:**
- 백엔드는 별도 배포 필요

### Option 3: ECS + Fargate (컨테이너)

**장점:**
- 서버리스 컨테이너
- 자동 스케일링
- 관리 불필요

**단점:**
- 복잡한 설정
- 비용이 높을 수 있음

### Option 4: Elastic Beanstalk (PaaS)

**장점:**
- 완전 관리형
- 쉬운 배포
- 자동 스케일링

**단점:**
- 제한적인 커스터마이징
- 비용이 높을 수 있음

---

## GitHub Actions 설정

### 1. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions

필수 Secrets:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# EC2 배포시
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-2.compute.amazonaws.com
EC2_USER=ubuntu
EC2_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----...

# S3 배포시
S3_BUCKET_NAME=wine-admin-static
CLOUDFRONT_DISTRIBUTION_ID=E123456789ABC

# Elastic Beanstalk 배포시
EB_APPLICATION_NAME=wine-admin
EB_ENVIRONMENT_NAME=wine-admin-prod
```

### 2. GitHub Variables 설정

```
DEPLOYMENT_TYPE=ec2  # 또는 s3, eb
```

### 3. 워크플로우 실행

```bash
# main 브랜치에 푸시하면 자동 배포
git push origin main

# 또는 수동 실행
# GitHub → Actions → Deploy to AWS → Run workflow
```

---

## AWS CodePipeline 설정

### 1. CodeBuild 프로젝트 생성

```bash
# AWS CLI로 생성
aws codebuild create-project \
  --name wine-admin-build \
  --source type=GITHUB,location=https://github.com/your-org/wine-admin.git \
  --artifacts type=S3,location=wine-admin-artifacts \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL \
  --service-role arn:aws:iam::YOUR_ACCOUNT:role/CodeBuildServiceRole
```

### 2. CodePipeline 생성

AWS Console → CodePipeline → Create pipeline

**단계:**
1. Source: GitHub (v2)
2. Build: CodeBuild (위에서 생성한 프로젝트)
3. Deploy: 
   - EC2: CodeDeploy
   - S3: S3 Deploy
   - ECS: ECS Deploy

### 3. buildspec.yml 사용

프로젝트 루트의 `buildspec.yml` 파일이 자동으로 사용됩니다.

---

## Docker 배포

### 1. 로컬 테스트

```bash
# 이미지 빌드
docker build -t wine-admin .

# 컨테이너 실행
docker run -p 3000:3000 --env-file .env wine-admin

# 또는 docker-compose 사용
docker-compose up -d
```

### 2. AWS ECR에 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com

# ECR 리포지토리 생성
aws ecr create-repository --repository-name wine-admin

# 이미지 태그
docker tag wine-admin:latest YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/wine-admin:latest

# 이미지 푸시
docker push YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/wine-admin:latest
```

### 3. ECS에 배포

```bash
# ECS 클러스터 생성
aws ecs create-cluster --cluster-name wine-admin-cluster

# 태스크 정의 등록 (task-definition.json 필요)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 서비스 생성
aws ecs create-service \
  --cluster wine-admin-cluster \
  --service-name wine-admin-service \
  --task-definition wine-admin:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

---

## 환경 변수 관리

### AWS Systems Manager Parameter Store

```bash
# 파라미터 저장
aws ssm put-parameter \
  --name /wine-admin/prod/database-url \
  --value "mysql://user:pass@host:3306/db" \
  --type SecureString

# 파라미터 조회
aws ssm get-parameter \
  --name /wine-admin/prod/database-url \
  --with-decryption
```

### AWS Secrets Manager

```bash
# 시크릿 생성
aws secretsmanager create-secret \
  --name wine-admin-prod \
  --secret-string '{"db_password":"xxx","jwt_secret":"yyy"}'

# 시크릿 조회
aws secretsmanager get-secret-value \
  --secret-id wine-admin-prod
```

### 서버 코드에서 사용

```javascript
// server/config/secrets.js
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: "ap-northeast-2" });

export async function getParameter(name) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true
  });
  
  const response = await client.send(command);
  return response.Parameter.Value;
}
```

---

## 모니터링 및 로깅

### CloudWatch 설정

```bash
# 로그 그룹 생성
aws logs create-log-group --log-group-name /aws/wine-admin

# 로그 스트림 생성
aws logs create-log-stream \
  --log-group-name /aws/wine-admin \
  --log-stream-name production
```

### PM2 로깅

```bash
# PM2 로그 확인
pm2 logs admin-api

# PM2 모니터링
pm2 monit

# PM2 로그를 CloudWatch로 전송 (pm2-cloudwatch 사용)
npm install -g pm2-cloudwatch
pm2 install pm2-cloudwatch
```

---

## 배포 체크리스트

### 배포 전

- [ ] 모든 테스트 통과
- [ ] 환경 변수 확인
- [ ] 데이터베이스 마이그레이션 준비
- [ ] 백업 생성
- [ ] 롤백 계획 수립

### 배포 중

- [ ] 빌드 성공 확인
- [ ] 헬스 체크 통과
- [ ] 로그 모니터링

### 배포 후

- [ ] 기능 테스트
- [ ] 성능 모니터링
- [ ] 에러 로그 확인
- [ ] 사용자 피드백 수집

---

## 트러블슈팅

### 빌드 실패

```bash
# 로컬에서 동일한 환경으로 빌드 테스트
docker run -it node:20-alpine sh
npm ci
npm run build:client
```

### 배포 실패

```bash
# EC2 SSH 접속
ssh -i key.pem ubuntu@ec2-host

# 로그 확인
pm2 logs admin-api --lines 100

# 프로세스 상태 확인
pm2 status
pm2 describe admin-api
```

### 데이터베이스 연결 실패

```bash
# 보안 그룹 확인
aws ec2 describe-security-groups --group-ids sg-xxxxx

# RDS 엔드포인트 확인
aws rds describe-db-instances --db-instance-identifier wine-admin-db
```

---

## 유용한 명령어

```bash
# 스크립트 실행 권한 부여
chmod +x scripts/*.sh

# 배포 스크립트 실행
./scripts/deploy.sh

# 롤백
./scripts/rollback.sh

# PM2 설정
./scripts/setup-pm2.sh

# Docker 빌드 및 실행
docker-compose up -d

# AWS 리소스 상태 확인
aws cloudformation describe-stacks --stack-name wine-admin
```

---

## 추가 리소스

- [AWS 공식 문서](https://docs.aws.amazon.com/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [PM2 문서](https://pm2.keymetrics.io/)
- [Docker 문서](https://docs.docker.com/)

---

## 지원

문제가 발생하면 다음을 확인하세요:

1. GitHub Actions 로그
2. CloudWatch 로그
3. PM2 로그
4. 데이터베이스 연결 상태
5. 보안 그룹 및 네트워크 설정


