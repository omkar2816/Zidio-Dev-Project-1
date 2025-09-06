import React, { useRef, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import Plot from 'react-plotly.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BarChart3, LineChart, PieChart, ScatterChart, Activity, TrendingUp, Settings, Download, FileImage, FileText, Edit3, Copy, Trash2, Palette, Move, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  onColorSchemeChange = null,
  id = null,
  performanceMode = false,
  totalDataRows = 0,
  displayedRows = 0,
  samplingInfo = null,
  gridView = false // New prop for grid view mode
}) => {
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [zoomLevel, setZoomLevel] = useState({ start: 0, end: 100 });

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

  const chartTitle = title || getDefaultTitle(type);

  // Color schemes
  const colorSchemes = {
    emerald: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
    blue: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#EFF6FF'],
    purple: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
    pink: ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#FDF2F8'],
    red: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'],
    orange: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFF7ED'],
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

  // Export functionality
  const exportChart = async (format) => {
    try {
      setIsLoading(true);
      const chartElement = chartRef.current?.getEchartsInstance?.()?.getDom() || 
                          chartRef.current?.parentElement?.querySelector('.js-plotly-plot') ||
                          chartRef.current?.parentElement;
      
      if (!chartElement) {
        console.error('Chart element not found');
        return;
      }

      switch (format) {
        case 'png':
        case 'jpg':
          await exportAsImage(chartElement, format);
          break;
        case 'pdf':
          await exportAsPDF(chartElement);
          break;
        case 'svg':
          await exportAsSVG();
          break;
        default:
          console.error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export failed:', error);
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
        default:
          return processXYData();
      }
    } catch (error) {
      console.error('Error processing chart data:', error);
      return null;
    }
  };

  const processXYData = () => {
    const categories = data.map(row => row[xAxis]).slice(0, 20); // Limit for performance
    
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
          data: seriesGroups[name].slice(0, 20),
          color: currentColors[index % currentColors.length]
        }))
      };
    } else {
      // Single series - remove slice limit to use full data
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
    const pieData = data.slice(0, 10).map((row, index) => ({
      name: row[xAxis],
      value: parseFloat(row[yAxis]) || 0,
      itemStyle: { color: currentColors[index % currentColors.length] }
    }));
    return pieData;
  };

  const processScatterData = () => {
    if (!yAxis) return null;
    
    // Remove slice limit to use full scatter data
    const scatterData = data.map(row => [
      parseFloat(row[xAxis]) || 0,
      parseFloat(row[yAxis]) || 0
    ]).filter(point => !isNaN(point[0]) && !isNaN(point[1]));

    return [{
      data: scatterData,
      color: currentColors[0]
    }];
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
        confine: true
      },
      legend: {
        type: 'scroll',
        top: '8%',
        textStyle: { color: '#6B7280', fontSize: 12 }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '10%',
        top: '20%',
        containLabel: true
      },
      animationDuration: showAnimation ? 1000 : 0,
      animationEasing: 'cubicOut'
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
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: s.color },
                { offset: 1, color: s.color + '80' }
              ])
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
            smooth: true,
            lineStyle: { width: 3, color: s.color },
            itemStyle: { 
              borderWidth: 3,
              color: s.color
            },
            symbol: 'circle',
            symbolSize: 8
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
            itemStyle: { color: s.color },
            symbolSize: 8
          }))
        };

      default:
        return baseOption;
    }
  };

  const renderChart = () => {
    return (
      <ReactECharts
        ref={chartRef}
        option={getEChartsOption()}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas', locale: 'en' }}
        onEvents={{
          'finished': () => setIsLoading(false)
        }}
      />
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
            {(() => {
              const iconProps = { className: "w-4 h-4 text-emerald-600 dark:text-emerald-400" };
              switch (type) {
                case 'bar': return <BarChart3 {...iconProps} />;
                case 'line': return <LineChart {...iconProps} />;
                case 'area': return <Activity {...iconProps} />;
                case 'pie': return <PieChart {...iconProps} />;
                case 'scatter':
                case 'bubble': return <ScatterChart {...iconProps} />;
                default: return <TrendingUp {...iconProps} />;
              }
            })()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chartTitle}
            </h3>
            {performanceMode && samplingInfo && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {displayedRows.toLocaleString()} of {totalDataRows.toLocaleString()} rows (optimized)
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* In grid view, show only essential controls */}
          {gridView ? (
            // Grid view: Only download option
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Download Chart"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {showExportMenu && (
                <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 min-w-[120px]">
                  <button
                    onClick={() => exportChart('png')}
                    disabled={isLoading}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <FileImage className="w-4 h-4" />
                    <span>PNG</span>
                  </button>
                  <button
                    onClick={() => exportChart('pdf')}
                    disabled={isLoading}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Full view: All controls with tooltips
            <>
              {/* Color Palette */}
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
            </>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className="relative h-80">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        )}
        {renderChart()}
      </div>
    </div>
  );
};

export default AdvancedChart;
