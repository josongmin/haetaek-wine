// ESM 가정 ("type": "module")
import { sendToTopic, sendToTokens, sendToToken } from '../services/firebase.js';

export async function sendToTopicController(req, res) {
  try {
    const { topic, title, body, data = {} } = req.body || {};
    if (!topic || !title || !body) {
      return res.status(400).json({ ok: false, error: 'topic/title/body are required' });
    }
    const id = await sendToTopic({ topic, title, body, data });
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function sendToUsersController(req, res) {
  try {
    const { userIds = [], title, body, data = {} } = req.body || {};
    if (!Array.isArray(userIds) || !userIds.length) {
      return res.json({ ok: true, sent: 0, message: 'no userIds' });
    }
    if (!title || !body) {
      return res.status(400).json({ ok: false, error: 'title/body are required' });
    }

    // TODO: DB에서 userIds -> tokens 조회
    const tokens = []; // 예: await db.getFcmTokensByUserIds(userIds);

    if (!tokens.length) return res.json({ ok: true, sent: 0, message: 'no tokens' });

    const result = await sendToTokens({ tokens, title, body, data });
    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function sendToTokenController(req, res) {
  try {
    const { token, title, body, data = {} } = req.body || {};
    if (!token || !title || !body) {
      return res.status(400).json({ ok: false, error: 'token/title/body are required' });
    }
    const id = await sendToToken({ token, title, body, data });
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}