// src/components/containers/TwinModalStage.tsx
import React, { ReactNode } from 'react';
import HeadlessModal from '../Content/HeadlessModal';
import styles from './TwinModalStage.module.css';

interface TwinModalStageProps {
  isOpen?: boolean;
  onCloseBoth?: () => void;
  contentLabel?: string;
  overlayClassName?: string;
  stageClassName?: string;
  leftBoxClassName?: string;
  rightBoxClassName?: string;
  boxWidthPx?: number;
  boxMinWidthPx?: number;
  left?: ReactNode;
  right?: ReactNode;
  [key: string]: any;
}

export default function TwinModalStage({
  isOpen = true,
  onCloseBoth,
  contentLabel = 'Compare',
  overlayClassName = '',
  stageClassName = '',
  leftBoxClassName = '',
  rightBoxClassName = '',
  boxWidthPx = 480,
  boxMinWidthPx = 360,
  left,
  right,
  ...rest
}: TwinModalStageProps) {
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
        style={{ '--box-base': `${boxWidthPx}px`, '--box-min': `${boxMinWidthPx}px` } as React.CSSProperties}
      >
        <div className={styles.boxInner}>{left}</div>
      </div>
      <div
        className={rightCls}
        style={{ '--box-base': `${boxWidthPx}px`, '--box-min': `${boxMinWidthPx}px` } as React.CSSProperties}
      >
        <div className={styles.boxInner}>{right}</div>
      </div>
    </HeadlessModal>
  );
}

