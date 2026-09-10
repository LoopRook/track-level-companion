import { useEffect } from 'react';

// Keep track of how many modals are concurrently open
let activeScrollLocks = 0;

/**
 * Locks document.body and document.documentElement scrolling while isOpen is true.
 * Compatible with mobile Safari, Chrome, and desktop browsers.
 * Uses reference counting so nested or chained modals don't prematurely unlock the body.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    activeScrollLocks++;

    if (activeScrollLocks === 1) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Prevent rubber-band touch dragging of the root document on mobile devices
      document.body.style.touchAction = 'none';
    }

    return () => {
      activeScrollLocks = Math.max(0, activeScrollLocks - 1);
      if (activeScrollLocks === 0) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.touchAction = '';
      }
    };
  }, [isOpen]);
}
