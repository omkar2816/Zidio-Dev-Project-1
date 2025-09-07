import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import Plot from 'react-plotly.js';
import toast from 'react-hot-toast';

const ChartViewerModal = ({ isOpen, onClose, chart }) => {
  const [chartData, setChartData] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const [renderingEngine, setRenderingEngine] = useState('echarts');

  // Color palette
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
  ];

  useEffect(() => {
    if (isOpen && chart) {
      console.log('🎯 ChartViewerModal opening with chart:', chart.chartTitle);
      toast.success(`📊 Opening chart: ${chart.chartTitle}`, {
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white'
        }
      });
      processChartData();
    }
  }, [isOpen, chart]);

  const processChartData = () => {
    if (!chart) return;

    console.log('Processing chart data for modal:', chart);

    // Extract data using multiple fallback strategies
    let processedData = null;
    const configuration = chart.configuration || {};
    const categories = configuration.categories || [];
    const values = configuration.values || [];

    // Strategy 1: Use configuration data if both categories and values exist and have same length
    if (categories.length > 0 && values.length > 0 && categories.length === values.length) {
      processedData = categories.map((category, index) => ({
        name: category,
        category: category,
        value: parseFloat(values[index]) || 0,
        x: category,
        y: parseFloat(values[index]) || 0
      }));
      console.log('✅ Using configuration arrays (categories + values):', processedData);
    } 
    // Strategy 2: Extract from chartData/data field
    else {
      let rawData = chart.chartData || chart.data;
      
      // Convert object with numeric keys to array if needed
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        const keys = Object.keys(rawData);
        if (keys.length > 0 && keys.every(key => !isNaN(key))) {
          const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
          rawData = sortedKeys.map(key => rawData[key]);
          console.log('🔄 Converted object to array:', rawData);
        } else if (keys.length > 0) {
          // Try to convert object properties to array
          rawData = Object.values(rawData);
          console.log('🔄 Converted object values to array:', rawData);
        }
      }

      if (Array.isArray(rawData) && rawData.length > 0) {
        // Handle array of objects
        if (typeof rawData[0] === 'object') {
          const firstItem = rawData[0];
          const keys = Object.keys(firstItem);
          
          // Smart key detection for category/label field
          const categoryKey = keys.find(key => 
            key.toLowerCase().includes('category') ||
            key.toLowerCase().includes('name') ||
            key.toLowerCase().includes('label') ||
            key.toLowerCase().includes('month') ||
            key.toLowerCase().includes('date') ||
            key.toLowerCase().includes('time') ||
            key.toLowerCase().includes('x')
          ) || keys[0];
          
          // Smart key detection for value/numeric field
          const valueKey = keys.find(key => 
            key !== categoryKey &&
            (key.toLowerCase().includes('value') ||
             key.toLowerCase().includes('count') ||
             key.toLowerCase().includes('amount') ||
             key.toLowerCase().includes('sales') ||
             key.toLowerCase().includes('revenue') ||
             key.toLowerCase().includes('profit') ||
             key.toLowerCase().includes('y') ||
             typeof firstItem[key] === 'number')
          ) || keys[1] || keys[0];
          
          console.log(`🔍 Detected keys - Category: "${categoryKey}", Value: "${valueKey}"`);
          
          processedData = rawData.map((item, index) => ({
            name: String(item[categoryKey] || `Item ${index + 1}`),
            category: String(item[categoryKey] || `Item ${index + 1}`),
            value: parseFloat(item[valueKey]) || 0,
            x: String(item[categoryKey] || `Item ${index + 1}`),
            y: parseFloat(item[valueKey]) || 0
          }));
          console.log('✅ Extracted from object array:', processedData.slice(0, 3));
        } else {
          // Handle array of primitive values
          processedData = rawData.map((value, index) => ({
            name: `Item ${index + 1}`,
            category: `Item ${index + 1}`,
            value: parseFloat(value) || 0,
            x: `Item ${index + 1}`,
            y: parseFloat(value) || 0
          }));
          console.log('✅ Converted primitive array:', processedData.slice(0, 3));
        }
      }
      // Strategy 3: Use categories array with generated values if only categories exist
      else if (categories.length > 0) {
        processedData = categories.map((category, index) => ({
          name: category,
          category: category,
          value: index + 1, // Generate simple incremental values
          x: category,
          y: index + 1
        }));
        console.log('⚠️ Using categories only with generated values:', processedData);
      }
      // Strategy 4: Use values array with generated categories if only values exist
      else if (values.length > 0) {
        processedData = values.map((value, index) => ({
          name: `Item ${index + 1}`,
          category: `Item ${index + 1}`,
          value: parseFloat(value) || 0,
          x: `Item ${index + 1}`,
          y: parseFloat(value) || 0
        }));
        console.log('⚠️ Using values only with generated categories:', processedData);
      }
    }

    if (!processedData || processedData.length === 0) {
      console.error('❌ No valid data found for chart');
      toast.error('No valid chart data available for viewing');
      return;
    }

    console.log(`✅ Final processed data (${processedData.length} points):`, processedData.slice(0, 3));

    setChartData(processedData);
    setChartConfig({
      title: chart.chartTitle || chart.title || 'Chart',
      type: chart.chartType || chart.type || 'bar',
      xAxis: chart.configuration?.xAxis || 'category',
      yAxis: chart.configuration?.yAxis || 'value'
    });

    console.log('Final processed data:', processedData);
    console.log('Chart config:', chartConfig);
  };

  const getEChartsOption = () => {
    if (!chartData || !chartConfig) return {};

    const baseOption = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 1000,
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      tooltip: {
        trigger: chartConfig.type === 'pie' ? 'item' : 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        textStyle: { color: '#fff' }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        bottom: '5%'
      }
    };

    switch (chartConfig.type) {
      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.map(item => item.name),
            axisLabel: { 
              rotate: chartData.length > 8 ? 45 : 0,
              interval: 0
            }
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            name: chartConfig.title,
            type: 'bar',
            data: chartData.map(item => item.value),
            itemStyle: {
              color: (params) => colors[params.dataIndex % colors.length],
              borderRadius: [4, 4, 0, 0]
            }
          }]
        };

      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.map(item => item.name)
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            name: chartConfig.title,
            type: 'line',
            data: chartData.map(item => item.value),
            smooth: true,
            lineStyle: { color: '#3b82f6', width: 3 },
            itemStyle: { color: '#3b82f6' },
            symbol: 'circle',
            symbolSize: 6
          }]
        };

      case 'pie':
        return {
          ...baseOption,
          series: [{
            name: chartConfig.title,
            type: 'pie',
            radius: '60%',
            center: ['50%', '50%'],
            data: chartData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colors[index % colors.length]
              }
            })),
            label: {
              formatter: '{b}: {c} ({d}%)'
            }
          }]
        };

      case 'scatter':
        return {
          ...baseOption,
          xAxis: { type: 'value' },
          yAxis: { type: 'value' },
          series: [{
            name: chartConfig.title,
            type: 'scatter',
            data: chartData.map(item => [item.x, item.y]),
            itemStyle: { color: '#3b82f6' },
            symbolSize: 8
          }]
        };

      default:
        return baseOption;
    }
  };

  const getPlotlyData = () => {
    if (!chartData || !chartConfig) return [];

    switch (chartConfig.type) {
      case 'bar':
        return [{
          x: chartData.map(item => item.name),
          y: chartData.map(item => item.value),
          type: 'bar',
          marker: { color: colors.slice(0, chartData.length) },
          name: chartConfig.title
        }];

      case 'line':
        return [{
          x: chartData.map(item => item.name),
          y: chartData.map(item => item.value),
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: '#3b82f6', width: 3 },
          marker: { color: '#3b82f6', size: 8 },
          name: chartConfig.title
        }];

      case 'pie':
        return [{
          labels: chartData.map(item => item.name),
          values: chartData.map(item => item.value),
          type: 'pie',
          marker: { colors: colors.slice(0, chartData.length) },
          textinfo: 'label+percent',
          name: chartConfig.title
        }];

      case 'scatter':
        return [{
          x: chartData.map(item => item.x),
          y: chartData.map(item => item.y),
          mode: 'markers',
          type: 'scatter',
          marker: { color: '#3b82f6', size: 10 },
          name: chartConfig.title
        }];

      default:
        return [];
    }
  };

  const getPlotlyLayout = () => ({
    title: {
      text: chartConfig?.title || '',
      font: { size: 16 }
    },
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    height: 400
  });

  const downloadChart = () => {
    try {
      const chartInfo = {
        title: chartConfig?.title || 'Chart',
        type: chartConfig?.type || 'bar',
        data: chartData,
        metadata: {
          created: chart.createdAt,
          source: chart.sourceFileName,
          dataPoints: chartData?.length || 0
        }
      };

      const dataStr = JSON.stringify(chartInfo, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(chartConfig?.title || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Chart data downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chart');
    }
  };

  if (!chart) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border-2 border-blue-200 max-h-[95vh] overflow-hidden flex flex-col"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-semibold text-gray-900 truncate pr-2">
                  📊 Chart Viewer: {chartConfig?.title || 'Loading...'}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto overscroll-contain">
              <div className="space-y-4">
        {/* Chart Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Type:</span>
              <span className="ml-2 capitalize">{chartConfig?.type || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Data Points:</span>
              <span className="ml-2">{chartData?.length || 0}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Source:</span>
              <span className="ml-2 truncate">{chart.sourceFileName || 'Unknown'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Created:</span>
              <span className="ml-2">{chart.createdAt ? new Date(chart.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Rendering Engine Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setRenderingEngine('echarts')}
              className={`px-3 py-1 text-sm rounded ${
                renderingEngine === 'echarts'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ECharts
            </button>
            <button
              onClick={() => setRenderingEngine('plotly')}
              className={`px-3 py-1 text-sm rounded ${
                renderingEngine === 'plotly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Plotly
            </button>
          </div>

          <button
            onClick={downloadChart}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        {/* Chart Display */}
        <div className="bg-white border rounded-lg p-4" style={{ height: '450px' }}>
          {chartData && chartConfig ? (
            renderingEngine === 'echarts' ? (
              <ReactECharts
                option={getEChartsOption()}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <Plot
                data={getPlotlyData()}
                layout={getPlotlyLayout()}
                style={{ height: '100%', width: '100%' }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false
                }}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading chart data...
            </div>
          )}
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify({ chartData, chartConfig, originalChart: chart }, null, 2)}
            </pre>
          </details>
        )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChartViewerModal;
