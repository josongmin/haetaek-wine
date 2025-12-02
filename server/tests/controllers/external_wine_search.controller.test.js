import { jest } from '@jest/globals';
import * as externalWineSearchController from '../../controllers/external_wine_search.controller.js';

// Mock node-fetch
const mockFetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: (...args) => mockFetch(...args)
}));

import fetch from 'node-fetch';

describe('External Wine Search Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
    
    // 환경 변수 설정
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
    process.env.SERPAPI_KEY = 'test-serpapi-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('keywordSuggestion', () => {
    test('성공 - 한글 키워드로 와인 제안 받기', async () => {
      req.query = { keyword: '샤또 마고' };

      const mockGeminiResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  wines: [
                    {
                      kr_name: '샤또 마고',
                      en_name: 'Château Margaux',
                      confidence: 'high'
                    }
                  ]
                })
              }]
            }
          }]
        })
      };

      mockFetch.mockResolvedValueOnce(mockGeminiResponse);

      await externalWineSearchController.keywordSuggestion(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.ok).toBe(true);
      expect(Array.isArray(callArgs.wines)).toBe(true);
      expect(callArgs.fromCache).toBe(false);
    });

    test('성공 - 캐시에서 결과 반환', async () => {
      req.query = { keyword: '샤또 마고' };

      // 첫 번째 호출로 캐시에 저장
      const mockGeminiResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  wines: [
                    {
                      kr_name: '샤또 마고',
                      en_name: 'Château Margaux',
                      confidence: 'high'
                    }
                  ]
                })
              }]
            }
          }]
        })
      };

      mockFetch.mockResolvedValueOnce(mockGeminiResponse);

      await externalWineSearchController.keywordSuggestion(req, res);

      // 두 번째 호출 - 캐시에서 반환
      jest.clearAllMocks();
      await externalWineSearchController.keywordSuggestion(req, res);

      expect(mockedFetch).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.fromCache).toBe(true);
    });

    test('실패 - keyword 필드 누락', async () => {
      req.query = {};
      req.body = {};

      await externalWineSearchController.keywordSuggestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: 'keyword is required'
      });
    });

    test('실패 - 빈 키워드', async () => {
      req.query = { keyword: '   ' };

      await externalWineSearchController.keywordSuggestion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: 'keyword cannot be empty'
      });
    });

    test('성공 - 한글이 없는 키워드는 빈 배열 반환', async () => {
      req.query = { keyword: 'Château Margaux' };

      await externalWineSearchController.keywordSuggestion(req, res);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        wines: []
      });
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    test('실패 - Gemini API 오류', async () => {
      req.query = { keyword: '샤또 마고' };

      const mockError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('API Error')
      };

      mockFetch.mockResolvedValueOnce(mockError);

      await externalWineSearchController.keywordSuggestion(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getWineDetails', () => {
    test('성공 - 와인 상세 정보 조회', async () => {
      req.body = {
        kr_name: '샤또 마고',
        en_name: 'Château Margaux'
      };

      const mockPerplexityResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                wine_name: 'Château Margaux',
                description: 'Premium Bordeaux wine',
                rating: { score: 95 },
                price_range: '$500-$1000'
              })
            }
          }]
        })
      };

      mockFetch.mockResolvedValueOnce(mockPerplexityResponse);

      await externalWineSearchController.getWineDetails(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.kr_name).toBeDefined();
    });

    test('실패 - 필수 필드 누락', async () => {
      req.body = {};

      await externalWineSearchController.getWineDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: expect.stringContaining('required')
      });
    });

    test('실패 - Perplexity API 오류', async () => {
      req.body = {
        kr_name: '샤또 마고',
        en_name: 'Château Margaux'
      };

      const mockError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ error: 'API Error' })
      };

      mockFetch.mockResolvedValueOnce(mockError);

      await externalWineSearchController.getWineDetails(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteCache', () => {
    test('성공 - 캐시 삭제', async () => {
      req.query = { keyword: '샤또 마고' };

      await externalWineSearchController.deleteCache(req, res);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        message: expect.stringContaining('캐시')
      });
    });

    test('성공 - 전체 캐시 삭제', async () => {
      req.query = {};

      await externalWineSearchController.deleteCache(req, res);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        message: expect.stringContaining('캐시')
      });
    });
  });

  describe('searchCandidatesWithPerplexity', () => {
    test('성공 - 후보 검색', async () => {
      req.body = {
        candidates: ['Château Margaux 2015'],
        search_metadata: {
          quoted_full_name: '"Château Margaux 2015"',
          search_keywords: ['wine'],
          region_keywords: [],
          varietal_keywords: [],
          vintage_keywords: ['2015'],
          expansion_keywords: ['2015']
        }
      };

      const mockPerplexityResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                wine_name: 'Château Margaux 2015',
                sources: [
                  { site_name: 'Vivino', url: 'https://vivino.com' }
                ],
                relevance_score: 0.9,
                match_confidence: 'high'
              })
            }
          }]
        })
      };

      mockFetch.mockResolvedValueOnce(mockPerplexityResponse);

      await externalWineSearchController.searchCandidatesWithPerplexity(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(Array.isArray(callArgs.results)).toBe(true);
    });

    test('실패 - candidates 필드 누락', async () => {
      req.body = {};

      await externalWineSearchController.searchCandidatesWithPerplexity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('candidates')
      });
    });

    test('실패 - Perplexity API 오류', async () => {
      req.body = {
        candidates: ['Château Margaux 2015'],
        search_metadata: {}
      };

      const mockError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('API Error')
      };

      mockFetch.mockResolvedValueOnce(mockError);

      await externalWineSearchController.searchCandidatesWithPerplexity(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      // 실패한 후보는 결과에 포함되지만 success: false로 표시됨
      expect(res.json).toHaveBeenCalled();
    });
  });
});

