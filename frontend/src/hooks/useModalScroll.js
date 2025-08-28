import { useEffect, useRef } from 'react';

export const useModalScroll = (isOpen) => {
  const modalContentRef = useRef(null);

  useEffect(() => {
    const modalContent = modalContentRef.current;
    if (!modalContent || !isOpen) return;

    const handleWheel = (e) => {
      // Always stop propagation to prevent Lenis from interfering
      e.stopPropagation();
      
      const { scrollTop, scrollHeight, clientHeight } = modalContent;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      
      // Only prevent default if we're at scroll boundaries
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    const handleTouchStart = (e) => {
      e.stopPropagation();
    };

    const handleTouchMove = (e) => {
      e.stopPropagation();
      
      const touch = e.touches[0];
      const { scrollTop, scrollHeight, clientHeight } = modalContent;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      
      // Allow scrolling within the modal bounds
      if (!isAtTop && !isAtBottom) {
        return;
      }
    };

    const handleKeyDown = (e) => {
      // Handle keyboard scrolling (arrow keys, page up/down, home/end)
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        e.stopPropagation();
      }
    };

    // Add event listeners with proper options
    modalContent.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    modalContent.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    modalContent.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    modalContent.addEventListener('keydown', handleKeyDown, { passive: true, capture: true });

    // Also prevent wheel events on the modal container itself
    const preventWheelBubbling = (e) => {
      e.stopPropagation();
    };
    
    const modalContainer = modalContent.closest('[role="dialog"]');
    if (modalContainer) {
      modalContainer.addEventListener('wheel', preventWheelBubbling, { passive: false, capture: true });
    }

    // Cleanup
    return () => {
      modalContent.removeEventListener('wheel', handleWheel, { capture: true });
      modalContent.removeEventListener('touchstart', handleTouchStart, { capture: true });
      modalContent.removeEventListener('touchmove', handleTouchMove, { capture: true });
      modalContent.removeEventListener('keydown', handleKeyDown, { capture: true });
      
      if (modalContainer) {
        modalContainer.removeEventListener('wheel', preventWheelBubbling, { capture: true });
      }
    };
  }, [isOpen]);

  return modalContentRef;
};

export default useModalScroll;
