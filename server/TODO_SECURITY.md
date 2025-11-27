# 보안 개선 사항 (추후 처리)

## 🔒 Critical Security Issues

### 1. 하드코딩된 인증 로직
**위치**: `server/controllers/wine.controller.js:121-125`
```javascript
if (!accessToken || !accessToken.includes('1234qwer')) {
  return res.status(403).json({ success: false, message: 'Access denied' });
}
```
**해결방안**:
- 환경변수로 이동: `process.env.ADMIN_ACCESS_TOKEN`
- bcrypt로 해시 비교 구현
- JWT 토큰 방식으로 전환 고려

---

### 2. SQL Injection 취약점
**위치**: 
- `server/dao/wineShop.dao.js:14-24`
- `server/dao/wineShop.dao.js:157-194`

```javascript
// BAD: SQL Injection 가능
loadMoreQuery = ` AND WS.WSH_index < ${lastRowIndex} `;
searchQuery = `AND REPLACE(WS.WSH_searchField, ' ', '') LIKE '%${cleaned}%'`;
```

**해결방안**:
```javascript
// GOOD: Prepared Statement 사용
let params = [];
let conditions = ['1=1'];

if (lastRowIndex) {
  conditions.push('WS.WSH_index < ?');
  params.push(lastRowIndex);
}

if (searchText) {
  conditions.push("REPLACE(WS.WSH_searchField, ' ', '') LIKE ?");
  params.push(`%${cleaned}%`);
}

const sql = `SELECT ... WHERE ${conditions.join(' AND ')}`;
const [rows] = await db.query(sql, params);
```

---

### 3. API 키 하드코딩
**위치**: `server/controllers/naver_search.controller.js:4-6`
```javascript
const NAVER_CLIENT_ID = 'lZGF9YKFrdOsSZhT7pJC';
const NAVER_CLIENT_SECRET = '7qHDN3rJGF';
```

**해결방안**:
```javascript
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  throw new Error('NAVER API credentials are not set');
}
```

---

### 4. 매직 넘버/문자열
**위치**: `server/dao/winePrice.dao.js:36`
```javascript
writerIsNotAdminQuery = ` AND U.USR_level < 999999 AND U.USR_index != 250 AND U.USR_index != 6107 AND U.USR_index != 152 AND U.USR_index != 195 `;
```

**해결방안**:
```javascript
// shared/constants/userRoles.js
export const ADMIN_LEVEL = 999999;
export const EXCLUDED_USER_INDICES = [250, 6107, 152, 195];

// dao에서
if (writerIsNotAdmin) {
  writerIsNotAdminQuery = ` AND U.USR_level < ? AND U.USR_index NOT IN (${EXCLUDED_USER_INDICES.join(',')})`;
  params.push(ADMIN_LEVEL);
}
```

---

### 5. 민감한 사용자 정보 노출
**위치**: `server/dao/winePrice.dao.js:55`
```javascript
U.*,  // 모든 유저 정보 반환 (비밀번호 등 포함 가능)
```

**해결방안**:
```javascript
// 필요한 필드만 명시적으로 선택
U.USR_index, U.USR_id, U.USR_nickname, U.USR_level, 
U.USR_point, U.USR_thumbnailURL,
// USR_password, USR_accessToken 등은 제외
```

---

## 📝 환경변수 설정 가이드

### `.env` 파일 예시
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PORT=3306
DB_PASSWORD=your_password
DB_NAME=wine_db

# API Keys
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
SERPAPI_KEY=your_serpapi_key

# Auth
ADMIN_ACCESS_TOKEN=your_secure_token_here
JWT_SECRET=your_jwt_secret

# Server
PORT=4000
NODE_ENV=production
```

---

## 🔐 추가 보안 권장사항

1. **Helmet.js 적용**: HTTP 헤더 보안 강화
2. **Rate Limiting**: DDoS 방어
3. **Input Sanitization**: XSS 공격 방어
4. **HTTPS 강제**: 운영 환경에서 필수
5. **DB Connection Pool 최적화**: 현재 `connectionLimit: 10` 검토

