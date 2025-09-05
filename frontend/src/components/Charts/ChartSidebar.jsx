import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronDown, 
  BarChart3, 
  LineChart, 
  PieChart, 
  ScatterChart, 
  Activity, 
  TrendingUp,
  Palette,
  Settings2,
  Filter,
  Layers
} from 'lucide-react';

const ChartSidebar = ({ 
  isOpen, 
  onClose, 
  data = [], 
  onApplyConfig,
  initialConfig = {}
}) => {
  // Default chart titles based on chart type
  const getDefaultTitle = (chartType) => {
    const titleMap = {
      bar: 'Bar Chart',
      line: 'Line Chart',
      area: 'Area Chart',
      pie: 'Pie Chart',
      scatter: 'Scatter Plot',
      bubble: 'Bubble Chart',
      histogram: 'Histogram',
      box: 'Box Plot',
      radar: 'Radar Chart'
    };
    return titleMap[chartType] || 'Chart';
  };

  const [config, setConfig] = useState({
    type: 'bar',
    title: getDefaultTitle('bar'),
    xAxis: '',
    yAxis: '',
    series: '',
    colorScheme: 'emerald',
    showAnimation: true,
    filters: {},
    ...initialConfig
  });

  const [expandedSections, setExpandedSections] = useState({
    chartType: true,
    dataMapping: true,
    styling: true,
    filters: false
  });

  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...initialConfig }));
    }
  }, [initialConfig]);

  // Chart types with descriptions
  const chartTypes = [
    { 
      value: 'bar', 
      label: 'Bar Chart', 
      icon: BarChart3, 
      description: 'Compare values across categories',
      requiredFields: ['xAxis', 'yAxis']
    },
    { 
      value: 'line', 
      label: 'Line Chart', 
      icon: LineChart, 
      description: 'Show trends over time',
      requiredFields: ['xAxis', 'yAxis']
    },
    { 
      value: 'area', 
      label: 'Area Chart', 
      icon: Activity, 
      description: 'Show cumulative values',
      requiredFields: ['xAxis', 'yAxis']
    },
    { 
      value: 'pie', 
      label: 'Pie Chart', 
      icon: PieChart, 
      description: 'Show proportions of a whole',
      requiredFields: ['xAxis', 'yAxis']
    },
    { 
      value: 'scatter', 
      label: 'Scatter Plot', 
      icon: ScatterChart, 
      description: 'Show relationship between variables',
      requiredFields: ['xAxis', 'yAxis']
    },
    { 
      value: 'bubble', 
      label: 'Bubble Chart', 
      icon: ScatterChart, 
      description: 'Three-dimensional scatter plot',
      requiredFields: ['xAxis', 'yAxis', 'series']
    },
    { 
      value: 'histogram', 
      label: 'Histogram', 
      icon: BarChart3, 
      description: 'Show distribution of data',
      requiredFields: ['xAxis']
    },
    { 
      value: 'box', 
      label: 'Box Plot', 
      icon: TrendingUp, 
      description: 'Show data distribution statistics',
      requiredFields: ['xAxis']
    },
    { 
      value: 'radar', 
      label: 'Radar Chart', 
      icon: TrendingUp, 
      description: 'Compare multiple metrics',
      requiredFields: []
    }
  ];

  // Color schemes
  const colorSchemes = [
    { value: 'emerald', label: 'Emerald', preview: '#059669' },
    { value: 'blue', label: 'Blue', preview: '#2563EB' },
    { value: 'purple', label: 'Purple', preview: '#7C3AED' },
    { value: 'rose', label: 'Rose', preview: '#E11D48' },
    { value: 'amber', label: 'Amber', preview: '#D97706' },
    { value: 'cyan', label: 'Cyan', preview: '#0891B2' }
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateConfig = (field, value) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [field]: value
      };
      
      // If chart type changes and title is still default, update title
      if (field === 'type' && prev.title === getDefaultTitle(prev.type)) {
        newConfig.title = getDefaultTitle(value);
      }
      
      return newConfig;
    });
  };

  const isConfigValid = () => {
    const chartType = chartTypes.find(ct => ct.value === config.type);
    if (!chartType) return false;

    return chartType.requiredFields.every(field => config[field]);
  };

  const handleApply = () => {
    if (isConfigValid()) {
      onApplyConfig(config);
      onClose();
    }
  };

  const getUniqueValues = (column) => {
    if (!data || data.length === 0) return [];
    const values = [...new Set(data.map(row => row[column]))].slice(0, 10);
    return values;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="w-96 bg-white dark:bg-gray-800 shadow-2xl flex flex-col max-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-600 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Settings2 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Chart Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          <div className="p-6 space-y-6">
          {/* Chart Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chart Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter chart title"
            />
          </div>

          {/* Chart Type Section */}
          <div>
            <button
              onClick={() => toggleSection('chartType')}
              className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900 dark:text-white">Chart Type</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.chartType ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.chartType && (
              <div className="mt-3 space-y-2">
                {chartTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => updateConfig('type', type.value)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        config.type === type.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-1">
                        <Icon className={`w-4 h-4 ${
                          config.type === type.value ? 'text-emerald-600' : 'text-gray-500'
                        }`} />
                        <span className={`font-medium text-sm ${
                          config.type === type.value 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Data Mapping Section */}
          <div>
            <button
              onClick={() => toggleSection('dataMapping')}
              className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900 dark:text-white">Data Mapping</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.dataMapping ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.dataMapping && (
              <div className="mt-3 space-y-4">
                {/* X-Axis */}
                {!['radar'].includes(config.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      X-Axis {['histogram', 'box'].includes(config.type) ? '(Data Column)' : '(Categories)'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={config.xAxis}
                      onChange={(e) => updateConfig('xAxis', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select column</option>
                      {(['histogram', 'box'].includes(config.type) ? getNumericColumns() : getColumns()).map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Y-Axis */}
                {!['histogram', 'box', 'radar'].includes(config.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Y-Axis (Values)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={config.yAxis}
                      onChange={(e) => updateConfig('yAxis', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select column</option>
                      {getNumericColumns().map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Series */}
                {['bar', 'line', 'area', 'scatter'].includes(config.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Series (Optional)
                    </label>
                    <select
                      value={config.series}
                      onChange={(e) => updateConfig('series', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">None (single series)</option>
                      {getCategoricalColumns().map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bubble Size */}
                {config.type === 'bubble' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bubble Size Column
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={config.series}
                      onChange={(e) => updateConfig('series', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select column</option>
                      {getNumericColumns().map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Styling Section */}
          <div>
            <button
              onClick={() => toggleSection('styling')}
              className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900 dark:text-white">Styling & Animation</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.styling ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.styling && (
              <div className="mt-3 space-y-4">
                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Scheme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorSchemes.map(scheme => (
                      <button
                        key={scheme.value}
                        onClick={() => updateConfig('colorScheme', scheme.value)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all ${
                          config.colorScheme === scheme.value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: scheme.preview }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {scheme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Animation
                  </label>
                  <button
                    onClick={() => updateConfig('showAnimation', !config.showAnimation)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.showAnimation ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.showAnimation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div>
            <button
              onClick={() => toggleSection('filters')}
              className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900 dark:text-white">Data Filters</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.filters ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.filters && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Apply filters to limit the data shown in your chart
                </p>
                
                {getCategoricalColumns().slice(0, 3).map(column => (
                  <div key={column}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {column}
                    </label>
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                      style={{ height: '80px' }}
                    >
                      {getUniqueValues(column).map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-3">
            {!isConfigValid() && (
              <p className="text-sm text-red-500">
                Please fill in all required fields marked with *
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!isConfigValid()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Apply Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSidebar;
