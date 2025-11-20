// controllers/ai_suggestion.controller.js
import fetch from 'node-fetch';

// API 키 설정 (환경변수에서 가져오기)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
}
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const PROMPT_TEMPLATE = `You are a wine-product extraction and normalization system.

TASK:

Given a long Korean text that contains multiple wine mentions mixed with descriptive commentary, extract ONLY the actual wine product names.  

For each wine, output:

1. wine_index: 1, 2, 3, ...

2. original_ko: the Korean wine name phrase as it directly appears in the text (cleaned)

3. candidates_en: 2–5 English wine name candidates, each containing **sufficient information for accurate international wine search**, including:

   - Producer (winery)

   - Cuvée / Label name

   - Vintage

   - Optional: Region or varietal IF AND ONLY IF they are part of the official label naming used by Vivino or Wine-Searcher.

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

/**
 * OpenAI API 호출
 */
async function callOpenAI(text) {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY가 설정되지 않았습니다.');
    return null;
  }

  try {
    const prompt = PROMPT_TEMPLATE.replace('{{INPUT_TEXT}}', text);
    
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
            content: 'You are a helpful assistant that extracts wine information from Korean text and outputs valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API 오류:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('OpenAI 응답에 content가 없습니다:', data);
      return null;
    }

    // JSON 파싱
    const parsed = JSON.parse(content);
    // OpenAI는 response_format이 json_object일 때 { "wines": [...] } 형태로 반환할 수 있음
    return parsed.wines || (Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    return null;
  }
}

/**
 * Gemini API 호출
 */
async function callGemini(text) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY가 설정되지 않았습니다.');
    return null;
  }

  try {
    const prompt = PROMPT_TEMPLATE.replace('{{INPUT_TEXT}}', text);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 오류:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error('Gemini 응답에 content가 없습니다:', data);
      return null;
    }

    // JSON 파싱
    const parsed = JSON.parse(content);
    // Gemini도 { "wines": [...] } 형태로 반환할 수 있음
    return parsed.wines || (Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    return null;
  }
}

/**
 * 두 결과를 합집합으로 병합
 */
function mergeWineResults(openaiWines, geminiWines) {
  const wineMap = new Map();
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
            candidates_en: [...new Set(wine.candidates_en || [])],
            search_metadata: wine.search_metadata || null
          });
        } else {
          // 기존 와인에 candidates_en 추가 (중복 제거)
          const existing = wineMap.get(key);
          const newCandidates = wine.candidates_en || [];
          existing.candidates_en = [...new Set([...existing.candidates_en, ...newCandidates])];
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
            candidates_en: [...new Set(wine.candidates_en || [])],
            search_metadata: wine.search_metadata || null
          });
        } else {
          // 기존 와인에 candidates_en 추가 (중복 제거)
          const existing = wineMap.get(key);
          const newCandidates = wine.candidates_en || [];
          existing.candidates_en = [...new Set([...existing.candidates_en, ...newCandidates])];
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

/**
 * AI 와인 텍스트 인식 제안 API
 * POST /ai/suggestion_fulltext
 */
export const suggestionFulltext = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: '텍스트가 필요합니다.',
        message: '요청 본문에 text 필드가 필요합니다.'
      });
    }

    // OpenAI와 Gemini 동시 호출
    const [openaiWines, geminiWines] = await Promise.all([
      callOpenAI(text.trim()),
      callGemini(text.trim())
    ]);

    console.log('OpenAI 결과:', openaiWines?.length || 0, '개');
    console.log('Gemini 결과:', geminiWines?.length || 0, '개');

    // 합집합으로 병합
    const mergedWines = mergeWineResults(openaiWines, geminiWines);

    console.log('병합된 결과:', mergedWines.length, '개');

    // 결과가 없으면 빈 배열 반환
    if (mergedWines.length === 0) {
      return res.json({ wines: [] });
    }

    res.json({ wines: mergedWines });
  } catch (error) {
    console.error('AI suggestion 오류:', error);
    res.status(500).json({ 
      error: 'AI suggestion 처리 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
};

// 와인 검색 결과 분석 (상위 3개 선택)
export async function analyzeWineResults(req, res) {
  try {
    const { results, wine } = req.body;
    
    if (!results || !wine || !OPENAI_API_KEY) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었거나 API 키가 설정되지 않았습니다.' });
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

    const data = await response.json();
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
    
    const topIndices = JSON.parse(jsonText);
    
    console.log(`[AI Suggestion] 분석 완료 - 선택된 인덱스:`, topIndices);
    
    res.json({ topIndices });
  } catch (error) {
    console.error('[AI Suggestion] 와인 결과 분석 오류:', error);
    res.status(500).json({ 
      error: '분석 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
}

