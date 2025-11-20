import React, { useState, useEffect, useRef } from 'react';
import { searchSingleCandidateV3 } from '../../api/wineApi';
import './WineCandidateBottomSheet.css';

export default function WineCandidateBottomSheet({ isOpen, onClose, wine, onSelectWine, onRegisterWine }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedCount, setSearchedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const firstResultReceivedRef = useRef(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [topPicks, setTopPicks] = useState([]);
  const [highlightedIndices, setHighlightedIndices] = useState([]);

  useEffect(() => {
    if (isOpen && wine && wine.candidates_en && wine.candidates_en.length > 0) {
      searchAllCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, wine?.wine_index]);

  // 검색 완료 후 OpenAI 분석 시작
  useEffect(() => {
    if (!isSearching && searchResults.length > 0 && !isAnalyzing && topPicks.length === 0) {
      analyzeTopResults(searchResults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, searchResults.length]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchResults([]);
      setIsLoading(false);
      setIsSearching(false);
      setSearchedCount(0);
      setTotalCount(0);
      setIsAnalyzing(false);
      setTopPicks([]);
      setAnalysisStatus('');
      setHighlightedIndices([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // OpenAI로 상위 3개 결과 분석 (서버를 통해 프록시)
  const analyzeTopResults = async (results) => {
    if (!results || results.length === 0 || !wine) return;
    
    setIsAnalyzing(true);
    setAnalysisStatus('AI 분석 중...');
    
    try {
      console.log(`[WineCandidateBottomSheet] AI 분석 시작 - ${results.length}개 결과`);
      
      const response = await fetch('/api/ai-suggestion/analyze-wine-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          results,
          wine: {
            original_ko: wine.original_ko,
            candidates_en: wine.candidates_en
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const parsed = data.topIndices;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validIndices = parsed.filter(idx => idx >= 0 && idx < results.length).slice(0, 3);
            
            // 마법 애니메이션으로 순차적으로 하이라이트
            setAnalysisStatus('AI 매칭 완료');
            
            // 각 카드를 순차적으로 하이라이트 (마법 효과)
            validIndices.forEach((idx, order) => {
              setTimeout(() => {
                setHighlightedIndices(prev => {
                  const newIndices = [...prev];
                  if (!newIndices.includes(idx)) {
                    newIndices.push(idx);
                  }
                  return newIndices;
                });
                
                if (order === validIndices.length - 1) {
                  // 마지막 카드 하이라이트 후 완료 상태
                  setTopPicks(validIndices);
                  setTimeout(() => {
                    setAnalysisStatus(`✨ ${validIndices.length}개 매칭 완료`);
                  }, 500);
                }
              }, order * 300); // 300ms 간격으로 순차 표시
            });
            
            console.log(`[WineCandidateBottomSheet] OpenAI 선택 결과:`, validIndices);
          }
        }
      } else {
        console.error('[WineCandidateBottomSheet] OpenAI 분석 실패:', response.status);
        setAnalysisStatus('');
      }
    } catch (error) {
      console.error('[WineCandidateBottomSheet] OpenAI 분석 오류:', error);
      setAnalysisStatus('');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        setAnalysisStatus('');
      }, 3000);
    }
  };

  const searchAllCandidates = async () => {
    if (!wine || !wine.candidates_en || wine.candidates_en.length === 0) return;

    console.log(`[WineCandidateBottomSheet] 검색 시작 - 총 candidate 수: ${wine.candidates_en.length}개`);
    console.log(`[WineCandidateBottomSheet] candidates:`, wine.candidates_en);

    setIsLoading(true);
    setIsSearching(true);
    setSearchResults([]);
    setSearchedCount(0);
    setTotalCount(wine.candidates_en.length);
    firstResultReceivedRef.current = false;

    let successCount = 0;
    let failCount = 0;

    // 각 candidate를 병렬로 검색하되, 결과가 나오는 대로 추가
    const searchPromises = wine.candidates_en.map(async (candidate, index) => {
      try {
        console.log(`[WineCandidateBottomSheet] Candidate ${index + 1}/${wine.candidates_en.length} 검색 시작: "${candidate}"`);
        
        const response = await searchSingleCandidateV3(
          candidate,
          wine.original_ko,
          wine.search_metadata || null
        );

        if (response.success && response.result) {
          successCount++;
          console.log(`[WineCandidateBottomSheet] Candidate ${index + 1} 성공: "${candidate}"`);
          
          // 카드 목록이 있으면 사용, 없으면 기존 방식
          const cardsToAdd = response.result.cards || [response.result];
          
          // 결과가 나오는 대로 리스트에 추가 (중복 방지)
          setSearchResults(prev => {
            const newResults = [...prev];
            
            cardsToAdd.forEach(card => {
              // URL 기준으로 중복 체크
              const isDuplicate = newResults.some(r => r.url === card.url);
              if (!isDuplicate) {
                console.log(`[WineCandidateBottomSheet] 카드 추가: "${card.wine_name}" (${card.domain})`);
                newResults.push(card);
              }
            });
            
            // 첫 번째 결과가 나오면 로딩 스피너 끄기
            if (!firstResultReceivedRef.current && newResults.length > 0) {
              firstResultReceivedRef.current = true;
              setIsLoading(false);
            }
            
            return newResults;
          });
        } else {
          failCount++;
          console.log(`[WineCandidateBottomSheet] Candidate ${index + 1} 실패: "${candidate}" - ${response.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        failCount++;
        console.error(`[WineCandidateBottomSheet] Candidate ${index + 1} 검색 오류: "${candidate}"`, error);
      } finally {
        setSearchedCount(prev => {
          const newCount = prev + 1;
          console.log(`[WineCandidateBottomSheet] 검색 완료: ${newCount}/${wine.candidates_en.length}`);
          return newCount;
        });
      }
    });

    // 모든 검색이 완료되면 보조 스피너 끄기
    Promise.allSettled(searchPromises).then(() => {
      console.log(`[WineCandidateBottomSheet] 모든 검색 완료 - 성공: ${successCount}개, 실패: ${failCount}개`);
      setSearchResults(prev => {
        console.log(`[WineCandidateBottomSheet] 최종 결과 수: ${prev.length}개`);
        return prev;
      });
      setIsSearching(false);
      setIsLoading(false);
    });
  };

  if (!isOpen || !wine) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleWineClick = (result) => {
    // 카드 클릭 시 아무 일도 하지 않음 (닫히지 않음)
  };

  const handleRegisterClick = (e, result) => {
    e.stopPropagation();
    console.log('어쏨가이드 등록 클릭:', result);
    
    if (onRegisterWine) {
      // 한글 이름에서 숫자 제거
      const cleanTitleKR = (wine?.original_ko || result.wine_name || '').replace(/\d+/g, '').trim();
      
      // 카드 정보와 와인 정보를 합쳐서 전달
      const wineData = {
        // 와인 기본 정보
        original_ko: wine?.original_ko || '',
        candidates_en: wine?.candidates_en || [],
        
        // 카드에서 추출한 정보
        wine_name: result.wine_name || '',
        title: result.wine_name || '', // 영문 이름
        titleKR: cleanTitleKR, // 한글 이름 (숫자 제거)
        thumbnailURL: result.thumbnail_url || '',
        domain: result.domain || '',
        description: result.description || '',
        price_range: result.price_range || '',
        url: result.url || '',
      };
      
      onRegisterWine(wineData);
      // 등록 팝업이 열리면 바텀시트 닫기
      onClose();
    }
  };

  const handleSourceClick = (e, sourceUrl) => {
    e.stopPropagation();
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };


  return (
    <div className="wine-candidate-bottom-sheet-overlay" onClick={handleOverlayClick}>
      <div className="wine-candidate-bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="wine-candidate-bottom-sheet-header">
          <h3>
            {wine.original_ko}
            {(isSearching || isAnalyzing) && (
              <span className="wine-candidate-header-spinner">
                <span className="wine-candidate-magic-icon">✨</span>
                {analysisStatus && (
                  <span className="wine-candidate-analysis-status">{analysisStatus}</span>
                )}
              </span>
            )}
          </h3>
          <button className="wine-candidate-bottom-sheet-close" onClick={onClose}>×</button>
        </div>
        
        <div className="wine-candidate-bottom-sheet-body">
          {isLoading && searchResults.length === 0 ? (
            <div className="wine-candidate-bottom-sheet-loading">
              <div className="wine-candidate-spinner"></div>
              <p>Perplexity로 검색 중...</p>
            </div>
          ) : searchResults.length === 0 && !isSearching ? (
            <div className="wine-candidate-bottom-sheet-empty">
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="wine-candidate-grid">
              {searchResults.map((result, index) => {
                const isTopPick = topPicks.includes(index) || highlightedIndices.includes(index);
                return (
                  <div
                    key={`${result.url || result.candidate}-${index}`}
                    className={`wine-candidate-card ${isTopPick ? 'wine-candidate-card-highlighted' : ''}`}
                  >
                  {/* 와인 이미지 */}
                  <div className="wine-candidate-card-image">
                    {result.thumbnail_url ? (
                      <img
                        src={result.thumbnail_url}
                        alt={result.wine_name || result.candidate}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E이미지 없음%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="wine-candidate-card-image-placeholder">
                        이미지 없음
                      </div>
                    )}
                  </div>

                  {/* 와인 정보 */}
                  <div className="wine-candidate-card-content">
                    <h4 className="wine-candidate-card-title">
                      {result.wine_name || result.candidate}
                    </h4>

                    {/* 도메인 */}
                    {result.domain && (
                      <div className="wine-candidate-card-domain">
                        {result.domain}
                      </div>
                    )}

                    {/* 설명 */}
                    {result.description && (
                      <div className="wine-candidate-card-description">
                        {result.description}
                      </div>
                    )}

                    {/* 가격 */}
                    {result.price_range && (
                      <div className="wine-candidate-card-price">
                        {result.price_range}
                      </div>
                    )}

                    {/* 어쏨가이드 등록 및 링크 열기 버튼 */}
                    <div className="wine-candidate-card-footer">
                      <div className="wine-candidate-card-buttons">
                        <button
                          className="wine-candidate-register-btn"
                          onClick={(e) => handleRegisterClick(e, result)}
                        >
                          어쏨가이드 등록
                        </button>
                        {result.url && (
                          <button
                            className="wine-candidate-link-btn"
                            onClick={(e) => handleSourceClick(e, result.url)}
                          >
                            링크 열기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

