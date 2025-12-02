// controllers/ai_suggestion.controller.ts
import type { Request, Response } from 'express';
import fetch from 'node-fetch';

// API 키를 함수 내부에서 읽도록 변경 (dotenv.config() 실행 후에 읽히도록)
const getOpenAIKey = (): string | undefined => process.env.OPENAI_API_KEY;
const getGeminiKey = (): string | undefined => process.env.GEMINI_API_KEY;

const PROMPT_TEMPLATE = `You are a wine-product extraction and normalization system specialized in Korean wine market.

TASK:

Given a Korean text (even a single word or short phrase), interpret it as a wine-related query and suggest MULTIPLE DISTINCT WINE PRODUCTS that match the query.

**CRITICAL**: If the input is a grape variety, region, or general wine term, suggest 5-10 DIFFERENT SPECIFIC WINE PRODUCTS from various producers.

For each DISTINCT wine product, output:

1. wine_index: 1, 2, 3, ... (each wine gets a unique index)

2. original_ko: A descriptive Korean name for this specific wine (NOT just repeating the input)
   - For "까베르네" input → "샤또 마고", "오퍼스 원", "펜폴즈 빈 407" etc. (different wines)
   - For "샤또 마고" input → "샤또 마고 2015", "샤또 마고 2016" etc. (different vintages)

3. candidates_en: 2–5 English name variations for THIS SPECIFIC wine, including:
   - Producer (winery) - REQUIRED
   - Cuvée / Label name
   - Vintage (if applicable)
   
   **EXAMPLES OF CORRECT OUTPUT:**
   
   Input: "까베르네"
   Output: [
     { wine_index: 1, original_ko: "샤또 마고", candidates_en: ["Château Margaux", "Chateau Margaux 2015"] },
     { wine_index: 2, original_ko: "오퍼스 원", candidates_en: ["Opus One", "Opus One 2018"] },
     { wine_index: 3, original_ko: "펜폴즈 빈 407", candidates_en: ["Penfolds Bin 407 Cabernet Sauvignon"] },
     { wine_index: 4, original_ko: "케이머스 카베르네", candidates_en: ["Caymus Cabernet Sauvignon"] },
     { wine_index: 5, original_ko: "실버 오크", candidates_en: ["Silver Oak Cabernet Sauvignon"] }
   ]
   
   Input: "샤또 마고"
   Output: [
     { wine_index: 1, original_ko: "샤또 마고 2015", candidates_en: ["Château Margaux 2015"] },
     { wine_index: 2, original_ko: "샤또 마고 2016", candidates_en: ["Château Margaux 2016"] },
     { wine_index: 3, original_ko: "샤또 마고 2018", candidates_en: ["Château Margaux 2018"] }
   ]

4. search_metadata: Additional search keywords for building optimized search queries:

   - quoted_full_name: The full wine name wrapped in double quotes (e.g., "McLaren Vale Roussanne Museum Release 2017")
   
   - search_keywords: Array of descriptive keywords like ["wine", "tasting notes", "tasting tastes"]
   
   - region_keywords: Array of region-related keywords extracted from the wine name or context (e.g., ["mclaren vale", "hunter valley"])
   
   - varietal_keywords: Array of grape variety keywords (e.g., ["roussanne", "semillon", "cabernet sauvignon"])
   
   - vintage_keywords: Array of vintage-related keywords (e.g., ["2017", "2018"])
   
   - expansion_keywords: Array of unquoted words for broader search expansion (typically region, varietal, vintage without quotes)

REQUIREMENTS:

1. Ignore all tasting notes, metaphors, emotional language, and descriptive prose.  

2. Identify exactly the wine product names, even if written in mixed Korean phonetics.  

3. Convert ambiguous or phonetic Korean wine names into multiple likely English canonical forms.

4. Each English candidate must be a form that is **searchable with high accuracy** on Vivino, Wine-Searcher, and CellarTracker.

5. Do NOT output simplified or incomplete wine names (e.g., missing vintage or missing cuvée).

6. **CRITICAL: Wine names must contain ONLY:**
   - English letters (A-Z, a-z)
   - Numbers (0-9)
   - Spaces
   - Common punctuation: hyphens (-), apostrophes ('), ampersands (&), periods (.)
   - **DO NOT include placeholders like [YEAR], [VINTAGE], [REGION], etc.**
   - **DO NOT include brackets [], parentheses (), or other special characters**
   - If vintage year is mentioned, use the actual year (e.g., "2017") not "[YEAR]"
   - If region/varietal is mentioned, use the actual name not "[REGION]" or "[VARIETAL]"

7. For search_metadata:
   - quoted_full_name should be the most complete and accurate English wine name from candidates_en[0]
   - search_keywords should include common wine-related terms
   - Extract region, varietal, and vintage from the wine name itself
   - expansion_keywords should be unquoted versions of region, varietal, and vintage for flexible search
   - **quoted_full_name must NOT contain any placeholders or brackets**

8. Output JSON ONLY, in the following schema:

{
  "wines": [
    {
      "wine_index": 1,
      "original_ko": "",
      "candidates_en": ["", "", ""],
      "search_metadata": {
        "quoted_full_name": "\"Full Wine Name\"",
        "search_keywords": ["wine", "tasting notes"],
        "region_keywords": ["region name"],
        "varietal_keywords": ["grape variety"],
        "vintage_keywords": ["year"],
        "expansion_keywords": ["region", "varietal", "year"]
      }
    }
  ]
}

Now process the following text:

{{INPUT_TEXT}}`;

