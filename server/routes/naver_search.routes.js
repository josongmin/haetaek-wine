// routes/naver_search.routes.js
import express from 'express';
import { integratedSearch, singleSearch } from '../controllers/naver_search.controller.js';

const router = express.Router();

// 네이버 통합 검색 API
// GET /naver_search?query=와인&types=cafearticle,blog,webkr&start=1&display=50&sort=sim
router.get('/', integratedSearch);

// 특정 타입만 검색
// GET /naver_search/cafearticle?query=와인&start=1&display=50&sort=sim
router.get('/:type', singleSearch);

export default router;

