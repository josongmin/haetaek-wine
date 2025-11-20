// components/reviewPrice/WineSearchPopup.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-hot-toast';
import { keywordSuggestion, deleteSearchCache, getWineDetails } from '../../../../api/wineApi';
import './WineSearchPopup.css';

Modal.setAppElement('#root');

export default function WineSearchPopup({ isOpen, onClose, onSelectWine, initialKeyword = '' }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [cacheDeleted, setCacheDeleted] = useState(false);
  const [expandedWineIndex, setExpandedWineIndex] = useState(null);
  const [wineDetails, setWineDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [showSourceDropdown, setShowSourceDropdown] = useState(null);

  const handleSearchWithKeyword = useCallback(async (searchKeyword) => {
    if (!searchKeyword || !searchKeyword.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setWines([]);

    try {
      const response = await keywordSuggestion(searchKeyword);
      if (response.ok && response.wines) {
        // 디버깅: 이미지 URL 확인
        const winesWithImage = response.wines.filter(w => w.thumbnail_url).length;
        console.log(`프론트엔드: 총 ${response.wines.length}개, 이미지 있는 와인: ${winesWithImage}개`);
        if (winesWithImage > 0) {
          const sampleUrls = response.wines.filter(w => w.thumbnail_url).slice(0, 3).map(w => w.thumbnail_url);
          console.log('프론트엔드 이미지 URL 샘플:', sampleUrls);
        }
        
        setWines(response.wines);
        const isFromCache = response.fromCache === true;
        setFromCache(isFromCache);
        setCacheDeleted(false);
        console.log('캐시 여부:', isFromCache, '응답:', response);
        if (response.wines.length === 0) {
          setError('검색 결과가 없습니다.');
        }
      } else {
        setError(response.error || '검색에 실패했습니다.');
        setFromCache(false);
      }
    } catch (err) {
      console.error('와인 검색 실패:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // initialKeyword가 변경되면 keyword 업데이트 및 자동 검색
  useEffect(() => {
    if (isOpen && initialKeyword) {
      setKeyword(initialKeyword);
      setFromCache(false);
      setCacheDeleted(false);
      // 자동 검색 실행
      setTimeout(() => {
        handleSearchWithKeyword(initialKeyword);
      }, 100);
    }
  }, [isOpen, initialKeyword, handleSearchWithKeyword]);
  
  // 팝업이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setFromCache(false);
      setCacheDeleted(false);
      setExpandedWineIndex(null);
      setWineDetails({});
      setLoadingDetails({});
      setShowSourceDropdown(null);
    }
  }, [isOpen]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (showSourceDropdown === null) return;
    
    const handleClickOutside = (e) => {
      const container = e.target.closest('.wine-select-dropdown-container');
      if (!container) {
        setShowSourceDropdown(null);
      }
    };
    
    // 약간의 지연을 두어 현재 클릭 이벤트가 완료된 후 실행
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSourceDropdown]);

  const handleSearch = async () => {
    await handleSearchWithKeyword(keyword);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectWine = (wine, selectedSource = null, index = null) => {
    if (onSelectWine) {
      // 선택된 사이트 정보가 있으면 해당 정보를 사용
      if (selectedSource && index !== null && wineDetails[index]) {
        const details = wineDetails[index];
        const updatedWine = {
          ...wine,
          kr_name: selectedSource.kr_name || wine.kr_name,
          en_name: selectedSource.en_name || wine.en_name,
          thumbnail_url: selectedSource.image_url || details.thumbnail_url || wine.thumbnail_url,
        };
        onSelectWine(updatedWine);
      } else {
        onSelectWine(wine);
      }
    }
    setShowSourceDropdown(null);
    onClose();
  };

  const handleSelectButtonClick = (e, wine, index) => {
    e.stopPropagation();
    e.preventDefault();
    const details = wineDetails[index];
    // 사이트 정보가 있으면 드롭다운 표시, 없으면 바로 선택
    if (details && details.sources && Array.isArray(details.sources) && details.sources.length > 0) {
      setShowSourceDropdown(prev => prev === index ? null : index);
    } else {
      handleSelectWine(wine, null, index);
    }
  };

  const handleShowDetails = async (wine, index) => {
    // 이미 펼쳐져 있으면 닫기
    if (expandedWineIndex === index) {
      setExpandedWineIndex(null);
      return;
    }

    // 펼치기
    setExpandedWineIndex(index);

    // 이미 로드된 상세정보가 있으면 다시 로드하지 않음
    if (wineDetails[index]) {
      return;
    }

    // 상세정보 로드
    setLoadingDetails(prev => ({ ...prev, [index]: true }));
    try {
      const details = await getWineDetails(wine);
      setWineDetails(prev => ({ ...prev, [index]: details }));
    } catch (error) {
      console.error('와인 상세정보 로드 실패:', error);
      toast.error('상세정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingDetails(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDeleteCache = async () => {
    try {
      await deleteSearchCache(keyword);
      setCacheDeleted(true);
      setFromCache(false);
      // 캐시 삭제 후 재검색
      setTimeout(() => {
        handleSearchWithKeyword(keyword);
      }, 300);
    } catch (err) {
      console.error('캐시 삭제 실패:', err);
      toast.error('캐시 삭제에 실패했습니다.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="wine-search-modal"
      overlayClassName="wine-search-overlay"
      contentLabel="와인 검색"
    >
      <div className="wine-search-container">
        <div className="wine-search-header">
          <div>
            <h2>와인 검색</h2>
            <p className="wine-search-subtitle">정확한 와인이름 검색을 찾습니다.</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="wine-search-input-section">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="와인 이름을 입력하세요 (예: 슐로스굿)"
            className="wine-search-input"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="wine-search-button"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>

        {loading && (
          <div className="wine-search-loading">
            <div className="wine-search-spinner"></div>
            <span>Gemini를 통해 와인명 검색중...</span>
          </div>
        )}

        {!loading && wines.length > 0 && fromCache && !cacheDeleted && (
          <div className="wine-search-cache-info">
            <span style={{ color: '#666' }}>캐시에서 불러옴</span>
            <button
              onClick={handleDeleteCache}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: '#007bff',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '12px',
                padding: 0
              }}
            >
              캐시 삭제
            </button>
          </div>
        )}
        
        {!loading && cacheDeleted && (
          <div className="wine-search-cache-info">
            <span style={{ color: '#28a745' }}>삭제됨</span>
          </div>
        )}

        {error && (
          <div className="wine-search-error">{error}</div>
        )}

        {wines.length > 0 && (
          <div className="wine-search-results" onScroll={(e) => {
            // 스크롤 이벤트 처리
            const target = e.target;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;
            
            // 필요시 추가 스크롤 로직 구현 가능
            // 예: 무한 스크롤, 스크롤 위치 저장 등
          }}>
            <h3>검색 결과 ({wines.length}개)</h3>
            <ul className="wine-list">
              {wines.map((wine, index) => (
                <li key={index} className="wine-item">
                  <div className="wine-item-content">
                    <div className="wine-item-info">
                      <div className="wine-name-kr">{wine.kr_name || '-'}</div>
                      <div className="wine-name-en">{wine.en_name || '-'}</div>
                      {wine.fr_name && (
                        <div className="wine-name-fr">{wine.fr_name}</div>
                      )}
                      {wine.dutch_name && (
                        <div className="wine-name-dutch">{wine.dutch_name}</div>
                      )}
                      <div className="wine-item-details">
                        {wine.vintage && (
                          <span className="wine-detail-item">연도: {wine.vintage}</span>
                        )}
                        {wine.price && (
                          <span className="wine-detail-item">
                            가격: {typeof wine.price === 'number' ? wine.price.toLocaleString() : wine.price}{wine.price_unit || '원'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="wine-item-actions">
                      <button
                        className="wine-detail-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDetails(wine, index);
                        }}
                      >
                        상세정보확인
                      </button>
                    </div>
                  </div>
                  {expandedWineIndex === index && (
                    <div className="wine-details-expanded">
                      {loadingDetails[index] ? (
                        <div className="wine-details-loading">
                          <div className="wine-search-spinner"></div>
                          <span>상세정보를 불러오는 중...</span>
                        </div>
                      ) : wineDetails[index] ? (
                        <div className="wine-details-content">
                          <div className="wine-details-header">
                            <div className="wine-details-main">
                              <div className="wine-details-info">
                                <h4 className="wine-details-title">
                                  {wineDetails[index].kr_name || wineDetails[index].en_name}
                                </h4>
                                {wineDetails[index].en_name && wineDetails[index].kr_name !== wineDetails[index].en_name && (
                                  <p className="wine-details-subtitle">{wineDetails[index].en_name}</p>
                                )}
                                {wineDetails[index].sources && wineDetails[index].sources.length > 0 && (
                                  <div className="wine-details-sources-tags">
                                    <span className="sources-label">출처:</span>
                                    <div className="sources-tags">
                                      {wineDetails[index].sources.map((source, idx) => (
                                        <a
                                          key={idx}
                                          href={source.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="source-tag"
                                        >
                                          {source.site_name}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {wineDetails[index].rating && (
                                  <div className="wine-details-rating">
                                    <span className="rating-label">평점:</span>
                                    <span className="rating-score">
                                      {wineDetails[index].rating.score}
                                      {wineDetails[index].rating.max_score && ` / ${wineDetails[index].rating.max_score}`}
                                    </span>
                                    {wineDetails[index].rating.source && (
                                      <span className="rating-source">({wineDetails[index].rating.source})</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="wine-select-dropdown-container">
                              <button
                                type="button"
                                className="wine-select-button"
                                onClick={(e) => handleSelectButtonClick(e, wine, index)}
                              >
                                선택
                                <span className="dropdown-arrow">▼</span>
                              </button>
                              {showSourceDropdown === index && wineDetails[index] && wineDetails[index].sources && wineDetails[index].sources.length > 0 && (
                                <div className="source-dropdown" onClick={(e) => e.stopPropagation()}>
                                  <div className="source-dropdown-header">사이트 선택</div>
                                  <div className="source-dropdown-list">
                                    <div
                                      className="source-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectWine(wine, null, index);
                                      }}
                                    >
                                      <span>기본 정보 사용</span>
                                    </div>
                                    {wineDetails[index].sources.map((source, sourceIdx) => (
                                      <div
                                        key={sourceIdx}
                                        className="source-dropdown-item"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectWine(wine, source, index);
                                        }}
                                      >
                                        <span>{source.site_name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {wineDetails[index].description && (
                            <div className="wine-details-section">
                              <h5>설명</h5>
                              <p>{wineDetails[index].description}</p>
                            </div>
                          )}
                          {(wineDetails[index].region || wineDetails[index].winery || wineDetails[index].grape_varieties?.length > 0) && (
                            <div className="wine-details-section">
                              <h5>기본 정보</h5>
                              <div className="wine-info-grid">
                                {wineDetails[index].region && (
                                  <div className="info-item info-item-full">
                                    <span className="info-label">지역:</span>
                                    <span className="info-value">{wineDetails[index].region}</span>
                                  </div>
                                )}
                                {wineDetails[index].winery && (
                                  <div className="info-item info-item-full">
                                    <span className="info-label">와이너리:</span>
                                    <span className="info-value">{wineDetails[index].winery}</span>
                                  </div>
                                )}
                                {wineDetails[index].grape_varieties?.length > 0 && (
                                  <div className="info-item">
                                    <span className="info-label">포도 품종:</span>
                                    <span className="info-value">{wineDetails[index].grape_varieties.join(', ')}</span>
                                  </div>
                                )}
                                {wineDetails[index].alcohol_content && (
                                  <div className="info-item">
                                    <span className="info-label">알코올:</span>
                                    <span className="info-value">{wineDetails[index].alcohol_content}</span>
                                  </div>
                                )}
                                {wineDetails[index].vintage && (
                                  <div className="info-item">
                                    <span className="info-label">빈티지:</span>
                                    <span className="info-value">{wineDetails[index].vintage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="wine-details-content">
                          <p>상세정보가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