interface SearchMetadata {
  quoted_full_name: string;
  search_keywords: string[];
  region_keywords: string[];
  varietal_keywords: string[];
  vintage_keywords: string[];
  expansion_keywords: string[];
}

interface WineResult {
  wine_index: number;
  original_ko: string;
  candidates_en: string[];
  search_metadata: SearchMetadata | null;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface ParsedResponse {
  wines?: WineResult[];
}

/**
 * OpenAI API 호출
 */
async function callOpenAI(text: string): Promise<WineResult[] | null> {
  const OPENAI_API_KEY = getOpenAIKey();
  if (!OPENAI_API_KEY) {
    console.warn('[OpenAI] API 키가 설정되지 않았습니다.');
    return null;
  }

  console.log('[OpenAI] API 호출 시작:', {
    textLength: text.length,
    textPreview: text.substring(0, 100),
    hasApiKey: !!OPENAI_API_KEY
  });

  try {
    const prompt = PROMPT_TEMPLATE.replace('{{INPUT_TEXT}}', text);
    
    const requestPayload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts wine information from Korean text and outputs valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' as const }
    };
    
    console.log('[OpenAI] 요청 페이로드:', {
      model: requestPayload.model,
      temperature: requestPayload.temperature,
      systemMessageLength: requestPayload.messages[0].content.length,
      userMessageLength: requestPayload.messages[1].content.length,
      promptPreview: prompt.substring(0, 300),
      fullPayload: JSON.stringify(requestPayload).substring(0, 1000),
      apiKeyPreview: OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 10)}...` : '없음'
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI] API 오류:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      });
      return null;
    }

    const data = await response.json() as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    
    console.log('[OpenAI] 응답 받음:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 200) || '없음'
    });
    
    if (!content) {
      console.error('[OpenAI] 응답에 content가 없습니다:', {
        data: JSON.stringify(data).substring(0, 500)
      });
      return null;
    }

    // JSON 파싱
    let parsed: ParsedResponse;
    try {
      parsed = JSON.parse(content) as ParsedResponse;
      console.log('[OpenAI] JSON 파싱 성공:', {
        hasWines: !!parsed.wines,
        winesCount: parsed.wines?.length || 0,
        isArray: Array.isArray(parsed)
      });
    } catch (parseError) {
      const error = parseError as Error;
      console.error('[OpenAI] JSON 파싱 실패:', {
        error: error.message,
        contentPreview: content.substring(0, 500)
      });
      return null;
    }
    
    // OpenAI는 response_format이 json_object일 때 { "wines": [...] } 형태로 반환할 수 있음
    const result = parsed.wines || (Array.isArray(parsed) ? parsed : []);
    console.log('[OpenAI] 최종 결과:', {
      resultCount: result.length,
      resultPreview: result.length > 0 ? JSON.stringify(result[0]).substring(0, 200) : '빈 배열'
    });
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[OpenAI] API 호출 오류:', {
      error: err.message,
      stack: err.stack
    });
    return null;
  }
}

/**
 * Gemini API 호출
 */
async function callGemini(text: string): Promise<WineResult[] | null> {
  const GEMINI_API_KEY = getGeminiKey();
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] API 키가 설정되지 않았습니다.');
    return null;
  }

  console.log('[Gemini] API 호출 시작:', {
    textLength: text.length,
    textPreview: text.substring(0, 100),
    hasApiKey: !!GEMINI_API_KEY
  });

  try {
    const prompt = PROMPT_TEMPLATE.replace('{{INPUT_TEXT}}', text);
    
    const requestPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json' as const
      }
    };
    
    console.log('[Gemini] 요청 페이로드:', {
      temperature: requestPayload.generationConfig.temperature,
      responseMimeType: requestPayload.generationConfig.responseMimeType,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 300),
      fullPayload: JSON.stringify(requestPayload).substring(0, 1000),
      apiKeyPreview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : '없음'
    });
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API 오류:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      });
      return null;
    }

    const data = await response.json() as GeminiResponse;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log('[Gemini] 응답 받음:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 200) || '없음'
    });
    
    if (!content) {
      console.error('[Gemini] 응답에 content가 없습니다:', {
        data: JSON.stringify(data).substring(0, 500)
      });
      return null;
    }

    // JSON 파싱
    let parsed: ParsedResponse;
    try {
      parsed = JSON.parse(content) as ParsedResponse;
      console.log('[Gemini] JSON 파싱 성공:', {
        hasWines: !!parsed.wines,
        winesCount: parsed.wines?.length || 0,
        isArray: Array.isArray(parsed)
      });
    } catch (parseError) {
      const error = parseError as Error;
      console.error('[Gemini] JSON 파싱 실패:', {
        error: error.message,
        contentPreview: content.substring(0, 500)
      });
      return null;
    }
    
    // Gemini도 { "wines": [...] } 형태로 반환할 수 있음
    const result = parsed.wines || (Array.isArray(parsed) ? parsed : []);
    console.log('[Gemini] 최종 결과:', {
      resultCount: result.length,
      resultPreview: result.length > 0 ? JSON.stringify(result[0]).substring(0, 200) : '빈 배열'
    });
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[Gemini] API 호출 오류:', {
      error: err.message,
      stack: err.stack
    });
    return null;
  }
}

/**
 * 두 결과를 합집합으로 병합
 */
function mergeWineResults(openaiWines: WineResult[] | null, geminiWines: WineResult[] | null): WineResult[] {
  const wineMap = new Map<string, WineResult>();
  let index = 1;

  // OpenAI 결과 추가
  if (openaiWines && Array.isArray(openaiWines)) {
    openaiWines.forEach(wine => {
      if (wine.original_ko) {
        const key = wine.original_ko.trim().toLowerCase();
        if (!wineMap.has(key)) {
          wineMap.set(key, {
            wine_index: index++,
            original_ko: wine.original_ko.trim(),
            candidates_en: Array.from(new Set(wine.candidates_en || [])),
            search_metadata: wine.search_metadata || null
          });
        } else {
          // 기존 와인에 candidates_en 추가 (중복 제거)
          const existing = wineMap.get(key)!;
          const newCandidates = wine.candidates_en || [];
          existing.candidates_en = Array.from(new Set([...existing.candidates_en, ...newCandidates]));
          // search_metadata가 없으면 추가
          if (!existing.search_metadata && wine.search_metadata) {
            existing.search_metadata = wine.search_metadata;
          }
        }
      }
    });
  }

  // Gemini 결과 추가
  if (geminiWines && Array.isArray(geminiWines)) {
    geminiWines.forEach(wine => {
      if (wine.original_ko) {
        const key = wine.original_ko.trim().toLowerCase();
        if (!wineMap.has(key)) {
          wineMap.set(key, {
            wine_index: index++,
            original_ko: wine.original_ko.trim(),
            candidates_en: Array.from(new Set(wine.candidates_en || [])),
            search_metadata: wine.search_metadata || null
          });
        } else {
          // 기존 와인에 candidates_en 추가 (중복 제거)
          const existing = wineMap.get(key)!;
          const newCandidates = wine.candidates_en || [];
          existing.candidates_en = Array.from(new Set([...existing.candidates_en, ...newCandidates]));
          // search_metadata가 없으면 추가
          if (!existing.search_metadata && wine.search_metadata) {
            existing.search_metadata = wine.search_metadata;
          }
        }
      }
    });
  }

  return Array.from(wineMap.values());
}

interface SuggestionFulltextBody {
  text: string;
}

/**
 * AI 와인 텍스트 인식 제안 API
 * POST /ai/suggestion_fulltext
 */
export const suggestionFulltext = async (req: Request<{}, {}, SuggestionFulltextBody>, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { text } = req.body;

    console.log('[AI Suggestion] 요청 받음:', {
      textLength: text?.length || 0,
      textPreview: text?.substring(0, 100) || '없음',
      hasText: !!text,
      trimmedLength: text?.trim()?.length || 0
    });

    if (!text || !text.trim()) {
      console.warn('[AI Suggestion] 텍스트가 없음:', { text, body: req.body });
      res.status(400).json({
        error: '텍스트가 필요합니다.',
        message: '요청 본문에 text 필드가 필요합니다.'
      });
      return;
    }

    const trimmedText = text.trim();
    console.log('[AI Suggestion] API 호출 시작:', {
      textLength: trimmedText.length,
      openaiKeyExists: !!getOpenAIKey(),
      geminiKeyExists: !!getGeminiKey()
    });

    // OpenAI와 Gemini 동시 호출
    const [openaiWines, geminiWines] = await Promise.all([
      callOpenAI(trimmedText),
      callGemini(trimmedText)
    ]);

    console.log('[AI Suggestion] API 호출 완료:', {
      openaiCount: openaiWines?.length || 0,
      geminiCount: geminiWines?.length || 0,
      openaiData: openaiWines ? JSON.stringify(openaiWines).substring(0, 200) : 'null',
      geminiData: geminiWines ? JSON.stringify(geminiWines).substring(0, 200) : 'null'
    });

    // 합집합으로 병합
    const mergedWines = mergeWineResults(openaiWines, geminiWines);

    console.log('[AI Suggestion] 병합 완료:', {
      mergedCount: mergedWines.length,
      elapsedTime: Date.now() - startTime,
      mergedData: mergedWines.length > 0 ? JSON.stringify(mergedWines).substring(0, 300) : '빈 배열'
    });

    // 결과가 없으면 빈 배열 반환
    if (mergedWines.length === 0) {
      console.warn('[AI Suggestion] 결과 없음 - 빈 배열 반환');
      res.json({ wines: [] });
      return;
    }

    res.json({ wines: mergedWines });
  } catch (error) {
    const err = error as Error;
    console.error('[AI Suggestion] 오류 발생:', {
      error: err.message,
      stack: err.stack,
      elapsedTime: Date.now() - startTime
    });
    res.status(500).json({ 
      error: 'AI suggestion 처리 중 오류가 발생했습니다.',
      message: err.message 
    });
  }
};

interface WineCard {
  wine_name?: string;
  domain?: string;
  description?: string;
  price_range?: string;
  url?: string;
}

interface AnalyzeWineResultsBody {
  results: WineCard[];
  wine: {
    original_ko: string;
    candidates_en?: string[];
  };
}

// 와인 검색 결과 분석 (상위 3개 선택)
export const analyzeWineResults = async (req: Request<{}, {}, AnalyzeWineResultsBody>, res: Response): Promise<void> => {
  try {
    const { results, wine } = req.body;
    const OPENAI_API_KEY = getOpenAIKey();
    
    if (!results || !wine || !OPENAI_API_KEY) {
      res.status(400).json({ error: '필수 파라미터가 누락되었거나 API 키가 설정되지 않았습니다.' });
      return;
    }

    // 카드 정보를 텍스트로 변환
    const cardsText = results.map((card, index) => `
Card ${index}:
Wine Name: ${card.wine_name || 'N/A'}
Domain: ${card.domain || 'N/A'}
Description: ${card.description?.substring(0, 200) || 'N/A'}
Price: ${card.price_range || 'N/A'}
URL: ${card.url || 'N/A'}
---`).join('\n');
    
    const prompt = `You are an expert wine data analyzer. Analyze the following search results and select the TOP 3 most accurate and reliable results for the wine: "${wine.original_ko}".

Candidate wine names: ${wine.candidates_en?.join(', ') || 'N/A'}

## SELECTION CRITERIA (Priority Order)

### 1st Priority: Wine Name Match Accuracy (MOST IMPORTANT)
- Match wine names considering:
  - Language variations (English, Korean, French, etc.)
  - Spelling variations (e.g., "Tyrrell's" vs "Tyrrells")
  - Punctuation differences (e.g., "&" vs "and")
  - Accent marks and special characters
  - Abbreviations (e.g., "Vat 1" vs "Vat One")
- Ignore vintage year differences (e.g., 2017 vs 2018 is OK)
- Exact match > Partial match > No match
- Producer name + Cuvée name matching is critical

### 2nd Priority: Site Authority (Only if wine name match is similar)
Rank sites by authority:
1. Official winery/producer website (highest authority)
2. Vivino, Wine-Searcher, CellarTracker, Decanter (high authority)
3. Wine shopping sites/retailers (medium authority)
4. Other sites (lowest authority)

## ANALYSIS PROCESS

1. First, evaluate wine name match accuracy for each card (considering language variations)
2. If multiple cards have similar name match accuracy, then consider site authority
3. Select TOP 3 cards that have the best combination of name match + site authority

Return ONLY a JSON array with the indices of the top 3 cards (0-based index):
[0, 2, 5]

Search Results:
${cardsText}

Return JSON array only. No markdown. No commentary.`;

    console.log(`[AI Suggestion] 와인 결과 분석 시작 - ${results.length}개 결과`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert wine data analyzer. Return JSON array only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json() as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('OpenAI로부터 응답을 받지 못했습니다.');
    }

    let jsonText = content;
    // 코드 블록 제거
    if (jsonText.includes('```')) {
      const jsonBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonText = jsonBlockMatch[1].trim();
      }
    }
    
    const topIndices = JSON.parse(jsonText) as number[];
    
    console.log(`[AI Suggestion] 분석 완료 - 선택된 인덱스:`, topIndices);
    
    res.json({ topIndices });
  } catch (error) {
    const err = error as Error;
    console.error('[AI Suggestion] 와인 결과 분석 오류:', err);
    res.status(500).json({ 
      error: '분석 중 오류가 발생했습니다.',
      message: err.message 
    });
  }
};

