// src/components/reviewPrice/SelectAdminWriterPopup.jsx
import React, { useState, useEffect, useContext } from 'react';
import styles from './SelectAdminWriterPopup.module.css';
import { updateWinePriceWriter } from '../../../../api/wineApi';
import { toast } from 'react-hot-toast';
import { UserContext } from '../../../../UserContext';

// 추후 서버에서 받아올 라벨/인덱스/아이디/닉네임 매핑
export const ROLE_OPTIONS = [
  { label: '관리자',                index: 3,    id: 'test',              nickname: 'manager' },
  { label: '해외 직구 수집',          index: 250,  id: 'test5@test.test',   nickname: '해외직구 상품' },
  { label: '국내 구매 수집 (와인루트)', index: 152,  id: 'test3@test.test',   nickname: '와인루트 상품' },
  { label: '아이디얼와인 수집',        index: 195,  id: 'test4@test.test',   nickname: '아이디얼 상품' },
  { label: '아이디얼와인 경매',        index: 6530, id: 'test6@test.test',   nickname: '아이디얼 경매 가격' },
  { label: '테스트',                index: 6107, id: 'test.crawl',        nickname: 'dev.crawl' },
];

export default function SelectAdminWriterPopup({
  isOpen,
  initialWriter,
  priceIndex,
  wineIndex,
  onConfirm,
  onCancel
}) {
  const { user } = useContext(UserContext);
  
  const [selectedWriter, setSelectedWriter] = useState(initialWriter);
  const [isLoading, setIsLoading] = useState(false);

  // 팝업 열릴 때마다 초기값 리셋
  useEffect(() => {
    if (isOpen) {
      setSelectedWriter(initialWriter);
    }
  }, [isOpen, initialWriter]);

  // 팝업이 닫힌 상태에서는 렌더링 안 함
  if (!isOpen) return null;

  // 확인 버튼 클릭 시
  const handleConfirm = async () => {
    // 변경 사항 없으면 바로 리턴
    if (selectedWriter?.index === initialWriter?.index) return;

    setIsLoading(true);
    try {
      // 서버에 writerIndex 업데이트 요청
      await updateWinePriceWriter(
        //requesterIndex: user.index,
        //accessToken: user.accessToken,
        priceIndex,
        selectedWriter.index
      );
      toast.success('작성자 업데이트 완료');
      onConfirm(selectedWriter);
    } catch (err) {
      console.error(err);
      toast.error(`작성자 업데이트에 실패했습니다.\n${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>작성자 유형 선택</h3>
        <ul className={styles.list}>
          {ROLE_OPTIONS.map(option => (
            <li key={option.index} className={styles.listItem}>
              <label className={styles.optionLabel}>
                <input
                  type="radio"
                  name="writerRole"
                  value={option.index}
                  checked={selectedWriter?.index === option.index}
                  onChange={() => setSelectedWriter(option)}
                  disabled={isLoading}
                />
                <div className={styles.optionText}>
                  <span className={styles.mainLabel}>{option.label}</span>
                  <span className={styles.subInfo}>
                    ({option.index} / {option.id} / {option.nickname})
                  </span>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isLoading || selectedWriter?.index === initialWriter?.index}
          >
            {isLoading ? '로딩중…' : '확인'}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}