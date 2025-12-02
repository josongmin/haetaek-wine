// routes/user.routes.ts
import express from 'express';
import { getHotDealCountOfUser, updateUserLevel } from '../controllers/user.controller.js';
import { signIn } from '../controllers/wine-proxy.controller.js';

const router = express.Router();

// Proxy routes
router.post('/signIn', signIn);

// Local routes
router.post('/getHotDealCount', getHotDealCountOfUser);
router.post('/updateUserLevel', updateUserLevel);

export default router;
