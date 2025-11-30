# 배포 담당자를 위한 정보

이 문서는 wine-admin 프로젝트를 AWS에 배포하기 위해 필요한 모든 정보를 담고 있습니다.

---

## 📋 프로젝트 개요

- **프로젝트명**: wine-admin (와인 관리자 도구)
- **구조**: Monorepo (클라이언트 + 서버)
  - **클라이언트**: React (Vite) - 포트 3001 (개발시)
  - **서버**: Node.js + Express - 포트 3000
  - **데이터베이스**: MySQL
- **Node 버전**: 20.x
- **GitHub**: [저장소 URL을 여기에]

---

## 🔑 필요한 정보 체크리스트

### 1. AWS 계정 정보

**제공 필요:**
- [ ] AWS 계정 ID: `____________`
- [ ] AWS 리전: `ap-northeast-2` (서울)
- [ ] IAM 사용자 생성 또는 임시 자격 증명 제공

**필요한 IAM 권한:**
- EC2 (인스턴스 생성/관리)
- RDS (데이터베이스)
- S3 (정적 파일 저장)
- CloudWatch (로깅/모니터링)
- Systems Manager (환경 변수 관리)
- CodeBuild, CodePipeline (선택사항 - CI/CD)

### 2. 데이터베이스 정보

**제공 필요:**
```
DB_HOST=____________.rds.amazonaws.com
DB_PORT=3306
DB_USER=____________
DB_PASSWORD=____________
DB_NAME=wine_admin
```

**데이터베이스 설정:**
- MySQL 버전: 8.0 권장
- 인스턴스 크기: db.t3.micro 이상 (프로덕션은 더 큰 것 권장)
- 스토리지: 20GB 이상
- 백업 설정: 자동 백업 활성화
- 보안 그룹: EC2에서만 접근 가능하도록 설정

**초기 데이터:**
- [ ] DB 스키마 파일이 있나요? 경로: `____________`
- [ ] 초기 데이터 마이그레이션이 필요한가요? (Yes/No)

### 3. Firebase 설정

**제공 필요:**
- [ ] Firebase Admin SDK JSON 키 파일
  - Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
  - 파일 다운로드 후 안전하게 전달 (이메일X, 보안 공유 도구 사용)

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  ...
}
```

### 4. 외부 API 키

**제공 필요:**
```
NAVER_CLIENT_ID=____________
NAVER_CLIENT_SECRET=____________
```

기타 필요한 API 키가 있다면 여기에 추가:
```
____________=____________
____________=____________
```

### 5. 도메인 및 SSL

**제공 필요:**
- [ ] 도메인: `____________` (예: admin.example.com)
- [ ] 도메인 DNS 관리 접근 권한 (Route 53 또는 외부 DNS)
- [ ] SSL 인증서 발급 방법: 
  - [ ] AWS Certificate Manager (ACM) 사용
  - [ ] Let's Encrypt 사용
  - [ ] 기존 인증서 제공

### 6. CORS 허용 도메인

**운영 환경에서 허용할 도메인:**
```
https://admin.asommguide.com
https://asommguide.com
(추가할 도메인이 있다면 여기에)
```

### 7. 서버 스펙 요구사항

**추천 사양:**

**개발/테스트 환경:**
- EC2: t3.micro (1 vCPU, 1GB RAM)
- RDS: db.t3.micro (1 vCPU, 1GB RAM)
- 월 예상 비용: $15-30

**프로덕션 환경:**
- EC2: t3.small 이상 (2 vCPU, 2GB RAM)
- RDS: db.t3.small 이상 (2 vCPU, 2GB RAM)
- S3 + CloudFront (선택사항)
- 월 예상 비용: $50-100+

**트래픽 예상:**
- 일일 활성 사용자: ______명
- 예상 동시 접속자: ______명
- 데이터 저장량: ______GB

### 8. 배포 방식 선택

다음 중 선호하는 배포 방식을 선택해주세요:

**Option A: EC2 + PM2** (가장 간단, 추천)
- [ ] 단일 EC2 인스턴스
- [ ] PM2로 프로세스 관리
- [ ] Nginx 리버스 프록시
- [ ] 예상 설정 시간: 1-2시간

**Option B: Docker + ECS Fargate** (컨테이너, 자동 스케일링)
- [ ] Docker 이미지 사용
- [ ] ECS Fargate (서버리스)
- [ ] 자동 스케일링 설정
- [ ] 예상 설정 시간: 3-4시간

**Option C: S3 + CloudFront (클라이언트) + EC2 (서버)**
- [ ] 클라이언트는 S3에 정적 호스팅
- [ ] CloudFront CDN 사용
- [ ] 서버는 별도 EC2
- [ ] 예상 설정 시간: 2-3시간

### 9. CI/CD 설정

**GitHub Actions 자동 배포를 원하시나요?**
- [ ] Yes - main 브랜치 푸시시 자동 배포
- [ ] No - 수동 배포만

**자동 배포 선택시 제공 필요:**
- [ ] GitHub 저장소 접근 권한 (Collaborator 추가)
- [ ] GitHub Actions Secrets 설정 권한

---

## 📝 환경 변수 전체 목록

배포 담당자에게 다음 정보를 안전하게 전달해주세요:

```bash
# 서버 설정
NODE_ENV=production
PORT=3000

# 데이터베이스
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-secure-password-here
DB_NAME=wine_admin

