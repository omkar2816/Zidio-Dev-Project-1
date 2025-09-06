import React, { useState, useEffect } from 'react';
import AdvancedChart from './SimpleChart';
import ChartSidebar from './ChartSidebar';
import ProgressiveChartLoader from '../UI/ProgressiveChartLoader';
import ChartDeduplicationManager from '../../utils/ChartDeduplicationManager';
import EnhancedChartGenerator from '../../utils/EnhancedChartGenerator';
import SmartAutoConfigurator from '../../utils/SmartAutoConfigurator';
import { ChartErrorBoundary, DataValidationAlert, useNotifications } from '../UI/EnhancedUserExperience';
import { VirtualScrollContainer } from '../UI/VirtualScrolling';
import { Plus, BarChart3, Trash2, Edit3, Grid3X3, LayoutGrid, Settings, Lightbulb, Zap, TrendingUp, PieChart, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdvancedChartDashboard = ({ 
  data = [], 
  autoConfigRecommendations = null,
  onApplyRecommendation = null,
  className = '' 
}) => {
  const [charts, setCharts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid', 'list'
  const [loadingCharts, setLoadingCharts] = useState(new Set()); // Track loading charts
  const [pendingChart, setPendingChart] = useState(null); // Chart waiting to be rendered
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Initialize enhanced systems
  const [deduplicationManager] = useState(() => ChartDeduplicationManager);
  const [chartGenerator] = useState(() => EnhancedChartGenerator);
  const [autoConfigurator] = useState(() => SmartAutoConfigurator);
  const { notifications, addNotification, clearNotifications } = useNotifications();

  // Data validation
  const dataValidation = {
    isValid: data && data.length > 0,
    errors: data?.length === 0 ? ['No data available'] : [],
    warnings: data?.length > 10000 ? ['Large dataset detected - performance mode will be enabled'] : []
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

  const handleApplyConfig = async (config) => {
    try {
      const chartId = editingChart?.id || Date.now();
      
      // Check for duplicates using our deduplication manager
      const existingCharts = charts.map(chart => ({
        type: chart.type,
        xAxis: chart.xAxis,
        yAxis: chart.yAxis,
        series: chart.series,
        colorScheme: chart.colorScheme
      }));

      const isDuplicate = deduplicationManager.isDuplicateChart(config, existingCharts);
      
      if (isDuplicate.isDuplicate && !editingChart) {
        // Show duplicate warning with alternatives
        addNotification({
          type: 'warning',
          title: 'Duplicate Chart Detected',
          message: isDuplicate.message,
          actions: isDuplicate.alternatives ? [
            {
              label: 'Use Alternative',
              action: () => handleApplyConfig(isDuplicate.alternatives[0])
            },
            {
              label: 'Create Anyway',
              action: () => handleApplyConfig({ ...config, _forceDuplicate: true })
            }
          ] : []
        });
        return;
      }

      // Use enhanced chart generator
      const enhancedChart = await chartGenerator.generateChart({
        data,
        config,
        performanceMode: data.length > 1000
      });

      const chartData = {
        id: chartId,
        ...config,
        ...enhancedChart,
        data: data,
        totalDataRows: data.length,
        displayedRows: enhancedChart.displayedRows || data.length,
        samplingInfo: enhancedChart.samplingInfo,
        performanceMode: enhancedChart.performanceMode,
        createdAt: new Date().toISOString()
      };
      
      // Set pending chart to show loader
      setPendingChart(chartData);
      
      // Add to loading set
      setLoadingCharts(prev => new Set([...prev, chartId]));
      
      // Simulate chart processing with progressive loading
      setTimeout(() => {
        if (editingChart) {
          setCharts(prev => prev.map(chart => 
            chart.id === chartId ? chartData : chart
          ));
          addNotification({
            type: 'success',
            title: 'Chart Updated',
            message: `${chartData.title || chartData.type} chart has been updated successfully.`
          });
        } else {
          setCharts(prev => [...prev, chartData]);
          addNotification({
            type: 'success',
            title: 'Chart Created',
            message: `${chartData.title || chartData.type} chart has been created successfully.`
          });
        }
        
        setLoadingCharts(prev => {
          const newSet = new Set(prev);
          newSet.delete(chartId);
          return newSet;
        });
        setPendingChart(null);
        setIsSidebarOpen(false);
        setEditingChart(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating chart:', error);
      addNotification({
        type: 'error',
        title: 'Chart Creation Failed',
        message: error.message || 'An error occurred while creating the chart.'
      });
      setLoadingCharts(prev => {
        const newSet = new Set(prev);
        if (editingChart) newSet.delete(editingChart.id);
        return newSet;
      });
      setPendingChart(null);
    }
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

  // Apply auto-configuration recommendation
  const handleApplyAutoRecommendation = (recommendation) => {
    const chartId = Date.now();
    
    // Create chart from recommendation
    const simulatedChartData = {
      id: chartId,
      ...recommendation.configuration,
      data: data,
      totalDataRows: data.length,
      performanceMode: data.length > 1000,
      createdAt: new Date().toISOString(),
      autoGenerated: true,
      confidence: recommendation.confidence
    };
    
    // Set pending chart to show loader
    setPendingChart(simulatedChartData);
    setLoadingCharts(prev => new Set([...prev, chartId]));
    
    // Call parent handler if provided
    onApplyRecommendation?.(recommendation.configuration);
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
    <ChartErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Data Validation Alert */}
        <DataValidationAlert validation={dataValidation} />
        
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  notification.type === 'error' ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600' :
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600' :
                  notification.type === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600' :
                  'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                    {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                    {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {notification.type === 'info' && <TrendingUp className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 space-x-2">
                        {notification.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={action.action}
                            className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => clearNotifications([index])}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* Smart Recommendations */}
      {autoConfigRecommendations && autoConfigRecommendations.recommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Smart Chart Recommendations
            </h3>
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors flex items-center"
            >
              <Zap className="w-4 h-4 mr-1" />
              {showRecommendations ? 'Hide' : 'Show'} ({autoConfigRecommendations.recommendations.length})
            </button>
          </div>

          {showRecommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {autoConfigRecommendations.recommendations.slice(0, 6).map((recommendation, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/20 rounded flex items-center justify-center">
                        {recommendation.type === 'line' && <TrendingUp className="w-4 h-4 text-yellow-600" />}
                        {recommendation.type === 'bar' && <BarChart3 className="w-4 h-4 text-yellow-600" />}
                        {recommendation.type === 'pie' && <PieChart className="w-4 h-4 text-yellow-600" />}
                        {!['line', 'bar', 'pie'].includes(recommendation.type) && <BarChart3 className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {recommendation.confidence.toFixed(0)}%
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {recommendation.title}
                  </h4>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {recommendation.subtitle}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      recommendation.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {recommendation.priority} priority
                    </span>
                    
                    <button
                      onClick={() => handleApplyAutoRecommendation(recommendation)}
                      className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts Grid with Virtual Scrolling */}
      <VirtualScrollContainer 
        itemCount={charts.length + (pendingChart ? 1 : 0)}
        itemHeight={layoutMode === 'grid' ? 320 : 400}
        className="charts-container"
        enabled={charts.length > 6}
      >
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
            <AdvancedChart 
              key={chart.id}
              id={chart.id}
              data={data} 
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
              samplingInfo={chart.samplingInfo}
              gridView={layoutMode === 'grid'}
            />
          ))}
        </div>
      </VirtualScrollContainer>
      
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
      />
      </div>
    </ChartErrorBoundary>
  );
};

export default AdvancedChartDashboard;
