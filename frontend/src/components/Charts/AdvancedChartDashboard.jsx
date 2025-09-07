import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdvancedChart from './SimpleChart';
import ChartSidebar from './ChartSidebar';
import ProgressiveChartLoader from '../UI/ProgressiveChartLoader';
import { Plus, BarChart3, Trash2, Edit3, Grid3X3, LayoutGrid, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../config/axios';
import { saveChartToHistory, fetchChartHistory } from '../../store/slices/analyticsSlice';

const AdvancedChartDashboard = ({ data = [], className = '' }) => {
  const dispatch = useDispatch();
  const { uploadedFile } = useSelector((state) => state.analytics);
  const authState = useSelector((state) => state.auth);
  const [charts, setCharts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid', 'list'
  const [loadingCharts, setLoadingCharts] = useState(new Set()); // Track loading charts
  const [pendingChart, setPendingChart] = useState(null); // Chart waiting to be rendered
  const [smartRecommendations, setSmartRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Notification management to prevent duplicates
  const [recentNotifications, setRecentNotifications] = useState(new Set());
  const [savingCharts, setSavingCharts] = useState(new Set()); // Track which charts are being saved

  // Helper function to show notifications without duplicates
  const showNotification = (type, message, chartId = null) => {
    const notificationKey = `${type}-${message}-${chartId}`;
    
    // Check if this notification was recently shown
    if (recentNotifications.has(notificationKey)) {
      console.log('🔕 Duplicate notification prevented:', notificationKey);
      return;
    }
    
    // Add to recent notifications
    setRecentNotifications(prev => new Set([...prev, notificationKey]));
    
    // Show the notification
    if (type === 'success') {
      toast.success(message, { duration: 4000 });
    } else if (type === 'error') {
      toast.error(message, { duration: 5000 });
    } else if (type === 'info') {
      toast(message, { duration: 3000 });
    }
    
    // Clean up notification key after some time
    setTimeout(() => {
      setRecentNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationKey);
        return newSet;
      });
    }, 10000); // Clear after 10 seconds
  };

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
      
      // Use the analyze route for smart recommendations
      const response = await axios.post('/api/analytics/analyze', {
        sheetData: {
          headers: Object.keys(data[0] || {}),
          data: data.slice(0, 100) // Send sample of data for analysis
        },
        analysisType: 'comprehensive'
      });

      if (response.data && response.data.analysis && response.data.analysis.chartSuggestions) {
        setSmartRecommendations(response.data.analysis.chartSuggestions);
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
    // Generate a unique ID using timestamp + random number to prevent collisions
    const chartId = editingChart?.id || `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prevent multiple chart creation attempts
    if (!editingChart && pendingChart) {
      toast.error('Please wait for the current chart to finish loading');
      return;
    }
    
    // Use filtered data from config if available, otherwise use original data
    const chartData = config.data || data;
    const isFiltered = config.data && config.data.length !== data.length;
    
    // Check if full dataset rendering was requested
    const fullDataset = config.fullDataset === true;
    
    // Create chart data with filter information
    const simulatedChartData = {
      id: chartId,
      title: config.title || `Chart ${chartId}`, // Ensure title is set
      type: config.type || 'bar', // Ensure type is set
      ...config,
      data: chartData, // Use filtered data
      originalData: data, // Keep reference to original data
      totalDataRows: chartData.length,
      originalDataRows: data.length,
      isFiltered: isFiltered,
      fullDataset: fullDataset, // Pass through full dataset flag
      filterInfo: isFiltered ? {
        activeFilters: config.activeFilters || {},
        numericFilters: config.numericFilters || {},
        filteredCount: config.filteredDataCount,
        originalCount: config.originalDataCount
      } : null,
      performanceMode: chartData.length > 1000 && !fullDataset, // Disable performance mode if full dataset requested
      createdAt: new Date().toISOString(),
      // Add additional fields expected by backend
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      series: config.series,
      colorScheme: config.colorScheme,
      dataColumns: config.xAxis && config.yAxis ? [config.xAxis, config.yAxis] : [],
      categories: [], // Will be populated by chart component
      values: [], // Will be populated by chart component
      options: {
        showAnimation: config.showAnimation,
        colorScheme: config.colorScheme,
        fullDataset: fullDataset
      }
    };
    
    // Set pending chart to show loader
    setPendingChart(simulatedChartData);
    setLoadingCharts(prev => new Set([...prev, chartId]));
    setIsSidebarOpen(false);
    
    // Simulate chart creation with a delay to show the loading state
    setTimeout(() => {
      handleChartLoadComplete(simulatedChartData);
    }, 1000);
  };
  
  const handleChartLoadComplete = (chartData) => {
    // Clear pending chart state first
    setPendingChart(null);
    setLoadingCharts(prev => {
      const newSet = new Set(prev);
      newSet.delete(chartData.id);
      return newSet;
    });
    
    if (editingChart) {
      // Update existing chart
      setCharts(prev => prev.map(chart => 
        chart.id === editingChart.id 
          ? { ...chart, ...chartData }
          : chart
      ));
      setEditingChart(null);
      showNotification('success', 'Chart updated successfully!', chartData.id);
    } else {
      // Create new chart - check if chart with this ID already exists to prevent duplicates
      setCharts(prev => {
        const existingChart = prev.find(chart => chart.id === chartData.id);
        if (existingChart) {
          // Chart already exists, don't add duplicate
          console.warn('Chart with ID already exists, skipping duplicate creation');
          return prev;
        }
        return [...prev, chartData];
      });
      showNotification('success', 'Chart created successfully!', chartData.id);
    }
    
    // Automatically save chart to MongoDB history
    try {
      console.log('💾 CHART DASHBOARD - Initiating chart save to history:', {
        chartId: chartData.id,
        chartTitle: chartData.title,
        chartType: chartData.type,
        uploadedFileId: uploadedFile?._id,
        chartDataLength: chartData.data?.length,
        hasTitle: !!chartData.title,
        hasType: !!chartData.type,
        hasData: !!chartData.data,
        authToken: !!authState?.token
      });

      // Check if this chart is already being saved
      if (savingCharts.has(chartData.id)) {
        console.log('⏳ Chart save already in progress for:', chartData.id);
        return;
      }

      // Verify we have required data for saving
      if (!chartData.title || !chartData.type) {
        console.error('❌ Missing required chart data for save:', {
          title: chartData.title,
          type: chartData.type
        });
        showNotification('error', 'Chart created but missing title or type for save', chartData.id);
        return;
      }

      // Check authentication
      if (!authState?.token) {
        console.error('❌ No authentication token available for chart save');
        console.error('🔍 Auth state:', {
          hasAuthState: !!authState,
          hasToken: !!authState?.token,
          isLoggedIn: !!authState?.isLoggedIn,
          user: authState?.user?.email
        });
        showNotification('error', 'Please log in to save charts', chartData.id);
        return;
      }

      console.log('🔑 Authentication check passed, proceeding with save');

      // Mark chart as being saved
      setSavingCharts(prev => new Set([...prev, chartData.id]));

      const fileId = uploadedFile?._id || null;
      console.log('💾 Dispatching saveChartToHistory action with:', {
        chartId: chartData.id,
        chartTitle: chartData.title,
        chartType: chartData.type,
        fileId,
        hasData: !!chartData.data,
        dataLength: chartData.data?.length
      });

      const saveAction = dispatch(saveChartToHistory({ 
        chart: chartData, 
        fileId 
      }));
      
      // Handle the save result
      saveAction.then((result) => {
        console.log('📋 Chart save action result:', result);
        
        // Remove from saving set
        setSavingCharts(prev => {
          const newSet = new Set(prev);
          newSet.delete(chartData.id);
          return newSet;
        });
        
        if (result.type === 'analytics/saveChartToHistory/fulfilled') {
          console.log('✅ Chart successfully saved to history');
          showNotification('success', 'Chart created and saved to history!', chartData.id);
          
          // Emit multiple events to trigger chart history refresh
          window.dispatchEvent(new CustomEvent('chartSaved', { 
            detail: { chartId: chartData.id, chartTitle: chartData.title } 
          }));
          
          window.dispatchEvent(new CustomEvent('analyticsChartSaved', { 
            detail: { chartId: chartData.id, chartTitle: chartData.title, timestamp: Date.now() } 
          }));
          
          window.dispatchEvent(new CustomEvent('customChartSaved', { 
            detail: { chartId: chartData.id, chartTitle: chartData.title, source: 'analytics' } 
          }));
          
          // Also set localStorage for cross-tab communication
          localStorage.setItem('chartSaved', JSON.stringify({
            chartId: chartData.id,
            timestamp: Date.now()
          }));
          
          // Force refresh chart history in Redux store
          setTimeout(() => {
            dispatch(fetchChartHistory({ _t: Date.now() }));
          }, 1000);
          
        } else if (result.type === 'analytics/saveChartToHistory/rejected') {
          console.error('❌ Failed to save chart to history:', result.error);
          const errorPayload = result.payload;
          
          // Handle specific error cases
          if (errorPayload?.code === 'AUTH_FAILED' || errorPayload?.status === 401) {
            showNotification('error', 'Please log in to save charts to history', chartData.id);
          } else if (errorPayload?.code === 'NETWORK_ERROR') {
            showNotification('error', 'Network error - chart saved locally only', chartData.id);
          } else {
            showNotification('error', 'Chart created but failed to save to history', chartData.id);
          }
        }
      }).catch((error) => {
        console.error('💥 Error in save chain:', error);
        // Remove from saving set on error
        setSavingCharts(prev => {
          const newSet = new Set(prev);
          newSet.delete(chartData.id);
          return newSet;
        });
        showNotification('error', 'Chart save failed', chartData.id);
      });
    } catch (error) {
      console.error('💥 Error saving chart to history:', error);
      // Remove from saving set on error
      setSavingCharts(prev => {
        const newSet = new Set(prev);
        newSet.delete(chartData.id);
        return newSet;
      });
      showNotification('error', 'Chart created but history save failed', chartData.id);
    }
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
    // Ensure we have a valid ID
    if (!id) {
      console.error('Invalid chart ID for removal');
      toast.error('Invalid chart ID');
      return;
    }
    
    // Remove only the chart with the specific ID
    setCharts(prev => {
      const filteredCharts = prev.filter(chart => chart.id !== id);
      console.log(`Removing chart with ID: ${id}, before: ${prev.length}, after: ${filteredCharts.length}`);
      return filteredCharts;
    });
    
    // Also clear from loading state if present
    setLoadingCharts(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    toast.success('Chart removed');
  };

  const handleDuplicateChart = (chart) => {
    // Generate a unique ID to prevent collisions
    const uniqueId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const duplicatedChart = {
      ...chart,
      id: uniqueId,
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
              <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
                Total Charts
                {charts.length > 0 && (
                  <span className="text-xs bg-emerald-200 dark:bg-emerald-700 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300">
                    newest first ↓
                  </span>
                )}
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

      {/* Authentication Warning */}
      {!authState?.token && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Charts will be created but not saved
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You're not logged in. Charts can be created and viewed, but won't be saved to your history. 
                  <a href="/login" className="font-medium underline hover:text-yellow-600 ml-1">
                    Log in to save charts
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {charts
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by creation date (newest first)
          .map(chart => (
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
              // Enhanced performance props
              performanceMode={chart.performanceMode}
              extremePerformanceMode={chart.extremePerformanceMode}
              optimizations={chart.optimizations}
              renderingStrategy={chart.renderingStrategy}
              performanceLevel={chart.dataSize?.level || 'normal'}
              totalDataRows={chart.totalDataRows}
              displayedRows={chart.displayedRows}
              isFiltered={chart.isFiltered}
              filterInfo={chart.filterInfo}
              samplingInfo={chart.samplingInfo}
              // Pass data size information
              dataSize={chart.dataSize}
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
