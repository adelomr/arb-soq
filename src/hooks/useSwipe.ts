'use client';

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // minimum px to register a swipe (default 50)
}

/**
 * Returns touch event handlers to attach to any element.
 * Usage:
 *   const swipe = useSwipe({ onSwipeLeft: handleNext, onSwipeRight: handlePrev });
 *   <div {...swipe.handlers}>...</div>
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeHandlers) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Only register horizontal swipes (ignore vertical scrolls)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX < 0) {
          // Swiped left → next (in RTL: previous)
          onSwipeLeft?.();
        } else {
          // Swiped right → previous (in RTL: next)
          onSwipeRight?.();
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return {
    handlers: {
      onTouchStart,
      onTouchEnd,
    },
  };
}
