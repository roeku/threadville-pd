// Copied from assets/skeuomorphic-forensic-os/hooks/useDraggable.ts
import React, { useState, useEffect, useCallback, RefObject } from 'react';

interface UseDraggableProps {
  id: string;
  initialX: number;
  initialY: number;
  onUpdate: (id: string, x: number, y: number) => void;
  isActive: boolean;
  onFocus: () => void;
  parentRef: RefObject<HTMLElement>;
}

export const useDraggable = ({
  id,
  initialX,
  initialY,
  onUpdate,
  isActive,
  onFocus,
  parentRef
}: UseDraggableProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only drag with primary button
      if (e.button !== 0) return;
      
      e.stopPropagation();
      e.preventDefault(); // Prevent text selection
      
      onFocus();
      
      if (parentRef.current) {
        const parentRect = parentRef.current.getBoundingClientRect();
        
        // Calculate offset from the top-left of the window being dragged
        // We use percentages relative to parent
        const clientX = e.clientX;
        const clientY = e.clientY;
        
        // Convert mouse position to percentage within parent
        const mouseXPercent = ((clientX - parentRect.left) / parentRect.width) * 100;
        const mouseYPercent = ((clientY - parentRect.top) / parentRect.height) * 100;
        
        setDragOffset({
          x: mouseXPercent - initialX,
          y: mouseYPercent - initialY
        });
        
        setIsDragging(true);
      }
    },
    [initialX, initialY, onFocus, parentRef]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!parentRef.current) return;
      
      const parentRect = parentRef.current.getBoundingClientRect();
      const mouseXPercent = ((e.clientX - parentRect.left) / parentRect.width) * 100;
      const mouseYPercent = ((e.clientY - parentRect.top) / parentRect.height) * 100;

      let newX = mouseXPercent - dragOffset.x;
      let newY = mouseYPercent - dragOffset.y;

      // Basic constraints (magnetic snap feel at edges)
      const snapThreshold = 1; // 1%
      if (Math.abs(newX) < snapThreshold) newX = 0;
      if (Math.abs(newY) < snapThreshold) newY = 0;
      if (Math.abs(newX - (100 - 0)) < snapThreshold) newX = 90; // Just loose bounds

      onUpdate(id, newX, newY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragOffset, id, onUpdate, parentRef]);

  return { isDragging, handlePointerDown };
};
