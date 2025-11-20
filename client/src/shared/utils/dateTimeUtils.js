// utils/dateTimeUtils.js


export function toLocalInputValue(rawValue) {
  if (!rawValue) return "";
  const iso = rawValue.includes("T") ? rawValue : rawValue.replace(" ", "T"); // TZ 없음 = 로컬(KST)
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

export function toLocalDisplay(rawValue) {
  if (!rawValue) return "";
  const iso = rawValue.includes("T") ? rawValue : rawValue.replace(" ", "T"); // TZ 없음 = 로컬(KST)
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}.${MM}.${DD} ${hh}:${mm}:${ss}`;
}


// util: "YYYY-MM-DD HH:mm:ss" 또는 "YYYY-MM-DD"만 안전하게 파싱
export function parseDateSafe(s) {
  if (!s || typeof s !== 'string') return null;
  // 잘못 들어온 "25:07:25" 같은 건 버림
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  // 로컬(사용자 타임존)의 자정으로 생성 → 시차로 인한 하루 오프셋 방지
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

export function formatRelative(past, now = new Date()) {
  const d = typeof past === 'string' ? parseDateSafe(past) : past;
  if (!d) return ''; // 혹은 '날짜 없음'
  const ms = now - d;
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.floor(ms / dayMs);
  if (days < 1) return '오늘';
  if (days < 60) return `${days}일 전`;
  const months = Math.floor(days / 30); // 충분히 정확
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(months / 12);
  return `${years}년 전`;
}