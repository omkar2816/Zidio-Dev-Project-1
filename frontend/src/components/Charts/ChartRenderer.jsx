import React, { useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import Plot from 'react-plotly.js';
import { 
  Download, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Camera,
  FileImage,
  FileText,
  Box,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import Chart3DRenderer from './Chart3DRenderer';

const ChartRenderer = ({ 
  chart, 
  chartId, 
  onPreferencesChange, 
  preferences = {},
  onFullscreen 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chartRef = useRef(null);
  const plotlyRef = useRef(null);

  // Emerald color palette
  const emeraldColors = [
    '#10b981', '#065f46', '#34d399', '#047857', '#6ee7b7',
    '#059669', '#a7f3d0', '#064e3b', '#d1fae5', '#022c22'
  ];

  // Enhanced chart options with emerald theme and animations
  const getEChartsOption = () => {
    const baseOption = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      tooltip: {
        trigger: chart.type === 'pie' ? 'item' : 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#10b981',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(16, 185, 129, 0.1)'
          }
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { color: '#6b7280' }
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {
            show: true,
            title: 'Save as Image',
            iconStyle: { color: '#10b981' }
          },
          dataZoom: {
            show: true,
            title: { zoom: 'Zoom', back: 'Reset Zoom' },
            iconStyle: { color: '#10b981' }
          },
          restore: {
            show: true,
            title: 'Restore',
            iconStyle: { color: '#10b981' }
          }
        },
        iconStyle: { borderColor: '#10b981' },
        emphasis: { iconStyle: { borderColor: '#059669' } }
      }
    };

    switch (chart.type) {
      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chart.data.map(item => item[chart.xAxis] || item.x || item.name),
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280', rotate: preferences.rotateLabels ? 45 : 0 }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
          },
          series: [{
            name: chart.title,
            type: 'bar',
            data: chart.data.map(item => item[chart.yAxis] || item.y || item.value),
            itemStyle: {
              color: (params) => emeraldColors[params.dataIndex % emeraldColors.length],
              borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(16, 185, 129, 0.3)'
              }
            },
            animationDelay: (idx) => idx * 100
          }]
        };

      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chart.data.map(item => item[chart.xAxis] || item.x),
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
          },
          series: [{
            name: chart.title,
            type: 'line',
            data: chart.data.map(item => item[chart.yAxis] || item.y),
            smooth: preferences.smoothLine !== false,
            lineStyle: { 
              color: '#10b981',
              width: 3
            },
            itemStyle: { color: '#10b981' },
            areaStyle: preferences.showArea ? {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                ]
              }
            } : null,
            symbol: 'circle',
            symbolSize: 6,
            animationDelay: (idx) => idx * 50
          }]
        };

      case 'pie':
        return {
          ...baseOption,
          series: [{
            name: chart.title,
            type: 'pie',
            radius: preferences.donut ? ['40%', '70%'] : '70%',
            center: ['50%', '60%'],
            data: chart.data.map((item, index) => ({
              name: item.name || item[chart.labelField] || `Item ${index}`,
              value: item.value || item[chart.valueField],
              itemStyle: {
                color: emeraldColors[index % emeraldColors.length]
              }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(16, 185, 129, 0.3)'
              }
            },
            label: {
              formatter: preferences.showPercentage ? '{b}: {d}%' : '{b}: {c}',
              color: '#6b7280'
            },
            animationType: 'scale',
            animationEasing: 'elasticOut'
          }]
        };

      case 'scatter':
        return {
          ...baseOption,
          xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
          },
          series: [{
            name: chart.title,
            type: 'scatter',
            data: chart.data.map(item => [
              item[chart.xAxis] || item.x,
              item[chart.yAxis] || item.y
            ]),
            symbolSize: (data, params) => preferences.dynamicSize ? 
              Math.max(6, Math.min(20, params.data[0] / 10)) : 8,
            itemStyle: {
              color: (params) => emeraldColors[params.dataIndex % emeraldColors.length],
              opacity: 0.8
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(16, 185, 129, 0.3)'
              }
            }
          }]
        };

      case 'area':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: chart.data.map(item => item[chart.xAxis] || item.x),
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
          },
          series: [{
            name: chart.title,
            type: 'line',
            data: chart.data.map(item => item[chart.yAxis] || item.y),
            smooth: true,
            lineStyle: { color: '#10b981', width: 3 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(16, 185, 129, 0.6)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
                ]
              }
            },
            itemStyle: { color: '#10b981' }
          }]
        };

      case 'histogram':
        // Prepare histogram data
        const values = chart.data.map(item => item[chart.valueField] || item.value);
        const bins = preferences.bins || 10;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / bins;
        const histogramData = Array(bins).fill(0);
        
        values.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
          histogramData[binIndex]++;
        });

        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: Array(bins).fill(0).map((_, i) => 
              `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`
            ),
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280', rotate: 45 }
          },
          yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#d1d5db' } },
            axisLabel: { color: '#6b7280' },
            splitLine: { lineStyle: { color: '#f3f4f6' } }
          },
          series: [{
            name: 'Frequency',
            type: 'bar',
            data: histogramData,
            itemStyle: {
              color: '#10b981',
              borderRadius: [2, 2, 0, 0]
            }
          }]
        };

      default:
        return baseOption;
    }
  };

  // Plotly.js configuration for 3D charts
  const getPlotlyConfig = () => {
    const config = {
      displayModeBar: true,
      modeBarButtonsToAdd: [
        {
          name: 'Download PNG',
          icon: { width: 24, height: 24, path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          click: () => downloadChart('png')
        }
      ],
      toImageButtonOptions: {
        format: 'png',
        filename: `chart_${chartId}`,
        height: 500,
        width: 800,
        scale: 2
      }
    };

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#6b7280' },
      scene: chart.type.includes('3d') ? {
        xaxis: { title: chart.axes?.x || 'X Axis', color: '#6b7280' },
        yaxis: { title: chart.axes?.y || 'Y Axis', color: '#6b7280' },
        zaxis: { title: chart.axes?.z || 'Z Axis', color: '#6b7280' },
        bgcolor: 'rgba(0,0,0,0)'
      } : {}
    };

    let plotData = [];

    switch (chart.type) {
      case 'scatter3d':
        plotData = [{
          x: chart.data.map(d => d.x),
          y: chart.data.map(d => d.y),
          z: chart.data.map(d => d.z),
          mode: 'markers',
          marker: {
            size: 8,
            color: chart.data.map((_, i) => emeraldColors[i % emeraldColors.length]),
            opacity: 0.8,
            line: { color: '#10b981', width: 1 }
          },
          type: 'scatter3d',
          name: chart.title
        }];
        break;

      case 'surface3d':
        // Prepare surface data
        const uniqueX = [...new Set(chart.data.map(d => d.x))].sort((a, b) => a - b);
        const uniqueY = [...new Set(chart.data.map(d => d.y))].sort((a, b) => a - b);
        const zMatrix = [];
        
        for (let i = 0; i < uniqueY.length; i++) {
          zMatrix[i] = [];
          for (let j = 0; j < uniqueX.length; j++) {
            const point = chart.data.find(d => d.x === uniqueX[j] && d.y === uniqueY[i]);
            zMatrix[i][j] = point ? point.z : 0;
          }
        }

        plotData = [{
          z: zMatrix,
          x: uniqueX,
          y: uniqueY,
          type: 'surface',
          colorscale: [
            [0, '#d1fae5'],
            [0.5, '#10b981'],
            [1, '#064e3b']
          ],
          name: chart.title
        }];
        break;

      case 'box':
        plotData = [{
          y: chart.data.map(d => d.value || d.y),
          type: 'box',
          name: chart.title,
          marker: { color: '#10b981' },
          line: { color: '#059669' }
        }];
        break;

      case 'bubble':
        plotData = [{
          x: chart.data.map(d => d.x),
          y: chart.data.map(d => d.y),
          mode: 'markers',
          marker: {
            size: chart.data.map(d => d.size || 10),
            color: chart.data.map((_, i) => emeraldColors[i % emeraldColors.length]),
            opacity: 0.7,
            sizemode: 'diameter',
            sizeref: 2.0 * Math.max(...chart.data.map(d => d.size || 10)) / (40**2),
            line: { color: '#10b981', width: 1 }
          },
          type: 'scatter',
          name: chart.title
        }];
        break;

      case 'radar':
        plotData = [{
          r: chart.data.map(d => d.value),
          theta: chart.data.map(d => d.category),
          fill: 'toself',
          type: 'scatterpolar',
          name: chart.title,
          line: { color: '#10b981' },
          fillcolor: 'rgba(16, 185, 129, 0.3)'
        }];
        layout.polar = {
          radialaxis: { visible: true, range: [0, Math.max(...chart.data.map(d => d.value))] }
        };
        break;

      default:
        plotData = [];
    }

    return { data: plotData, layout, config };
  };

  const downloadChart = async (format) => {
    setIsDownloading(true);
    try {
      if (chart.library === 'plotly' && plotlyRef.current) {
        const plotly = plotlyRef.current;
        const imageOptions = {
          format: format,
          width: 1200,
          height: 800,
          scale: 2
        };
        
        const url = await plotly.toImage(imageOptions);
        const link = document.createElement('a');
        link.download = `chart_${chartId}.${format}`;
        link.href = url;
        link.click();
      } else if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const url = echartsInstance.getDataURL({
          type: format,
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        const link = document.createElement('a');
        link.download = `chart_${chartId}.${format}`;
        link.href = url;
        link.click();
      }
      toast.success(`Chart downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {chart.title}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Chart Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => downloadChart('png')}
            disabled={isDownloading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Download PNG"
          >
            {isDownloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => downloadChart('svg')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Download SVG"
          >
            <FileImage className="h-4 w-4" />
          </button>
          {onFullscreen && (
            <button
              onClick={() => onFullscreen(chart)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4">
            {chart.type === 'line' && (
              <>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.smoothLine !== false}
                    onChange={(e) => onPreferencesChange({
                      ...preferences,
                      smoothLine: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Smooth Line</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.showArea}
                    onChange={(e) => onPreferencesChange({
                      ...preferences,
                      showArea: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Area</span>
                </label>
              </>
            )}
            {chart.type === 'pie' && (
              <>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.donut}
                    onChange={(e) => onPreferencesChange({
                      ...preferences,
                      donut: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Donut Chart</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.showPercentage}
                    onChange={(e) => onPreferencesChange({
                      ...preferences,
                      showPercentage: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Percentage</span>
                </label>
              </>
            )}
            {(chart.type === 'bar' || chart.type === 'scatter') && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.rotateLabels}
                  onChange={(e) => onPreferencesChange({
                    ...preferences,
                    rotateLabels: e.target.checked
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Rotate Labels</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-4">
        {/* Use Chart3DRenderer for 3D charts */}
        {['scatter3d', 'surface3d', 'mesh3d', 'bar3d'].includes(chart.type) ? (
          <Chart3DRenderer
            data={chart.data}
            type={chart.type}
            title={chart.title}
            xAxis={chart.xAxis || chart.axes?.x || 'x'}
            yAxis={chart.yAxis || chart.axes?.y || 'y'}
            zAxis={chart.zAxis || chart.axes?.z || 'z'}
            colorScheme="emerald"
            showControls={true}
            autoRotate={false}
            className="border-0 shadow-none"
          />
        ) : chart.library === 'plotly' ? (
          <Plot
            ref={plotlyRef}
            {...getPlotlyConfig()}
            style={{ width: '100%', height: '400px' }}
            useResizeHandler={true}
            className="plotly-chart"
          />
        ) : (
          <ReactECharts
            ref={chartRef}
            option={getEChartsOption()}
            style={{ height: '400px', width: '100%' }}
            opts={{ renderer: 'svg' }}
            className="echarts-chart"
          />
        )}
      </div>
    </div>
  );
};

export default ChartRenderer;
