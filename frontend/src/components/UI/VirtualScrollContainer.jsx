import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, Mouse } from 'lucide-react';

const VirtualScrollContainer = ({ 
  items, 
  renderItem, 
  itemHeight = 120, 
  containerHeight = 400, 
  overscan = 3,
  className = '',
  enableMouseWheel = true,
  scrollSpeed = 3
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastWheelEventRef = useRef(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + overscan, items.length - 1);

  const visibleItems = [];
  for (let i = Math.max(0, startIndex - overscan); i <= endIndex; i++) {
    if (items[i]) {
      visibleItems.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          width: '100%',
        }
      });
    }
  }

  // Enhanced mouse wheel handler with smooth scrolling
  const handleWheel = useCallback((e) => {
    if (!enableMouseWheel) return;
    
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const deltaY = e.deltaY;
    
    // Smooth scroll calculation
    const scrollDelta = deltaY * scrollSpeed;
    
    setScrollTop(prevScrollTop => {
      const newScrollTop = Math.max(0, Math.min(
        totalHeight - containerHeight,
        prevScrollTop + scrollDelta
      ));
      return newScrollTop;
    });

    setIsScrolling(true);
    lastWheelEventRef.current = now;

    // Clear existing timeout and set new one
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [enableMouseWheel, scrollSpeed, totalHeight, containerHeight]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setScrollTop(prev => Math.max(0, prev - itemHeight));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setScrollTop(prev => Math.min(totalHeight - containerHeight, prev + itemHeight));
        break;
      case 'PageUp':
        e.preventDefault();
        setScrollTop(prev => Math.max(0, prev - containerHeight));
        break;
      case 'PageDown':
        e.preventDefault();
        setScrollTop(prev => Math.min(totalHeight - containerHeight, prev + containerHeight));
        break;
      case 'Home':
        e.preventDefault();
        setScrollTop(0);
        break;
      case 'End':
        e.preventDefault();
        setScrollTop(totalHeight - containerHeight);
        break;
    }
  }, [itemHeight, containerHeight, totalHeight]);

  // Touch support for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.targetTouches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    setTouchEnd(e.targetTouches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const threshold = 50;

    if (Math.abs(distance) > threshold) {
      const scrollDelta = distance * 2;
      setScrollTop(prevScrollTop => {
        const newScrollTop = Math.max(0, Math.min(
          totalHeight - containerHeight,
          prevScrollTop + scrollDelta
        ));
        return newScrollTop;
      });
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, totalHeight, containerHeight]);

  // Scroll bar calculations
  const scrollBarHeight = Math.max(20, (containerHeight / totalHeight) * containerHeight);
  const scrollBarTop = (scrollTop / (totalHeight - containerHeight)) * (containerHeight - scrollBarHeight);

  // Handle scroll bar drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScrollTop, setDragStartScrollTop] = useState(0);

  const handleScrollBarMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartScrollTop(scrollTop);
  }, [scrollTop]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaY = e.clientY - dragStartY;
    const scrollRatio = deltaY / (containerHeight - scrollBarHeight);
    const newScrollTop = Math.max(0, Math.min(
      totalHeight - containerHeight,
      dragStartScrollTop + scrollRatio * (totalHeight - containerHeight)
    ));

    setScrollTop(newScrollTop);
  }, [isDragging, dragStartY, dragStartScrollTop, containerHeight, scrollBarHeight, totalHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Navigation buttons
  const scrollToTop = () => setScrollTop(0);
  const scrollToBottom = () => setScrollTop(totalHeight - containerHeight);
  const scrollUp = () => setScrollTop(prev => Math.max(0, prev - itemHeight * 3));
  const scrollDown = () => setScrollTop(prev => Math.min(totalHeight - containerHeight, prev + itemHeight * 3));

  return (
    <div className={`relative ${className}`}>
      {/* Virtual scroll container */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden focus:outline-none border border-gray-200 rounded-lg ${
          isScrolling ? 'select-none' : ''
        }`}
        style={{ height: containerHeight }}
        tabIndex={0}
        role="listbox"
        aria-label="Virtual scrollable list"
      >
        {/* Total height container for scrolling calculation */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items */}
          {visibleItems.map(({ index, item, style }) => (
            <div key={index} style={style}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>

        {/* Custom scrollbar */}
        {totalHeight > containerHeight && (
          <div className="absolute right-0 top-0 w-3 h-full bg-gray-100 bg-opacity-50 hover:bg-opacity-75 transition-all">
            <div
              className={`absolute right-0 w-full bg-gray-400 rounded cursor-pointer transition-colors ${
                isDragging ? 'bg-gray-600' : 'hover:bg-gray-500'
              }`}
              style={{
                height: scrollBarHeight,
                top: scrollBarTop,
                minHeight: '20px'
              }}
              onMouseDown={handleScrollBarMouseDown}
            />
          </div>
        )}

        {/* Scroll indicators */}
        {isScrolling && (
          <div className="absolute top-2 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-75 hover:opacity-100 transition-opacity">
        <button
          onClick={scrollToTop}
          className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Scroll to top"
          disabled={scrollTop === 0}
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={scrollUp}
          className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Scroll up"
          disabled={scrollTop === 0}
        >
          <ChevronUp size={12} />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 flex flex-col gap-1 opacity-75 hover:opacity-100 transition-opacity">
        <button
          onClick={scrollDown}
          className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Scroll down"
          disabled={scrollTop >= totalHeight - containerHeight}
        >
          <ChevronDown size={12} />
        </button>
        <button
          onClick={scrollToBottom}
          className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Scroll to bottom"
          disabled={scrollTop >= totalHeight - containerHeight}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Mouse wheel indicator */}
      {enableMouseWheel && (
        <div className="absolute bottom-2 right-4 flex items-center gap-1 text-xs text-gray-500">
          <Mouse size={12} />
          <span>Scroll enabled</span>
        </div>
      )}

      {/* Status info */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>
          Showing {Math.max(0, startIndex - overscan) + 1}-{Math.min(endIndex + 1, items.length)} of {items.length} items
        </span>
        <span>
          {Math.round((scrollTop / Math.max(1, totalHeight - containerHeight)) * 100)}% scrolled
        </span>
      </div>
    </div>
  );
};

export default VirtualScrollContainer;
