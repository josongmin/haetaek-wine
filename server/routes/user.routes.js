// routes/user.routes.js
import express from 'express';
import { getWinePriceList, changePhotoStatus } from '../controllers/wine.controller.js';
import { updatePriceStatus } from '../controllers/wine.controller.js';
import { updateUserLevel, getHotDealCountOfUser, getUserByIndex } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/changePhotoStatus', changePhotoStatus);
router.post('/price/changeStatus', updatePriceStatus);
router.post('/updateLevel', updateUserLevel);
router.post('/hotDealCount', getHotDealCountOfUser);
router.post('/getUserByIndex', getUserByIndex);

export default router;