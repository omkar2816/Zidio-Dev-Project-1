import React, { useState, useEffect } from 'react';
import { Plus, BarChart3 } from 'lucide-react';

// Temporary simplified version to test
const AdvancedChartDashboard = ({ 
  data = [], 
  autoConfigRecommendations = null,
  onApplyRecommendation = null,
  className = '' 
}) => {
  const [charts, setCharts] = useState([]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Simple Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chart Dashboard (Testing)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Simplified version for debugging
            </p>
          </div>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chart</span>
          </button>
        </div>
      </div>

      {/* Simple content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-12">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Dashboard is Working
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Data rows: {data?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChartDashboard;
