import { jest } from '@jest/globals';
import * as aiSuggestionController from '../../controllers/ai_suggestion.controller.js';

// Mock node-fetch
const mockFetch = jest.fn();
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: (...args) => mockFetch(...args)
}));

import fetch from 'node-fetch';

describe('AI Suggestion Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
    
    // 환경 변수 설정
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('suggestionFulltext', () => {
    test('성공 - 유효한 입력으로 와인 제안 받기', async () => {
      req.body = { text: '샤또 마고' };

      const mockOpenAIResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                wines: [
                  {
                    wine_index: 1,
                    original_ko: '샤또 마고 2015',
                    candidates_en: ['Château Margaux 2015'],
                    search_metadata: {
                      quoted_full_name: '"Château Margaux 2015"',
                      search_keywords: ['wine'],
                      region_keywords: [],
                      varietal_keywords: [],
                      vintage_keywords: ['2015'],
                      expansion_keywords: ['2015']
                    }
                  }
                ]
              })
            }
          }]
        })
      };

      const mockGeminiResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  wines: [
                    {
                      wine_index: 1,
                      original_ko: '샤또 마고 2016',
                      candidates_en: ['Château Margaux 2016'],
                      search_metadata: null
                    }
                  ]
                })
              }]
            }
          }]
        })
      };

      mockFetch
        .mockResolvedValueOnce(mockOpenAIResponse)
        .mockResolvedValueOnce(mockGeminiResponse);

      await aiSuggestionController.suggestionFulltext(req, res);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.ok).toBe(true);
      expect(Array.isArray(callArgs.wines)).toBe(true);
    });

    test('실패 - text 필드 누락', async () => {
      req.body = {};

      await aiSuggestionController.suggestionFulltext(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: 'text is required'
      });
    });

    test('실패 - OpenAI API 오류', async () => {
      req.body = { text: '샤또 마고' };

      const mockOpenAIError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('API Error')
      };

      const mockGeminiResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({ wines: [] })
              }]
            }
          }]
        })
      };

      mockedFetch
        .mockResolvedValueOnce(mockOpenAIError)
        .mockResolvedValueOnce(mockGeminiResponse);

      await aiSuggestionController.suggestionFulltext(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(2);
      // Gemini 응답만으로도 처리 가능하므로 성공 응답이 나올 수 있음
      expect(res.json).toHaveBeenCalled();
    });

    test('실패 - Gemini API 오류', async () => {
      req.body = { text: '샤또 마고' };

      const mockOpenAIResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({ wines: [] })
            }
          }]
        })
      };

      const mockGeminiError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('API Error')
      };

      mockedFetch
        .mockResolvedValueOnce(mockOpenAIResponse)
        .mockResolvedValueOnce(mockGeminiError);

      await aiSuggestionController.suggestionFulltext(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(2);
      // OpenAI 응답만으로도 처리 가능하므로 성공 응답이 나올 수 있음
      expect(res.json).toHaveBeenCalled();
    });

    test('실패 - 두 API 모두 실패', async () => {
      req.body = { text: '샤또 마고' };

      const mockError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('API Error')
      };

      mockedFetch
        .mockResolvedValueOnce(mockError)
        .mockResolvedValueOnce(mockError);

      await aiSuggestionController.suggestionFulltext(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: expect.stringContaining('API')
      });
    });
  });

  describe('analyzeWineResults', () => {
    test('성공 - 와인 결과 분석', async () => {
      req.body = {
        wines: [
          {
            wine_index: 1,
            original_ko: '샤또 마고',
            candidates_en: ['Château Margaux 2015'],
            search_metadata: null
          }
        ]
      };

      const mockOpenAIResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                analysis: 'High quality wine',
                confidence: 'high'
              })
            }
          }]
        })
      };

      mockFetch.mockResolvedValueOnce(mockOpenAIResponse);

      await aiSuggestionController.analyzeWineResults(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalled();
      const callArgs = res.json.mock.calls[0][0];
      expect(callArgs.ok).toBe(true);
    });

    test('실패 - wines 필드 누락', async () => {
      req.body = {};

      await aiSuggestionController.analyzeWineResults(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: 'wines is required'
      });
    });

    test('실패 - OpenAI API 오류', async () => {
      req.body = {
        wines: [
          {
            wine_index: 1,
            original_ko: '샤또 마고',
            candidates_en: ['Château Margaux 2015'],
            search_metadata: null
          }
        ]
      };

      const mockError = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('API Error')
      };

      mockFetch.mockResolvedValueOnce(mockError);

      await aiSuggestionController.analyzeWineResults(req, res);

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: expect.stringContaining('API')
      });
    });
  });
});

