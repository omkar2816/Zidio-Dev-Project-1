import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart3 } from 'lucide-react';

const Charts = () => {
  const { chartHistory } = useSelector((state) => state.analytics);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Charts History</h2>
        {chartHistory && chartHistory.length > 0 ? (
          <div className="space-y-3">
            {chartHistory.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">{c.type} chart</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.title || 'Untitled'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">No data available.</div>
        )}
      </div>
    </div>
  );
};

export default Charts;


