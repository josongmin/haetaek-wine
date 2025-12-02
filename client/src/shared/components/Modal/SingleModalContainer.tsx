// src/components/containers/SingleModalContainer.tsx
import React, { useEffect, useRef, ReactNode } from 'react';
import HeadlessModal from '../Content/HeadlessModal';
import styles from './SingleModalContainer.module.css';

interface SingleModalContainerProps {
  isOpen?: boolean;
  onClose?: () => void;
  contentLabel?: string;
  overlayClassName?: string;
  className?: string;
  shouldCloseOnOverlayClick?: boolean;
  widthPx?: number;
  children?: ReactNode;
  [key: string]: any;
}

export default function SingleModalContainer({
  isOpen = true,
  onClose,
  contentLabel = 'Dialog',
  overlayClassName = '',
  className = '',
  shouldCloseOnOverlayClick = true,
  widthPx = 480,
  children,
  ...rest
}: SingleModalContainerProps) {
  const mergedOverlay = [styles.overlay, overlayClassName].filter(Boolean).join(' ');
  const mergedContent = [styles.content, className].filter(Boolean).join(' ');

  const shellRef = useRef<HTMLDivElement>(null);
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

