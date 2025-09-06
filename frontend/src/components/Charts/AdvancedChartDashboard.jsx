import React, { useState, useEffect } from 'react';
import AdvancedChart from './SimpleChart';
import ChartSidebar from './ChartSidebar';
import ProgressiveChartLoader from '../UI/ProgressiveChartLoader';
import { Plus, BarChart3, Trash2, Edit3, Grid3X3, LayoutGrid, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../config/axios';

const AdvancedChartDashboard = ({ data = [], className = '' }) => {
  const [charts, setCharts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid', 'list'
  const [loadingCharts, setLoadingCharts] = useState(new Set()); // Track loading charts
  const [pendingChart, setPendingChart] = useState(null); // Chart waiting to be rendered
  const [smartRecommendations, setSmartRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Fetch smart recommendations when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      fetchSmartRecommendations();
    }
  }, [data]);

  const fetchSmartRecommendations = async () => {
    if (!data || data.length === 0) return;

    try {
      setLoadingRecommendations(true);
      
      // Use the enhanced analytics route for smart recommendations
      const response = await axios.post('/api/analytics/analyze-enhanced', {
        data: data.slice(0, 100), // Send sample of data for analysis
        options: {
          includeSmartRecommendations: true,
          includeDataPreprocessing: false, // Just for recommendations
          generateCharts: false
        }
      });

      if (response.data && response.data.smartRecommendations) {
        setSmartRecommendations(response.data.smartRecommendations);
      }
    } catch (error) {
      console.error('Error fetching smart recommendations:', error);
      // Don't show error toast for this, as it's optional functionality
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleAddChart = () => {
    if (!data || data.length === 0) {
      toast.error('No data available for chart creation');
      return;
    }
    setEditingChart(null);
    setIsSidebarOpen(true);
  };

  const handleEditChart = (chart) => {
    setEditingChart(chart);
    setIsSidebarOpen(true);
  };

  const handleApplyConfig = (config) => {
    const chartId = editingChart?.id || Date.now();
    
    // Use filtered data from config if available, otherwise use original data
    const chartData = config.data || data;
    const isFiltered = config.data && config.data.length !== data.length;
    
    // Create chart data with filter information
    const simulatedChartData = {
      id: chartId,
      ...config,
      data: chartData, // Use filtered data
      originalData: data, // Keep reference to original data
      totalDataRows: chartData.length,
      originalDataRows: data.length,
      isFiltered: isFiltered,
      filterInfo: isFiltered ? {
        activeFilters: config.activeFilters || {},
        numericFilters: config.numericFilters || {},
        filteredCount: config.filteredDataCount,
        originalCount: config.originalDataCount
      } : null,
      performanceMode: chartData.length > 1000,
      createdAt: new Date().toISOString()
    };
    
    // Set pending chart to show loader
    setPendingChart(simulatedChartData);
    setLoadingCharts(prev => new Set([...prev, chartId]));
    setIsSidebarOpen(false);
  };
  
  const handleChartLoadComplete = (chartData) => {
    if (editingChart) {
      // Update existing chart
      setCharts(prev => prev.map(chart => 
        chart.id === editingChart.id 
          ? { ...chart, ...chartData }
          : chart
      ));
      toast.success('Chart updated successfully!');
    } else {
      // Create new chart
      setCharts(prev => [...prev, chartData]);
      toast.success('Chart created successfully!');
    }
    
    // Clean up loading state
    setLoadingCharts(prev => {
      const newSet = new Set(prev);
      newSet.delete(chartData.id);
      return newSet;
    });
    setPendingChart(null);
    setEditingChart(null);
  };
  
  const handleChartLoadError = (error) => {
    console.error('Chart loading error:', error);
    toast.error('Failed to create chart: ' + error.message);
    
    // Clean up loading state
    if (pendingChart) {
      setLoadingCharts(prev => {
        const newSet = new Set(prev);
        newSet.delete(pendingChart.id);
        return newSet;
      });
    }
    setPendingChart(null);
    setEditingChart(null);
  };

  const handleRemoveChart = (id) => {
    setCharts(prev => prev.filter(chart => chart.id !== id));
    toast.success('Chart removed');
  };

  const handleDuplicateChart = (chart) => {
    const duplicatedChart = {
      ...chart,
      id: Date.now(),
      title: `${chart.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    setCharts(prev => [...prev, duplicatedChart]);
    toast.success('Chart duplicated!');
  };

  const handleColorSchemeChange = (chartId, newColorScheme) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId 
        ? { ...chart, colorScheme: newColorScheme }
        : chart
    ));
  };

  const getLayoutClasses = () => {
    switch (layoutMode) {
      case 'grid':
        return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6';
      case 'list':
        return 'space-y-6';
      default:
        return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
    }
  };

  const getChartTypeStats = () => {
    const typeCount = {};
    charts.forEach(chart => {
      typeCount[chart.type] = (typeCount[chart.type] || 0) + 1;
    });
    return typeCount;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Chart Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create interactive charts with multiple types, customizable parameters, and beautiful animations
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
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
            </div>

            {/* Add Chart */}
            <button
              onClick={handleAddChart}
              disabled={!data || data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Create Chart</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        {data.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
              <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                Total Charts
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {charts.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Data Rows
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {data.length.toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                Data Columns
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {data.length > 0 ? Object.keys(data[0]).length : 0}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <div className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                Chart Types
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {Object.keys(getChartTypeStats()).length}
              </div>
            </div>
          </div>
        )}

        {/* Chart Type Distribution */}
        {charts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(getChartTypeStats()).map(([type, count]) => (
              <span
                key={type}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className={getLayoutClasses()}>
        {/* Show progressive loader for pending chart */}
        {pendingChart && (
          <ProgressiveChartLoader
            chartData={pendingChart}
            onComplete={handleChartLoadComplete}
            onError={handleChartLoadError}
            className="min-h-64"
          />
        )}
        
        {/* Render existing charts */}
        {charts.map(chart => (
          <div key={chart.id} className="relative">
            {/* Filter Indicator */}
            {chart.isFiltered && chart.filterInfo && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium shadow-lg border border-blue-200">
                  🔍 Filtered: {chart.filterInfo.filteredCount}/{chart.filterInfo.originalCount} rows
                </div>
              </div>
            )}
            <AdvancedChart 
              key={chart.id}
              id={chart.id}
              data={chart.data || data} // Use chart's filtered data if available
              type={chart.type}
              title={chart.title}
              xAxis={chart.xAxis}
              yAxis={chart.yAxis}
              series={chart.series}
              colorScheme={chart.colorScheme}
              showAnimation={chart.showAnimation}
              onEdit={() => handleEditChart(chart)}
              onDuplicate={() => handleDuplicateChart(chart)}
              onRemove={() => handleRemoveChart(chart.id)}
              onColorSchemeChange={(newScheme) => handleColorSchemeChange(chart.id, newScheme)}
              performanceMode={chart.performanceMode}
              totalDataRows={chart.totalDataRows}
              displayedRows={chart.displayedRows}
              isFiltered={chart.isFiltered}
              filterInfo={chart.filterInfo}
              samplingInfo={chart.samplingInfo}
            />
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {charts.length === 0 && !pendingChart && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BarChart3 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Ready to Create Beautiful Charts
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {data.length > 0 
                ? 'Transform your data into stunning interactive visualizations with multiple chart types, custom styling, and smooth animations.'
                : 'Upload and analyze your Excel data to start creating interactive charts and visualizations.'
              }
            </p>
            {data.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={handleAddChart}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  <Plus className="w-6 h-6" />
                  <span>Create Your First Chart</span>
                </button>
                <div className="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>• 9 Chart Types</span>
                  <span>• Custom Colors</span>
                  <span>• Smooth Animations</span>
                  <span>• Interactive Controls</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Configuration Sidebar */}
      <ChartSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setEditingChart(null);
        }}
        data={data}
        onApplyConfig={handleApplyConfig}
        initialConfig={editingChart || {}}
        smartRecommendations={smartRecommendations}
      />
    </div>
  );
};

export default AdvancedChartDashboard;
