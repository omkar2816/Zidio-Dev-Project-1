import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Settings2, Palette, BarChart3, LineChart, PieChart, ScatterChart, Activity, TrendingUp, Radar, Histogram } from 'lucide-react';
import { CHART_COLORS } from '../../utils/chartUtils';

const ChartConfigModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  data = [], 
  currentConfig = {} 
}) => {
  const [config, setConfig] = useState({
    chartType: 'bar',
    title: 'Chart',
    xAxis: null,
    yAxis: null,
    series: null,
    colorScheme: 'emerald',
    showLegend: true,
    showTooltip: true,
    animation: true,
    ...currentConfig
  });

  useEffect(() => {
    if (isOpen) {
      setConfig(prev => ({ ...prev, ...currentConfig }));
    }
  }, [isOpen, currentConfig]);

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
    { value: 'area', label: 'Area Chart', icon: Activity, description: 'Show cumulative values' },
    { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
    { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart, description: 'Show relationship between variables' },
    { value: 'bubble', label: 'Bubble Chart', icon: ScatterChart, description: 'Three-dimensional scatter plot' },
    { value: 'histogram', label: 'Histogram', icon: Histogram, description: 'Show distribution of data' },
    { value: 'box', label: 'Box Plot', icon: TrendingUp, description: 'Show data distribution statistics' },
    { value: 'radar', label: 'Radar Chart', icon: Radar, description: 'Compare multiple metrics' }
  ];

  const colorSchemes = [
    { value: 'emerald', label: 'Emerald', colors: CHART_COLORS },
    { value: 'blue', label: 'Blue', colors: { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' } },
    { value: 'purple', label: 'Purple', colors: { primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD' } },
    { value: 'rose', label: 'Rose', colors: { primary: '#F43F5E', secondary: '#FB7185', accent: '#FDA4AF' } },
    { value: 'amber', label: 'Amber', colors: { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FCD34D' } }
  ];

  // Get column names from data
  const getColumns = () => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const getNumericColumns = () => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(key => {
      const value = data[0][key];
      return !isNaN(parseFloat(value)) && isFinite(value);
    });
  };

  const getCategoricalColumns = () => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(key => {
      const value = data[0][key];
      return isNaN(parseFloat(value)) || !isFinite(value);
    });
  };

  const handleApply = () => {
    onApply(config);
    onClose();
  };

  const isValidConfig = () => {
    if (!config.chartType) return false;
    
    switch (config.chartType) {
      case 'pie':
        return config.xAxis && config.yAxis;
      case 'histogram':
      case 'box':
        return config.xAxis;
      case 'radar':
        return config.series && config.yAxis;
      default:
        return config.xAxis && config.yAxis;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings2 className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chart Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                Chart Type
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {chartTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setConfig(prev => ({ ...prev, chartType: type.value }))}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        config.chartType === type.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className={`w-5 h-5 ${
                          config.chartType === type.value ? 'text-emerald-600' : 'text-gray-500'
                        }`} />
                        <span className={`font-medium ${
                          config.chartType === type.value 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Data Configuration
              </h3>
              
              {/* Chart Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chart Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter chart title"
                />
              </div>

              {/* X-Axis */}
              {!['box'].includes(config.chartType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    X-Axis {config.chartType === 'histogram' ? '(Data Column)' : '(Categories)'}
                  </label>
                  <select
                    value={config.xAxis || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select column</option>
                    {(config.chartType === 'histogram' ? getNumericColumns() : getColumns()).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Y-Axis */}
              {!['pie', 'histogram'].includes(config.chartType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Y-Axis {config.chartType === 'box' ? '(Data Column)' : '(Values)'}
                  </label>
                  <select
                    value={config.yAxis || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select column</option>
                    {getNumericColumns().map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Value Column for Pie Chart */}
              {config.chartType === 'pie' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Value Column
                  </label>
                  <select
                    value={config.yAxis || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select column</option>
                    {getNumericColumns().map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Series (for multi-series charts) */}
              {['bar', 'line', 'area', 'scatter', 'bubble', 'radar'].includes(config.chartType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Series Column (Optional)
                  </label>
                  <select
                    value={config.series || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, series: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">None (single series)</option>
                    {getCategoricalColumns().map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Style Configuration */}
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Palette className="w-5 h-5 mr-2 text-emerald-500" />
              Style & Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Scheme
                </label>
                <select
                  value={config.colorScheme}
                  onChange={(e) => setConfig(prev => ({ ...prev, colorScheme: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                >
                  {colorSchemes.map(scheme => (
                    <option key={scheme.value} value={scheme.value}>
                      {scheme.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Legend */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showLegend"
                  checked={config.showLegend}
                  onChange={(e) => setConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="showLegend" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show Legend
                </label>
              </div>

              {/* Show Tooltip */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTooltip"
                  checked={config.showTooltip}
                  onChange={(e) => setConfig(prev => ({ ...prev, showTooltip: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="showTooltip" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show Tooltip
                </label>
              </div>

              {/* Animation */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="animation"
                  checked={config.animation}
                  onChange={(e) => setConfig(prev => ({ ...prev, animation: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="animation" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable Animation
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {!isValidConfig() && (
              <span className="text-red-500">Please configure required fields</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!isValidConfig()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartConfigModal;
