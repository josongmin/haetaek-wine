// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';                   // ⬅️ 추가
import { fileURLToPath } from 'url';       // ⬅️ 추가
import wineRoutes from './routes/wine.routes.js';
import pointRoutes from './routes/point.routes.js';
import userRoutes from './routes/user.routes.js';
import shopRoutes from './routes/shop.routes.js';
import pushRoutes from './routes/pushRoutes.js';
import externalWineSearchRoutes from './routes/external_wine_search.routes.js';
import aiSuggestionRoutes from './routes/ai_suggestion.routes.js';

dotenv.config();

const app = express();

// CORS: 운영 도메인 + 로컬 허용
const allowed = new Set([
  'https://admin.asommguide.com',  // 운영(필요한 도메인으로 수정)
  'http://admin.asommguide.com',  // 운영(필요한 도메인으로 수정)
  'https://asommguide.com',        // 필요시 유지/삭제
  'http://localhost:4000',     // ← same-origin 호출도 허용
  'http://127.0.0.1:4000',
  'http://localhost:3000',     // ← React 클라이언트
  'http://127.0.0.1:3000',
  'http://localhost:5173',     // ← Vite 쓰면 필요
  'http://127.0.0.1:5173',
]);
app.use(cors({
  origin: (origin, cb) => (!origin || allowed.has(origin) ? cb(null, true) : cb(new Error(`Not allowed by CORS: ${origin}`))),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⬇️ API 라우트 (그대로 유지)
app.use('/wine', wineRoutes);
app.use('/point', pointRoutes);
app.use('/user', userRoutes);
app.use('/shop', shopRoutes);
app.use('/push', pushRoutes);
app.use('/external_wine_search', externalWineSearchRoutes);
app.use('/ai', aiSuggestionRoutes);

// ⬇️ 여기부터 정적 파일 서빙 + SPA fallback (추가)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CRA build 폴더 서빙
app.use(express.static(path.join(__dirname, '../client/build')));

// SPA 라우팅 처리 (API 제외 모든 경로를 index.html로)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
// ⬆️ 추가 끝

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});