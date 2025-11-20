// server/services/firebase.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ JSON import assertion 대신 파일로 읽기
const keyPath = path.join(__dirname, '../config/firebase-adminsdk.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 단일 토큰
export async function sendToToken({ token, title, body, data = {} }) {
  const message = {
    token,
    notification: { title, body },
    data: stringifyValues(data),
    android: { notification: { channelId: 'default_notification_channel_id' } },
    apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
  };
  return admin.messaging().send(message);
}

// 여러 토큰
export async function sendToTokens({ tokens = [], title, body, data = {} }) {
  const message = {
    tokens,
    notification: { title, body },
    data: stringifyValues(data),
    android: { notification: { channelId: 'default_notification_channel_id' } },
    apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
  };
  return admin.messaging().sendEachForMulticast(message);
}

// 토픽
export async function sendToTopic({ topic, title, body, data = {} }) {
  const message = {
    topic,
    notification: { title, body },
    data: stringifyValues(data),
    android: { notification: { channelId: 'default_notification_channel_id' } },
    apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
  };
  return admin.messaging().send(message);
}

// 🔸 FCM data payload는 문자열만 허용
function stringifyValues(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) out[k] = String(v);
  return out;
}