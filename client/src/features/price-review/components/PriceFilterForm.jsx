// src/components/PriceFilterForm.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../../../UserContext';
import { toast } from 'react-hot-toast';
import { searchWines, getWineShopList } from '../../../api/wineApi';
import { WineStatusMap } from '@myorg/shared/constants/wineStatusMap';

// -------------------- 나중에 utils 로 뺄지 고민 --------------------
// BASE 기본값(모든 사용자 공통)
export const BASE_FILTER = {
  writerIndex: '',
  writerIsNotAdmin: true,
  showReportedByUser: false,
  showPassed: true,
  showInReview: true,
  showDeleted: true,
  showReported: true,
  showPassBeforeReview: true,
  count: 50,
};

// 사용자별 프리셋만 따로 정의 (필요한 키만 덮어쓰기)
export const USER_PRESETS = {
  250: {
    writerIndex: '250',
    writerIsNotAdmin: false,
  },
  195: {
    writerIndex: '195',
    writerIsNotAdmin: false,
    // 예: 195는 삭제 숨기고 시작
    showDeleted: false,
  },
  // ... 앞으로 추가
};

export function getDefaultFiltersForUser(user) {
  const id = Number(user?.index);
  return { ...BASE_FILTER, ...(USER_PRESETS[id] || {}) };
}
// --------------------------------------------------------------------------------

