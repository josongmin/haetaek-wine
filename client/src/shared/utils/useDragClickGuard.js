import { useRef, useCallback } from 'react';

/**
 * 드래그(텍스트 선택 등) 후 발생한 클릭을 무시하는 가드.
 * - threshold(px) 이상 움직이면 드래그로 간주하고, 그 뒤 첫 click을 막습니다.
 */
export function useDragClickGuard(threshold = 5) {
  const sRef = useRef({ x: 0, y: 0, dragging: false, downOnSelf: false });

  const onMouseDown = useCallback((e) => {
    sRef.current = { x: e.clientX, y: e.clientY, dragging: false, downOnSelf: true };
  }, []);

  const onMouseMove = useCallback((e) => {
    const s = sRef.current;
    if (!s.downOnSelf) return;
    if (!s.dragging) {
      const dx = Math.abs(e.clientX - s.x);
      const dy = Math.abs(e.clientY - s.y);
      if (dx > threshold || dy > threshold) s.dragging = true;
    }
  }, [threshold]);

  // 부모 onClick에 감싸서 사용: onClick={guardClick(() => ...)}
  const guardClick = useCallback((handler) => (e) => {
    const s = sRef.current;
    if (s.dragging) {
      // 드래그로 판정된 경우, 첫 클릭은 소거
      s.dragging = false;
      s.downOnSelf = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    s.downOnSelf = false;
    handler && handler(e);
  }, []);

  return {
    handlers: { onMouseDown, onMouseMove },
    guardClick,
  };
}