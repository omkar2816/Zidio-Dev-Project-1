import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Clock, 
  Search, 
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  TrendingUp,
  PieChart,
  LineChart,
  Plus,
  Upload,
  AlertCircle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchChartHistory, deleteChartFromHistory } from '../../store/slices/analyticsSlice';
import ChartViewerModal from '../../components/Charts/ChartViewerModal';

const ChartHistoryFixed = () => {
  console.log('ChartHistoryFixed component rendering...');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  // Use Redux state for chart history with correct state names
  const { 
    chartHistory, 
    chartHistoryLoading: loading, 
    chartHistoryError: error,
    chartHistoryPagination
  } = useSelector((state) => state.analytics);
  
  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state for chart viewing
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [deletingCharts, setDeletingCharts] = useState(new Set());

  // Check authentication
  useEffect(() => {
    console.log('Auth check - user:', authState.user?.email, 'token exists:', !!authState.token);
    if (!authState.user || !authState.token) {
      console.log('No authentication - redirecting to login');
      navigate('/auth');
      return;
    }
    
    // Fetch chart history when component mounts
    fetchHistory();
  }, [authState.user, authState.token, navigate]);

  // Auto-refresh chart history every 15 seconds for better real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (authState.user && authState.token && !loading) {
        console.log('Auto-refreshing chart history...');
        fetchHistory(true); // Force refresh to bypass cache
      }
    }, 10000); // Reduced to 10 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [authState.user, authState.token, loading]);

  // Enhanced event listeners for real-time updates
  useEffect(() => {
    const handleChartSaved = (event) => {
      console.log('Chart saved event received - refreshing history', event.detail);
      // Small delay to ensure backend has processed the save
      setTimeout(() => {
        fetchHistory(true); // Force refresh
      }, 500);
    };

    const handleStorageChange = (event) => {
      if (event.key === 'chartSaved') {
        console.log('Chart saved in another tab - refreshing history');
        setTimeout(() => {
          fetchHistory(true); // Force refresh
        }, 500);
      }
    };

    // Listen for various chart-related events
    const handleChartUpdated = () => {
      console.log('Chart updated event - refreshing history');
      setTimeout(() => {
        fetchHistory(true); // Force refresh
      }, 500);
    };

    // Force refresh on window visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && authState.user && authState.token) {
        console.log('Window became visible - refreshing chart history');
        fetchHistory(true); // Force refresh
      }
    };

    // Enhanced chart save event listeners
    const handleAnalyticsChartSaved = (event) => {
      console.log('Analytics chart saved - refreshing chart history', event.detail);
      setTimeout(() => {
        fetchHistory(true);
      }, 1000); // Longer delay for analytics charts
    };

    // Add multiple event listeners for comprehensive updates
    window.addEventListener('chartSaved', handleChartSaved);
    window.addEventListener('chartUpdated', handleChartUpdated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('analyticsChartSaved', handleAnalyticsChartSaved);
    
    // Also listen for focus events to refresh when user returns to tab
    const handleFocus = () => {
      if (authState.user && authState.token) {
        console.log('Tab focused - refreshing chart history');
        fetchHistory(true); // Force refresh
      }
    };
    
    window.addEventListener('focus', handleFocus);

    // Listen for custom events from analytics dashboard
    const handleCustomChartSave = () => {
      console.log('Custom chart save event - refreshing history');
      setTimeout(() => {
        fetchHistory(true);
      }, 800);
    };

    window.addEventListener('customChartSaved', handleCustomChartSave);

    return () => {
      window.removeEventListener('chartSaved', handleChartSaved);
      window.removeEventListener('chartUpdated', handleChartUpdated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('analyticsChartSaved', handleAnalyticsChartSaved);
      window.removeEventListener('customChartSaved', handleCustomChartSave);
    };
  }, [authState.user, authState.token]);

  // Re-fetch when search/filter parameters change
  useEffect(() => {
    if (authState.user && authState.token) {
      const delayedFetch = setTimeout(() => {
        fetchHistory();
      }, 300); // Debounce to avoid too many requests

      return () => clearTimeout(delayedFetch);
    }
  }, [searchTerm, filterType, sortBy, sortOrder, currentPage]);

  // Listen for changes in the Redux analytics store for real-time updates
  useEffect(() => {
    const handleStoreChange = () => {
      if (authState.user && authState.token) {
        console.log('Redux store updated - checking for chart history refresh');
        // Small delay to ensure the store is fully updated
        setTimeout(() => {
          fetchHistory(true);
        }, 500);
      }
    };

    // Monitor chartHistory changes in Redux
    const unsubscribe = () => {
      if (chartHistory?.total !== undefined) {
        handleStoreChange();
      }
    };

    return unsubscribe;
  }, [chartHistory?.total, authState.user, authState.token]);

  const fetchHistory = async (forceRefresh = false) => {
    try {
      console.log('Fetching chart history with params:', {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: filterType,
        sortBy,
        sortOrder,
        forceRefresh
      });
      
      // Add cache-busting parameter for forced refreshes
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: filterType,
        sortBy,
        sortOrder
      };
      
      if (forceRefresh) {
        params._t = Date.now(); // Cache buster
      }
      
      await dispatch(fetchChartHistory(params)).unwrap();
      
      console.log('📋 Chart history fetch successful');
      
      // Debug: Log received chart data
      if (chartHistory?.charts?.length) {
        console.log(`📊 Received ${chartHistory.charts.length} charts:`);
        chartHistory.charts.forEach((chart, index) => {
          console.log(`📋 Chart ${index + 1}: "${chart.chartTitle}" - Data check:`, {
            hasChartData: !!chart.chartData,
            chartDataType: typeof chart.chartData,
            chartDataLength: Array.isArray(chart.chartData) ? chart.chartData.length : 'not array',
            hasConfiguration: !!chart.configuration,
            configValuesLength: chart.configuration?.values?.length || 0,
            configCategoriesLength: chart.configuration?.categories?.length || 0,
            hasDataInfo: !!chart.dataInfo,
            dataInfoTotalRows: chart.dataInfo?.totalRows || 0,
            calculatedDataPoints: getDataPointsCount(chart)
          });
        });
      }
    } catch (error) {
      console.error('Error fetching chart history:', error);
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        toast.error('Session expired. Please login again.');
        navigate('/auth');
      } else {
        toast.error('Failed to load chart history');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchHistory(true); // Force refresh
      toast.success('Chart history refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh chart history');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (chart) => {
    console.log('Downloading chart:', chart.chartTitle);
    try {
      // Create downloadable content
      const chartData = {
        title: chart.chartTitle,
        type: chart.chartType,
        data: {
          categories: chart.configuration?.categories || [],
          values: chart.configuration?.values || []
        },
        metadata: {
          created: chart.createdAt,
          source: chart.sourceFileName,
          dataPoints: chart.configuration?.values?.length || 0
        }
      };

      const dataStr = JSON.stringify(chartData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(chart.chartTitle || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Chart data downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chart');
    }
  };

  // Helper function to calculate data points reliably
  const getDataPointsCount = (chart) => {
    console.log('🔍 Calculating data points for chart:', chart.chartTitle);
    
    // TEMP DEBUG: Log the entire chart object structure
    console.log('🔬 FULL CHART OBJECT:', JSON.stringify(chart, null, 2));
    
    console.log('📊 Data analysis:', {
      hasChartData: !!chart.chartData,
      chartDataType: typeof chart.chartData,
      chartDataIsArray: Array.isArray(chart.chartData),
      chartDataKeysLength: chart.chartData && typeof chart.chartData === 'object' ? Object.keys(chart.chartData).length : 0,
      configValuesLength: chart.configuration?.values?.length || 0,
      configCategoriesLength: chart.configuration?.categories?.length || 0,
      dataInfoTotalRows: chart.dataInfo?.totalRows || 0
    });
    
    // Try multiple sources in order of priority
    let count = 0;
    let source = 'unknown';
    
    // Priority 1: Data info total rows (most reliable for actual data count)
    if (chart.dataInfo?.totalRows && chart.dataInfo.totalRows > 0) {
      count = chart.dataInfo.totalRows;
      source = 'dataInfo.totalRows';
    }
    // Priority 2: Chart data object keys (for object-based data storage)
    else if (chart.chartData && typeof chart.chartData === 'object' && !Array.isArray(chart.chartData)) {
      const keys = Object.keys(chart.chartData);
      if (keys.length > 0) {
        count = keys.length;
        source = 'chartData.object';
      }
    }
    // Priority 3: Chart data array
    else if (Array.isArray(chart.chartData) && chart.chartData.length > 0) {
      count = chart.chartData.length;
      source = 'chartData.array';
    }
    // Priority 4: Configuration values
    else if (chart.configuration?.values?.length > 0) {
      count = chart.configuration.values.length;
      source = 'config.values';
    }
    // Priority 5: Configuration categories
    else if (chart.configuration?.categories?.length > 0) {
      count = chart.configuration.categories.length;
      source = 'config.categories';
    }
    // Priority 6: Data info displayed rows
    else if (chart.dataInfo?.displayedRows && chart.dataInfo.displayedRows > 0) {
      count = chart.dataInfo.displayedRows;
      source = 'dataInfo.displayedRows';
    }
    
    console.log(`📊 Chart "${chart.chartTitle}" data points: ${count} (from ${source})`);
    
    // TEMP DEBUG: Test the function manually
    if (chart.chartTitle === 'Pie Chart') {
      console.log('🧪 MANUAL TEST for Pie Chart:');
      const testChart = {
        chartTitle: 'Test Chart',
        dataInfo: { totalRows: 72 },
        chartData: { '0': 'test', '1': 'test' }, // Object with 2 keys
        configuration: { values: [], categories: [] }
      };
      
      let testCount = 0;
      let testSource = 'unknown';
      
      if (testChart.dataInfo?.totalRows && testChart.dataInfo.totalRows > 0) {
        testCount = testChart.dataInfo.totalRows;
        testSource = 'dataInfo.totalRows';
        console.log('✅ TEST: dataInfo.totalRows check passed:', testCount);
      }
      
      console.log(`🧪 TEST RESULT: ${testCount} from ${testSource}`);
    }
    
    return count;
  };

  const handleViewChart = (chart) => {
    console.log('🎯 Opening chart in modal:', chart.chartTitle);
    console.log('📊 Chart data preview:', {
      type: chart.chartType,
      hasChartData: !!chart.chartData,
      hasConfiguration: !!chart.configuration,
      dataPoints: chart.chartData?.length || chart.configuration?.values?.length || 0
    });
    setSelectedChart(chart);
    setIsChartModalOpen(true);
  };

  const handleDelete = async (chart) => {
    const chartTitle = chart.chartTitle || 'Untitled Chart';
    const idToDelete = chart.chartId || chart._id;
    
    if (!window.confirm(`Are you sure you want to delete "${chartTitle}"? This action cannot be undone.`)) {
      return;
    }

    // Add to deleting set
    setDeletingCharts(prev => new Set(prev).add(idToDelete));

    try {
      console.log('🗑️ Attempting to delete chart:', { 
        idToDelete, 
        chartTitle,
        originalChart: chart 
      });
      
      if (!idToDelete) {
        throw new Error('Chart ID not found');
      }
      
      await dispatch(deleteChartFromHistory(idToDelete)).unwrap();
      toast.success(`Chart "${chartTitle}" deleted successfully`);
      
      // Refresh the list after successful deletion
      console.log('🔄 Refreshing chart history after deletion');
      await fetchHistory();
    } catch (error) {
      console.error('❌ Delete error:', error);
      const errorMessage = error.message || error.data?.message || 'Unknown error';
      toast.error(`Failed to delete chart: ${errorMessage}`);
    } finally {
      // Remove from deleting set
      setDeletingCharts(prev => {
        const newSet = new Set(prev);
        newSet.delete(idToDelete);
        return newSet;
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // fetchHistory will be called automatically via useEffect
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    // fetchHistory will be called automatically via useEffect
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getChartIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'line':
        return <LineChart className="w-4 h-4" />;
      case 'pie':
      case 'doughnut':
        return <PieChart className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getChartTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'line':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
      case 'pie':
      case 'doughnut':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      default:
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800/30 dark:text-secondary-300';
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil((chartHistory?.total || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, chartHistory?.total || 0);

  if (loading && !chartHistory?.charts?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
        
        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Chart History</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we fetch your charts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  Chart History
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  View and manage your saved charts with advanced analytics
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => navigate('/charts')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Chart
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:items-end sm:space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Charts
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or source file..."
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chart Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="doughnut">Doughnut Chart</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="chartTitle-asc">Title A-Z</option>
                  <option value="chartTitle-desc">Title Z-A</option>
                  <option value="chartType-asc">Type A-Z</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-500" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800 dark:text-error-200">Error Loading Charts</h3>
                  <p className="text-sm text-error-700 dark:text-error-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts List */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {loading && (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">Loading charts...</p>
                </div>
              </div>
            )}

            {!loading && (!chartHistory?.charts || chartHistory.charts.length === 0) && (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl mb-4">
                    <BarChart3 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Charts Found</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    {searchTerm || filterType !== 'all'
                      ? 'No charts match your current filters. Try adjusting your search criteria.'
                      : 'You haven\'t created any charts yet. Start by creating your first chart!'}
                  </p>
                  <button
                    onClick={() => navigate('/charts')}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Chart
                  </button>
                </div>
              </div>
            )}

            {!loading && chartHistory?.charts && chartHistory.charts.length > 0 && (
              <>
                {/* Charts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chart
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Data Points
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700">
                      {chartHistory.charts.map((chart) => (
                        <tr key={chart._id || chart.chartId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg mr-3">
                                {getChartIcon(chart.chartType)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {chart.chartTitle || 'Untitled Chart'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {chart.chartId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChartTypeColor(chart.chartType)}`}>
                              {chart.chartType?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {chart.sourceFileName || 'Unknown File'}
                            </div>
                            {chart.sourceSheet && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Sheet: {chart.sourceSheet}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(chart.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getDataPointsCount(chart)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewChart(chart)}
                                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                                title="View Chart"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(chart)}
                                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                                title="Download Chart Data"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(chart)}
                                disabled={deletingCharts.has(chart.chartId || chart._id)}
                                className={`inline-flex items-center p-2 border rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${
                                  deletingCharts.has(chart.chartId || chart._id)
                                    ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                                    : 'border-error-300 dark:border-error-600 text-error-700 dark:text-error-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-error-50 dark:hover:bg-error-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500'
                                }`}
                                title={deletingCharts.has(chart.chartId || chart._id) ? "Deleting..." : "Delete Chart"}
                              >
                                {deletingCharts.has(chart.chartId || chart._id) ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <span>
                          Showing {startIndex} to {endIndex} of {chartHistory?.total || 0} results
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            const isActive = page === currentPage;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${
                                  isActive
                                    ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                                    : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart Viewer Modal */}
      <ChartViewerModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        chart={selectedChart}
      />
    </div>
  );
};

export default ChartHistoryFixed;
