// controllers/naver_search.controller.js
import fetch from 'node-fetch';

const NAVER_CLIENT_ID = 'lZGF9YKFrdOsSZhT7pJC';
const NAVER_CLIENT_SECRET = '7qHDN3rJGF';

/**
 * 네이버 검색 API 호출
 * @param {string} type - 검색 타입 (cafearticle, blog, webkr 등)
 * @param {string} query - 검색 키워드
 * @param {number} start - 검색 시작 위치 (1부터 시작)
 * @param {number} display - 한 번에 표시할 검색 결과 개수 (최대 100)
 * @param {string} sort - 정렬 옵션 (sim: 정확도순, date: 날짜순)
 * @param {string} filter - 필터 옵션 (all: 전체)
 */
async function searchNaver(type, query, start = 1, display = 50, sort = 'sim', filter = 'all') {
  try {
    const params = new URLSearchParams({
      query,
      start: start.toString(),
      display: display.toString(),
      sort,
      filter
    });

    // 네이버 개발자 센터 proxyapi 사용
    const url = `https://developers.naver.com/proxyapi/openapi/v1/search/${type}?${params}`;
    
    console.log(`[Naver Search] ${type} 검색 시작: ${query}, URL: ${url}`);
    
    // AbortController로 timeout 구현
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Naver Search] ${type} 검색 실패:`, response.status, errorText);
      return {
        type,
        success: false,
        error: `${response.status}: ${errorText}`,
        items: []
      };
    }

    const data = await response.json();
    
    console.log(`[Naver Search] ${type} 검색 완료: ${data.items?.length || 0}개 결과`);
    
    return {
      type,
      success: true,
      total: data.total || 0,
      start: data.start || start,
      display: data.display || display,
      items: data.items || []
    };
  } catch (error) {
    console.error(`[Naver Search] ${type} 검색 에러:`, error);
    return {
      type,
      success: false,
      error: error.message,
      items: []
    };
  }
}

/**
 * 네이버 통합 검색 API
 * GET /naver_search?query=검색어&types=cafearticle,blog,webkr&start=1&display=50&sort=sim
 */
export async function integratedSearch(req, res) {
  try {
    const { query, types, start = 1, display = 50, sort = 'sim', filter = 'all' } = req.query;

    // 필수 파라미터 확인
    if (!query) {
      return res.status(400).json({
        ok: false,
        error: 'query parameter is required'
      });
    }

    // types 파라미터 처리 (기본값: cafearticle, blog, webkr)
    const searchTypes = types 
      ? types.split(',').map(t => t.trim())
      : ['cafearticle', 'blog', 'webkr'];

    console.log(`[Naver Integrated Search] 검색 시작 - 키워드: "${query}", 타입: ${searchTypes.join(', ')}`);

    // 모든 타입에 대해 동시 검색
    const searchPromises = searchTypes.map(type => 
      searchNaver(type, query, parseInt(start), parseInt(display), sort, filter)
    );

    const results = await Promise.all(searchPromises);

    // 결과 집계
    const totalResults = results.reduce((sum, r) => sum + (r.items?.length || 0), 0);
    const successCount = results.filter(r => r.success).length;

    console.log(`[Naver Integrated Search] 검색 완료 - 총 ${totalResults}개 결과 (성공: ${successCount}/${results.length})`);

    return res.json({
      ok: true,
      query,
      results,
      summary: {
        totalResults,
        successCount,
        totalTypes: searchTypes.length
      }
    });
  } catch (error) {
    console.error('[Naver Integrated Search] 에러:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

/**
 * 특정 타입만 검색하는 API
 * GET /naver_search/:type?query=검색어&start=1&display=50&sort=sim
 */
export async function singleSearch(req, res) {
  try {
    const { type } = req.params;
    const { query, start = 1, display = 50, sort = 'sim', filter = 'all' } = req.query;

    // 필수 파라미터 확인
    if (!query) {
      return res.status(400).json({
        ok: false,
        error: 'query parameter is required'
      });
    }

    console.log(`[Naver Single Search] ${type} 검색 시작 - 키워드: "${query}"`);

    const result = await searchNaver(type, query, parseInt(start), parseInt(display), sort, filter);

    if (!result.success) {
      return res.status(500).json({
        ok: false,
        error: result.error
      });
    }

    return res.json({
      ok: true,
      query,
      ...result
    });
  } catch (error) {
    console.error('[Naver Single Search] 에러:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

