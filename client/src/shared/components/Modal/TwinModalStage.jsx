// src/components/containers/TwinModalStage.jsx
import React from 'react';
import HeadlessModal from '../Content/HeadlessModal';
import styles from './TwinModalStage.module.css';

export default function TwinModalStage({
  isOpen = true,
  onCloseBoth,
  contentLabel = 'Compare',
  overlayClassName = '',
  stageClassName = '',
  leftBoxClassName = '',
  rightBoxClassName = '',
  /** 박스 기준폭 (고정) */
  boxWidthPx = 480,
  /** 박스 최소폭(선택) */
  boxMinWidthPx = 360,
  left,
  right,
  ...rest
}) {
  const mergedOverlay = [styles.overlay, overlayClassName].filter(Boolean).join(' ');
  const mergedStage   = [styles.stage, stageClassName].filter(Boolean).join(' ');
  const leftCls  = [styles.box, leftBoxClassName].filter(Boolean).join(' ');
  const rightCls = [styles.box, rightBoxClassName].filter(Boolean).join(' ');

  return (
    <HeadlessModal
      isOpen={isOpen}
      onClose={onCloseBoth}
      overlayClassName={mergedOverlay}
      className={mergedStage}
      contentLabel={contentLabel}
      {...rest}
    >
      <div
        className={leftCls}
        style={{ '--box-base': `${boxWidthPx}px`, '--box-min': `${boxMinWidthPx}px` }}
      >
        <div className={styles.boxInner}>{left}</div>
      </div>
      <div
        className={rightCls}
        style={{ '--box-base': `${boxWidthPx}px`, '--box-min': `${boxMinWidthPx}px` }}
      >
        <div className={styles.boxInner}>{right}</div>
      </div>
    </HeadlessModal>
  );
}