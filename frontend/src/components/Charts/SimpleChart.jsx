import React, { useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import Plot from 'react-plotly.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { BarChart3, LineChart, PieChart, ScatterChart, Activity, TrendingUp, Settings, Download, FileImage, FileText, Edit3, Copy, Trash2, Palette, Move, Check, ZoomIn, ZoomOut, RotateCcw, Box, Eye } from 'lucide-react';
import Chart3DRenderer from './Chart3DRenderer';

const AdvancedChart = ({ 
  data = [], 
  type = 'bar', 
  title = null, // Allow null to use default titles
  xAxis = null,
  yAxis = null,
  series = null,
  colorScheme = 'emerald',
  showAnimation = true,
  onEdit = null,
  onDuplicate = null,
  onRemove = null,
  onSave = null,
  enableSave = true,
  onColorSchemeChange = null,
  id = null,
  performanceMode = false,
  // NEW: Extreme performance mode props
  optimizations = null,
  renderingStrategy = 'standard',
  performanceLevel = 'normal',
  extremePerformanceMode = false,
  // Existing props
  totalDataRows = 0,
  displayedRows = 0,
  samplingInfo = null
}) => {
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [zoomLevel, setZoomLevel] = useState({ start: 0, end: 100 });

  // Auto-detect performance settings if not provided
  const autoOptimizations = optimizations || {
    echarts: {
      large: data.length > 5000,
      largeThreshold: Math.min(2000, data.length),
      progressive: data.length > 15000 ? 500 : 0,
      useDirtyRect: data.length > 1000,
      useCoarsePointer: data.length > 5000,
      animation: data.length < 5000 ? showAnimation : false
    },
    plotly: {
      useWebGL: data.length > 5000,
      scattergl: data.length > 5000,
      webglpointthreshold: 5000
    }
  };

  // Performance-aware animation setting
  const effectiveShowAnimation = extremePerformanceMode ? 
    autoOptimizations.echarts.animation : showAnimation;

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

  // Use provided title or default based on chart type
  const chartTitle = title || getDefaultTitle(type);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Real-time data updates
  useEffect(() => {
    if (chartRef.current?.getEchartsInstance) {
      const chart = chartRef.current.getEchartsInstance();
      const newOption = getEChartsOption();
      
      // Use notMerge: false for smooth updates, true for complete replacement
      chart.setOption(newOption, {
        notMerge: false,
        lazyUpdate: true,
        silent: false
      });
    }
  }, [data, type, xAxis, yAxis, series, colorScheme, showAnimation]);

  // Handle window resize for responsive charts
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current?.getEchartsInstance) {
        chartRef.current.getEchartsInstance().resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Color schemes
  const colorSchemes = {
    emerald: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    blue: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
    purple: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF'],
    rose: ['#E11D48', '#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3'],
    amber: ['#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7'],
    cyan: ['#0891B2', '#06B6D4', '#22D3EE', '#67E8F9', '#CFFAFE']
  };

  const currentColors = colorSchemes[colorScheme] || colorSchemes.emerald;

  const handleColorSchemeChange = (newScheme) => {
    if (onColorSchemeChange) {
      onColorSchemeChange(newScheme);
    }
    setShowColorPalette(false);
  };

  const toggleDragMode = () => {
    setIsDragMode(!isDragMode);
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      if (chartInstance) {
        chartInstance.setOption({
          animation: false,
          dataZoom: isDragMode ? [] : [
            {
              type: 'inside',
              xAxisIndex: 0,
              filterMode: 'none'
            },
            {
              type: 'inside',
              yAxisIndex: 0,
              filterMode: 'none'
            }
          ]
        });
      }
    }
  };

  const handleZoomIn = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      if (chartInstance) {
        // Calculate new zoom level for infinite zoom in
        const currentRange = zoomLevel.end - zoomLevel.start;
        const zoomFactor = 0.8; // Each zoom reduces view by 20%
        const newRange = currentRange * zoomFactor;
        const center = (zoomLevel.start + zoomLevel.end) / 2;
        
        const newStart = Math.max(0, center - newRange / 2);
        const newEnd = Math.min(100, center + newRange / 2);
        
        // Prevent over-zooming (minimum 1% range)
        if (newEnd - newStart > 1) {
          setZoomLevel({ start: newStart, end: newEnd });
          
          chartInstance.dispatchAction({
            type: 'dataZoom',
            start: newStart,
            end: newEnd
          });
        }
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      if (chartInstance) {
        // Calculate new zoom level for infinite zoom out
        const currentRange = zoomLevel.end - zoomLevel.start;
        const zoomFactor = 1.25; // Each zoom increases view by 25%
        const newRange = Math.min(100, currentRange * zoomFactor);
        const center = (zoomLevel.start + zoomLevel.end) / 2;
        
        let newStart = center - newRange / 2;
        let newEnd = center + newRange / 2;
        
        // Adjust if we go beyond bounds
        if (newStart < 0) {
          newEnd += Math.abs(newStart);
          newStart = 0;
        }
        if (newEnd > 100) {
          newStart -= (newEnd - 100);
          newEnd = 100;
        }
        
        // Ensure we don't go below 0 or above 100
        newStart = Math.max(0, newStart);
        newEnd = Math.min(100, newEnd);
        
        setZoomLevel({ start: newStart, end: newEnd });
        
        chartInstance.dispatchAction({
          type: 'dataZoom',
          start: newStart,
          end: newEnd
        });
      }
    }
  };

  const handleResetView = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      if (chartInstance) {
        // Reset zoom level to default
        setZoomLevel({ start: 0, end: 100 });
        
        chartInstance.dispatchAction({
          type: 'dataZoom',
          start: 0,
          end: 100
        });
      }
    }
  };

  // Export functionality
  const exportChart = async (format) => {
    try {
      setIsLoading(true);
      const chartElement = chartRef.current?.getEchartsInstance?.()?.getDom() || 
                          chartRef.current?.parentElement?.querySelector('.js-plotly-plot') ||
                          chartRef.current?.parentElement;
      
      if (!chartElement) {
        console.error('Chart element not found');
        toast.error('Chart element not found for export');
        return;
      }

      switch (format) {
        case 'png':
        case 'jpg':
          await exportAsImage(chartElement, format);
          toast.success(`Chart exported as ${format.toUpperCase()}`);
          break;
        case 'pdf':
          await exportAsPDF(chartElement);
          toast.success('Chart exported as PDF');
          break;
        case 'svg':
          await exportAsSVG();
          toast.success('Chart exported as SVG');
          break;
        default:
          console.error('Unsupported export format');
          toast.error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setShowExportMenu(false);
    }
  };

  const exportAsImage = async (element, format) => {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const link = document.createElement('a');
    link.download = `${chartTitle.replace(/\s+/g, '_').toLowerCase()}.${format}`;
    link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`);
    link.click();
  };

  const exportAsPDF = async (element) => {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`${chartTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const exportAsSVG = async () => {
    if (chartRef.current?.getEchartsInstance) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      const svgStr = echartsInstance.renderToSVGString();
      
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `${chartTitle.replace(/\s+/g, '_').toLowerCase()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      console.warn('SVG export only available for ECharts-based charts');
    }
  };

  // Process data for different chart types
  const processChartData = () => {
    if (!data || data.length === 0 || !xAxis) return null;

    try {
      switch (type) {
        case 'bar':
        case 'line':
        case 'area':
          return processXYData();
        case 'pie':
          return processPieData();
        case 'scatter':
        case 'bubble':
          return processScatterData();
        case 'histogram':
          return processHistogramData();
        case 'box':
          return processBoxData();
        case 'radar':
          return processRadarData();
        default:
          return processXYData();
      }
    } catch (error) {
      console.error('Error processing chart data:', error);
      return null;
    }
  };

  const processXYData = () => {
    // Use all data points for full dataset representation
    const categories = data.map(row => row[xAxis]);
    
    if (series) {
      // Multiple series
      const seriesGroups = {};
      data.forEach(row => {
        const seriesName = row[series];
        if (!seriesGroups[seriesName]) {
          seriesGroups[seriesName] = [];
        }
        seriesGroups[seriesName].push(parseFloat(row[yAxis]) || 0);
      });

      return {
        categories,
        series: Object.keys(seriesGroups).map((name, index) => ({
          name,
          data: seriesGroups[name],
          color: currentColors[index % currentColors.length]
        }))
      };
    } else {
      // Single series
      const values = data.map(row => parseFloat(row[yAxis]) || 0);
      return {
        categories,
        series: [{
          name: yAxis,
          data: values,
          color: currentColors[0]
        }]
      };
    }
  };

  const processPieData = () => {
    // Dynamic slice management for large datasets while preserving all data information
    const dataSize = data.length;
    const maxSlices = extremePerformanceMode ? 50 : Math.min(dataSize, 100); // Increased limits
    
    if (dataSize <= maxSlices) {
      // Use all data if under limit
      return data.map((row, index) => ({
        name: row[xAxis],
        value: parseFloat(row[yAxis]) || 0,
        itemStyle: { color: currentColors[index % currentColors.length] }
      }));
    } else {
      // Group smaller slices into "Others" category instead of truncating
      const sortedData = data
        .map((row, index) => ({
          name: row[xAxis],
          value: parseFloat(row[yAxis]) || 0,
          originalIndex: index
        }))
        .sort((a, b) => b.value - a.value);
      
      const topSlices = sortedData.slice(0, maxSlices - 1);
      const otherSlices = sortedData.slice(maxSlices - 1);
      const othersValue = otherSlices.reduce((sum, item) => sum + item.value, 0);
      
      const pieData = topSlices.map((item, index) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: currentColors[index % currentColors.length] }
      }));
      
      if (othersValue > 0) {
        pieData.push({
          name: `Others (${otherSlices.length} items)`,
          value: othersValue,
          itemStyle: { color: currentColors[maxSlices % currentColors.length] }
        });
      }
      
      return pieData;
    }
  };

  const processScatterData = () => {
    if (!yAxis) return null;
    
    // Use full dataset with extreme performance optimizations
    const scatterData = data.map(row => [
      parseFloat(row[xAxis]) || 0,
      parseFloat(row[yAxis]) || 0
    ]).filter(point => !isNaN(point[0]) && !isNaN(point[1]));

    return [{
      data: scatterData,
      color: currentColors[0],
      // Enable large mode for performance
      large: autoOptimizations.echarts.large,
      largeThreshold: autoOptimizations.echarts.largeThreshold
    }];
  };

  const processHistogramData = () => {
    const values = data.map(row => parseFloat(row[xAxis]) || 0).filter(val => !isNaN(val));
    if (values.length === 0) return null;

    // Create histogram bins
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.max(5, Math.sqrt(values.length)));
    const binSize = (max - min) / binCount;

    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const count = values.filter(val => val >= binStart && val < binEnd).length;
      bins.push([binStart + binSize / 2, count]);
    }

    return bins;
  };

  const processBoxData = () => {
    const values = data.map(row => parseFloat(row[xAxis]) || 0).filter(val => !isNaN(val)).sort((a, b) => a - b);
    if (values.length === 0) return null;

    return values;
  };

  const processRadarData = () => {
    const numericColumns = Object.keys(data[0]).filter(key => {
      const value = data[0][key];
      return !isNaN(parseFloat(value)) && isFinite(value);
    }).slice(0, extremePerformanceMode ? 8 : 12); // Increased dimension limits

    const indicators = numericColumns.map(col => ({
      name: col,
      max: Math.max(...data.map(row => parseFloat(row[col]) || 0))
    }));

    const radarData = [{
      name: 'Data',
      value: numericColumns.map(col => {
        const values = data.map(row => parseFloat(row[col]) || 0);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      })
    }];

    return { indicators, data: radarData };
  };

  // Get ECharts option based on chart type
  const getEChartsOption = () => {
    const chartData = processChartData();
    if (!chartData) return { title: { text: 'No Data', left: 'center' } };

    const baseOption = {
      title: {
        text: chartTitle,
        left: 'center',
        textStyle: {
          color: '#374151',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: type === 'pie' ? 'item' : 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: currentColors[0],
        borderWidth: 1,
        textStyle: { color: '#374151' },
        confine: true,
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: currentColors[0],
            width: 1,
            type: 'dashed'
          },
          crossStyle: {
            color: currentColors[0]
          }
        },
        formatter: (params) => {
          if (Array.isArray(params)) {
            let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValueLabel}</div>`;
            params.forEach(param => {
              result += `<div style="display: flex; align-items: center; margin: 2px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                <span style="margin-right: 15px;">${param.seriesName}:</span>
                <span style="font-weight: bold;">${param.value}</span>
              </div>`;
            });
            return result;
          }
          return `<div style="font-weight: bold;">${params.name}: ${params.value}</div>`;
        }
      },
      legend: {
        type: 'scroll',
        top: '8%',
        textStyle: { color: '#6B7280', fontSize: 12 },
        pageButtonItemGap: 5,
        pageButtonGap: 10,
        pageButtonPosition: 'end',
        selector: true,
        selectorLabel: {
          show: true,
          borderRadius: 10,
          padding: [3, 5, 3, 5],
          fontSize: 10
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '10%',
        top: '20%',
        containLabel: true
      },
      // Enhanced interactive features - removed brush selection
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: currentColors[0],
          fillerColor: currentColors[0] + '20',
          handleStyle: {
            color: currentColors[0],
            borderColor: currentColors[0]
          },
          moveHandleStyle: {
            color: currentColors[0]
          },
          selectedDataBackground: {
            lineStyle: {
              color: currentColors[0]
            },
            areaStyle: {
              color: currentColors[0] + '20'
            }
          },
          emphasis: {
            handleStyle: {
              color: currentColors[1]
            },
            moveHandleStyle: {
              color: currentColors[1]
            }
          }
        }
      ],
      // Removed toolbox - using custom header controls instead
      animationDuration: showAnimation ? 1000 : 0,
      animationEasing: 'cubicOut',
      animationDurationUpdate: showAnimation ? 800 : 0,
      animationEasingUpdate: 'cubicInOut'
    };

    switch (type) {
      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.categories,
            axisLabel: { color: '#6B7280', rotate: chartData.categories.length > 10 ? 45 : 0 },
            axisLine: { lineStyle: { color: '#E5E7EB' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
          },
          series: chartData.series.map(s => ({
            ...s,
            type: 'bar',
            // Enhanced large mode support with extreme performance optimizations
            large: autoOptimizations.echarts.large,
            largeThreshold: autoOptimizations.echarts.largeThreshold,
            progressive: autoOptimizations.echarts.progressive,
            progressiveThreshold: autoOptimizations.echarts.progressive ? 1000 : 0,
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: s.color },
                { offset: 1, color: s.color + '80' }
              ])
            },
            emphasis: {
              itemStyle: {
                shadowBlur: extremePerformanceMode ? 5 : 10, // Reduce shadow for performance
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            }
          }))
        };

      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.categories,
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
          },
          series: chartData.series.map(s => ({
            ...s,
            type: 'line',
            // Enhanced large mode support with extreme performance optimizations
            large: autoOptimizations.echarts.large,
            largeThreshold: autoOptimizations.echarts.largeThreshold,
            progressive: autoOptimizations.echarts.progressive,
            progressiveThreshold: autoOptimizations.echarts.progressive ? 1000 : 0,
            smooth: !extremePerformanceMode || data.length < 10000, // Disable smoothing for ultra-large datasets
            lineStyle: { width: 3, color: s.color },
            itemStyle: { 
              borderWidth: 3,
              color: s.color,
              shadowBlur: extremePerformanceMode ? 2 : 5, // Reduce shadow for performance
              shadowColor: s.color + '40'
            },
            symbol: extremePerformanceMode && data.length > 10000 ? 'none' : 'circle', // Hide symbols for ultra-large datasets
            symbolSize: extremePerformanceMode ? 4 : 8, // Smaller symbols for performance
            sampling: autoOptimizations.echarts.progressive ? 'lttb' : undefined // Line-To-Line-Binary-Tree sampling for progressive rendering
          }))
        };

      case 'area':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chartData.categories,
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
          },
          series: chartData.series.map((s, index) => ({
            ...s,
            type: 'line',
            smooth: true,
            stack: series ? 'total' : undefined,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: s.color + '80' },
                { offset: 1, color: s.color + '20' }
              ])
            },
            lineStyle: { width: 2, color: s.color }
          }))
        };

      case 'pie':
        return {
          ...baseOption,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '55%'],
            data: chartData,
            label: {
              show: true,
              formatter: '{b}: {d}%',
              fontSize: 12
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            }
          }]
        };

      case 'scatter':
        return {
          ...baseOption,
          xAxis: {
            type: 'value',
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
          },
          series: chartData.map(s => ({
            type: 'scatter',
            data: s.data,
            itemStyle: {
              color: s.color,
              shadowBlur: 5,
              shadowColor: s.color + '40'
            },
            symbolSize: 8
          }))
        };

      case 'radar':
        return {
          ...baseOption,
          radar: {
            indicator: chartData.indicators,
            center: ['50%', '55%'],
            radius: '60%',
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
          },
          series: [{
            type: 'radar',
            data: chartData.data,
            areaStyle: {
              opacity: 0.3,
              color: currentColors[0] + '50'
            },
            lineStyle: { color: currentColors[0], width: 2 },
            itemStyle: { color: currentColors[0] }
          }]
        };

      default:
        return baseOption;
    }
  };

  // Get Plotly data for specific chart types
  const getPlotlyData = () => {
    const chartData = processChartData();
    if (!chartData) return null;

    switch (type) {
      case 'histogram':
        return [{
          x: chartData.map(point => point[0]),
          y: chartData.map(point => point[1]),
          type: 'bar',
          marker: { color: currentColors[0], opacity: 0.7 },
          name: 'Frequency'
        }];

      case 'box':
        return [{
          y: chartData,
          type: 'box',
          name: xAxis,
          marker: { color: currentColors[0] },
          boxpoints: 'outliers'
        }];

      case 'bubble':
        const bubbleData = data.map(row => [
          parseFloat(row[xAxis]) || 0,
          parseFloat(row[yAxis]) || 0,
          Math.abs(parseFloat(row[series]) || 10)
        ]).filter(point => !isNaN(point[0]) && !isNaN(point[1]));

        return [{
          x: bubbleData.map(point => point[0]),
          y: bubbleData.map(point => point[1]),
          mode: 'markers',
          // Use WebGL for performance with large datasets
          type: autoOptimizations.plotly.useWebGL && bubbleData.length > autoOptimizations.plotly.webglpointthreshold ? 'scattergl' : 'scatter',
          marker: {
            size: bubbleData.map(point => point[2]),
            color: currentColors[0],
            sizemode: 'diameter',
            sizeref: 2.0 * Math.max(...bubbleData.map(point => point[2])) / (40 ** 2),
            sizemin: 4,
            opacity: 0.7
          },
          // Remove the hardcoded type since we set it above conditionally
        }];

      default:
        return null;
    }
  };

  const plotlyLayout = {
    title: {
      text: chartTitle,
      font: { size: 16, color: '#374151' }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#6B7280', size: 12 },
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.1,
      x: 0.5,
      xanchor: 'center'
    },
    margin: { l: 50, r: 50, t: 80, b: 100 },
    xaxis: { 
      gridcolor: '#F3F4F6', 
      title: { text: xAxis },
      showspikes: true,
      spikecolor: currentColors[0],
      spikethickness: 2,
      spikedash: 'dot'
    },
    yaxis: { 
      gridcolor: '#F3F4F6', 
      title: { text: yAxis },
      showspikes: true,
      spikecolor: currentColors[0],
      spikethickness: 2,
      spikedash: 'dot'
    },
    // Enhanced interactivity
    dragmode: 'zoom',
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'rgba(255, 255, 255, 0.95)',
      bordercolor: currentColors[0],
      font: { color: '#374151' }
    },
    // Responsive behavior
    responsive: true,
    autosize: true
  };

  const getChartIcon = () => {
    const iconProps = { className: "w-4 h-4" };
    switch (type) {
      case 'bar': return <BarChart3 {...iconProps} />;
      case 'line': return <LineChart {...iconProps} />;
      case 'area': return <Activity {...iconProps} />;
      case 'pie': return <PieChart {...iconProps} />;
      case 'scatter': return <ScatterChart {...iconProps} />;
      case 'scatter3d': return <Box {...iconProps} />;
      case 'surface3d': return <Eye {...iconProps} />;
      case 'mesh3d': return <Box {...iconProps} />;
      case 'bar3d': return <BarChart3 {...iconProps} />;
      case 'bubble': return <ScatterChart {...iconProps} />;
      default: return <TrendingUp {...iconProps} />;
    }
  };

  const renderChart = () => {
    // Handle 3D Charts with our custom renderer
    if (['scatter3d', 'surface3d', 'mesh3d', 'bar3d'].includes(type)) {
      return (
        <Chart3DRenderer
          data={data}
          type={type}
          title={chartTitle}
          xAxis={xAxis}
          yAxis={yAxis}
          zAxis={series?.[0]?.name || 'z'}
          colorScheme={colorScheme}
          onColorSchemeChange={onColorSchemeChange}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onSave={onSave}
          enableSave={enableSave !== false}
          autoRotate={false}
          showControls={true}
          extremePerformanceMode={extremePerformanceMode}
          performanceLevel={performanceLevel}
          className="border-0 shadow-none"
        />
      );
    }

    if (['histogram', 'box', 'bubble'].includes(type)) {
      const plotlyData = getPlotlyData();
      if (!plotlyData) return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;

      return (
        <Plot
          data={plotlyData}
          layout={plotlyLayout}
          style={{ 
            width: '100%', 
            height: '100%',
            minWidth: data.length > 50 ? `${Math.max(800, data.length * 12)}px` : '100%'
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToAdd: ['drawline', 'drawopenpath', 'drawclosedpath', 'drawcircle', 'drawrect', 'eraseshape'],
            modeBarButtonsToRemove: ['lasso2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: chartTitle.replace(/\s+/g, '_').toLowerCase(),
              height: 500,
              width: Math.max(700, data.length * 12),
              scale: 2
            },
            scrollZoom: true,
            doubleClick: 'reset+autosize',
            showTips: true,
            plotGlPixelRatio: 2
          }}
          onInitialized={(figure, graphDiv) => setIsLoading(false)}
          onUpdate={(figure, graphDiv) => console.log('Chart updated')}
          onRelayout={(eventdata) => console.log('Chart relayout:', eventdata)}
          onSelected={(eventdata) => console.log('Data selected:', eventdata)}
          onDeselect={() => console.log('Selection cleared')}
        />
      );
    }

    return (
      <ReactECharts
        ref={chartRef}
        option={getEChartsOption()}
        style={{ 
          width: '100%', 
          height: '100%',
          minWidth: data.length > 50 ? `${Math.max(800, data.length * 12)}px` : '100%'
        }}
        opts={{ 
          renderer: 'canvas', 
          locale: 'en',
          // Enhanced performance optimizations
          useDirtyRect: autoOptimizations.echarts.useDirtyRect,
          useCoarsePointer: autoOptimizations.echarts.useCoarsePointer,
          // Progressive rendering for ultra-large datasets
          progressiveThreshold: autoOptimizations.echarts.progressive || 0
        }}
        onEvents={{
          'finished': () => {
            setIsLoading(false);
            // Progressive rendering complete callback
            if (extremePerformanceMode && typeof window !== 'undefined') {
              window.requestIdleCallback?.(() => {
                console.log(`Chart rendered with ${data.length} points in extreme performance mode`);
              });
            }
          },
          'click': (params) => {
            console.log('Chart clicked:', params);
            // Add custom click handlers here
          },
          'mouseover': (params) => {
            // Enhanced hover effects with performance consideration
            if (!extremePerformanceMode || data.length < 10000) {
              const chart = chartRef.current?.getEchartsInstance();
              if (chart) {
                chart.dispatchAction({
                  type: 'highlight',
                  seriesIndex: params.seriesIndex,
                  dataIndex: params.dataIndex
                });
              }
            }
          },
          'mouseout': (params) => {
            if (!extremePerformanceMode || data.length < 10000) {
              const chart = chartRef.current?.getEchartsInstance();
              if (chart) {
                chart.dispatchAction({
                  type: 'downplay',
                  seriesIndex: params.seriesIndex,
                  dataIndex: params.dataIndex
                });
              }
            }
          },
          'legendselectchanged': (params) => {
            console.log('Legend selection changed:', params);
          },
          'dataZoom': (params) => {
            console.log('Data zoom changed:', params);
          }
        }}
        onChartReady={(chart) => {
          console.log('Chart ready');
          // Chart ready for interaction
        }}
        shouldSetOption={(prevProps, nextProps) => {
          // Optimize re-renders for real-time updates
          return JSON.stringify(prevProps.option) !== JSON.stringify(nextProps.option);
        }}
      />
    );
  };

  return (
    <>
      {/* Custom CSS for chart container scrolling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .chart-container-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          }
          .chart-container-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .chart-container-scroll::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 4px;
            margin: 0 4px;
          }
          .chart-container-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .chart-container-scroll::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
          .dark .chart-container-scroll {
            scrollbar-color: #4a5568 #2d3748;
          }
          .dark .chart-container-scroll::-webkit-scrollbar-track {
            background: #2d3748;
          }
          .dark .chart-container-scroll::-webkit-scrollbar-thumb {
            background: #4a5568;
            border-color: #374151;
          }
          .dark .chart-container-scroll::-webkit-scrollbar-thumb:hover {
            background: #718096;
          }
          .chart-content-wrapper {
            position: relative;
          }
          /* Ensure tooltips are properly positioned within scroll container */
          .chart-content-wrapper .recharts-tooltip-wrapper,
          .chart-content-wrapper [class*="tooltip"] {
            z-index: 1000;
            pointer-events: auto;
          }
          /* Prevent chart container from extending beyond viewport */
          .chart-container-scroll {
            box-sizing: border-box;
          }
          .chart-content-wrapper {
            position: relative;
            min-height: 100%;
          }
          /* Ensure charts render properly within scrollable container */
          .chart-content-wrapper > div {
            width: 100% !important;
            height: 100% !important;
          }
        `
      }} />
      
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-full`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {getChartIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {chartTitle}
          </h3>
          <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">
            {type}
          </span>
          
          {/* 3D Chart Indicator */}
          {['scatter3d', 'surface3d', 'mesh3d', 'bar3d'].includes(type) && (
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full font-medium">
              🌟 3D
            </span>
          )}
          
          {/* Performance Mode Indicator - Enhanced */}
          {(extremePerformanceMode || performanceMode) && (
            <div className="relative">
              <span 
                className={`px-2 py-1 text-xs rounded-full cursor-help font-medium ${
                  extremePerformanceMode 
                    ? performanceLevel === 'ultra' 
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                }`}
                onMouseEnter={() => setShowTooltip('performance')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                {extremePerformanceMode 
                  ? `🚀 ${String(performanceLevel || 'normal').toUpperCase()} MODE` 
                  : 'Performance Mode'
                }
              </span>
              {showTooltip === 'performance' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 max-w-xs">
                  <div className="text-center">
                    {extremePerformanceMode ? (
                      <>
                        <div className="font-semibold mb-1">🚀 Extreme Performance Active</div>
                        <div>Rendering {data.length.toLocaleString()} points with:</div>
                        <div className="mt-1 text-left space-y-1">
                          {renderingStrategy === 'progressive' && <div>• Progressive rendering</div>}
                          {renderingStrategy === 'webgl' && <div>• WebGL acceleration</div>}
                          {renderingStrategy === 'large' && <div>• Large dataset mode</div>}
                          <div>• Memory optimization</div>
                          <div>• No sampling/truncation</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold mb-1">Performance Mode Active</div>
                        <div>Optimized rendering for better performance</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Full Dataset Toggle */}
          {performanceMode && samplingInfo && (
            <div className="relative">
              <button
                onClick={() => {
                  if (window.confirm('Rendering the full dataset may impact performance. Continue?')) {
                    // Trigger full data reload
                    window.location.reload(); // Temporary solution - ideally would use state management
                  }
                }}
                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                onMouseEnter={() => setShowTooltip('fulldata')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                Render Full Data
              </button>
              {showTooltip === 'fulldata' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 max-w-xs">
                  Show complete dataset without sampling ({totalDataRows.toLocaleString()} rows)
                </div>
              )}
            </div>
          )}
          
          {/* Custom Toolbox Controls */}
          <div className="relative">
            <button
              onClick={() => setShowColorPalette(!showColorPalette)}
              className="p-2 text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              onMouseEnter={() => setShowTooltip('palette')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Palette className="w-4 h-4" />
              {showTooltip === 'palette' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Color Palette
                </div>
              )}
            </button>
            
            {showColorPalette && (
              <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(colorSchemes).map(([scheme, colors]) => (
                    <button
                      key={scheme}
                      onClick={() => handleColorSchemeChange(scheme)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      style={{ backgroundColor: colors[0] }}
                      title={scheme}
                    >
                      {colorScheme === scheme && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleDragMode}
            className={`p-2 rounded-lg transition-colors ${
              isDragMode 
                ? 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/20' 
                : 'text-orange-500 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
            }`}
            onMouseEnter={() => setShowTooltip('drag')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <Move className="w-4 h-4" />
            {showTooltip === 'drag' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                {isDragMode ? "Disable drag mode" : "Enable drag mode"}
              </div>
            )}
          </button>

          {/* Zoom Controls */}
          <button
            onClick={handleZoomIn}
            className="p-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors relative"
            onMouseEnter={() => setShowTooltip('zoomIn')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <ZoomIn className="w-4 h-4" />
            {showTooltip === 'zoomIn' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                Zoom In
              </div>
            )}
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors relative"
            onMouseEnter={() => setShowTooltip('zoomOut')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <ZoomOut className="w-4 h-4" />
            {showTooltip === 'zoomOut' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                Zoom Out
              </div>
            )}
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors relative"
            onMouseEnter={() => setShowTooltip('reset')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <RotateCcw className="w-4 h-4" />
            {showTooltip === 'reset' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                Reset View
              </div>
            )}
          </button>

          {/* Chart Management Buttons */}
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors relative"
              onMouseEnter={() => setShowTooltip('edit')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Edit3 className="w-4 h-4" />
              {showTooltip === 'edit' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Edit Chart
                </div>
              )}
            </button>
          )}
          
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(id)}
              className="p-2 text-green-500 hover:text-green-700 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors relative"
              onMouseEnter={() => setShowTooltip('duplicate')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Copy className="w-4 h-4" />
              {showTooltip === 'duplicate' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Duplicate Chart
                </div>
              )}
            </button>
          )}
          
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors relative"
              onMouseEnter={() => setShowTooltip('remove')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Trash2 className="w-4 h-4" />
              {showTooltip === 'remove' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Remove Chart
                </div>
              )}
            </button>
          )}

          {/* Export Menu */}
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              onMouseEnter={() => setShowTooltip('export')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Download className="w-4 h-4" />
              {showTooltip === 'export' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Export Chart
                </div>
              )}
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-1">
                  <button
                    onClick={() => exportChart('png')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FileImage className="w-4 h-4" />
                    <span>PNG</span>
                  </button>
                  <button
                    onClick={() => exportChart('jpg')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FileImage className="w-4 h-4" />
                    <span>JPG</span>
                  </button>
                  <button
                    onClick={() => exportChart('svg')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FileImage className="w-4 h-4" />
                    <span>SVG</span>
                  </button>
                  <button
                    onClick={() => exportChart('pdf')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Edit chart"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Content with Proper Container Scrolling */}
      <div className={`relative ${['scatter3d', 'surface3d', 'mesh3d', 'bar3d'].includes(type) ? 'h-auto min-h-[800px]' : 'h-80'}`}>
        {/* Chart container with horizontal scroll (includes tooltips) */}
        <div 
          className={`chart-container-scroll ${data.length > 50 ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}`}
          style={{ 
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Chart content wrapper with dynamic width */}
          <div 
            className="chart-content-wrapper h-full relative" 
            style={{ 
              width: data.length > 50 ? `${Math.max(800, data.length * 12)}px` : '100%',
              minWidth: '100%'
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
            )}
            {renderChart()}
          </div>
        </div>
        
        {/* Horizontal scroll indicator for large datasets */}
        {data.length > 50 && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
            Scroll horizontally to view all data →
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default AdvancedChart;
