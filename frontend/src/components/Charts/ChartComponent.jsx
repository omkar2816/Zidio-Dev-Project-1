import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import Plot from 'react-plotly.js';
import { 
  CHART_COLORS, 
  ANIMATION_CONFIG, 
  processDataForChart, 
  exportChart,
  optimizeDataForLargeDataset,
  getResponsiveOptions
} from '../../utils/chartUtils';
import { 
  Download, 
  Settings, 
  Maximize2, 
  RefreshCw,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Activity,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChartComponent = ({ 
  data = [], 
  chartType = 'bar', 
  title = 'Chart',
  xAxis = null,
  yAxis = null,
  series = null,
  options = {},
  onConfigChange = null,
  className = ''
}) => {
  const chartRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [plotlyData, setPlotlyData] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

  // Process data when inputs change
  useEffect(() => {
    if (data && data.length > 0 && xAxis && yAxis) {
      setIsLoading(true);
      try {
        // Optimize for large datasets
        const optimizedData = optimizeDataForLargeDataset(data, 1000);
        const processed = processDataForChart(optimizedData, chartType, xAxis, yAxis, series);
        
        if (processed) {
          setChartData(processed);
          
          // Also prepare Plotly data for certain chart types
          if (['bubble', 'box', 'histogram'].includes(chartType)) {
            setPlotlyData(prepareePlotlyData(processed, chartType));
          }
        }
      } catch (error) {
        console.error('Chart data processing error:', error);
        toast.error('Failed to process chart data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [data, chartType, xAxis, yAxis, series]);

  // Prepare Plotly data
  const prepareePlotlyData = useCallback((processedData, type) => {
    switch (type) {
      case 'bubble':
        return [{
          x: processedData.map(point => point[0]),
          y: processedData.map(point => point[1]),
          mode: 'markers',
          marker: {
            size: processedData.map(point => point[2]),
            color: CHART_COLORS.primary,
            sizemode: 'diameter',
            sizeref: 2.0 * Math.max(...processedData.map(point => point[2])) / (40 ** 2),
            sizemin: 4
          },
          type: 'scatter'
        }];
      
      case 'box':
        return [{
          y: data.map(row => parseFloat(row[yAxis])).filter(val => !isNaN(val)),
          type: 'box',
          name: yAxis,
          marker: { color: CHART_COLORS.primary }
        }];
      
      case 'histogram':
        return [{
          x: data.map(row => parseFloat(row[xAxis])).filter(val => !isNaN(val)),
          type: 'histogram',
          marker: { color: CHART_COLORS.primary },
          opacity: 0.7
        }];
      
      default:
        return null;
    }
  }, [data, xAxis, yAxis]);

  // ECharts configuration
  const getEChartsOption = useCallback(() => {
    if (!chartData) return {};

    const baseOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: '#374151',
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: chartType === 'pie' ? 'item' : 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: CHART_COLORS.primary,
        borderWidth: 1,
        textStyle: { color: '#374151' },
        axisPointer: {
          type: 'shadow',
          shadowStyle: { color: 'rgba(5, 150, 105, 0.1)' }
        }
      },
      legend: {
        top: '8%',
        textStyle: { color: '#6B7280' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      ...getResponsiveOptions(containerSize.width, containerSize.height),
      ...options
    };

    switch (chartType) {
      case 'bar':
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
            type: 'bar',
            animationDuration: 1000,
            animationEasing: 'cubicOut',
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
            animationDuration: 1200,
            animationEasing: 'elasticOut',
            lineStyle: { width: 3 },
            itemStyle: { borderWidth: 3 },
            areaStyle: {
              opacity: 0.1,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: s.color + '40' },
                { offset: 1, color: s.color + '10' }
              ])
            }
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
          series: chartData.series.map(s => ({
            ...s,
            type: 'line',
            smooth: true,
            stack: 'total',
            animationDuration: 1000,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: s.color + '80' },
                { offset: 1, color: s.color + '20' }
              ])
            }
          }))
        };

      case 'pie':
        return {
          ...baseOption,
          series: [{
            type: 'pie',
            radius: ['30%', '70%'],
            center: ['50%', '55%'],
            data: chartData,
            animationDuration: 1500,
            animationEasing: 'bounceOut',
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)'
            },
            labelLine: { show: true },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'radar':
        // Process radar data inline since it's not exported
        const radarIndicators = series ? [series] : Object.keys(data[0]).filter(key => {
          const value = data[0][key];
          return !isNaN(parseFloat(value)) && isFinite(value);
        }).slice(0, 5); // Limit to 5 indicators for readability
        
        const radarData = {
          indicators: radarIndicators.map(col => ({
            name: col,
            max: Math.max(...data.map(row => parseFloat(row[col]) || 0))
          })),
          data: [{
            name: 'Data',
            value: radarIndicators.map(col => {
              const values = data.map(row => parseFloat(row[col]) || 0);
              return values.reduce((sum, val) => sum + val, 0) / values.length;
            })
          }]
        };

        return {
          ...baseOption,
          radar: {
            indicator: radarData.indicators,
            center: ['50%', '55%'],
            radius: '60%'
          },
          series: [{
            type: 'radar',
            data: radarData.data,
            animationDuration: 1000,
            areaStyle: {
              opacity: 0.3,
              color: CHART_COLORS.primary + '50'
            },
            lineStyle: { color: CHART_COLORS.primary }
          }]
        };

      default:
        return baseOption;
    }
  }, [chartData, chartType, title, containerSize, options, data, series, yAxis]);

  // Plotly layout
  const plotlyLayout = {
    title: {
      text: title,
      font: { size: 18, color: '#374151' }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#6B7280' },
    showlegend: true,
    margin: { l: 60, r: 60, t: 60, b: 60 },
    ...options.plotlyLayout
  };

  // Export functions
  const handleExport = async (format) => {
    setIsLoading(true);
    try {
      const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}`;
      await exportChart(chartRef, filename, format);
      toast.success(`Chart exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Force re-render
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Chart refreshed');
    }, 500);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render chart based on type
  const renderChart = () => {
    if (['bubble', 'box', 'histogram'].includes(chartType) && plotlyData) {
      return (
        <Plot
          data={plotlyData}
          layout={plotlyLayout}
          style={{ width: '100%', height: '100%' }}
          config={{
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToAdd: ['pan2d', 'select2d', 'lasso2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: title.replace(/\s+/g, '_'),
              height: 500,
              width: 700,
              scale: 1
            }
          }}
        />
      );
    }

    return (
      <ReactECharts
        ref={chartRef}
        option={getEChartsOption()}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={{
          'finished': () => setIsLoading(false)
        }}
      />
    );
  };

  const getChartIcon = () => {
    const iconProps = { className: "w-4 h-4" };
    switch (chartType) {
      case 'bar': return <BarChart3 {...iconProps} />;
      case 'line': return <LineChart {...iconProps} />;
      case 'pie': return <PieChart {...iconProps} />;
      case 'bubble': 
      case 'scatter': return <ScatterChart {...iconProps} />;
      case 'area': return <Activity {...iconProps} />;
      default: return <TrendingUp {...iconProps} />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg ${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {getChartIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">
            {chartType}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh chart"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {onConfigChange && (
            <button
              onClick={() => onConfigChange(chartType, xAxis, yAxis, series)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Chart settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative group">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Export chart"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="p-2 space-y-1 min-w-24">
                {['png', 'jpg', 'svg', 'pdf'].map(format => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className={`relative ${isFullscreen ? 'h-full' : 'h-96'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading chart...</span>
            </div>
          </div>
        )}
        
        {chartData || plotlyData ? renderChart() : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="mb-2">{getChartIcon()}</div>
              <p>No data available for chart</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartComponent;
