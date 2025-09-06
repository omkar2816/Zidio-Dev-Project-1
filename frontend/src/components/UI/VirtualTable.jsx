import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Edit3, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const VirtualTable = ({ 
  data, 
  onDataChange, 
  editingCell, 
  onCellClick, 
  onCellChange, 
  onCellSave, 
  onCellCancel 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  
  // Configuration
  const ITEM_HEIGHT = 41; // Height of each row in pixels
  const CONTAINER_HEIGHT = window.innerHeight * 0.8; // 80vh
  const OVERSCAN = 10; // Number of items to render outside visible area
  
  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT),
    data.length
  );
  
  // Add overscan
  const startIndex = Math.max(0, visibleStart - OVERSCAN);
  const endIndex = Math.min(data.length, visibleEnd + OVERSCAN);
  
  // Get visible items
  const visibleItems = useMemo(() => {
    return data.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      originalIndex: startIndex + index
    }));
  }, [data, startIndex, endIndex]);
  
  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  // Delete row handler
  const handleDeleteRow = useCallback((rowIndex) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    onDataChange(newData);
    toast.success('Row deleted');
  }, [data, onDataChange]);
  
  // Get headers from first row
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Performance indicator */}
      <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800 dark:text-blue-200">
            📊 Virtual scrolling enabled for {data.length.toLocaleString()} rows
          </span>
          <span className="text-blue-600 dark:text-blue-400">
            Showing rows {startIndex + 1}-{endIndex} of {data.length}
          </span>
        </div>
      </div>
      
      {/* Table container */}
      <div 
        ref={containerRef}
        className="overflow-auto enhanced-table-scroll"
        style={{ 
          height: CONTAINER_HEIGHT,
          overflowY: 'auto',
          overflowX: 'auto'
        }}
        onScroll={handleScroll}
      >
        {/* Virtual scrolling container */}
        <div style={{ height: data.length * ITEM_HEIGHT, position: 'relative' }}>
          {/* Sticky header */}
          <div 
            className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-700"
            style={{ height: ITEM_HEIGHT }}
          >
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                    #
                  </th>
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-32">
                      {header}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          
          {/* Virtual rows */}
          <div 
            style={{ 
              position: 'absolute',
              top: (startIndex * ITEM_HEIGHT) + ITEM_HEIGHT, // +ITEM_HEIGHT for header
              width: '100%'
            }}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {visibleItems.map((row, index) => {
                  const rowIndex = row.originalIndex;
                  return (
                    <tr 
                      key={rowIndex} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                      style={{ height: ITEM_HEIGHT }}
                    >
                      <td className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {rowIndex + 1}
                      </td>
                      {headers.map((columnKey, cellIndex) => {
                        const value = row[columnKey];
                        return (
                          <td key={cellIndex} className="px-4 py-2 relative group">
                            {editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  defaultValue={String(value)}
                                  className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      onCellChange(rowIndex, columnKey, e.target.value);
                                      onCellSave();
                                    } else if (e.key === 'Escape') {
                                      onCellCancel();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    onCellChange(rowIndex, columnKey, e.target.value);
                                    onCellSave();
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div
                                className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors min-h-6 flex items-center"
                                onClick={() => onCellClick(rowIndex, columnKey)}
                                title="Click to edit"
                              >
                                {String(value)}
                                <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDeleteRow(rowIndex)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete row"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            💡 Virtual scrolling: Only visible rows are rendered for optimal performance
          </span>
          <span>
            Scroll position: {Math.round((scrollTop / (data.length * ITEM_HEIGHT)) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default VirtualTable;
