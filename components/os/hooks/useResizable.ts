// Copied from assets/skeuomorphic-forensic-os/hooks/useResizable.ts
import React, { useState, useEffect, useCallback, RefObject } from 'react';

interface UseResizableProps {
  id: string;
  initialW: number;
  initialH: number;
  minW?: number;
  minH?: number;
  onUpdate: (id: string, w: number, h: number) => void;
  parentRef: RefObject<HTMLElement>;
}

export const useResizable = ({
  id,
  initialW,
  initialH,
  minW = 15,
  minH = 15,
  onUpdate,
  parentRef
}: UseResizableProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ w: initialW, h: initialH });
    setIsResizing(true);
  }, [initialW, initialH]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!parentRef.current) return;
      
      const parentRect = parentRef.current.getBoundingClientRect();
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      // Convert pixel delta to percentage
      const deltaWPercent = (deltaX / parentRect.width) * 100;
      const deltaHPercent = (deltaY / parentRect.height) * 100;
      
      const newW = Math.max(minW, startSize.w + deltaWPercent);
      const newH = Math.max(minH, startSize.h + deltaHPercent);

      onUpdate(id, newW, newH);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, startPos, startSize, id, onUpdate, parentRef, minW, minH]);

  return { isResizing, handleResizePointerDown };
};
