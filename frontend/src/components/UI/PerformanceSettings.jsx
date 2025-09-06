import React, { useState } from 'react';
import { Settings, Zap, Database, TrendingUp, Info, X } from 'lucide-react';

const PerformanceSettings = ({ 
  isOpen, 
  onClose, 
  settings = {
    enablePerformanceMode: true,
    autoDetectLargeDatasets: true,
    maxDataPoints: {
      line: 1500,
      scatter: 1000,
      scatter3d: 800,
      bar: 100,
      pie: 50
    },
    samplingMethod: 'smart', // 'smart', 'systematic', 'random'
    dataCompleteness: 'medium' // 'basic', 'medium', 'high'
  },
  onSettingsChange 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (path, value) => {
    const newSettings = { ...localSettings };
    const keys = path.split('.');
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLocalSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const getCompleteneessMultiplier = (level) => {
    switch (level) {
      case 'basic': return 0.1;
      case 'medium': return 0.3;
      case 'high': return 0.7;
      default: return 0.3;
    }
  };

  const getEstimatedDataPoints = (chartType, totalRows) => {
    const baseLimit = localSettings.maxDataPoints[chartType] || 1000;
    const completenessMultiplier = getCompleteneessMultiplier(localSettings.dataCompleteness);
    return Math.min(baseLimit, Math.floor(totalRows * completenessMultiplier));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chart Performance Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Optimize chart rendering for large datasets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Performance Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Enable Performance Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically optimize charts for large datasets
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enablePerformanceMode}
                onChange={(e) => handleChange('enablePerformanceMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Auto-detect Large Datasets */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Auto-detect Large Datasets</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically enable sampling for datasets over 1,000 rows
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.autoDetectLargeDatasets}
                onChange={(e) => handleChange('autoDetectLargeDatasets', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Data Completeness Level */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Data Completeness Level</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Balance between data detail and performance
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {['basic', 'medium', 'high'].map((level) => (
                <label key={level} className="relative">
                  <input
                    type="radio"
                    name="dataCompleteness"
                    value={level}
                    checked={localSettings.dataCompleteness === level}
                    onChange={(e) => handleChange('dataCompleteness', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    localSettings.dataCompleteness === level
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                    <div className="text-center">
                      <div className="font-medium text-gray-900 dark:text-white capitalize">{level}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {level === 'basic' && '~10% of data'}
                        {level === 'medium' && '~30% of data'}
                        {level === 'high' && '~70% of data'}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Maximum Data Points per Chart Type */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Maximum Data Points by Chart Type</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize limits for optimal performance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(localSettings.maxDataPoints).map(([chartType, value]) => (
                <div key={chartType} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {chartType} Charts
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(`maxDataPoints.${chartType}`, parseInt(e.target.value) || 100)}
                    min="50"
                    max="5000"
                    step="50"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended: {chartType === 'line' ? '1000-2000' : chartType === 'scatter' ? '500-1500' : chartType === 'scatter3d' ? '200-1000' : '50-200'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Preview */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600 dark:text-blue-400">10K Dataset</div>
                <div className="text-gray-500 dark:text-gray-400">
                  ~{getEstimatedDataPoints('line', 10000)} points
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600 dark:text-green-400">50K Dataset</div>
                <div className="text-gray-500 dark:text-gray-400">
                  ~{getEstimatedDataPoints('scatter', 50000)} points
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600 dark:text-purple-400">100K Dataset</div>
                <div className="text-gray-500 dark:text-gray-400">
                  ~{getEstimatedDataPoints('bar', 100000)} points
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600 dark:text-orange-400">Performance</div>
                <div className="text-gray-500 dark:text-gray-400">
                  {localSettings.dataCompleteness === 'high' ? 'Detailed' : 
                   localSettings.dataCompleteness === 'medium' ? 'Balanced' : 'Fast'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Reset to defaults
              const defaultSettings = {
                enablePerformanceMode: true,
                autoDetectLargeDatasets: true,
                maxDataPoints: {
                  line: 1500,
                  scatter: 1000,
                  scatter3d: 800,
                  bar: 100,
                  pie: 50
                },
                samplingMethod: 'smart',
                dataCompleteness: 'medium'
              };
              setLocalSettings(defaultSettings);
              onSettingsChange?.(defaultSettings);
            }}
            className="px-4 py-2 text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceSettings;