export default function PriceFilterForm({ onSubmit, isLoading, initialFilters, aiSearchText, onAiSearchTextProcessed }) {
  const { user } = useContext(UserContext);

  // 사용자별 기본값 한 번 계산 (userIndex 바뀌면 재계산)
  const userDefaults = React.useMemo(
    () => getDefaultFiltersForUser(user),
    [user?.index]
  );

  // ── 1) 기본 필터 상태 ──
  const [writerIndex, setWriterIndex] = useState('');
  const [writerIsNotAdmin, setWriterIsNotAdmin] = useState(true);
  const [showReportedByUser, setShowReportedByUser] = useState(false);
  const [showPassed, setShowPassed] = useState(true);
  const [showInReview, setShowInReview] = useState(true);
  const [showDeleted, setShowDeleted] = useState(true);
  const [showReported, setShowReported] = useState(true);
  const [showPassBeforeReview, setShowPassBeforeReview] = useState(true);
  const [count, setCount] = useState(50);
  
  useEffect(() => {
    if (!initialFilters) return;
    setWriterIndex(initialFilters.writerIndex ?? '');
    setWriterIsNotAdmin(!!initialFilters.writerIsNotAdmin);
    setShowReportedByUser(!!initialFilters.showReportedByUser);
    setShowPassed(!!initialFilters.showPassed);
    setShowInReview(!!initialFilters.showInReview);
    setShowDeleted(!!initialFilters.showDeleted);
    setShowReported(!!initialFilters.showReported);
    setShowPassBeforeReview(!!initialFilters.showPassBeforeReview);
    setCount(Number(initialFilters.count ?? initialFilters.loadRowCount ?? 50));
  }, [initialFilters]);

  // ── 2) 와인 자동완성 관련 상태 ──
  const [wineInput, setWineInput] = useState('');
  const [wineSuggestions, setWineSuggestions] = useState([]);
  const [showWineSuggestions, setShowWineSuggestions] = useState(false);
  const [wineFocused, setWineFocused] = useState(false);
  const [wineEdited, setWineEdited] = useState(false);
  const wineDebounceRef = useRef(null);
  const [selectedWine, setSelectedWine] = useState(null);

  // ── 3) 샵 자동완성 관련 상태 ──
  const [shopInput, setShopInput] = useState('');
  const [shopSuggestions, setShopSuggestions] = useState([]);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);
  const [shopFocused, setShopFocused] = useState(false);
  const [shopEdited, setShopEdited] = useState(false);
  const shopDebounceRef = useRef(null);
  const [selectedShop, setSelectedShop] = useState(null);

  // ── 4) 외부에서 AI 검색 결과를 받아서 와인 입력 필드에 설정 ──
  useEffect(() => {
    if (aiSearchText) {
      setWineInput(aiSearchText);
      setWineEdited(true);
      setWineFocused(true);
      // 처리 완료를 부모에게 알림
      if (onAiSearchTextProcessed) {
        onAiSearchTextProcessed();
      }
    }
  }, [aiSearchText, onAiSearchTextProcessed]);

  // ── 5) initialFilters가 들어왔을 때, 와인/샵 칩으로 표시하기 ──
  useEffect(() => {
    if (!initialFilters) return;

    // — 와인 필터가 있으면 칩으로 표시
    if (initialFilters.wineIndex && initialFilters.wineName) {
      setSelectedWine({
        index: initialFilters.wineIndex,
        titleKR: initialFilters.wineName,
        thumbnailURLString: initialFilters.wineThumbnailURLString ?? '',
        title: initialFilters.wineTitle ?? ''
      });
      setWineInput(initialFilters.wineName);
      setWineEdited(false);
    }

    // — 샵 필터가 있으면, shopIndex/shopTitle/shopBranch를 별도로 읽어서 칩에 세팅
    if (initialFilters.shopIndex && initialFilters.shopTitle != null) {
      setSelectedShop({
        WSH_index: initialFilters.shopIndex,
        WSH_title: initialFilters.shopTitle,
        WSH_branch: initialFilters.shopBranch || '',
        WSH_headShopIndex: initialFilters.headShopIndex || '',
        WSH_priceUnitCode: initialFilters.priceUnitCode || ''
      });
      setShopInput(
        initialFilters.shopBranch
          ? `${initialFilters.shopTitle} ${initialFilters.shopBranch}`
          : initialFilters.shopTitle
      );
      setShopEdited(false);
    }

    // — Writer Index 초기화
    if (initialFilters.writerIndex != null) {
      setWriterIndex(initialFilters.writerIndex);
    }
  }, [initialFilters]);

  // ── 5) 와인 자동완성: wineInput 변화 감지 ──
  useEffect(() => {
    const cleaned = wineInput.replace(/\s/g, '');
    if (cleaned.length < 2 || !wineFocused) {
      setWineSuggestions([]);
      setShowWineSuggestions(false);
      return;
    }
    if (!wineEdited) return;

    if (wineDebounceRef.current) clearTimeout(wineDebounceRef.current);
    wineDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchWines(user, cleaned);
        setWineSuggestions(results);
        setShowWineSuggestions(true);
      } catch (err) {
        console.error('와인 자동완성 오류:', err);
        setWineSuggestions([]);
        setShowWineSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(wineDebounceRef.current);
  }, [wineInput, wineEdited, wineFocused, user]);

  const handleWineFocus = () => setWineFocused(true);
  const handleWineBlur = () => {
    setWineFocused(false);
    setTimeout(() => setShowWineSuggestions(false), 100);
  };
  const handleWineSelect = (w) => {
    setSelectedWine(w);
    setWineInput(w.titleKR);
    setWineEdited(false);
    setShowWineSuggestions(false);
  };
  const removeWineChip = () => {
    setSelectedWine(null);
    setWineInput('');
    setWineEdited(false);
  };

  // ── 6) 샵 자동완성: shopInput 변화 감지 ──
  useEffect(() => {
    const cleaned = shopInput.replace(/\s/g, '');
    if (cleaned.length < 2 || !shopFocused) {
      setShopSuggestions([]);
      setShowShopSuggestions(false);
      return;
    }
    if (!shopEdited) return;

    if (shopDebounceRef.current) clearTimeout(shopDebounceRef.current);
    shopDebounceRef.current = setTimeout(async () => {
      try {
        const results = await getWineShopList(cleaned);
        const arr = results.success ? results.data : results;
        setShopSuggestions(arr);
        setShowShopSuggestions(true);
      } catch (err) {
        console.error('와인샵 자동완성 오류:', err);
        setShopSuggestions([]);
        setShowShopSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(shopDebounceRef.current);
  }, [shopInput, shopEdited, shopFocused]);

  const handleShopFocus = () => setShopFocused(true);
  const handleShopBlur = () => {
    setShopFocused(false);
    setTimeout(() => setShowShopSuggestions(false), 100);
  };
  const handleShopSelect = (s) => {
    // 디버깅용: 실제로 s에 어떤 필드가 있는지 찍어보기
    console.log('자동완성으로 선택된 샵:', s);

    // 1) selectedShop에 객체 전체 저장
    setSelectedShop({
      WSH_index: s.WSH_index,
      WSH_title: s.WSH_title,
      WSH_branch: s.WSH_branch || '',
      WSH_headShopIndex: s.WSH_headShopIndex || '',    // 서버가 내려준 값이 없으면 빈 문자열
      WSH_priceUnitCode: s.WSH_priceUnitCode || '',   // 서버가 내려준 값이 없으면 빈 문자열
    });

    // 2) Input 텍스트로는 “샾 이름 + (지점)”만 보여주기
    const branchLabel = s.WSH_branch ? ` ${s.WSH_branch}` : '';
    setShopInput(`${s.WSH_title}${branchLabel}`);

    setShopEdited(false);
    setShowShopSuggestions(false);
  };
  const removeShopChip = () => {
    setSelectedShop(null);
    setShopInput('');
    setShopEdited(false);
  };

  // ── 7) 최종 전송 핸들러 ──
  const handleSubmit = (e) => {
    e.preventDefault();

    // “와인” 결정
    let finalWineIndex = '';
    let finalSearchText = '';
    let finalWineName = '';
    let finalWineThumbnailURLString = '';
    if (selectedWine) {
      finalWineIndex = selectedWine.index;
      finalWineName = selectedWine.titleKR;
      finalWineThumbnailURLString = selectedWine.thumbnailURLString
    } else if (wineInput.trim() !== '') {
      finalSearchText = wineInput.trim();
    }

    // “샵” 결정: selectedShop이 있으면 그것, 없으면 (칩을 지웠거나) 빈 값
    let finalShopIndex = '';
    let finalShopTitle = '';
    let finalShopBranch = '';
    let finalHeadShopIndex = '';
    let finalPriceUnitCode = '';

    if (selectedShop) {
      // 서버에서 이 두 필드를 내려주지 않으면, ''(빈 문자열)로 디폴트
      finalShopIndex = String(selectedShop.WSH_index);
      finalShopTitle = selectedShop.WSH_title;
      finalShopBranch = selectedShop.WSH_branch || '';
      finalHeadShopIndex = selectedShop.WSH_headShopIndex
        ? String(selectedShop.WSH_headShopIndex)
        : '';
      finalPriceUnitCode = selectedShop.WSH_priceUnitCode || '';
    } else {
      // selectedShop이 없으면 → (칩을 지운 상태 혹은 처음부터 샵 선택 안 한 상태)
      finalShopIndex = '';
      finalShopTitle = '';
      finalShopBranch = '';
      finalHeadShopIndex = '';
      finalPriceUnitCode = '';
    }
    // *주의*: shopInput만 남아 있고 selectedShop이 없으면 경고
    if (!selectedShop && shopInput.trim() !== '') {
      toast.error('와인샵을 선택하거나 검색어를 지워주세요.');
      return;
    }

    // 부모에 넘길 객체
    onSubmit({
      wineIndex: finalWineIndex,
      wineName: finalWineName,
      wineThumbnailURLString: finalWineThumbnailURLString,
      writerIndex,
      shopIndex: finalShopIndex,
      shopTitle: finalShopTitle,
      shopBranch: finalShopBranch,
      headShopIndex: finalHeadShopIndex,
      priceUnitCode: finalPriceUnitCode,
      searchText: finalSearchText,
      writerIsNotAdmin,
      showReportedByUser,
      showPassed,
      showInReview,
      showDeleted,
      showReported,
      showPassBeforeReview,
      loadRowCount: count,
    });
  };

  // ── 8) JSX 렌더링 ──
  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>

      {/* ── “관리자 작성 제외” + “신고접수만 보기”: 한 줄에 배치 ── */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={writerIsNotAdmin}
            onChange={() => setWriterIsNotAdmin(prev => !prev)}
          />
          관리자 작성 제외
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={showReportedByUser}
            onChange={() => setShowReportedByUser(prev => !prev)}
          />
          신고접수만 보기
        </label>
      </div>

      {/* ── 와인 자동완성 필드 ── */}
      <div style={{ position: 'relative' }}>
        <label>와인</label>

        {selectedWine && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f3e5f5',
            borderRadius: '16px',
            padding: '4px 8px',
            marginBottom: '6px'
          }}>
            {selectedWine.thumbnailURLString && (
              <img
                src={selectedWine.thumbnailURLString}
                alt="wine-chip-thumb"
                style={{
                  width: '24px',
                  height: '24px',
                  objectFit: 'cover',
                  borderRadius: '3px',
                  marginRight: '6px'
                }}
              />
            )}
            <span style={{ fontSize: '13px', fontWeight: 500 }}>
              {selectedWine.titleKR}
            </span>
            <span
              style={{ marginLeft: '4px', cursor: 'pointer', fontSize: '12px' }}
              onClick={removeWineChip}
            >✕</span>
          </div>
        )}

        <input
          type="text"
          value={wineInput}
          onChange={(e) => {
            setWineInput(e.target.value);
            setWineEdited(true);
          }}
          onFocus={handleWineFocus}
          onBlur={handleWineBlur}
          placeholder="와인 검색하기"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxSizing: 'border-box'
          }}
        />

        {showWineSuggestions && wineSuggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0, right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            zIndex: 1100,
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            {wineSuggestions.map(w => (
              <li
                key={w.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }}
                onMouseDown={() => handleWineSelect(w)}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  flexShrink: 0,
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginRight: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#f0f0f0'
                }}>
                  {w.thumbnailURLString
                    ? <img
                      src={w.thumbnailURLString}
                      alt="wine-thumb"
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    />
                    : <span style={{
                      fontSize: '8px',
                      color: '#666',
                      textAlign: 'center',
                      padding: '4px'
                    }}>
                      {w.status != null ? WineStatusMap[w.status] : '알 수 없음'}
                    </span>
                  }
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{w.titleKR}</span>
                  <span style={{ fontSize: '12px', color: '#555' }}>{w.title}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 와인샵 + Writer Index: 한 줄에 배치 ── */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* ── 샵 자동완성 필드 ── */}
        <div style={{ position: 'relative', flex: 1 }}>
          <label>와인샵</label>

          {selectedShop && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#e0f7fa',
              borderRadius: '16px',
              padding: '4px 8px',
              marginBottom: '6px'
            }}>
              <span style={{ fontWeight: 500 }}>{selectedShop.WSH_title}</span>
              {selectedShop.WSH_branch && (
                <span style={{
                  fontSize: '13px',
                  fontWeight: 300,
                  color: '#555',
                  marginLeft: '4px'
                }}>
                  {selectedShop.WSH_branch}
                </span>
              )}
              <span
                style={{ marginLeft: '4px', cursor: 'pointer', fontSize: '12px' }}
                onClick={removeShopChip}
              >✕</span>
            </div>
          )}

          <input
            type="text"
            value={shopInput}
            onChange={(e) => {
              setShopInput(e.target.value);
              setShopEdited(true);
            }}
            onFocus={handleShopFocus}
            onBlur={handleShopBlur}
            placeholder="와인샵 검색하기"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxSizing: 'border-box'
            }}
          />

          {showShopSuggestions && shopSuggestions.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0, right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              zIndex: 1100,
              listStyle: 'none',
              margin: 0,
              padding: 0
            }}>
              {shopSuggestions.map(s => (
                <li
                  key={s.WSH_index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    cursor: 'pointer'
                  }}
                  onMouseDown={() => handleShopSelect(s)}
                >
                  <span style={{ fontWeight: 500 }}>{s.WSH_title}</span>
                  {s.WSH_branch && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 300,
                      color: '#555',
                      marginLeft: '4px'
                    }}>
                      {s.WSH_branch}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Writer Index 필드 ── */}
        <div style={{ flex: 1 }}>
          <label>Writer Index</label>
          <input
            type="text"
            value={writerIndex}
            onChange={(e) => setWriterIndex(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ── 상태 필터 + 불러올 개수: 한 줄에 배치 ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* 상태 체크박스 그룹 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label>
            <input
              type="checkbox"
              checked={showPassed}
              onChange={() => setShowPassed(prev => !prev)}
            />
            통과
          </label>
          <label>
            <input
              type="checkbox"
              checked={showInReview}
              onChange={() => setShowInReview(prev => !prev)}
            />
            심사중
          </label>
          <label>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={() => setShowDeleted(prev => !prev)}
            />
            삭제
          </label>
          <label>
            <input
              type="checkbox"
              checked={showReported}
              onChange={() => setShowReported(prev => !prev)}
            />
            거절
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPassBeforeReview}
              onChange={() => setShowPassBeforeReview(prev => !prev)}
            />
            선통과
          </label>
        </div>

        {/* 불러올 개수 입력 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label>불러올 개수:</label>
          <input
            type="number"
            min="1"
            max="500"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{
              width: '80px',
              padding: '6px 8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <button type="submit"
        disabled={isLoading}
        style={{
          padding: '12px 20px',     // 높이 증가
          fontSize: '16px',         // 글자도 살짝 키우기
          borderRadius: '6px',      // 모서리 둥글게 (선택)
          backgroundColor: '#1976d2', // 보기 좋게 색도 추가 (선택)
          color: '#fff',
          border: 'none',
          cursor: isLoading ? 'default' : 'pointer'
        }}
      >
        {isLoading ? '불러오는 중...' : '불러오기'}
      </button>
    </form>
  );
}