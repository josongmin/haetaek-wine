// routes/point.routes.js
import express from 'express';
import { insertPointForWritePrice, updatePointForWritePrice, deletePointHistoryWithSyncUserPoint } from '../controllers/point.controller.js';

const router = express.Router();

router.post('/insert/writePrice', insertPointForWritePrice);
router.post('/update/writePrice', updatePointForWritePrice);
router.post('/delete', deletePointHistoryWithSyncUserPoint);

export default router;