import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../UserContext';
import { aiSuggestionFulltext } from '../../../api/wineApi';
import WineCandidateBottomSheet from './WineCandidateBottomSheet';
import { TbWand } from 'react-icons/tb';
import { toast } from 'react-hot-toast';
import './AiTextRecognitionModal.css';

export default function AiTextRecognitionModal({ isOpen, onClose, onSearch, onRegisterWine }) {
  const { user } = useContext(UserContext);
  const [text, setText] = useState('');
  const [wineSuggestions, setWineSuggestions] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedWineForBottomSheet, setSelectedWineForBottomSheet] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showMagicAnimation, setShowMagicAnimation] = useState(false);
  const [lastSearchedText, setLastSearchedText] = useState('');

  // body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setText('');
      setWineSuggestions([]);
      setShowResults(false);
      setIsLoading(false);
      setActiveTabIndex(0);
      setSelectedWineForBottomSheet(null);
      setShowBottomSheet(false);
      setShowMagicAnimation(false);
      setLastSearchedText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!text.trim()) {
      toast.error('와인에 대한 설명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    setActiveTabIndex(0);
    setLastSearchedText(text.trim());

    try {
      const response = await aiSuggestionFulltext(text);
      console.log('AI suggestion 응답:', response);
      if (response && response.wines && response.wines.length > 0) {
        console.log('와인 제안 데이터:', response.wines);
        setWineSuggestions(response.wines);
        setShowResults(true);
        // 마법 애니메이션 표시
        setShowMagicAnimation(true);
        setTimeout(() => {
          setShowMagicAnimation(false);
        }, 2000);
      } else {
        toast.error('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('AI suggestion 오류:', error);
      toast.error('검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 버튼 활성화 조건: 텍스트가 있고, 검색 완료 후 텍스트가 변경되었거나 아직 검색하지 않은 경우
  const isSearchButtonEnabled = text.trim().length > 0 && 
                                 (lastSearchedText === '' || text.trim() !== lastSearchedText);

  const handleWineTabClick = (wine, index) => {
    setActiveTabIndex(index);
    setSelectedWineForBottomSheet(wine);
    setShowBottomSheet(true);
  };

  const handleWineSelectFromBottomSheet = (selectedWine) => {
    onSearch(selectedWine);
    setText('');
    setWineSuggestions([]);
    setShowResults(false);
    setActiveTabIndex(0);
    setSelectedWineForBottomSheet(null);
    setShowBottomSheet(false);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={handleOverlayClick}>
      {/* 마법 애니메이션 */}
      {showMagicAnimation && (
        <div className="ai-magic-animation">
          <div className="ai-magic-sparkles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="ai-sparkle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`
              }}>✨</div>
            ))}
          </div>
        </div>
      )}
      <div className="ai-modal-content">
        <div className="ai-modal-header">
          <h3>AI 와인검색/등록</h3>
          <button className="ai-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="ai-modal-body">
          <div className="ai-modal-input-wrapper">
            {isLoading && (
              <div className="ai-modal-loading">
                <div className="ai-spinner"></div>
              </div>
            )}
            <textarea
              className="ai-modal-input"
              placeholder="와인에 대한 설명을 입력하세요...&#10;&#10;예시: 2019년 프랑스 보르도 지역의 레드 와인으로, 카베르네 소비뇽과 메를로가 블렌딩된 풀바디 와인입니다."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (isSearchButtonEnabled && !isLoading) {
                    handleSearch();
                  }
                }
              }}
              rows={10}
              autoFocus
            />
          </div>
        </div>

        <div className="ai-modal-footer">
          {showResults && wineSuggestions.length > 0 && (
            <div className="ai-wine-tabs">
              {wineSuggestions.map((wine, index) => {
                const wineName = wine?.original_ko || wine?.raw || `와인 ${index + 1}`;
                console.log(`와인 ${index}:`, wine, '표시할 이름:', wineName);
                return (
                  <button
                    key={wine?.wine_index || index}
                    className={`ai-wine-tab ${activeTabIndex === index ? 'ai-wine-tab-active' : ''}`}
                    onClick={() => handleWineTabClick(wine, index)}
                  >
                    {wineName}
                  </button>
                );
              })}
            </div>
          )}
          <button 
            className="ai-modal-search-button" 
            onClick={handleSearch}
            disabled={isLoading || !isSearchButtonEnabled}
          >
            {isLoading ? (
              <>
                <TbWand className="ai-magic-wand-icon ai-wand-spinning" />
                <span>AI 검색 중...</span>
              </>
            ) : (
              <>
                {isSearchButtonEnabled ? (
                  <TbWand className="ai-magic-wand-icon" />
                ) : (
                  <span className="ai-magic-wand-icon-disabled">✕</span>
                )}
                <span>AI 검색하기</span>
              </>
            )}
          </button>
        </div>
      </div>

              <WineCandidateBottomSheet
                isOpen={showBottomSheet}
                onClose={() => {
                  setShowBottomSheet(false);
                  setSelectedWineForBottomSheet(null);
                }}
                wine={selectedWineForBottomSheet}
                onSelectWine={handleWineSelectFromBottomSheet}
                onRegisterWine={onRegisterWine}
              />
    </div>
  );
}

