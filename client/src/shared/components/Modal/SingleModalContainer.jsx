// src/components/containers/SingleModalContainer.jsx
import React, { useEffect, useRef } from 'react';
import HeadlessModal from '../common/HeadlessModal';
import styles from './SingleModalContainer.module.css';

export default function SingleModalContainer({
  isOpen = true,
  onClose,
  contentLabel = 'Dialog',
  overlayClassName = '',
  className = '',
  shouldCloseOnOverlayClick = true,
  // ✅ 원하는 기본 폭(px). Twin과 맞추려면 720 유지
  widthPx = 480,
  children,
  ...rest
}) {
  const mergedOverlay = [styles.overlay, overlayClassName].filter(Boolean).join(' ');
  const mergedContent = [styles.content, className].filter(Boolean).join(' ');

  const shellRef = useRef(null);
  useEffect(() => {
    if (shellRef.current) {
      const rect = shellRef.current.getBoundingClientRect();
      // 디버그 로그: 실제 적용된 픽셀 폭
      // eslint-disable-next-line no-console
      console.log('[SingleModalContainer] shell width:', Math.round(rect.width), 'px');
    }
  }, [isOpen, widthPx]);

  return (
    <HeadlessModal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName={mergedOverlay}
      className={mergedContent}
      contentLabel={contentLabel}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      {...rest}
    >
      {/* ✅ 변수 대신 인라인 스타일로 강제 */}
      <div
        ref={shellRef}
        className={styles.shell}
        style={{ width: `${widthPx}px`, maxWidth: '96vw' }}
      >
        <div className={styles.inner}>
          {children}
        </div>
      </div>
    </HeadlessModal>
  );
}