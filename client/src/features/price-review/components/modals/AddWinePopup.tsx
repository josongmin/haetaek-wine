// src/components/AddWinePopup.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../../../../UserContext';
import CreatableSelect from 'react-select/creatable';
import AsyncSelect from 'react-select/async';
import { toast } from 'react-hot-toast';
import { TbWand } from 'react-icons/tb';
import './AddWinePopup.css';
import grapeOptions from '../../../../shared/utils/grapeOptions';
import {
  addWine,
  updateWine,
  loadRegionOptions,
  fetchWineByIndex,
  searchWines,
  mergeWine
} from '../../../../api/wineApi';
import { WineType } from '@myorg/shared/constants/wineType';
import { WineStatusMap, WineStatusOptions } from '@myorg/shared/constants/wineStatusMap';
import WineSearchPopup from './WineSearchPopup';

export default function AddWinePopup({
  onClose,
  priceIndex,
  wineIndex,         // prop 으로 전달되는 원래 wineIndex
  initialWineName,
  initialData,       // 카드에서 가져온 초기 데이터
}) {
  const { user } = useContext(UserContext);
  const mouseDownOnBgRef = useRef(false);

  const [formData, setFormData] = useState<{
    title: string;
    titleKR: string;
    region: string;
    grape: string;
    wineryIndex: string;
    thumbnailURL: string;
    searchField: string;
    status: number;
    description?: string;
  }>({
    title: '',
    titleKR: '',
    region: '',
    grape: '',
    wineryIndex: '',
    thumbnailURL: '',
    searchField: '',
    status: 0,
  });
  const [selectedWineType, setSelectedWineType] = useState(WineType.TYPE_UNKNOWN);
  const [isSparkling, setIsSparkling] = useState(false);
  const [selectedGrapes, setSelectedGrapes] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionOptions, setRegionOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [edited, setEdited] = useState(false);
  const [focused, setFocused] = useState(false);
  const [closingPayload, setClosingPayload] = useState(null)
  // 병합 전 알럿을 위해 저장
  const [originalTitleKR, setOriginalTitleKR] = useState('');
  
  // 와인 검색 팝업 상태
  const [isWineSearchPopupOpen, setIsWineSearchPopupOpen] = useState(false);

  // 보충 필요 코드
  const SUPPLEMENT_STATUS_CODE = WineStatusOptions.find(opt => opt.label === '보충 필요')?.code;

  // 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      status: SUPPLEMENT_STATUS_CODE
    }));
    if (name === 'titleKR') setEdited(true);
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    setFocused(false);
    setTimeout(() => setShowSuggestions(false), 100);
  };

  // 모달 열리면 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // titleKR 로 자동완성
  useEffect(() => {
    const id = setTimeout(async () => {
      const cleaned = formData.titleKR.replace(/\s/g, '');
      if (cleaned.length > 1 && edited && focused) {
        try {
          const results = await searchWines(user, cleaned);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (e) {
          console.error('자동완성 오류', e);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [formData.titleKR, edited, focused]);

  // wineIndex prop 변경되면 해당 와인 로드
  useEffect(() => {
    const loadWineIfNeeded = async () => {
      if (wineIndex) {
        const wine = await fetchWineByIndex(wineIndex, user);
        if (wine) {
          applyWineToState(wine);
          setOriginalTitleKR(wine.titleKR || '');
        }
      } else if (initialData) {
        // 검색 필드를 쉼표로 구분된 형식으로 변환
        const searchTerms = [];
        
        // 한글 이름을 토큰별로 나누어 추가
        const titleKR = initialData.titleKR || initialData.original_ko || '';
        if (titleKR) {
          // 공백, 하이픈 등으로 구분된 토큰들을 추출
          const krTokens = titleKR
            .split(/[\s\-]+/)
            .map(token => token.trim())
            .filter(token => token.length > 0);
          searchTerms.push(...krTokens);
        }
        
        // 영문 와인 이름을 토큰별로 나누어 추가
        const titleEN = initialData.title || initialData.wine_name || '';
        if (titleEN) {
          // 공백, 하이픈, 특수문자 등으로 구분된 토큰들을 추출
          const enTokens = titleEN
            .split(/[\s\-&,]+/)
            .map(token => token.trim().replace(/['"]/g, '')) // 따옴표 제거
            .filter(token => token.length > 0);
          searchTerms.push(...enTokens);
        }
        
        // 도메인 추가
        if (initialData.domain) {
          searchTerms.push(initialData.domain);
        }
        
        // 가격 정보 추가
        if (initialData.price_range) {
          searchTerms.push(initialData.price_range);
        }
        
        // description 처리
        if (initialData.description) {
          const desc = initialData.description.trim();
          if (desc.includes(',')) {
            // 이미 쉼표가 있으면 그대로 사용
            searchTerms.push(desc);
          } else {
            // 쉼표가 없으면 문장 단위로 나누어 쉼표로 구분
            const sentences = desc
              .split(/[.!?]\s+/)
              .map(s => s.trim())
              .filter(s => s.length > 0);
            if (sentences.length > 0) {
              searchTerms.push(sentences.join(', '));
            }
          }
        }
        
        // 중복 제거 후 쉼표로 구분
        const uniqueTerms = [...new Set(searchTerms)];
        const finalSearchField = uniqueTerms.join(', ');
        
        // 한글 이름에서 숫자 제거 (이미 WineCandidateBottomSheet에서 처리했지만 다시 한번)
        const cleanTitleKR = (initialData.titleKR || initialData.original_ko || '').replace(/\d+/g, '').trim();
        
        // 카드에서 가져온 데이터로 폼 자동 기입
        setFormData(prev => ({
          ...prev,
          titleKR: cleanTitleKR,
          title: initialData.title || initialData.wine_name || '',
          thumbnailURL: initialData.thumbnailURL || '',
          searchField: finalSearchField,
        }));
        setOriginalTitleKR(cleanTitleKR);
      } else if (initialWineName) {
        setFormData(prev => ({ ...prev, titleKR: initialWineName }));
        setOriginalTitleKR(initialWineName);
      }
    };
    loadWineIfNeeded();
  }, [wineIndex, initialWineName, initialData]);

  // 포도 품종 선택시 지역 옵션 로드
  useEffect(() => {
    if (selectedGrapes.length === 1) {
      loadRegionOptions('', selectedGrapes[0].value).then(setRegionOptions);
    }
  }, [selectedGrapes]);

  // API 로부터 받은 와인 데이터를 form 에 세팅
  const applyWineToState = (wine) => {
    setFormData({
      title: wine.title || '',
      titleKR: wine.titleKR || '',
      region: wine.region || '',
      grape: wine.grape || '',
      wineryIndex: wine.wineryIndex || '',
      thumbnailURL: wine.thumbnailURLString || '',
      searchField: wine.searchField || '',
      status: wine.status || 0,
      description: wine.description || '',
    });
    setSelectedGrapes(
      wine.grape
        ? wine.grape.split(',').map(g => ({ value: g, label: g }))
        : []
    );
    setSelectedRegion(
      wine.region ? { value: wine.region, label: wine.region } : null
    );

    const type = wine.type;
    setIsSparkling([
      WineType.TYPE_RED_SPARKLING,
      WineType.TYPE_WHITE_SPARKLING,
      WineType.TYPE_ROSE_SPARKLING,
    ].includes(type));

    if ([WineType.TYPE_RED, WineType.TYPE_RED_SPARKLING].includes(type)) {
      setSelectedWineType(WineType.TYPE_RED);
    } else if ([WineType.TYPE_WHITE, WineType.TYPE_WHITE_SPARKLING].includes(type)) {
      setSelectedWineType(WineType.TYPE_WHITE);
    } else if ([WineType.TYPE_ROSE, WineType.TYPE_ROSE_SPARKLING].includes(type)) {
      setSelectedWineType(WineType.TYPE_ROSE);
    } else {
      setSelectedWineType(WineType.TYPE_UNKNOWN);
    }
  };

  // 와인 타입 값 결정
  const getWineTypeValue = () => {
    switch (selectedWineType) {
      case WineType.TYPE_RED:
        return isSparkling ? WineType.TYPE_RED_SPARKLING : WineType.TYPE_RED;
      case WineType.TYPE_WHITE:
        return isSparkling ? WineType.TYPE_WHITE_SPARKLING : WineType.TYPE_WHITE;
      case WineType.TYPE_ROSE:
        return isSparkling ? WineType.TYPE_ROSE_SPARKLING : WineType.TYPE_ROSE;
      default:
        return WineType.TYPE_UNKNOWN;
    }
  };

  const handleWineTypeChange = (type) => {
    setSelectedWineType(prev => (prev === type ? WineType.TYPE_UNKNOWN : type));
  };
  const handleSparklingChange = () => {
    setIsSparkling(prev => !prev);
    if (!isSparkling && selectedWineType === WineType.TYPE_UNKNOWN) {
      setSelectedWineType(WineType.TYPE_WHITE);
    }
  };

  // 3) 부모에 전달할 객체 생성 
  const mapWineToPriceItem = (wine) => ({
    WPR_index: priceIndex,
    WPR_wineIndex: wine.index,
    WIN_title: wine.title,
    WIN_titleKR: wine.titleKR,
    WIN_thumbnailURL: wine.thumbnailURLString,
    WIN_region: wine.region,
    WIN_grape: wine.grape,
    WIN_type: wine.type,
    WIN_status: wine.status,
  });

  // 자동완성에서 제안 선택(병합)
  const handleSuggestionSelect = async (suggestedWine) => {
    if (Number(suggestedWine.index) === Number(wineIndex)) return;

    // 현재 폼에 로드된 와인의 한글 제목 또는 영문 제목을 먼저 구해둡니다.
    const currentName = originalTitleKR || '알 수 없음';
    let selectedName;
    if (suggestedWine.titleKR && suggestedWine.title) {
      // 한글·영문 둘 다 있을 때
      selectedName = `${suggestedWine.titleKR}\n${suggestedWine.title}`;
    } else if (suggestedWine.titleKR) {
      // 한글만 있을 때
      selectedName = suggestedWine.titleKR;
    } else if (suggestedWine.title) {
      // 영문만 있을 때
      selectedName = suggestedWine.title;
    } else {
      // 둘 다 없을 때
      selectedName = '알 수 없음';
    }

    const confirmMessage =
      `기존 정보를 삭제하고 이 와인에 병합합니다.\n\n` +
      `${currentName}\n` +
      `↓\n ` +
      `${selectedName}\n\n`
      ;
    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await mergeWine(wineIndex, suggestedWine.index, user);
      if (result?.code === '0' && result.body) {
        toast.success('병합이 완료되었습니다.');
        applyWineToState(result.body);
        setClosingPayload(mapWineToPriceItem(result.body));
      } else {
        toast.error('병합에 실패했습니다.');
      }
    } catch (e) {
      toast.error('오류 발생: 병합 실패');
    }
  };

  // 폼 제출(등록/수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameKR = formData.titleKR.trim();
    const nameEN = formData.title.trim();
    const grapeRegex = /^[A-Za-z\s,()]+$/;

    if (!nameKR && !nameEN) {
      toast.error('이름은 비워둘 수 없습니다.');
      return;
    }
    if (selectedGrapes.some(g => !grapeRegex.test(g.label))) {
      toast.error('품종은 영어, 공백, 쉼표만 사용할 수 있습니다.');
      return;
    }

    const targetWineIndex = closingPayload?.WPR_wineIndex ?? wineIndex;

    setIsSubmitting(true);
    const wineData = {
      ...formData,
      index: targetWineIndex,
      type: getWineTypeValue(),
      grape: selectedGrapes.map(g => g.value).join(','),
      region: selectedRegion?.value || '',
    };

    try {
      const response = targetWineIndex
        ? await updateWine(targetWineIndex, wineData, user)
        : await addWine(wineData, user);
      if (response?.code === '0') {
        toast.success('와인이 성공적으로 저장되었습니다!');
        applyWineToState(response.body);
        // 여기선 handleClose 호출할 경우 mapWineToPriceItem 가 저장 완료되기 전에 호출되어 버림. 
        const payload = mapWineToPriceItem(response.body);
        onClose(payload);
      } else {
        toast.error('와인 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('오류 발생: 와인 저장 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose(closingPayload)
  }

  return (
    <div
      className="popup-overlay"
      onMouseDown={() => { 
        if (!isWineSearchPopupOpen) {
          mouseDownOnBgRef.current = true;
        }
      }}
      onMouseUp={() => {
        if (mouseDownOnBgRef.current && !isWineSearchPopupOpen) {
          handleClose();
        }
      }}
      onTouchStart={() => { 
        if (!isWineSearchPopupOpen) {
          mouseDownOnBgRef.current = true;
        }
      }}
      onTouchEnd={(e) => {
        // 터치 업도 오버레이에서만 닫힘 (자식에서 stopPropagation 처리)
        if (mouseDownOnBgRef.current && !isWineSearchPopupOpen) {
          handleClose();
        }
      }}
    >
      <div
        className="popup-content"
        onMouseDown={(e) => { e.stopPropagation(); mouseDownOnBgRef.current = false; }}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => { e.stopPropagation(); mouseDownOnBgRef.current = false; }}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <button
          className="popup-close-button"
          onClick={handleClose}
        >
          ×
        </button>

        <h2>
          {wineIndex ? '와인 수정' : '새 와인 등록'}
          {wineIndex && <span className="wineIndex">({wineIndex})</span>}
        </h2>

        <form onSubmit={handleSubmit} className="form">
          {/* 상태 선택 */}
          <div className="form-field">
            <label>상태</label>
            <div className="wine-status-segment">
              {WineStatusOptions.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  className={`status-segment-button ${formData.status === code ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, status: code }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 한글 이름 + 자동완성 */}
          <div className="form-field">
            <label>한글 와인 이름</label>
            <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                name="titleKR"
                value={formData.titleKR}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setIsWineSearchPopupOpen(true)}
                className="ai-search-button-wine-popup"
              >
                <TbWand style={{ fontSize: '14px' }} />
                AI 검색
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestion-list">
                {suggestions.map(wine => (
                  <li
                    key={wine.index}
                    className={`suggestion-item ${Number(wine.index) === Number(wineIndex) ? 'suggestion-item-current' : ''}`}
                    onMouseDown={() => handleSuggestionSelect(wine)}
                  >
                    <div className="suggestion-thumbnail-wrapper">
                      {wine.thumbnailURLString ? (
                        <img
                          src={wine.thumbnailURLString}
                          alt="thumb"
                          className="suggestion-thumbnail"
                        />
                      ) : (
                        <div className="suggestion-placeholder">
                          {WineStatusMap[wine.status] || '알 수 없음'}
                        </div>
                      )}
                    </div>
                    <div className="suggestion-text">
                      <div>
                        {wine.titleKR}
                        {Number(wine.index) === Number(wineIndex) && <span className="check-icon">✓</span>}
                      </div>
                      <div className="suggestion-subtext">{wine.title}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 영문 이름 */}
          <div className="form-field">
            <label>영문 와인 이름</label>
            <input name="title" value={formData.title} onChange={handleChange} />
          </div>

          {/* 타입 선택 */}
          <div className="form-field">
            <label>타입</label>
            <div className="wine-type-buttons">
              {[WineType.TYPE_RED, WineType.TYPE_WHITE, WineType.TYPE_ROSE].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`wine-type-button ${selectedWineType === type ? 'selected' : ''}`}
                  onClick={() => handleWineTypeChange(type)}
                >
                  {type === WineType.TYPE_RED
                    ? '레드'
                    : type === WineType.TYPE_WHITE
                      ? '화이트'
                      : '로제'}
                </button>
              ))}
              +
              <button
                type="button"
                className={`wine-type-button ${isSparkling ? 'selected' : ''}`}
                onClick={handleSparklingChange}
              >
                스파클링
              </button>
            </div>
          </div>

          {/* 썸네일 URL */}
          <div className="form-field thumbnail-field-vertical">
            <div className="thumbnail-preview-wrapper-large">
              <img
                className="thumbnail-preview-image"
                src={formData.thumbnailURL || '/placeholder-image.png'}
                alt="thumbnail"
              />
            </div>
            <div className="thumbnail-url-section">
              <label>썸네일 URL</label>
              <input
                name="thumbnailURL"
                value={formData.thumbnailURL}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* 포도 품종 */}
          <div className="form-field">
            <label>포도 품종</label>
            <CreatableSelect
              isMulti
              options={grapeOptions}
              value={selectedGrapes}
              onChange={(newValue) => setSelectedGrapes(newValue as any)}
            />
          </div>

          {/* 생산 지역 */}
          <div className="form-field">
            <label>생산 지역</label>
            <AsyncSelect
              cacheOptions
              loadOptions={inputValue =>
                loadRegionOptions(inputValue, selectedGrapes.length === 1 ? selectedGrapes[0].value : null)
              }
              defaultOptions={regionOptions}
              value={selectedRegion}
              onChange={(newValue) => setSelectedRegion(newValue as any)}
            />
          </div>

          {/* 검색 필드 */}
          <div className="form-field">
            <label>검색 필드</label>
            <textarea
              name="searchField"
              value={formData.searchField}
              onChange={handleChange}
              rows={3}
              style={{
                resize: 'vertical',
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          {/* 제출 */}
          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? '저장 중…' : wineIndex ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </div>

      {/* 와인 검색 팝업 */}
      {isWineSearchPopupOpen && (
        <WineSearchPopup
          isOpen={isWineSearchPopupOpen}
          onClose={() => setIsWineSearchPopupOpen(false)}
          initialKeyword={formData.titleKR}
          onSelectWine={(wine) => {
            // 선택된 와인 정보를 폼에 반영
            if (wine.kr_name) {
              setFormData(prev => ({
                ...prev,
                titleKR: wine.kr_name,
                title: wine.en_name || prev.title,
                thumbnailURL: wine.thumbnail_url || prev.thumbnailURL,
              }));
            }
            setIsWineSearchPopupOpen(false);
            toast.success('와인 정보가 입력되었습니다.');
          }}
        />
      )}
    </div>
  );
}