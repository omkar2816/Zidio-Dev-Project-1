import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw, BarChart3 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import Plot from 'react-plotly.js';
import Chart3DRenderer from './Chart3DRenderer';
import toast from 'react-hot-toast';

// Custom styles for horizontal scroll bar (vertical-like appearance) - theme aware
const getScrollBarStyles = (isDarkMode) => `
  .horizontal-scrollbar {
    -webkit-appearance: none;
    appearance: none;
    background: ${isDarkMode ? '#374151' : '#f1f5f9'};
    height: 16px;
    border-radius: 8px;
    border: 1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'};
    outline: none;
    cursor: pointer;
  }
  
  .horizontal-scrollbar::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 40px;
    height: 14px;
    border-radius: 6px;
    background: ${isDarkMode ? 
      'linear-gradient(to bottom, #6b7280, #4b5563)' : 
      'linear-gradient(to bottom, #cbd5e1, #94a3b8)'};
    border: 1px solid ${isDarkMode ? '#374151' : '#64748b'};
    cursor: pointer;
    box-shadow: inset 0 1px 0 ${isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(255,255,255,0.5)'}, 
                0 1px 2px rgba(0,0,0,0.1);
  }
  
  .horizontal-scrollbar::-webkit-slider-thumb:hover {
    background: ${isDarkMode ? 
      'linear-gradient(to bottom, #4b5563, #374151)' : 
      'linear-gradient(to bottom, #94a3b8, #64748b)'};
  }
  
  .horizontal-scrollbar::-webkit-slider-thumb:active {
    background: ${isDarkMode ? 
      'linear-gradient(to bottom, #374151, #1f2937)' : 
      'linear-gradient(to bottom, #64748b, #475569)'};
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .horizontal-scrollbar::-moz-range-thumb {
    width: 40px;
    height: 14px;
    border-radius: 6px;
    background: ${isDarkMode ? 
      'linear-gradient(to bottom, #6b7280, #4b5563)' : 
      'linear-gradient(to bottom, #cbd5e1, #94a3b8)'};
    border: 1px solid ${isDarkMode ? '#374151' : '#64748b'};
    cursor: pointer;
    box-shadow: inset 0 1px 0 ${isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(255,255,255,0.5)'}, 
                0 1px 2px rgba(0,0,0,0.1);
  }
  
  .horizontal-scrollbar::-moz-range-track {
    background: ${isDarkMode ? '#374151' : '#f1f5f9'};
    height: 16px;
    border-radius: 8px;
    border: 1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'};
  }
  
  .horizontal-scrollbar:focus {
    outline: 2px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'};
    outline-offset: 2px;
  }
  
  /* Vertical scroll bar styling - theme aware */
  .vertical-scrollable::-webkit-scrollbar {
    width: 12px;
  }
  
  .vertical-scrollable::-webkit-scrollbar-track {
    background: ${isDarkMode ? '#374151' : '#f1f5f9'};
    border-radius: 6px;
  }
  
  .vertical-scrollable::-webkit-scrollbar-thumb {
    background: ${isDarkMode ? 
      'linear-gradient(to bottom, #6b7280, #4b5563)' : 
      'linear-gradient(to bottom, #cbd5e1, #94a3b8)'};
    border-radius: 6px;
    border: 2px solid ${isDarkMode ? '#374151' : '#f1f5f9'};
  }
  
  .vertical-scrollable::-webkit-scrollbar-thumb:hover {
    background: ${isDarkMode ? 
      'linear-gradient(to bottom, #4b5563, #374151)' : 
      'linear-gradient(to bottom, #94a3b8, #64748b)'};
  }
`;

