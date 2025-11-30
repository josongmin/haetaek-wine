# Multi-stage build for wine-admin application

# Stage 1: Build client
FROM node:20-alpine AS client-builder

WORKDIR /app

# 루트 package.json과 workspace 설정 복사
COPY package*.json ./
COPY shared/ ./shared/
COPY client/package*.json ./client/

# 클라이언트 의존성 설치
RUN npm ci

# 클라이언트 소스 복사 및 빌드
COPY client/ ./client/
RUN npm run build:client

# Stage 2: Setup server
FROM node:20-alpine AS server-builder

WORKDIR /app

# 루트 package.json과 workspace 설정 복사
COPY package*.json ./
COPY shared/ ./shared/
COPY server/package*.json ./server/

# 서버 의존성 설치 (프로덕션만)
RUN npm ci --only=production --ignore-scripts

# 서버 소스 복사
COPY server/ ./server/

# Stage 3: Final production image
FROM node:20-alpine

# 보안을 위해 non-root 유저로 실행
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 필요한 파일들만 복사
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/server ./server
COPY --from=server-builder --chown=nodejs:nodejs /app/shared ./shared
COPY --from=server-builder --chown=nodejs:nodejs /app/package*.json ./

# 빌드된 클라이언트 파일 복사
COPY --from=client-builder --chown=nodejs:nodejs /app/client/build ./client/build

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 유저 전환
USER nodejs

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["node", "server/index.js"]


