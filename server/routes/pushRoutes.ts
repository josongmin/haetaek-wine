import { Router } from 'express';
import {
  sendToTopicController,
  sendToUsersController,
  sendToTokenController,
} from '../controllers/push.controller.js';

const router = Router();

router.post('/send-to-topic', sendToTopicController);
router.post('/send-to-users', sendToUsersController);
router.post('/send-to-token', sendToTokenController);

export default router;

