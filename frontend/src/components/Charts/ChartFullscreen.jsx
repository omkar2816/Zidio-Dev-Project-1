import React, { useState } from 'react';
import ChartRenderer from './ChartRenderer';
import { X, Maximize2, Minimize2 } from 'lucide-react';

const ChartFullscreen = ({ chart, onClose, preferences, onPreferencesChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!chart) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-96 h-64' : 'w-full h-full max-w-7xl max-h-[95vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {chart.title} - Fullscreen View
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chart Content */}
        {!isMinimized && (
          <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 80px)' }}>
            <ChartRenderer
              chart={chart}
              chartId={`fullscreen_${chart.id}`}
              preferences={preferences}
              onPreferencesChange={onPreferencesChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartFullscreen;
