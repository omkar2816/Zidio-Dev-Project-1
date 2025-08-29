import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useScrollDebug } from '../hooks/useScrollDebug';

const ScrollDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollInfo = useScrollDebug();

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 left-4 z-[9999] p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Scroll Debug"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-4 bottom-36 z-[9998] w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Bug className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Scroll Debug</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {/* Basic Scroll Info */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Page Y Offset:</span> {scrollInfo.pageYOffset}px
                </div>
                <div className="text-sm">
                  <span className="font-medium">Document Height:</span> {scrollInfo.documentHeight}px
                </div>
                <div className="text-sm">
                  <span className="font-medium">Window Height:</span> {scrollInfo.windowHeight}px
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lenis Status:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    scrollInfo.lenisEnabled 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {scrollInfo.lenisEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Scrollable Elements */}
              <div>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-900 dark:text-white py-2"
                >
                  <span>Scrollable Elements ({scrollInfo.scrollableElements.length})</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {scrollInfo.scrollableElements.length === 0 ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 py-2">
                          No conflicting scroll containers found
                        </div>
                      ) : (
                        scrollInfo.scrollableElements.map((el, index) => (
                          <div
                            key={index}
                            className="text-xs bg-gray-100 dark:bg-gray-700 rounded p-2"
                          >
                            <div className="font-medium">{el.tagName}</div>
                            {el.className && (
                              <div className="text-gray-600 dark:text-gray-400">
                                Class: {el.className.substring(0, 50)}...
                              </div>
                            )}
                            <div className="text-gray-600 dark:text-gray-400">
                              Height: {el.scrollHeight}px / {el.clientHeight}px
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Overflow: {el.overflowY}
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Fixes */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium mb-2">Quick Tests:</div>
                <div className="space-y-2">
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full text-left text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-2 py-1 hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    Test Native Scroll to Top
                  </button>
                  <button
                    onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}
                    className="w-full text-left text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-2 py-1 hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    Test Native Scroll Down
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollDebugPanel;
