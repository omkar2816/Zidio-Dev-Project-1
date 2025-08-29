import { useEffect, useState } from 'react';
import { useLenisContext } from '../components/LenisProvider';

export const useScrollDebug = () => {
  const [scrollInfo, setScrollInfo] = useState({
    pageYOffset: 0,
    documentHeight: 0,
    windowHeight: 0,
    lenisEnabled: false,
    scrollableElements: []
  });

  const { lenis } = useLenisContext();

  useEffect(() => {
    const updateScrollInfo = () => {
      // Find all scrollable elements
      const scrollableElements = [];
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const hasVerticalScroll = el.scrollHeight > el.clientHeight;
        const hasOverflowY = ['auto', 'scroll'].includes(style.overflowY);
        
        if (hasVerticalScroll && hasOverflowY) {
          scrollableElements.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            overflowY: style.overflowY
          });
        }
      });

      setScrollInfo({
        pageYOffset: window.pageYOffset,
        documentHeight: document.documentElement.scrollHeight,
        windowHeight: window.innerHeight,
        lenisEnabled: !!lenis,
        scrollableElements
      });
    };

    updateScrollInfo();
    
    // Update on scroll and resize
    window.addEventListener('scroll', updateScrollInfo, { passive: true });
    window.addEventListener('resize', updateScrollInfo, { passive: true });
    
    // Update every second to catch changes
    const interval = setInterval(updateScrollInfo, 1000);

    return () => {
      window.removeEventListener('scroll', updateScrollInfo);
      window.removeEventListener('resize', updateScrollInfo);
      clearInterval(interval);
    };
  }, [lenis]);

  return scrollInfo;
};

export default useScrollDebug;
