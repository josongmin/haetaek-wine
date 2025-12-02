// routes/shop.routes.ts
import express from 'express';
import { getWineShopList, getUsedDiscountHistoryListOfShop, getCommentHistoryListOfShop } from '../controllers/wineShop.controller.js';

const router = express.Router();

router.post('/list', getWineShopList);
router.post('/getUsedDiscountHistoryList', getUsedDiscountHistoryListOfShop);
router.post('/getCommentHistoryList', getCommentHistoryListOfShop);

export default router;

