// Virtual Scrolling Manager
// Efficient virtual scrolling with full mouse wheel support for large datasets

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export const useVirtualScrolling = ({
  data = [],
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5,
  enableMouseWheel = true,
  scrollSensitivity = 3
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, data.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return data.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index,
      key: `${startIndex + index}`,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [data, visibleRange, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((event) => {
    const target = event.target;
    const newScrollTop = target.scrollTop;
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Enhanced mouse wheel handling
  const handleWheel = useCallback((event) => {
    if (!enableMouseWheel) return;
    
    event.preventDefault();
    
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    // Calculate scroll delta with sensitivity
    const deltaY = event.deltaY * scrollSensitivity;
    const newScrollTop = Math.max(
      0,
      Math.min(
        scrollElement.scrollHeight - scrollElement.clientHeight,
        scrollElement.scrollTop + deltaY
      )
    );

    // Smooth scrolling
    scrollElement.scrollTo({
      top: newScrollTop,
      behavior: 'smooth'
    });
  }, [enableMouseWheel, scrollSensitivity]);

  // Scroll to index
  const scrollToIndex = useCallback((index) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [itemHeight]);

  // Scroll to item
  const scrollToItem = useCallback((predicate) => {
    const index = data.findIndex(predicate);
    if (index !== -1) {
      scrollToIndex(index);
    }
  }, [data, scrollToIndex]);

  // Setup event listeners
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      scrollElement.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    containerRef,
    scrollElementRef,
    visibleItems,
    visibleRange,
    isScrolling,
    scrollTop,
    handleScroll,
    scrollToIndex,
    scrollToItem,
    totalHeight: data.length * itemHeight,
    containerHeight
  };
};

// Virtual Scrolling Container Component
export const VirtualScrollContainer = ({ 
  children, 
  className = '', 
  style = {},
  data = [],
  itemHeight = 50,
  height = 400,
  overscan = 5,
  enableMouseWheel = true,
  scrollSensitivity = 3,
  onScroll,
  renderItem,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  isLoading = false
}) => {
  const {
    containerRef,
    scrollElementRef,
    visibleItems,
    isScrolling,
    handleScroll,
    totalHeight,
    scrollToIndex,
    scrollToItem
  } = useVirtualScrolling({
    data,
    itemHeight,
    containerHeight: height,
    overscan,
    enableMouseWheel,
    scrollSensitivity
  });

  // Handle external scroll events
  const handleScrollEvent = useCallback((event) => {
    handleScroll(event);
    onScroll?.(event);
  }, [handleScroll, onScroll]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (visibleItems.length > 0) {
          scrollToIndex(Math.max(0, visibleItems[0].index - 1));
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (visibleItems.length > 0) {
          scrollToIndex(Math.min(data.length - 1, visibleItems[visibleItems.length - 1].index + 1));
        }
        break;
      case 'Home':
        event.preventDefault();
        scrollToIndex(0);
        break;
      case 'End':
        event.preventDefault();
        scrollToIndex(data.length - 1);
        break;
      case 'PageUp':
        event.preventDefault();
        scrollToIndex(Math.max(0, (visibleItems[0]?.index || 0) - Math.floor(height / itemHeight)));
        break;
      case 'PageDown':
        event.preventDefault();
        scrollToIndex(Math.min(data.length - 1, (visibleItems[0]?.index || 0) + Math.floor(height / itemHeight)));
        break;
    }
  }, [visibleItems, data.length, height, itemHeight, scrollToIndex]);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-gray-400">{loadingMessage}</div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-gray-400">{emptyMessage}</div>
        </div>
      ) : (
        <div
          ref={scrollElementRef}
          className="virtual-scroll-area"
          style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          onScroll={handleScrollEvent}
        >
          {/* Virtual spacer to maintain scroll height */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleItems.map((item) => (
              <div key={item.key} style={item.style}>
                {renderItem ? renderItem(item, item.index) : (
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    Item {item.index}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Scroll indicator */}
      {isScrolling && data.length > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {Math.floor((visibleItems[0]?.index || 0) / data.length * 100)}%
        </div>
      )}
    </div>
  );
};

// Virtual Table Component for Data Display
export const VirtualTable = ({
  data = [],
  columns = [],
  height = 400,
  headerHeight = 40,
  rowHeight = 35,
  className = '',
  onRowClick,
  selectedRows = new Set(),
  enableSelection = false,
  enableMouseWheel = true,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
  emptyMessage = 'No data to display'
}) => {
  const [localSortColumn, setLocalSortColumn] = useState(sortColumn);
  const [localSortDirection, setLocalSortDirection] = useState(sortDirection);

  // Sort data locally if no external sort handler
  const sortedData = useMemo(() => {
    if (!localSortColumn || !columns.find(col => col.key === localSortColumn)) {
      return data;
    }

    const column = columns.find(col => col.key === localSortColumn);
    return [...data].sort((a, b) => {
      let aVal = a[localSortColumn];
      let bVal = b[localSortColumn];

      // Handle different data types
      if (column.type === 'number') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (column.type === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return localSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return localSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, localSortColumn, localSortDirection, columns]);

  const handleSort = useCallback((columnKey) => {
    if (onSort) {
      onSort(columnKey, localSortColumn === columnKey && localSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      const newDirection = localSortColumn === columnKey && localSortDirection === 'asc' ? 'desc' : 'asc';
      setLocalSortColumn(columnKey);
      setLocalSortDirection(newDirection);
    }
  }, [localSortColumn, localSortDirection, onSort]);

  const renderTableRow = useCallback((item, index) => (
    <div
      className={`
        flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
        ${selectedRows.has(index) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
      onClick={() => onRowClick?.(item, index)}
    >
      {enableSelection && (
        <div className="w-10 flex justify-center">
          <input
            type="checkbox"
            checked={selectedRows.has(index)}
            onChange={() => {}}
            className="rounded"
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          style={{ 
            width: column.width || `${100 / columns.length}%`,
            minWidth: column.minWidth || 100
          }}
        >
          {column.render ? column.render(item[column.key], item, index) : item[column.key]}
        </div>
      ))}
    </div>
  ), [columns, selectedRows, enableSelection, onRowClick]);

  return (
    <div className={`virtual-table ${className}`}>
      {/* Table Header */}
      <div 
        className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        style={{ height: headerHeight }}
      >
        {enableSelection && (
          <div className="w-10 flex justify-center">
            <input type="checkbox" className="rounded" />
          </div>
        )}
        {columns.map((column) => (
          <div
            key={column.key}
            className={`
              px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
              ${localSortColumn === column.key ? 'bg-gray-100 dark:bg-gray-700' : ''}
            `}
            style={{ 
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.minWidth || 100
            }}
            onClick={() => column.sortable !== false && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.title}</span>
              {column.sortable !== false && localSortColumn === column.key && (
                <span className="text-gray-400">
                  {localSortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Virtual Scrolling Table Body */}
      <VirtualScrollContainer
        data={sortedData}
        height={height - headerHeight}
        itemHeight={rowHeight}
        renderItem={renderTableRow}
        enableMouseWheel={enableMouseWheel}
        emptyMessage={emptyMessage}
        className="border border-gray-200 dark:border-gray-700"
      />
    </div>
  );
};

export default {
  useVirtualScrolling,
  VirtualScrollContainer,
  VirtualTable
};