const ChartViewerModal = ({ isOpen, onClose, chart }) => {
  // Redux theme selector with error handling
  let theme = 'light';
  let isDarkMode = false;
  
  try {
    const uiState = useSelector((state) => state?.ui);
    theme = uiState?.theme || 'light';
    isDarkMode = theme === 'dark';
  } catch (error) {
    console.warn('⚠️ Theme selector error, using light theme:', error);
    theme = 'light';
    isDarkMode = false;
  }
  
  // Generate scroll bar styles based on current theme
  const scrollBarStyles = getScrollBarStyles(isDarkMode);
  
  const [chartData, setChartData] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const [renderingEngine, setRenderingEngine] = useState('echarts');
  // Check if this is a 3D chart
  const [is3DChart, setIs3DChart] = useState(false);
  // Horizontal scrolling states (disabled for 3D charts)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const maxPointsPerView = 25;
  // Download dropdown state
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  // Chart ref for accessing ECharts instance
  const chartRef = useRef(null);

  // Theme-aware color palettes
  const lightColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
  ];
  
  const darkColors = [
    '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa',
    '#22d3ee', '#f472b6', '#a3e635', '#fb923c', '#818cf8'
  ];
  
  const colors = isDarkMode ? darkColors : lightColors;

  useEffect(() => {
    if (isOpen && chart) {
      toast.success(`Opening chart: ${chart.chartTitle}`, {
        icon: <BarChart3 className="w-4 h-4" />,
        duration: 2000,
        style: {
          background: '#10b981',
          color: 'white'
        }
      });
      // Reset scroll position when modal opens
      setScrollPosition(0);
      setCurrentPage(1);
      processChartData();
    }
  }, [isOpen, chart]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest('.relative')) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  const processChartData = () => {
    if (!chart) return;

    // Check if this is a 3D chart
    const chartType = chart.chartType || chart.type || 'bar';
    const is3D = chartType.includes('3d') || 
                 chartType.includes('surface') || 
                 chartType.includes('mesh3d') ||
                 chart.configuration?.is3D ||
                 chart.chart3DConfig?.is3D;
    
    setIs3DChart(is3D);

    // For 3D charts, use different data structure
    if (is3D) {
      // 3D charts don't need the same data processing as 2D charts
      setChartData(chart.data || chart.chartData || []);
      setChartConfig({
        title: chart.chartTitle || chart.title || '3D Chart',
        type: chartType,
        is3D: true,
        xAxis: chart.chart3DConfig?.xAxis || chart.configuration?.xAxis || 'x',
        yAxis: chart.chart3DConfig?.yAxis || chart.configuration?.yAxis || 'y',
        zAxis: chart.chart3DConfig?.zAxis || chart.configuration?.zAxis || 'z',
        colorScheme: chart.colorScheme || 'viridis',
        camera: chart.chart3DConfig?.camera,
        extremePerformanceMode: chart.chart3DConfig?.extremePerformanceMode || false,
        performanceLevel: chart.chart3DConfig?.performanceLevel || 'normal'
      });
      return;
    }

    // Extract data using multiple fallback strategies for 2D charts
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
        } else if (keys.length > 0) {
          // Try to convert object properties to array
          rawData = Object.values(rawData);
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
          
          processedData = rawData.map((item, index) => ({
            name: String(item[categoryKey] || `Item ${index + 1}`),
            category: String(item[categoryKey] || `Item ${index + 1}`),
            value: parseFloat(item[valueKey]) || 0,
            x: String(item[categoryKey] || `Item ${index + 1}`),
            y: parseFloat(item[valueKey]) || 0
          }));
        } else {
          // Handle array of primitive values
          processedData = rawData.map((value, index) => ({
            name: `Item ${index + 1}`,
            category: `Item ${index + 1}`,
            value: parseFloat(value) || 0,
            x: `Item ${index + 1}`,
            y: parseFloat(value) || 0
          }));
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
      }
    }

    if (!processedData || processedData.length === 0) {
      console.error('❌ No valid data found for chart');
      toast.error('No valid chart data available for viewing');
      return;
    }

    setChartData(processedData);
    setChartConfig({
      title: chart.chartTitle || chart.title || 'Chart',
      type: chart.chartType || chart.type || 'bar',
      xAxis: chart.configuration?.xAxis || 'category',
      yAxis: chart.configuration?.yAxis || 'value'
    });
  };

  // Handle horizontal scrolling
  const handleScroll = (event) => {
    const scrollValue = parseInt(event.target.value);
    setScrollPosition(scrollValue);
    setCurrentPage(Math.floor(scrollValue / maxPointsPerView) + 1);
  };

  // Handle mouse wheel scrolling for horizontal navigation (only when hovering scroll bar area)
  const handleHorizontalMouseWheel = (event) => {
    if (!chartData || chartData.length <= maxPointsPerView) return;
    
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY > 0 ? 3 : -3; // Scroll by 3 points per wheel step (more precise)
    const maxScroll = Math.max(0, chartData.length - maxPointsPerView);
    const newScrollPosition = Math.max(0, Math.min(scrollPosition + delta, maxScroll));
    
    setScrollPosition(newScrollPosition);
    setCurrentPage(Math.floor(newScrollPosition / maxPointsPerView) + 1);
  };

  // Handle keyboard navigation
  const handleKeyPress = (event) => {
    if (!chartData || chartData.length <= maxPointsPerView) return;
    
    const maxScroll = Math.max(0, chartData.length - maxPointsPerView);
    let newScrollPosition = scrollPosition;
    
    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newScrollPosition = Math.max(0, scrollPosition - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newScrollPosition = Math.min(maxScroll, scrollPosition + 1);
        break;
      case 'Home':
        event.preventDefault();
        newScrollPosition = 0;
        break;
      case 'End':
        event.preventDefault();
        newScrollPosition = maxScroll;
        break;
      case 'PageUp':
        event.preventDefault();
        newScrollPosition = Math.max(0, scrollPosition - maxPointsPerView);
        break;
      case 'PageDown':
        event.preventDefault();
        newScrollPosition = Math.min(maxScroll, scrollPosition + maxPointsPerView);
        break;
      default:
        return;
    }
    
    setScrollPosition(newScrollPosition);
    setCurrentPage(Math.floor(newScrollPosition / maxPointsPerView) + 1);
  };

  // Get visible data based on scroll position (disabled for 3D charts)
  const getVisibleData = () => {
    if (!chartData) return [];
    
    // For 3D charts, return all data without scrolling
    if (is3DChart) {
      return chartData;
    }
    
    // For 2D charts with horizontal scrolling
    if (chartData.length <= maxPointsPerView) {
      return chartData;
    }
    
    const startIndex = Math.max(0, Math.min(scrollPosition, chartData.length - maxPointsPerView));
    const endIndex = Math.min(startIndex + maxPointsPerView, chartData.length);
    const visibleData = chartData.slice(startIndex, endIndex);
    
    return visibleData;
  };

  const getEChartsOption = () => {
    if (!chartData || !chartConfig) return {};

    // Get visible data for current scroll position
    const visibleData = getVisibleData();
    
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
        backgroundColor: isDarkMode ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: isDarkMode ? '#60a5fa' : '#3b82f6',
        borderWidth: 1,
        textStyle: { 
          color: isDarkMode ? '#f3f4f6' : '#1f2937'
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        textStyle: {
          color: isDarkMode ? '#e5e7eb' : '#374151'
        }
      }
    };

    switch (chartConfig.type) {
      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: visibleData.map(item => item.name),
            axisLabel: { 
              rotate: visibleData.length > 8 ? 45 : 0,
              interval: 0,
              color: isDarkMode ? '#d1d5db' : '#4b5563'
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#6b7280' : '#d1d5db'
              }
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: isDarkMode ? '#d1d5db' : '#4b5563'
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#6b7280' : '#d1d5db'
              }
            },
            splitLine: {
              lineStyle: {
                color: isDarkMode ? '#374151' : '#e5e7eb'
              }
            }
          },
          series: [{
            name: chartConfig.title,
            type: 'bar',
            data: visibleData.map(item => item.value),
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
            data: visibleData.map(item => item.name),
            axisLabel: {
              color: isDarkMode ? '#d1d5db' : '#4b5563'
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#6b7280' : '#d1d5db'
              }
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: isDarkMode ? '#d1d5db' : '#4b5563'
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#6b7280' : '#d1d5db'
              }
            },
            splitLine: {
              lineStyle: {
                color: isDarkMode ? '#374151' : '#e5e7eb'
              }
            }
          },
          series: [{
            name: chartConfig.title,
            type: 'line',
            data: visibleData.map(item => item.value),
            smooth: true,
            lineStyle: { 
              color: isDarkMode ? '#60a5fa' : '#3b82f6', 
              width: 3 
            },
            itemStyle: { 
              color: isDarkMode ? '#60a5fa' : '#3b82f6' 
            },
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
            data: visibleData.map((item, index) => ({
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
          xAxis: { 
            type: 'value',
            axisLabel: {
              color: isDarkMode ? '#d1d5db' : '#4b5563'
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#6b7280' : '#d1d5db'
              }
            },
            splitLine: {
              lineStyle: {
                color: isDarkMode ? '#374151' : '#e5e7eb'
              }
            }
          },
          yAxis: { 
            type: 'value',
            axisLabel: {
              color: isDarkMode ? '#d1d5db' : '#4b5563'
            },
            axisLine: {
              lineStyle: {
                color: isDarkMode ? '#6b7280' : '#d1d5db'
              }
            },
            splitLine: {
              lineStyle: {
                color: isDarkMode ? '#374151' : '#e5e7eb'
              }
            }
          },
          series: [{
            name: chartConfig.title,
            type: 'scatter',
            data: visibleData.map(item => [item.x, item.y]),
            itemStyle: { 
              color: isDarkMode ? '#60a5fa' : '#3b82f6'
            },
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
      font: { 
        size: 16,
        color: isDarkMode ? '#f3f4f6' : '#1f2937'
      }
    },
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: isDarkMode ? '#1f2937' : 'white',
    plot_bgcolor: isDarkMode ? '#374151' : 'white',
    font: {
      color: isDarkMode ? '#e5e7eb' : '#374151'
    },
    xaxis: {
      gridcolor: isDarkMode ? '#4b5563' : '#e5e7eb',
      tickcolor: isDarkMode ? '#6b7280' : '#d1d5db',
      linecolor: isDarkMode ? '#6b7280' : '#d1d5db'
    },
    yaxis: {
      gridcolor: isDarkMode ? '#4b5563' : '#e5e7eb',
      tickcolor: isDarkMode ? '#6b7280' : '#d1d5db',
      linecolor: isDarkMode ? '#6b7280' : '#d1d5db'
    },
    height: 400
  });

  const downloadChart = (format = 'png') => {
    try {
      const chartTitle = chartConfig?.title || 'chart';
      const fileName = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      
      // Handle 3D chart downloads
      if (is3DChart) {
        download3DChart(fileName, format);
        return;
      }
      
      if (renderingEngine === 'echarts' && chartRef.current) {
        // Get the ECharts instance using the ref
        const echartsInstance = chartRef.current.getEchartsInstance();
        if (echartsInstance) {
          const canvas = echartsInstance.getDom().querySelector('canvas');
          if (canvas) {
            downloadCanvasAsImage(canvas, fileName, format);
          } else {
            toast.error('Could not find chart canvas for download');
          }
        } else {
          toast.error('Chart not ready for download');
        }
      } else {
        // Handle Plotly downloads
        const plotlyDiv = document.querySelector('[data-testid="plot-container"]');
        if (plotlyDiv) {
          downloadPlotlyChart(plotlyDiv, fileName, format);
        } else {
          toast.error('Could not find chart for download');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download chart as ${format.toUpperCase()}`);
    }
  };

  const download3DChart = (fileName, format) => {
    try {
      // Find the 3D chart's Plotly div (Chart3DRenderer uses Plotly)
      const plotlyDivs = document.querySelectorAll('.js-plotly-plot');
      let chartDiv = null;
      
      // Find the correct Plotly div (should be inside the modal)
      for (const div of plotlyDivs) {
        if (div.closest('.relative.w-full.max-w-4xl')) {
          chartDiv = div;
          break;
        }
      }
      
      if (chartDiv) {
        if (format === 'gif') {
          // For GIF format, we'll capture the current state as PNG
          // (true animated GIFs would require multiple captures)
          toast.info('Creating GIF from current 3D chart view...');
          downloadPlotlyChart(chartDiv, fileName, 'png');
          setTimeout(() => {
            toast.success('3D Chart exported as static GIF (PNG format)');
          }, 1000);
        } else {
          downloadPlotlyChart(chartDiv, fileName, format);
        }
      } else {
        toast.error('Could not find 3D chart for download');
      }
    } catch (error) {
      console.error('3D chart download error:', error);
      toast.error(`Failed to download 3D chart as ${format.toUpperCase()}`);
    }
  };

  const downloadCanvasAsImage = (canvas, fileName, format) => {
    try {
      let mimeType, fileExtension;
      
      switch(format.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          fileExtension = 'jpg';
          break;
        case 'pdf':
          downloadAsPDF(canvas, fileName);
          return;
        case 'png':
        default:
          mimeType = 'image/png';
          fileExtension = 'png';
          break;
      }

      toast.loading(`Preparing ${format.toUpperCase()} download...`);

      // Create a temporary canvas with white background for JPEG
      if (format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Fill with white background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        
        const dataURL = tempCanvas.toDataURL(mimeType, 0.9);
        downloadImageFromDataURL(dataURL, `${fileName}.${fileExtension}`, format);
      } else {
        const dataURL = canvas.toDataURL(mimeType, 1.0);
        downloadImageFromDataURL(dataURL, `${fileName}.${fileExtension}`, format);
      }
    } catch (error) {
      console.error('Canvas download error:', error);
      toast.error('Failed to download chart image');
    }
  };

  const downloadImageFromDataURL = (dataURL, filename, format) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
    
    toast.dismiss(); // Clear loading toast
    toast.success(`Chart downloaded as ${format.toUpperCase()}`);
  };

  const downloadAsPDF = async (canvas, fileName) => {
    try {
      // Create a simple PDF with the chart image
      const imgData = canvas.toDataURL('image/png');
      
      // Create a new window with the image for printing as PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; padding: 0; }
                img { width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <h2>${chartConfig?.title || 'Chart'}</h2>
            <img src="${imgData}" alt="Chart">
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success('Chart ready for PDF download (print dialog opened)');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const downloadPlotlyChart = (plotlyDiv, fileName, format) => {
    try {
      // Use Plotly's built-in download functionality
      const Plotly = window.Plotly;
      if (Plotly && Plotly.downloadImage) {
        const options = {
          format: format,
          width: 1200,
          height: 800,
          filename: fileName
        };
        
        Plotly.downloadImage(plotlyDiv, options);
        toast.success(`Chart downloaded as ${format.toUpperCase()}`);
      } else {
        toast.error('Plotly download not available');
      }
    } catch (error) {
      console.error('Plotly download error:', error);
      toast.error('Failed to download Plotly chart');
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollBarStyles }} />
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
            className={`relative w-full ${is3DChart ? 'max-w-6xl max-h-[90vh]' : 'max-w-4xl max-h-[70vh]'} ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-gray-50 border-emerald-200'
            } rounded-2xl shadow-2xl border-2 flex flex-col =border border-transparent px-2 py-1 rounded-lg`}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode 
                ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' 
                : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 border'
            } flex-shrink-0`}>
              <div className="flex items-center gap-3 border border-transparent hover:border-emerald-400 px-2 py-1 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border border-green-500"></div>
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                } truncate pr-2`}>
                  📊 Chart Viewer: {chartConfig?.title || 'Loading...'}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                } transition-colors rounded-lg flex-shrink-0`}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div 
              className={`flex-1 p-6 ${is3DChart ? 'overflow-visible' : 'overflow-y-auto'} overscroll-contain scroll-smooth min-h-0 max-h-full vertical-scrollable`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDarkMode ? '#4b5563 #374151' : '#cbd5e1 #f1f5f9'
              }}
            >
              <div className={`space-y-4 ${is3DChart ? 'min-h-[700px]' : 'min-h-[600px]'}`}>
                {!chart ? (
                  // No chart available
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className={`text-center p-8 rounded-lg ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-medium mb-2">No Chart Selected</h3>
                      <p className="text-sm">Please select a chart from the history to view it here.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Scroll indicator */}
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    } text-center mb-2`}>
                    </div>
            {/* Chart Info */}
        <div className={`${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        } p-4 rounded-lg`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Type:</span>
              <span className={`ml-2 capitalize ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>{chartConfig?.type || 'Unknown'}</span>
            </div>
            <div>
              <span className={`font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Data Points:</span>
              <span className={`ml-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>{chartData?.length || 0}</span>
            </div>
            <div>
              <span className={`font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Source:</span>
              <span className={`ml-2 truncate ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>{chart.sourceFileName || 'Unknown'}</span>
            </div>
            <div>
              <span className={`font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Created:</span>
              <span className={`ml-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>{chart.createdAt ? new Date(chart.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Rendering Engine Toggle - Only for 2D charts */}
        {!is3DChart && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setRenderingEngine('echarts')}
              className={`px-3 py-1 text-sm rounded ${
                renderingEngine === 'echarts'
                  ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                  : (isDarkMode 
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )
              }`}
            >
              ECharts
            </button>
            <button
              onClick={() => setRenderingEngine('plotly')}
              className={`px-3 py-1 text-sm rounded ${
                renderingEngine === 'plotly'
                  ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                  : (isDarkMode 
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )
              }`}
            >
              Plotly
            </button>
          </div>

          {/* Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className={`flex items-center gap-2 px-3 py-1 text-sm ${
                isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white rounded transition-colors`}
            >
              <Download className="w-4 h-4" />
              Download
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDownloadMenu && (
              <div className={`absolute right-0 mt-1 w-48 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              } border rounded-md shadow-lg z-10`}>
                <div className="py-1">
                  <div className={`px-3 py-2 text-xs font-medium ${
                    isDarkMode 
                      ? 'text-gray-300 border-gray-600' 
                      : 'text-gray-500 border-gray-200'
                  } border-b`}>
                    Download Chart As:
                  </div>
                  <button
                    onClick={() => {
                      downloadChart('png');
                      setShowDownloadMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      isDarkMode 
                        ? 'text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center gap-2`}
                  >
                    <span className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded text-xs flex items-center justify-center font-bold">PNG</span>
                    PNG Image (Recommended)
                  </button>
                  <button
                    onClick={() => {
                      downloadChart('jpg');
                      setShowDownloadMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      isDarkMode 
                        ? 'text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center gap-2`}
                  >
                    <span className="w-4 h-4 bg-orange-100 text-orange-600 rounded text-xs flex items-center justify-center font-bold">JPG</span>
                    JPEG Image
                  </button>
                  <button
                    onClick={() => {
                      downloadChart('pdf');
                      setShowDownloadMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      isDarkMode 
                        ? 'text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center gap-2`}
                  >
                    <span className="w-4 h-4 bg-red-100 text-red-600 rounded text-xs flex items-center justify-center font-bold">PDF</span>
                    PDF Document
                  </button>
                  {/* GIF option - only for 3D charts */}
                  {is3DChart && (
                    <button
                      onClick={() => {
                        downloadChart('gif');
                        setShowDownloadMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        isDarkMode 
                          ? 'text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      } flex items-center gap-2`}
                    >
                      <span className="w-4 h-4 bg-teal-100 text-teal-600 rounded text-xs flex items-center justify-center font-bold">GIF</span>
                      GIF Animation (3D Only)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Chart Display */}
        <div 
          className={`${
            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
          } border rounded-lg p-4 ${is3DChart ? 'overflow-visible' : 'overflow-x-auto'}`} 
          style={{ 
            height: is3DChart ? '600px' : '350px',
            minWidth: is3DChart ? '100%' : 'auto'
          }}
          onKeyDown={handleKeyPress}
          tabIndex={0}
        >
          {chartData && chartConfig ? (
            is3DChart ? (
              <Chart3DRenderer
                data={chartData}
                type={chartConfig.type}
                title={chartConfig.title}
                xAxis={chartConfig.xAxis}
                yAxis={chartConfig.yAxis}
                zAxis={chartConfig.zAxis}
                colorScheme={chartConfig.colorScheme}
                extremePerformanceMode={chartConfig.extremePerformanceMode}
                performanceLevel={chartConfig.performanceLevel}
                showControls={true}
                className="w-full h-full"
                style={{ width: '100%', height: '100%', minHeight: '550px' }}
                enableSave={true}
              />
            ) : renderingEngine === 'echarts' ? (
              <ReactECharts
                ref={chartRef}
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

        {/* Horizontal Scroll Controls - Only show for 2D charts with more than 25 data points */}
        {!is3DChart && chartData && chartData.length > maxPointsPerView && (
          <div 
            className={`mt-4 p-3 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
            } rounded-lg border transition-colors duration-200`}
            onWheel={handleHorizontalMouseWheel}
            title="Use mouse wheel here for horizontal scrolling through data points"
          >
            {/* Dataset info */}
            <div className="text-center mb-3">
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              } font-medium mb-1`}>
                📊 <strong>Large Dataset</strong> ({chartData.length} total points)
              </div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              } mb-1`}>
                <strong>Showing:</strong> Points {Math.max(1, scrollPosition + 1)} - {Math.min(scrollPosition + maxPointsPerView, chartData.length)} of {chartData.length}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Page {currentPage} of {Math.ceil(chartData.length / maxPointsPerView)}
              </div>
            </div>
            
            {/* Horizontal scroll bar */}
            <div className="px-2">
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              } mb-2 text-center`}>
                🖱️ <strong>Mouse Wheel here:</strong> Horizontal scroll • <strong>Drag Bar:</strong> Jump to position • <strong>Arrow Keys:</strong> Step navigation
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, chartData.length - maxPointsPerView)}
                step="1"
                value={scrollPosition}
                onChange={handleScroll}
                className="w-full horizontal-scrollbar"
              />
              <div className={`flex justify-between text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              } mt-2`}>
                <span>Start (Point 1)</span>
                <div className={`${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                } font-medium`}>
                  📍 Current View: {scrollPosition + 1} - {Math.min(scrollPosition + maxPointsPerView, chartData.length)}
                </div>
                <span>End (Point {chartData.length})</span>
              </div>
            </div>
            
            {/* Quick jump buttons */}
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => {
                  setScrollPosition(0);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs ${
                  isDarkMode 
                    ? 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700' 
                    : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                } rounded-md transition-colors`}
              >
                ⏪ Start
              </button>
              <button
                onClick={() => {
                  const maxScroll = Math.max(0, chartData.length - maxPointsPerView);
                  setScrollPosition(maxScroll);
                  setCurrentPage(Math.ceil(chartData.length / maxPointsPerView));
                }}
                className={`px-3 py-1 text-xs ${
                  isDarkMode 
                    ? 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700' 
                    : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                } rounded-md transition-colors`}
              >
                End ⏩
              </button>
            </div>
          </div>
        )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default ChartViewerModal;