# Firebase (JSON 파일 또는 환경 변수로)
FIREBASE_ADMIN_SDK_PATH=./config/firebase-adminsdk.json
# 또는
# FIREBASE_ADMIN_SDK_JSON={"type":"service_account",...}

# CORS
CORS_ORIGIN=https://admin.asommguide.com

# JWT (사용한다면)
JWT_SECRET=your-random-secret-key-change-this
JWT_EXPIRES_IN=7d

# AWS
AWS_REGION=ap-northeast-2

# 네이버 API
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret

# 로깅
LOG_LEVEL=info
```

---

## 📂 전달할 파일

배포 담당자에게 다음 파일들을 전달해주세요:

### 1. 보안 파일 (안전한 방법으로 전달)
- [ ] `firebase-adminsdk.json` - Firebase 서비스 계정 키
- [ ] `.env` - 환경 변수 파일 (또는 위의 정보 전달)
- [ ] SSH 키 페어 (EC2 접속용, 있다면)
- [ ] RDS 접속 정보

**안전한 전달 방법:**
- 1Password, Bitwarden 같은 비밀번호 관리자
- AWS Secrets Manager에 미리 저장
- 암호화된 파일 + 비밀번호 별도 전달

### 2. 코드 저장소
- [ ] GitHub 저장소 접근 권한 부여
- [ ] 또는 ZIP 파일로 코드 전달

---

## 🚀 배포 가이드 문서

프로젝트 루트에 다음 문서들이 준비되어 있습니다:

1. **CICD_SETUP.md** - 단계별 설정 체크리스트
2. **AWS_DEPLOYMENT_GUIDE.md** - 상세한 AWS 설정 가이드
3. **scripts/** - 배포 자동화 스크립트
   - `deploy.sh` - 배포 스크립트
   - `setup-pm2.sh` - PM2 초기 설정
   - `rollback.sh` - 롤백 스크립트

배포 담당자는 이 문서들을 참고하여 배포를 진행할 수 있습니다.

---

## ⏱️ 예상 일정

**초기 배포:**
- 준비 작업: 0.5일
- 인프라 구축: 0.5-1일
- 배포 및 테스트: 0.5일
- **총 예상: 1.5-2일**

**이후 배포:**
- GitHub Actions 자동 배포: 10-15분
- 수동 배포: 5-10분

---

## 🔒 보안 체크리스트

배포시 반드시 확인할 사항:

- [ ] RDS는 public 접근 비활성화 (EC2에서만 접근)
- [ ] EC2 보안 그룹은 필요한 포트만 오픈 (22, 80, 443)
- [ ] 환경 변수는 절대 코드에 커밋하지 않음
- [ ] Firebase Admin SDK 키는 안전하게 보관
- [ ] SSH 키는 안전하게 보관
- [ ] HTTPS 설정 (SSL/TLS)
- [ ] 데이터베이스 백업 설정 활성화

---

## 📞 연락처

**배포 중 문제 발생시:**
- 담당자: [이름]
- 연락처: [전화번호/이메일]
- 가능 시간: [업무 시간]

**프로젝트 정보:**
- 개발자: [이름]
- GitHub: [계정]
- 문서: 프로젝트 루트의 README.md, CICD_SETUP.md 참고

---

## ✅ 배포 완료 후 체크

배포 완료 후 다음을 확인해주세요:

- [ ] 웹사이트 접속 가능: `https://your-domain.com`
- [ ] API 헬스체크: `https://your-domain.com/health`
- [ ] 로그인 기능 정상 작동
- [ ] 데이터베이스 연결 확인
- [ ] Firebase 푸시 알림 테스트
- [ ] 로그 수집 정상 작동 (CloudWatch 또는 PM2)
- [ ] HTTPS 정상 작동
- [ ] 백업 설정 확인

---

## 📊 모니터링 설정

배포 후 다음 모니터링을 설정해주세요:

- [ ] CloudWatch 알람
  - CPU 사용률 > 80%
  - 메모리 사용률 > 80%
  - 디스크 사용률 > 80%
  - 헬스체크 실패
- [ ] 로그 확인 방법 공유
- [ ] 백업 주기 확인 (일일 백업 권장)

---

## 💰 비용 추정

**월 예상 AWS 비용:**

개발 환경:
- EC2 t3.micro: $8
- RDS db.t3.micro: $15
- 기타 (S3, CloudWatch): $2-5
- **총: $25-30/월**

프로덕션 환경:
- EC2 t3.small: $17
- RDS db.t3.small: $35
- S3 + CloudFront: $5-10
- 기타: $5-10
- **총: $60-75/월**

(실제 비용은 트래픽과 사용량에 따라 달라질 수 있습니다)

---

## 🎯 배포 우선순위

**Phase 1 (필수):**
- [ ] EC2 인스턴스 생성
- [ ] RDS 데이터베이스 설정
- [ ] 애플리케이션 배포
- [ ] 도메인 연결 + HTTPS

**Phase 2 (권장):**
- [ ] CloudWatch 모니터링
- [ ] 자동 백업 설정
- [ ] CI/CD 파이프라인

**Phase 3 (선택):**
- [ ] CloudFront CDN
- [ ] Auto Scaling
- [ ] Load Balancer

---

배포 관련 질문이나 추가로 필요한 정보가 있으면 언제든지 연락주세요!


