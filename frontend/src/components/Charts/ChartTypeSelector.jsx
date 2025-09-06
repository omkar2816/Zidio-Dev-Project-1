import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Scatter, 
  Activity,
  TrendingUp,
  Box,
  Radar,
  Settings,
  Wand2
} from 'lucide-react';

const ChartTypeSelector = ({ 
  onSelectChart, 
  data, 
  headers,
  selectedTypes = [],
  onPreviewChart
}) => {
  const [selectedChartType, setSelectedChartType] = useState('');
  const [chartOptions, setChartOptions] = useState({
    xAxis: '',
    yAxis: '',
    groupBy: '',
    aggregation: 'sum',
    colorBy: '',
    sizeBy: ''
  });

  // Get numeric and categorical columns
  const numericColumns = headers.filter(header => {
    return data.some(row => {
      const value = row[header];
      return !isNaN(parseFloat(value)) && value !== '';
    });
  });

  const categoricalColumns = headers.filter(header => !numericColumns.includes(header));

  const chartTypes = [
    {
      type: 'bar',
      name: 'Bar Chart',
      icon: BarChart3,
      description: 'Compare categories',
      requirements: { categorical: 1, numeric: 1 },
      library: 'echarts'
    },
    {
      type: 'line',
      name: 'Line Chart',
      icon: LineChart,
      description: 'Show trends over time',
      requirements: { categorical: 1, numeric: 1 },
      library: 'echarts'
    },
    {
      type: 'area',
      name: 'Area Chart',
      icon: Activity,
      description: 'Filled line chart',
      requirements: { categorical: 1, numeric: 1 },
      library: 'echarts'
    },
    {
      type: 'pie',
      name: 'Pie Chart',
      icon: PieChart,
      description: 'Show proportions',
      requirements: { categorical: 1, numeric: 1 },
      library: 'echarts'
    },
    {
      type: 'scatter',
      name: 'Scatter Plot',
      icon: Scatter,
      description: 'Relationship between variables',
      requirements: { numeric: 2 },
      library: 'echarts'
    },
    {
      type: 'histogram',
      name: 'Histogram',
      icon: BarChart3,
      description: 'Distribution of values',
      requirements: { numeric: 1 },
      library: 'echarts'
    },
    {
      type: 'box',
      name: 'Box Plot',
      icon: Box,
      description: 'Statistical distribution',
      requirements: { numeric: 1 },
      library: 'plotly'
    },
    {
      type: 'bubble',
      name: 'Bubble Chart',
      icon: Scatter,
      description: '3D scatter with size',
      requirements: { numeric: 3 },
      library: 'plotly'
    },
    {
      type: 'radar',
      name: 'Radar Chart',
      icon: Radar,
      description: 'Multi-dimensional data',
      requirements: { categorical: 1, numeric: 1 },
      library: 'plotly'
    },
    {
      type: 'scatter3d',
      name: '3D Scatter',
      icon: Box,
      description: '3D scatter plot',
      requirements: { numeric: 3 },
      library: 'plotly'
    },
    {
      type: 'surface3d',
      name: '3D Surface',
      icon: TrendingUp,
      description: '3D surface plot',
      requirements: { numeric: 3 },
      library: 'plotly'
    }
  ];

  const isChartAvailable = (chartType) => {
    const reqs = chartType.requirements;
    const availableNumeric = numericColumns.length;
    const availableCategorical = categoricalColumns.length;
    
    return (
      (!reqs.numeric || availableNumeric >= reqs.numeric) &&
      (!reqs.categorical || availableCategorical >= reqs.categorical)
    );
  };

  const generateChart = () => {
    if (!selectedChartType || !chartOptions.xAxis) return;

    const chartType = chartTypes.find(ct => ct.type === selectedChartType);
    let chartData = [];

    switch (selectedChartType) {
      case 'bar':
      case 'pie':
        if (chartOptions.groupBy) {
          // Group data by category and aggregate
          const grouped = {};
          data.forEach(row => {
            const category = row[chartOptions.groupBy];
            const value = parseFloat(row[chartOptions.yAxis]) || 0;
            
            if (!grouped[category]) {
              grouped[category] = [];
            }
            grouped[category].push(value);
          });

          chartData = Object.entries(grouped).map(([category, values]) => {
            let aggregatedValue;
            switch (chartOptions.aggregation) {
              case 'sum':
                aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                break;
              case 'avg':
                aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
              case 'count':
                aggregatedValue = values.length;
                break;
              case 'max':
                aggregatedValue = Math.max(...values);
                break;
              case 'min':
                aggregatedValue = Math.min(...values);
                break;
              default:
                aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            }
            return { name: category, value: aggregatedValue };
          });
        } else {
          chartData = data.slice(0, 20).map(row => ({
            name: row[chartOptions.xAxis],
            value: parseFloat(row[chartOptions.yAxis]) || 0
          }));
        }
        break;

      case 'line':
      case 'area':
        chartData = data.slice(0, 50).map(row => ({
          x: row[chartOptions.xAxis],
          y: parseFloat(row[chartOptions.yAxis]) || 0
        }));
        break;

      case 'scatter':
        chartData = data.slice(0, 100).map(row => ({
          x: parseFloat(row[chartOptions.xAxis]) || 0,
          y: parseFloat(row[chartOptions.yAxis]) || 0
        }));
        break;

      case 'histogram':
        chartData = data.map(row => ({
          value: parseFloat(row[chartOptions.xAxis]) || 0
        }));
        break;

      case 'box':
        chartData = data.map(row => ({
          value: parseFloat(row[chartOptions.xAxis]) || 0
        }));
        break;

      case 'bubble':
        // Remove slice limit to use full bubble data
        chartData = data.map(row => ({
          x: parseFloat(row[chartOptions.xAxis]) || 0,
          y: parseFloat(row[chartOptions.yAxis]) || 0,
          size: parseFloat(row[chartOptions.sizeBy]) || 10
        }));
        break;

      case 'radar':
        // Use more data for radar chart but still keep it reasonable
        chartData = data.slice(0, 25).map(row => ({
          category: row[chartOptions.xAxis],
          value: parseFloat(row[chartOptions.yAxis]) || 0
        }));
        break;

      case 'scatter3d':
      case 'surface3d':
        chartData = data.slice(0, 100).map(row => ({
          x: parseFloat(row[chartOptions.xAxis]) || 0,
          y: parseFloat(row[chartOptions.yAxis]) || 0,
          z: parseFloat(row[chartOptions.sizeBy]) || 0
        }));
        break;

      default:
        chartData = [];
    }

    const chart = {
      id: `chart_${Date.now()}`,
      type: selectedChartType,
      title: `${chartType.name} - ${chartOptions.xAxis} vs ${chartOptions.yAxis || chartOptions.xAxis}`,
      data: chartData,
      xAxis: chartOptions.xAxis,
      yAxis: chartOptions.yAxis,
      groupBy: chartOptions.groupBy,
      library: chartType.library,
      axes: {
        x: chartOptions.xAxis,
        y: chartOptions.yAxis,
        z: chartOptions.sizeBy
      },
      valueField: chartOptions.yAxis || 'value',
      labelField: chartOptions.xAxis || 'name'
    };

    onSelectChart(chart);
  };

  const previewChart = () => {
    if (onPreviewChart) {
      generateChart();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create New Chart
        </h3>
        <Wand2 className="h-5 w-5 text-emerald-600" />
      </div>

      {/* Chart Type Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {chartTypes.map(chartType => {
          const Icon = chartType.icon;
          const available = isChartAvailable(chartType);
          const isSelected = selectedChartType === chartType.type;

          return (
            <button
              key={chartType.type}
              onClick={() => available && setSelectedChartType(chartType.type)}
              disabled={!available}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : available
                  ? 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                  : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${
                  isSelected
                    ? 'text-emerald-600'
                    : available
                    ? 'text-gray-600 dark:text-gray-400'
                    : 'text-gray-400'
                }`} />
                <div className={`text-sm font-medium ${
                  isSelected
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : available
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400'
                }`}>
                  {chartType.name}
                </div>
                <div className={`text-xs mt-1 ${
                  isSelected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : available
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-400'
                }`}>
                  {chartType.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart Configuration */}
      {selectedChartType && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Chart Configuration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* X-Axis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedChartType === 'histogram' ? 'Value Column' : 'X-Axis *'}
              </label>
              <select
                value={chartOptions.xAxis}
                onChange={(e) => setChartOptions({ ...chartOptions, xAxis: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select column</option>
                {(['scatter', 'bubble', 'scatter3d', 'surface3d'].includes(selectedChartType) ? numericColumns : headers).map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>

            {/* Y-Axis */}
            {!['histogram', 'box'].includes(selectedChartType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Y-Axis *
                </label>
                <select
                  value={chartOptions.yAxis}
                  onChange={(e) => setChartOptions({ ...chartOptions, yAxis: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select column</option>
                  {(['radar'].includes(selectedChartType) ? numericColumns : 
                    (['scatter', 'bubble', 'scatter3d', 'surface3d'].includes(selectedChartType) ? numericColumns : headers)
                  ).map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Size/Z-Axis for 3D charts */}
            {(['bubble', 'scatter3d', 'surface3d'].includes(selectedChartType)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {selectedChartType === 'bubble' ? 'Size Column' : 'Z-Axis'} *
                </label>
                <select
                  value={chartOptions.sizeBy}
                  onChange={(e) => setChartOptions({ ...chartOptions, sizeBy: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select column</option>
                  {numericColumns.map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Group By for aggregation */}
            {['bar', 'pie'].includes(selectedChartType) && categoricalColumns.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group By
                </label>
                <select
                  value={chartOptions.groupBy}
                  onChange={(e) => setChartOptions({ ...chartOptions, groupBy: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">No grouping</option>
                  {categoricalColumns.map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Aggregation method */}
            {chartOptions.groupBy && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aggregation
                </label>
                <select
                  value={chartOptions.aggregation}
                  onChange={(e) => setChartOptions({ ...chartOptions, aggregation: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="max">Maximum</option>
                  <option value="min">Minimum</option>
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            {onPreviewChart && (
              <button
                onClick={previewChart}
                disabled={!chartOptions.xAxis || (!chartOptions.yAxis && !['histogram', 'box'].includes(selectedChartType))}
                className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Preview
              </button>
            )}
            <button
              onClick={generateChart}
              disabled={!chartOptions.xAxis || (!chartOptions.yAxis && !['histogram', 'box'].includes(selectedChartType))}
              className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Create Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTypeSelector;
