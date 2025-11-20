// src/components/common/HeadlessModal.jsx
import Modal from 'react-modal';

if (typeof document !== 'undefined') {
  Modal.setAppElement('#root');
}

export default function HeadlessModal({
  isOpen = true,
  onClose,
  overlayClassName,
  className,
  contentLabel = 'Dialog',
  shouldCloseOnOverlayClick = true,
  shouldCloseOnEsc = true,
  children,
  style: styleProp,
  ...rest
}) {
  // ✅ react-modal 기본 content 인라인 스타일 “필수만” 리셋
  const resetContentStyle = {
    position: 'static',
    inset: 'unset',
    padding: 0,
    border: 'none',
    outline: 'none',
    // ⛔ background / borderRadius / overflow 는 절대 여기서 지정하지 마세요
  };

  // overlay 배경은 안전망으로 유지 (전역 CSS가 투명 처리했을 때 대비)
  const defaultOverlayStyle = {
    backgroundColor: 'rgba(0,0,0,.35)',
  };

  const mergedStyle = {
    overlay: { ...defaultOverlayStyle, ...(styleProp?.overlay || {}) },
    content: { ...resetContentStyle,   ...(styleProp?.content || {}) },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      shouldCloseOnEsc={shouldCloseOnEsc}
      overlayClassName={overlayClassName}
      className={className}
      contentLabel={contentLabel}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Modal>
  );
}