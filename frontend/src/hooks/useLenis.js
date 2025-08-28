import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export const useLenis = (options = {}, isModalOpen = false) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis with smooth scrolling configuration
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false, // Disable on touch devices for better mobile performance
      wheelMultiplier: 1,
      touchMultiplier: 2,
      normalizeWheel: true,
      ...options
    });

    lenisRef.current = lenis;

    // Animation frame for smooth scrolling
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      lenis.destroy();
    };
  }, []);

  // Update Lenis configuration when modal state changes
  useEffect(() => {
    if (lenisRef.current) {
      if (isModalOpen) {
        // Stop Lenis when modal is open and prevent wheel events on body
        lenisRef.current.stop();
        document.body.style.pointerEvents = 'none';
        // Find modal elements and allow pointer events
        const modals = document.querySelectorAll('[role="dialog"], .modal-content');
        modals.forEach(modal => {
          modal.style.pointerEvents = 'auto';
        });
      } else {
        // Start Lenis when modal is closed and restore pointer events
        lenisRef.current.start();
        document.body.style.pointerEvents = 'auto';
      }
    }
  }, [isModalOpen]);

  // Scroll to top function
  const scrollToTop = () => {
    lenisRef.current?.scrollTo(0, {
      duration: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });
  };

  // Scroll to element function
  const scrollToElement = (element, options = {}) => {
    lenisRef.current?.scrollTo(element, {
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      ...options
    });
  };

  // Scroll by amount function
  const scrollBy = (amount, options = {}) => {
    lenisRef.current?.scrollTo(window.scrollY + amount, {
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      ...options
    });
  };

  return {
    lenis: lenisRef.current,
    scrollToTop,
    scrollToElement,
    scrollBy
  };
};

export default useLenis;
