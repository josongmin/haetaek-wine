# 프롬프트 관리 구조 변경

## 변경 내용

컨트롤러 내부에 하드코딩되어 있던 AI 프롬프트들을 별도 폴더로 분리하여 관리하도록 구조 개선

## 새로 생성된 파일

### 1. server/prompts/wineSearchPrompt.js
- 와인 검색 프롬프트 (Gemini API용)
- keywordSuggestion 함수에서 사용
- createWineSearchPrompt(keyword) 함수 제공

### 2. server/prompts/wineDetailsPrompt.js
- 와인 상세 정보 프롬프트 (Perplexity API용)
- getWineDetails 함수에서 사용
- createWineDetailsPrompt(wine) 함수 제공

### 3. server/prompts/searchFieldPrompt.js
- 검색 필드 생성 프롬프트 (Gemini API용)
- getWineDetails 함수에서 사용
- createSearchFieldPrompt(wineObject) 함수 제공

## 수정된 파일

### server/controllers/external_wine_search.controller.js
- 프롬프트 모듈 import 추가
- 하드코딩된 프롬프트를 함수 호출로 변경
- 기능 변경 없음 (동일한 동작 보장)

## 장점

- 프롬프트 유지보수 용이
- 프롬프트 재사용 가능
- 코드 가독성 향상
- 프롬프트 버전 관리 용이

