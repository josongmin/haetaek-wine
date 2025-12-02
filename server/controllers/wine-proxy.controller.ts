// controllers/wine-proxy.controller.ts
import type { Request, Response } from 'express';
import fetch from 'node-fetch';

const PRODUCTION_API_URL = 'https://asommguide.com';

/**
 * 프로덕션 서버로 프록시 요청
 */
async function proxyToProduction(req: Request, res: Response, endpoint: string) {
  try {
    const url = `${PRODUCTION_API_URL}${endpoint}`;
    
    console.log('[Proxy] 요청:', {
      method: req.method,
      endpoint,
      url,
      bodyKeys: Object.keys(req.body || {}),
      hasCookie: !!req.headers.cookie
    });

    // 요청 본문 준비 (POST 요청의 경우)
    let body: string | undefined;
    if (req.method === 'POST') {
      // Content-Type에 따라 body 처리
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        body = JSON.stringify(req.body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // URLSearchParams로 변환
        const params = new URLSearchParams();
        Object.entries(req.body).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        body = params.toString();
      } else {
        body = JSON.stringify(req.body);
      }
    }

    // 헤더 준비 (인증 정보 포함)
    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'User-Agent': req.headers['user-agent'] || 'wine-admin-proxy',
    };

    // 쿠키 전달
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie;
    }

    // Authorization 헤더 전달
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // 프로덕션 서버로 요청 (타임아웃 30초)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[Proxy] 응답:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      // 응답 본문 읽기
      const responseText = await response.text();
      
      // Content-Type 확인
      const responseContentType = response.headers.get('content-type') || '';
      
      // JSON 응답인 경우에만 파싱
      if (responseContentType.includes('application/json')) {
        try {
          const responseData = JSON.parse(responseText);
          return res.status(response.status).json(responseData);
        } catch (parseError) {
          console.error('[Proxy] JSON 파싱 실패:', {
            contentType: responseContentType,
            textPreview: responseText.substring(0, 200)
          });
          return res.status(response.status).send(responseText);
        }
      } else {
        // HTML 또는 기타 응답
        console.warn('[Proxy] Non-JSON 응답:', {
          contentType: responseContentType,
          textPreview: responseText.substring(0, 200)
        });
        return res.status(response.status).send(responseText);
      }
    } catch (fetchError: any) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Proxy] 타임아웃:', { endpoint, timeout: '30s' });
        return res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Production server did not respond in time'
        });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[Proxy] 오류:', {
      endpoint,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
}

/**
 * POST /wine/search - 와인 검색
 */
export const searchWines = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/search');
};

/**
 * POST /wine/searchRegion - 지역 검색
 */
export const searchRegion = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/searchRegion');
};

/**
 * POST /wine/add - 와인 추가
 */
export const addWine = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/add');
};

/**
 * POST /wine/update - 와인 업데이트
 */
export const updateWine = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/update');
};

/**
 * POST /wine/object - 와인 객체 조회
 */
export const getWineObject = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/object');
};

/**
 * POST /wine/merge - 와인 병합
 */
export const mergeWines = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/merge');
};

/**
 * POST /wine/addPrice - 가격 추가
 */
export const addPrice = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/addPrice');
};

/**
 * POST /wine/price/update - 가격 업데이트
 */
export const updatePrice = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/wine/price/update');
};

/**
 * POST /user/signIn - 사용자 로그인
 */
export const signIn = async (req: Request, res: Response) => {
  await proxyToProduction(req, res, '/user/signIn');
};

