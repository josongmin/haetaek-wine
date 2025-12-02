// index.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import wineRoutes from './routes/wine.routes.js';
import pointRoutes from './routes/point.routes.js';
import userRoutes from './routes/user.routes.js';
import shopRoutes from './routes/shop.routes.js';
import pushRoutes from './routes/pushRoutes.js';
import externalWineSearchRoutes from './routes/external_wine_search.routes.js';
import aiSuggestionRoutes from './routes/ai_suggestion.routes.js';

// __dirname을 ES 모듈에서 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 루트 디렉토리의 .env 파일 경로 지정
const rootEnvPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath });

// .env 파일 로드 확인 (디버깅용)
console.log('📁 .env 파일 경로:', rootEnvPath);
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 없음');
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 없음');

const app = express();

// CORS: 운영 도메인 + 로컬 허용
const allowed = new Set([
  'https://admin.asommguide.com',
  'http://admin.asommguide.com',
  'https://asommguide.com',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

// 개발 환경에서는 모든 localhost 포트 허용
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, cb) => {
    // origin이 없으면 (같은 origin 요청) 허용
    if (!origin) {
      return cb(null, true);
    }
    
    // 허용 목록에 있으면 허용
    if (allowed.has(origin)) {
      return cb(null, true);
    }
    
    // 개발 환경에서 localhost 또는 127.0.0.1이면 허용
    if (isDevelopment && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return cb(null, true);
    }
    
    // 그 외는 거부
    cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⬇️ 헬스체크 엔드포인트 (CI/CD 및 로드 밸런서용)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ⬇️ API 라우트 (그대로 유지)
app.use('/wine', wineRoutes);
app.use('/point', pointRoutes);
app.use('/user', userRoutes);
app.use('/shop', shopRoutes);
app.use('/push', pushRoutes);
app.use('/external_wine_search', externalWineSearchRoutes);
app.use('/ai', aiSuggestionRoutes);

// ⬇️ 여기부터 정적 파일 서빙 + SPA fallback (추가)
// 빌드 폴더 경로
const buildPath = path.join(__dirname, '../client/build');
const indexPath = path.join(buildPath, 'index.html');

// 빌드 폴더가 존재하는 경우에만 정적 파일 서빙
const buildExists = fs.existsSync(buildPath);
if (buildExists) {
  app.use(express.static(buildPath));
  console.log('Static files serving from:', buildPath);
} else {
  console.warn('⚠️  Client build folder not found. Run "pnpm build:client" to build the client.');
  console.warn('⚠️  Serving API only. Client should be run separately in development mode.');
}

// API 경로 패턴 정의
const API_PATHS = ['/wine', '/point', '/user', '/shop', '/push', '/external_wine_search', '/ai', '/health', '/crawl'];

// API 요청인지 확인하는 함수
const isApiRequest = (req: Request): boolean => {
  const path = req.path;
  // API 경로로 시작하는지 확인
  if (API_PATHS.some(apiPath => path.startsWith(apiPath))) {
    return true;
  }
  // Content-Type이 application/json인지 확인
  if (req.headers['content-type']?.includes('application/json')) {
    return true;
  }
  // Accept 헤더에 application/json이 포함되어 있는지 확인
  if (req.headers.accept?.includes('application/json')) {
    return true;
  }
  return false;
};

// 404 에러 핸들러 (API 요청인 경우)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (isApiRequest(req)) {
    return res.status(404).json({
      code: '404',
      errorMessage: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
  next();
});

// SPA 라우팅 처리 (API 제외 모든 경로를 index.html로)
// 빌드 파일이 있을 때만 실행
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (!buildExists) {
    // 빌드 파일이 없으면 404 반환 (개발 모드에서는 클라이언트를 별도로 실행)
    return res.status(404).json({
      code: '404',
      errorMessage: 'Client build not found. Please build the client first or run it separately in development mode.',
      path: req.path
    });
  }
  
  // index.html이 존재하는지 확인
  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({
      code: '404',
      errorMessage: 'index.html not found in build folder',
      path: req.path
    });
  }
  
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

