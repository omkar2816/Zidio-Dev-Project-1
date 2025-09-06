import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  Wand2,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

const ChartSidebar = ({ 
  isOpen, 
  onClose, 
  data = [], 
  onApplyConfig,
  initialConfig = {},
  smartRecommendations = []
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
    numericFilters: {},
    autoConfigEnabled: true,
    fullDataset: false, // Add full dataset flag
    extremePerformanceMode: false, // Auto extreme performance mode
    ...initialConfig
  });

  // EXTREME PERFORMANCE MODE - Auto-detection thresholds
  const PERFORMANCE_THRESHOLDS = {
    small: 1000,      // < 1000 rows: normal mode
    medium: 5000,     // 1000-5000 rows: optimized mode
    large: 15000,     // 5000-15000 rows: extreme mode auto-enabled
    massive: 50000    // > 50000 rows: ultra extreme mode
  };

  const [autoExtremeMode, setAutoExtremeMode] = useState(true);
  const [performanceLevel, setPerformanceLevel] = useState('normal');
  const [renderingStrategy, setRenderingStrategy] = useState('standard');

  const [autoConfig, setAutoConfig] = useState(null);
  const [showAutoSuggestions, setShowAutoSuggestions] = useState(false);
  const [filteredData, setFilteredData] = useState(data);
  const [activeFilters, setActiveFilters] = useState({});

  const [expandedSections, setExpandedSections] = useState({
    chartType: true,
    dataMapping: true,
    styling: true,
    filters: false
  });

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...initialConfig }));
    }
  }, [initialConfig]);

  // Auto Extreme Performance Mode Detection
  useEffect(() => {
    if (!autoExtremeMode) return;
    
    const dataSize = filteredData.length;
    let newPerformanceLevel = 'normal';
    let newRenderingStrategy = 'standard';
    let shouldEnableExtremeMode = false;

    if (dataSize >= PERFORMANCE_THRESHOLDS.massive) {
      newPerformanceLevel = 'ultra';
      newRenderingStrategy = 'progressive';
      shouldEnableExtremeMode = true;
    } else if (dataSize >= PERFORMANCE_THRESHOLDS.large) {
      newPerformanceLevel = 'extreme';
      newRenderingStrategy = 'webgl';
      shouldEnableExtremeMode = true;
    } else if (dataSize >= PERFORMANCE_THRESHOLDS.medium) {
      newPerformanceLevel = 'optimized';
      newRenderingStrategy = 'large';
      shouldEnableExtremeMode = false;
    } else {
      newPerformanceLevel = 'normal';
      newRenderingStrategy = 'standard';
      shouldEnableExtremeMode = false;
    }

    setPerformanceLevel(newPerformanceLevel);
    setRenderingStrategy(newRenderingStrategy);
    setConfig(prev => ({
      ...prev,
      extremePerformanceMode: shouldEnableExtremeMode,
      fullDataset: true // Always use full dataset with performance optimizations
    }));
  }, [filteredData.length, autoExtremeMode]);

  // Apply filters to data whenever filters or data changes
  useEffect(() => {
    applyFilters();
  }, [data, activeFilters]);

  // Apply filters to the data
  const applyFilters = () => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data];

    // Apply categorical filters
    Object.entries(activeFilters).forEach(([column, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        filtered = filtered.filter(row => {
          const value = row[column];
          return selectedValues.includes(value);
        });
      }
    });

    // Apply numeric range filters
    Object.entries(config.numericFilters || {}).forEach(([column, range]) => {
      if (range && (range.min !== undefined || range.max !== undefined)) {
        filtered = filtered.filter(row => {
          const value = parseFloat(row[column]);
          if (isNaN(value)) return false;
          
          const meetsMin = range.min === undefined || value >= range.min;
          const meetsMax = range.max === undefined || value <= range.max;
          
          return meetsMin && meetsMax;
        });
      }
    });

    setFilteredData(filtered);
  };

  const updateFilter = (column, selectedValues) => {
    setActiveFilters(prev => ({
      ...prev,
      [column]: selectedValues
    }));
  };

  const updateNumericFilter = (column, range) => {
    setConfig(prev => ({
      ...prev,
      numericFilters: {
        ...prev.numericFilters,
        [column]: range
      }
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setConfig(prev => ({
      ...prev,
      numericFilters: {}
    }));
  };

  const getFilteredDataCount = () => {
    return {
      total: data.length,
      filtered: filteredData.length,
      percentage: data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0
    };
  };

  // Enable mouse wheel scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e) => {
      // Allow normal scrolling within the container
      if (e.deltaY !== 0) {
        e.stopPropagation();
        scrollContainer.scrollTop += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  // Auto-configuration functionality
  const generateAutoConfig = () => {
    const dataToAnalyze = filteredData.length > 0 ? filteredData : data;
    if (!dataToAnalyze || dataToAnalyze.length === 0) return null;
    
    const columns = Object.keys(dataToAnalyze[0] || {});
    const analysis = analyzeDataStructure(columns, dataToAnalyze);
    
    return {
      recommendedXAxis: analysis.bestCategorical || analysis.bestTemporal || columns[0],
      recommendedYAxis: analysis.bestNumeric || columns[1],
      recommendedType: analysis.recommendedChartType,
      recommendedSeries: analysis.bestSeries,
      confidence: analysis.confidence
    };
  };

  const analyzeDataStructure = (columns, data) => {
    const analysis = {
      numeric: [],
      categorical: [],
      temporal: [],
      bestNumeric: null,
      bestCategorical: null,
      bestTemporal: null,
      bestSeries: null,
      recommendedChartType: 'bar',
      confidence: 0
    };

    // Analyze each column
    columns.forEach(column => {
      const values = data.slice(0, 100).map(row => row[column]).filter(v => v !== null && v !== undefined);
      const sampleValues = values.slice(0, 50);
      
      // Check if numeric
      const numericCount = sampleValues.filter(v => !isNaN(parseFloat(v))).length;
      const numericRatio = numericCount / sampleValues.length;
      
      // Check if date/temporal
      const dateCount = sampleValues.filter(v => !isNaN(Date.parse(v))).length;
      const dateRatio = dateCount / sampleValues.length;
      
      // Check if categorical
      const uniqueRatio = new Set(sampleValues).size / sampleValues.length;
      
      if (numericRatio > 0.8) {
        analysis.numeric.push({ column, quality: numericRatio });
      } else if (dateRatio > 0.8) {
        analysis.temporal.push({ column, quality: dateRatio });
      } else if (uniqueRatio < 0.8) {
        analysis.categorical.push({ column, quality: 1 - uniqueRatio });
      }
    });

    // Select best columns
    analysis.bestNumeric = analysis.numeric.sort((a, b) => b.quality - a.quality)[0]?.column;
    analysis.bestCategorical = analysis.categorical.sort((a, b) => b.quality - a.quality)[0]?.column;
    analysis.bestTemporal = analysis.temporal.sort((a, b) => b.quality - a.quality)[0]?.column;
    analysis.bestSeries = analysis.categorical.filter(c => c.column !== analysis.bestCategorical)[0]?.column;

    // Recommend chart type based on data structure
    if (analysis.temporal.length > 0 && analysis.numeric.length > 0) {
      analysis.recommendedChartType = 'line';
      analysis.confidence = 0.9;
    } else if (analysis.categorical.length > 0 && analysis.numeric.length > 0) {
      analysis.recommendedChartType = 'bar';
      analysis.confidence = 0.8;
    } else if (analysis.numeric.length >= 2) {
      analysis.recommendedChartType = 'scatter';
      analysis.confidence = 0.7;
    } else {
      analysis.confidence = 0.5;
    }

    return analysis;
  };

  const applyAutoConfig = () => {
    const generated = generateAutoConfig();
    if (generated) {
      setAutoConfig(generated);
      setConfig(prev => ({
        ...prev,
        type: generated.recommendedType,
        title: getDefaultTitle(generated.recommendedType),
        xAxis: generated.recommendedXAxis,
        yAxis: generated.recommendedYAxis,
        series: generated.recommendedSeries || ''
      }));
      setShowAutoSuggestions(true);
    }
  };

  const applySmartRecommendation = (recommendation) => {
    setConfig(prev => ({
      ...prev,
      type: recommendation.type,
      title: recommendation.title,
      xAxis: recommendation.autoSelections?.xAxis || '',
      yAxis: recommendation.autoSelections?.yAxis || '',
      series: recommendation.autoSelections?.series || ''
    }));
  };

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
    const dataToUse = filteredData.length > 0 ? filteredData : data;
    if (!dataToUse || dataToUse.length === 0) return [];
    return Object.keys(dataToUse[0]);
  };

  const getNumericColumns = () => {
    const dataToUse = filteredData.length > 0 ? filteredData : data;
    if (!dataToUse || dataToUse.length === 0) return [];
    return Object.keys(dataToUse[0]).filter(key => {
      const value = dataToUse[0][key];
      return !isNaN(parseFloat(value)) && isFinite(value);
    });
  };

  const getCategoricalColumns = () => {
    const dataToUse = filteredData.length > 0 ? filteredData : data;
    if (!dataToUse || dataToUse.length === 0) return [];
    return Object.keys(dataToUse[0]).filter(key => {
      const value = dataToUse[0][key];
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
    console.log('Apply button clicked!'); // Simple debug
    if (isConfigValid()) {
      // Get performance optimization settings based on data size
      const getPerformanceOptimizations = () => {
        const dataSize = filteredData.length;
        
        return {
          // Chart library optimizations
          echarts: {
            large: dataSize > PERFORMANCE_THRESHOLDS.medium,
            largeThreshold: Math.min(2000, dataSize),
            progressive: dataSize > PERFORMANCE_THRESHOLDS.large ? 500 : 0,
            progressiveThreshold: PERFORMANCE_THRESHOLDS.large,
            useDirtyRect: dataSize > PERFORMANCE_THRESHOLDS.medium,
            useCoarsePointer: dataSize > PERFORMANCE_THRESHOLDS.large,
            animation: dataSize < PERFORMANCE_THRESHOLDS.medium ? config.showAnimation : false,
            sampling: null // No sampling - always use full data
          },
          plotly: {
            useWebGL: dataSize > PERFORMANCE_THRESHOLDS.medium,
            scattergl: dataSize > PERFORMANCE_THRESHOLDS.medium,
            webglpointthreshold: PERFORMANCE_THRESHOLDS.medium,
            plotGlPixelRatio: dataSize > PERFORMANCE_THRESHOLDS.large ? 1 : 2,
            responsive: true,
            displaylogo: false,
            scrollZoom: true
          },
          // Browser optimizations
          browser: {
            requestIdleCallback: dataSize > PERFORMANCE_THRESHOLDS.large,
            virtualScrolling: dataSize > PERFORMANCE_THRESHOLDS.massive,
            memoryManagement: dataSize > PERFORMANCE_THRESHOLDS.large,
            progressiveRendering: renderingStrategy === 'progressive'
          },
          // Data processing optimizations
          processing: {
            useWorkers: dataSize > PERFORMANCE_THRESHOLDS.large,
            batchSize: Math.min(1000, Math.ceil(dataSize / 10)),
            debounceMs: dataSize > PERFORMANCE_THRESHOLDS.medium ? 300 : 100
          }
        };
      };

      const configToApply = {
        ...config,
        data: filteredData, // Always use full filtered data - no sampling/truncation
        originalDataCount: data.length,
        filteredDataCount: filteredData.length,
        activeFilters: activeFilters,
        numericFilters: config.numericFilters || {},
        
        // Performance metadata
        performanceMode: performanceLevel,
        renderingStrategy: renderingStrategy,
        extremePerformanceMode: config.extremePerformanceMode,
        autoExtremeMode: autoExtremeMode,
        
        // Optimization settings for chart components
        optimizations: getPerformanceOptimizations(),
        
        // Data size indicators
        dataSize: {
          total: data.length,
          filtered: filteredData.length,
          level: performanceLevel,
          strategy: renderingStrategy
        }
      };
      
      console.log('Config is valid, applying:', configToApply); // Simple debug
      onApplyConfig(configToApply);
      onClose();
    } else {
      console.log('Config is NOT valid'); // Simple debug
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
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500"
          style={{ scrollBehavior: 'smooth' }}
        >
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

        {/* Auto-Configuration Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="text-blue-600" size={18} />
              <h4 className="font-semibold text-gray-800">Smart Configuration</h4>
            </div>
            <button
              onClick={applyAutoConfig}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw size={14} />
              Auto-Configure
            </button>
          </div>

          {autoConfig && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-green-500" />
                <span>Confidence: {Math.round(autoConfig.confidence * 100)}%</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended Chart:</span>
                  <span className="font-medium capitalize">{autoConfig.recommendedType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">X-Axis:</span>
                  <span className="font-medium">{autoConfig.recommendedXAxis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Y-Axis:</span>
                  <span className="font-medium">{autoConfig.recommendedYAxis}</span>
                </div>
                {autoConfig.recommendedSeries && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Series:</span>
                    <span className="font-medium">{autoConfig.recommendedSeries}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {smartRecommendations && smartRecommendations.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Smart Recommendations:</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {smartRecommendations.slice(0, 3).map((rec, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-white rounded border hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => applySmartRecommendation(rec)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{rec.type}</span>
                      <span className="text-xs text-blue-600">{Math.round(rec.confidence * 100)}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{rec.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>          {/* Chart Type Section */}
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
                  const isRecommended = autoConfig && autoConfig.recommendedType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => updateConfig('type', type.value)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        config.type === type.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                      } ${
                        isRecommended 
                          ? 'ring-2 ring-blue-300 border-blue-400' 
                          : ''
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
                        {isRecommended && (
                          <div className="flex items-center gap-1 ml-auto">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">Recommended</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                        {type.description}
                        {isRecommended && (
                          <span className="block text-blue-600 font-medium mt-1">
                            Confidence: {Math.round(autoConfig.confidence * 100)}%
                          </span>
                        )}
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        X-Axis {['histogram', 'box'].includes(config.type) ? '(Data Column)' : '(Categories)'}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      {autoConfig && autoConfig.recommendedXAxis && (
                        <button
                          onClick={() => updateConfig('xAxis', autoConfig.recommendedXAxis)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          <Wand2 size={12} />
                          Use Recommended
                        </button>
                      )}
                    </div>
                    <select
                      value={config.xAxis}
                      onChange={(e) => updateConfig('xAxis', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select column</option>
                      {(['histogram', 'box'].includes(config.type) ? getNumericColumns() : getColumns()).map(col => (
                        <option 
                          key={col} 
                          value={col}
                          className={autoConfig && autoConfig.recommendedXAxis === col ? 'bg-blue-50 font-medium' : ''}
                        >
                          {col}
                          {autoConfig && autoConfig.recommendedXAxis === col ? ' (Recommended)' : ''}
                        </option>
                      ))}
                    </select>
                    {autoConfig && autoConfig.recommendedXAxis && config.xAxis !== autoConfig.recommendedXAxis && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Recommended: {autoConfig.recommendedXAxis}
                      </p>
                    )}
                  </div>
                )}

                {/* Y-Axis */}
                {!['histogram', 'box', 'radar'].includes(config.type) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Y-Axis (Values)
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      {autoConfig && autoConfig.recommendedYAxis && (
                        <button
                          onClick={() => updateConfig('yAxis', autoConfig.recommendedYAxis)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          <Wand2 size={12} />
                          Use Recommended
                        </button>
                      )}
                    </div>
                    <select
                      value={config.yAxis}
                      onChange={(e) => updateConfig('yAxis', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select column</option>
                      {getNumericColumns().map(col => (
                        <option 
                          key={col} 
                          value={col}
                          className={autoConfig && autoConfig.recommendedYAxis === col ? 'bg-blue-50 font-medium' : ''}
                        >
                          {col}
                          {autoConfig && autoConfig.recommendedYAxis === col ? ' (Recommended)' : ''}
                        </option>
                      ))}
                    </select>
                    {autoConfig && autoConfig.recommendedYAxis && config.yAxis !== autoConfig.recommendedYAxis && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Recommended: {autoConfig.recommendedYAxis}
                      </p>
                    )}
                  </div>
                )}

                {/* Series */}
                {['bar', 'line', 'area', 'scatter'].includes(config.type) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Series (Optional)
                      </label>
                      {autoConfig && autoConfig.recommendedSeries && (
                        <button
                          onClick={() => updateConfig('series', autoConfig.recommendedSeries)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          <Wand2 size={12} />
                          Use Recommended
                        </button>
                      )}
                    </div>
                    <select
                      value={config.series}
                      onChange={(e) => updateConfig('series', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">None (single series)</option>
                      {getCategoricalColumns().map(col => (
                        <option 
                          key={col} 
                          value={col}
                          className={autoConfig && autoConfig.recommendedSeries === col ? 'bg-blue-50 font-medium' : ''}
                        >
                          {col}
                          {autoConfig && autoConfig.recommendedSeries === col ? ' (Recommended)' : ''}
                        </option>
                      ))}
                    </select>
                    {autoConfig && autoConfig.recommendedSeries && config.series !== autoConfig.recommendedSeries && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Recommended: {autoConfig.recommendedSeries}
                      </p>
                    )}
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

                {/* Auto Extreme Performance Mode */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        🚀 Auto Extreme Performance Mode
                      </label>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        Automatically optimizes rendering for large datasets without sampling
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoExtremeMode(!autoExtremeMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoExtremeMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoExtremeMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Performance Status Display */}
                  {autoExtremeMode && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Current Status:</span>
                        <span className={`px-2 py-1 rounded-full font-medium ${
                          performanceLevel === 'ultra' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                          performanceLevel === 'extreme' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                          performanceLevel === 'optimized' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {performanceLevel.toUpperCase()} MODE
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        📊 Dataset: {filteredData.length.toLocaleString()} rows
                        <br />
                        🎯 Strategy: {renderingStrategy}
                        <br />
                        {performanceLevel !== 'normal' && (
                          <>
                            ⚡ Optimizations: {
                              performanceLevel === 'ultra' ? 'Progressive + WebGL + Large Mode' :
                              performanceLevel === 'extreme' ? 'WebGL + Large Mode' :
                              performanceLevel === 'optimized' ? 'Large Mode' : 'None'
                            }
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Full Dataset Rendering - Updated */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Force Full Dataset (Override Auto Mode)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {config.extremePerformanceMode ? 
                        `Auto mode active - full ${data.length.toLocaleString()} rows with optimizations` : 
                        `Show all ${data.length.toLocaleString()} rows`
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => updateConfig('fullDataset', !config.fullDataset)}
                    disabled={config.extremePerformanceMode} // Disabled when auto mode handles it
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.fullDataset || config.extremePerformanceMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    } ${config.extremePerformanceMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.fullDataset || config.extremePerformanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Performance Warning - Updated */}
                {config.extremePerformanceMode && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✅ Extreme Performance Mode Active! Rendering full {filteredData.length.toLocaleString()} rows with advanced optimizations:
                    </p>
                    <ul className="text-xs text-green-600 dark:text-green-400 mt-2 space-y-1">
                      {renderingStrategy === 'progressive' && <li>• Progressive rendering for ultra-smooth experience</li>}
                      {renderingStrategy === 'webgl' && <li>• WebGL acceleration for maximum performance</li>}
                      {renderingStrategy === 'large' && <li>• Large dataset mode with optimized rendering</li>}
                      <li>• Memory-efficient data processing</li>
                      <li>• No sampling or truncation - full data visualization</li>
                    </ul>
                  </div>
                )}
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
                {(Object.keys(activeFilters).length > 0 || Object.keys(config.numericFilters || {}).length > 0) && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    {Object.keys(activeFilters).length + Object.keys(config.numericFilters || {}).length} active
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedSections.filters ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.filters && (
              <div className="mt-3 space-y-4">
                {/* Filter Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Data Summary
                    </span>
                    {(Object.keys(activeFilters).length > 0 || Object.keys(config.numericFilters || {}).length > 0) && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Showing {getFilteredDataCount().filtered} of {getFilteredDataCount().total} rows 
                    ({getFilteredDataCount().percentage}%)
                  </div>
                </div>

                {/* Categorical Filters */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categorical Filters
                  </h5>
                  <div className="space-y-3">
                    {getCategoricalColumns().slice(0, 5).map(column => {
                      const uniqueValues = getUniqueValues(column);
                      if (uniqueValues.length <= 1) return null;
                      
                      return (
                        <div key={column} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {column} ({uniqueValues.length} options)
                            </label>
                            {activeFilters[column] && activeFilters[column].length > 0 && (
                              <button
                                onClick={() => updateFilter(column, [])}
                                className="text-xs text-red-600 hover:text-red-800 underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          
                          {/* Checkbox-based selection for better UX */}
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueValues.map(value => (
                              <label key={value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={activeFilters[column]?.includes(value) || false}
                                  onChange={(e) => {
                                    const currentValues = activeFilters[column] || [];
                                    let newValues;
                                    if (e.target.checked) {
                                      newValues = [...currentValues, value];
                                    } else {
                                      newValues = currentValues.filter(v => v !== value);
                                    }
                                    updateFilter(column, newValues);
                                  }}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {value || '(Empty)'}
                                </span>
                              </label>
                            ))}
                          </div>
                          
                          {activeFilters[column] && activeFilters[column].length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {activeFilters[column].map(value => (
                                <span key={value} className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                                  {value}
                                  <button
                                    onClick={() => {
                                      const newValues = activeFilters[column].filter(v => v !== value);
                                      updateFilter(column, newValues);
                                    }}
                                    className="ml-1 text-emerald-600 hover:text-emerald-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Numeric Range Filters */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numeric Range Filters
                  </h5>
                  <div className="space-y-3">
                    {getNumericColumns().slice(0, 3).map(column => {
                      const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
                      if (values.length === 0) return null;
                      
                      const min = Math.min(...values);
                      const max = Math.max(...values);
                      const currentFilter = config.numericFilters?.[column] || {};
                      const hasFilter = currentFilter.min !== undefined || currentFilter.max !== undefined;
                      
                      return (
                        <div key={column} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {column} (Range: {min.toFixed(2)} - {max.toFixed(2)})
                            </label>
                            {hasFilter && (
                              <button
                                onClick={() => updateNumericFilter(column, {})}
                                className="text-xs text-red-600 hover:text-red-800 underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">Min</label>
                              <input
                                type="number"
                                placeholder={min.toString()}
                                value={currentFilter.min || ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  updateNumericFilter(column, {
                                    ...currentFilter,
                                    min: value
                                  });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Max</label>
                              <input
                                type="number"
                                placeholder={max.toString()}
                                value={currentFilter.max || ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  updateNumericFilter(column, {
                                    ...currentFilter,
                                    max: value
                                  });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                          {hasFilter && (
                            <div className="mt-2 text-xs text-blue-600">
                              Active: {currentFilter.min !== undefined ? `≥${currentFilter.min}` : ''} 
                              {currentFilter.min !== undefined && currentFilter.max !== undefined ? ' and ' : ''}
                              {currentFilter.max !== undefined ? `≤${currentFilter.max}` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Filter Presets */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Actions
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        // Filter to show only top 10% of data by first numeric column
                        const numericCol = getNumericColumns()[0];
                        if (numericCol) {
                          const values = data.map(row => parseFloat(row[numericCol])).filter(v => !isNaN(v));
                          const threshold = values.sort((a, b) => b - a)[Math.floor(values.length * 0.1)];
                          updateNumericFilter(numericCol, { min: threshold });
                        }
                      }}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs hover:bg-emerald-200 transition-colors"
                    >
                      Top 10%
                    </button>
                    <button
                      onClick={() => {
                        // Filter to show only top 50% of data by first numeric column
                        const numericCol = getNumericColumns()[0];
                        if (numericCol) {
                          const values = data.map(row => parseFloat(row[numericCol])).filter(v => !isNaN(v));
                          const median = values.sort((a, b) => a - b)[Math.floor(values.length * 0.5)];
                          updateNumericFilter(numericCol, { min: median });
                        }
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors"
                    >
                      Above Median
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200 transition-colors font-medium"
                    >
                      ✕ Clear All Filters
                    </button>
                    <button
                      onClick={() => {
                        // Sample 1000 random rows
                        const sampleSize = Math.min(1000, data.length);
                        const shuffled = [...data].sort(() => 0.5 - Math.random());
                        const sample = shuffled.slice(0, sampleSize);
                        setFilteredData(sample);
                      }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs hover:bg-purple-200 transition-colors"
                    >
                      Random Sample
                    </button>
                  </div>
                </div>
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
            {filteredData.length !== data.length && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2 mb-2">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🔍 Filters applied: Using {filteredData.length} of {data.length} rows
                </p>
              </div>
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
              disabled={!isConfigValid() || filteredData.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {filteredData.length === 0 ? 'No Data' : 'Apply Chart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSidebar;
