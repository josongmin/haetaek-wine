// controllers/push.controller.ts
import type { Request, Response } from 'express';
import { sendToTopic, sendToTokens, sendToToken } from '../services/firebase.js';

interface SendToTopicBody {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface SendToUsersBody {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface SendToTokenBody {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendToTopicController(req: Request<{}, {}, SendToTopicBody>, res: Response): Promise<void> {
  try {
    const { topic, title, body, data = {} } = req.body || {};
    if (!topic || !title || !body) {
      res.status(400).json({ ok: false, error: 'topic/title/body are required' });
      return;
    }
    const id = await sendToTopic({ topic, title, body, data });
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
}

export async function sendToUsersController(req: Request<{}, {}, SendToUsersBody>, res: Response): Promise<void> {
  try {
    const { userIds = [], title, body, data = {} } = req.body || {};
    if (!Array.isArray(userIds) || !userIds.length) {
      res.json({ ok: true, sent: 0, message: 'no userIds' });
      return;
    }
    if (!title || !body) {
      res.status(400).json({ ok: false, error: 'title/body are required' });
      return;
    }

    // TODO: DB에서 userIds -> tokens 조회
    const tokens: string[] = []; // 예: await db.getFcmTokensByUserIds(userIds);

    if (!tokens.length) {
      res.json({ ok: true, sent: 0, message: 'no tokens' });
      return;
    }

    const result = await sendToTokens({ tokens, title, body, data });
    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
}

export async function sendToTokenController(req: Request<{}, {}, SendToTokenBody>, res: Response): Promise<void> {
  try {
    const { token, title, body, data = {} } = req.body || {};
    if (!token || !title || !body) {
      res.status(400).json({ ok: false, error: 'token/title/body are required' });
      return;
    }
    const id = await sendToToken({ token, title, body, data });
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
}

