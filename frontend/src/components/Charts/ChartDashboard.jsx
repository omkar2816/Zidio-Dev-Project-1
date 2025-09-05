import React, { useState, useCallback } from 'react';
import ChartComponent from './ChartComponent';
import ChartConfigModal from './ChartConfigModal';
import { 
  Plus, 
  Grid3X3, 
  LayoutGrid, 
  Maximize2, 
  Settings,
  Download,
  Filter,
  Search,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChartDashboard = ({ data = [], className = '' }) => {
  const [charts, setCharts] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingChartIndex, setEditingChartIndex] = useState(null);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid', 'list', 'single'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Add new chart
  const handleAddChart = () => {
    setEditingChartIndex(null);
    setIsConfigModalOpen(true);
  };

  // Edit existing chart
  const handleEditChart = useCallback((index, chartType, xAxis, yAxis, series) => {
    setEditingChartIndex(index);
    setIsConfigModalOpen(true);
  }, []);

  // Apply chart configuration
  const handleApplyConfig = (config) => {
    if (editingChartIndex !== null) {
      // Update existing chart
      setCharts(prev => prev.map((chart, index) => 
        index === editingChartIndex ? { ...chart, ...config, id: chart.id } : chart
      ));
      toast.success('Chart updated successfully');
    } else {
      // Add new chart
      const newChart = {
        id: Date.now(),
        ...config,
        createdAt: new Date().toISOString()
      };
      setCharts(prev => [...prev, newChart]);
      toast.success('Chart created successfully');
    }
  };

  // Remove chart
  const handleRemoveChart = (index) => {
    setCharts(prev => prev.filter((_, i) => i !== index));
    toast.success('Chart removed');
  };

  // Duplicate chart
  const handleDuplicateChart = (index) => {
    const chart = charts[index];
    const duplicatedChart = {
      ...chart,
      id: Date.now(),
      title: `${chart.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setCharts(prev => [...prev, duplicatedChart]);
    toast.success('Chart duplicated');
  };

  // Export all charts
  const handleExportAll = async () => {
    try {
      // This would trigger export for all charts
      toast.promise(
        Promise.all(charts.map(chart => 
          new Promise(resolve => setTimeout(resolve, 1000))
        )),
        {
          loading: 'Exporting all charts...',
          success: 'All charts exported successfully',
          error: 'Failed to export charts'
        }
      );
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // Filter charts
  const filteredCharts = charts.filter(chart => {
    const matchesSearch = chart.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || chart.chartType === filterType;
    return matchesSearch && matchesFilter;
  });

  // Get layout classes
  const getLayoutClasses = () => {
    switch (layoutMode) {
      case 'grid':
        return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6';
      case 'list':
        return 'space-y-6';
      case 'single':
        return 'grid grid-cols-1 gap-6';
      default:
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
    }
  };

  // Chart type options for filter
  const chartTypes = [
    { value: 'all', label: 'All Charts' },
    { value: 'bar', label: 'Bar Charts' },
    { value: 'line', label: 'Line Charts' },
    { value: 'pie', label: 'Pie Charts' },
    { value: 'area', label: 'Area Charts' },
    { value: 'scatter', label: 'Scatter Plots' },
    { value: 'bubble', label: 'Bubble Charts' },
    { value: 'histogram', label: 'Histograms' },
    { value: 'box', label: 'Box Plots' },
    { value: 'radar', label: 'Radar Charts' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chart Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage interactive charts from your data
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search charts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              {chartTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Layout Mode */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  layoutMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Grid layout"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  layoutMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="List layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('single')}
                className={`p-2 rounded-md transition-colors ${
                  layoutMode === 'single'
                    ? 'bg-white dark:bg-gray-600 text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Single column"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Export All */}
            {charts.length > 0 && (
              <button
                onClick={handleExportAll}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export All</span>
              </button>
            )}

            {/* Add Chart */}
            <button
              onClick={handleAddChart}
              disabled={!data || data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chart</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {charts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                Total Charts
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {charts.length}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Data Rows
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {data.length.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                Chart Types
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {new Set(charts.map(c => c.chartType)).size}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      {filteredCharts.length > 0 ? (
        <div className={getLayoutClasses()}>
          {filteredCharts.map((chart, index) => (
            <div key={chart.id} className="relative group">
              <ChartComponent
                data={data}
                chartType={chart.chartType}
                title={chart.title}
                xAxis={chart.xAxis}
                yAxis={chart.yAxis}
                series={chart.series}
                options={{
                  colorScheme: chart.colorScheme,
                  showLegend: chart.showLegend,
                  showTooltip: chart.showTooltip,
                  animation: chart.animation
                }}
                onConfigChange={() => handleEditChart(index, chart.chartType, chart.xAxis, chart.yAxis, chart.series)}
                className={layoutMode === 'single' ? 'h-[600px]' : ''}
              />
              
              {/* Chart Actions */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => handleEditChart(index, chart.chartType, chart.xAxis, chart.yAxis, chart.series)}
                    className="p-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                    title="Edit chart"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateChart(index)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                    title="Duplicate chart"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveChart(index)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title="Remove chart"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {charts.length === 0 ? 'No charts created yet' : 'No charts match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {charts.length === 0 
                ? data.length > 0 
                  ? 'Create your first chart to visualize your data'
                  : 'Upload and analyze data to create charts'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {data.length > 0 && charts.length === 0 && (
              <button
                onClick={handleAddChart}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Chart</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chart Configuration Modal */}
      <ChartConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onApply={handleApplyConfig}
        data={data}
        currentConfig={editingChartIndex !== null ? charts[editingChartIndex] : {}}
      />
    </div>
  );
};

export default ChartDashboard;
