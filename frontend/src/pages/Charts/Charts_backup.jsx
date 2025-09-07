import React from 'react';
import ChartHistoryFixed from './ChartHistoryFixed';

const Charts = () => {
  console.log('🏗️ Charts component rendering...');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const analyticsState = useSelector((state) => state.analytics);
  const authState = useSelector((state) => state.auth);
  const { 
    chartHistory, 
    chartHistoryLoading, 
    chartHistoryError, 
    chartHistoryPagination 
  } = analyticsState;

  console.log('🔧 Component state after selectors:', {
    chartHistory: chartHistory?.length || 0,
    loading: chartHistoryLoading,
    error: chartHistoryError,
    authState: authState?.user?.email || 'No user'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const pageSize = 10;

  useEffect(() => {
    console.log('📱 Charts component mounted!');
    console.log('🌐 Current URL:', window.location.href);
    console.log('🔐 Auth state:', authState);
    console.log('📊 Analytics state:', analyticsState);
    console.log('🎯 About to call fetchCharts...');
    console.log('🔧 fetchCharts function:', fetchCharts);
    
    // Add a small delay to ensure component is fully mounted
    setTimeout(() => {
      console.log('⏱️ Delayed execution of fetchCharts...');
      fetchCharts();
    }, 100);
  }, []);

  // Auto-refresh every 30 seconds and on window focus for real-time updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing chart history...');
      fetchCharts();
      setLastRefresh(Date.now());
    }, 30000);

    const handleWindowFocus = () => {
      fetchCharts();
      setLastRefresh(Date.now());
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Separate effect for parameter changes
  useEffect(() => {
    console.log('📋 Parameters changed, fetching charts...');
    fetchCharts();
  }, [searchTerm, filterType, sortBy, sortOrder, currentPage]);

  // Listen for chart history updates from the analytics slice
  useEffect(() => {
    const checkForUpdates = () => {
      if (Date.now() - lastRefresh > 5000) { // Only refresh if last refresh was more than 5 seconds ago
        fetchCharts();
        setLastRefresh(Date.now());
      }
    };

    // Check for updates when analytics state changes
    const unsubscribe = () => {
      checkForUpdates();
    };

    return unsubscribe;
  }, [analyticsState.chartHistory]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('Charts component state update:', {
      chartHistory: chartHistory.length,
      loading: chartHistoryLoading,
      error: chartHistoryError,
      pagination: chartHistoryPagination
    });
  }, [chartHistory, chartHistoryLoading, chartHistoryError, chartHistoryPagination]);

  const fetchCharts = useCallback(async () => {
    console.log('🔍 FETCH CHARTS CALLED - Starting fetch process...');
    console.log('� Function executing at:', new Date().toISOString());
    console.log('�📊 Current parameters:', {
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      type: filterType !== 'all' ? filterType : undefined,
      sortBy,
      sortOrder
    });
    console.log('🏪 Redux dispatch function:', typeof dispatch);
    console.log('🎯 fetchChartHistory function:', typeof fetchChartHistory);
    
    try {
      console.log('🚀 About to dispatch fetchChartHistory...');
      console.log('📋 Dispatch parameters:', {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined,
        sortBy,
        sortOrder
      });
      
      const result = await dispatch(fetchChartHistory({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined,
        sortBy,
        sortOrder
      }));
      
      console.log('📈 Redux action result:', result);
      console.log('✅ Result type:', typeof result);
      console.log('🔍 Result payload:', result?.payload);
      console.log('📊 Result meta:', result?.meta);
      
      if (fetchChartHistory.rejected.match(result)) {
        console.error('❌ Chart history fetch REJECTED:', result.payload);
        toast.error('Failed to load chart history');
      } else {
        console.log('✅ Chart history fetch SUCCESSFUL:', result.payload);
      }
    } catch (error) {
      console.error('💥 Error in fetchCharts function:', error);
      console.error('💥 Error stack:', error.stack);
      toast.error('Failed to load chart history');
    }
    
    console.log('🏁 fetchCharts execution completed');
  }, [dispatch, currentPage, pageSize, searchTerm, filterType, sortBy, sortOrder]);

  const handleDeleteChart = async (chartId) => {
    if (!window.confirm('Are you sure you want to delete this chart from history?')) {
      return;
    }

    try {
      await dispatch(deleteChartFromHistory(chartId)).unwrap();
      toast.success('Chart deleted from history');
      fetchCharts(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete chart');
    }
  };

  const handleViewChart = (chart) => {
    // This could be enhanced to open a modal or navigate to chart viewer
    console.log('View chart:', chart);
    toast.success('Chart details loaded');
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getChartTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar':
        return BarChart3;
      case 'line':
        return LineChart;
      case 'pie':
        return PieChart;
      default:
        return TrendingUp;
    }
  };

  const getChartTypeColor = (type) => {
    const colors = {
      bar: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      line: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      pie: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      scatter: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      area: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[type?.toLowerCase()] || colors.default;
  };

  const renderChartCard = (chart) => {
    const ChartIcon = getChartTypeIcon(chart.type);
    
    return (
      <div 
        key={chart._id} 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getChartTypeColor(chart.type)}`}>
              <ChartIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                {chart.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChartTypeColor(chart.type)}`}>
                {chart.type}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewChart(chart)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="View Chart"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteChart(chart._id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Chart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div>
            <span className="font-medium">Created:</span>
            <br />
            {formatDate(chart.createdAt)}
          </div>
          <div>
            <span className="font-medium">Data Points:</span>
            <br />
            {chart.performanceMetrics?.dataPoints || 0}
          </div>
          <div>
            <span className="font-medium">Access Count:</span>
            <br />
            {chart.accessHistory?.length || 0}
          </div>
          <div>
            <span className="font-medium">Last Accessed:</span>
            <br />
            {formatDate(chart.lastAccessed)}
          </div>
        </div>

        {chart.isSaved && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>
          </div>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (chartHistoryPagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-b-xl">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={!chartHistoryPagination.hasPrev}
            className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(chartHistoryPagination.totalPages, currentPage + 1))}
            disabled={!chartHistoryPagination.hasNext}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, chartHistoryPagination.totalCount)}
              </span>{' '}
              of <span className="font-medium">{chartHistoryPagination.totalCount}</span> charts
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!chartHistoryPagination.hasPrev}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {[...Array(Math.min(5, chartHistoryPagination.totalPages))].map((_, i) => {
                const page = Math.max(1, Math.min(
                  chartHistoryPagination.totalPages - 4,
                  Math.max(1, currentPage - 2)
                )) + i;
                
                if (page > chartHistoryPagination.totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === page
                        ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(chartHistoryPagination.totalPages, currentPage + 1))}
                disabled={!chartHistoryPagination.hasNext}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chart History</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and view your saved charts
              {lastRefresh && (
                <span className="ml-2 text-xs">
                  • Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Chart</span>
            </button>
            <button
              onClick={() => {
                fetchCharts();
                setLastRefresh(Date.now());
                toast.success('Chart history refreshed!');
              }}
              disabled={chartHistoryLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${chartHistoryLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search charts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Chart Types</option>
            <option value="bar">Bar Charts</option>
            <option value="line">Line Charts</option>
            <option value="pie">Pie Charts</option>
            <option value="scatter">Scatter Plots</option>
            <option value="area">Area Charts</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="lastAccessed">Sort by Last Access</option>
            <option value="type">Sort by Type</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Debug Section */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-yellow-700 dark:text-yellow-300">Charts loaded:</span>
            <div className="font-mono text-yellow-900 dark:text-yellow-100">{chartHistory.length}</div>
          </div>
          <div>
            <span className="text-yellow-700 dark:text-yellow-300">Loading:</span>
            <div className="font-mono text-yellow-900 dark:text-yellow-100">{chartHistoryLoading ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <span className="text-yellow-700 dark:text-yellow-300">Error:</span>
            <div className="font-mono text-yellow-900 dark:text-yellow-100">{chartHistoryError || 'None'}</div>
          </div>
          <div>
            <span className="text-yellow-700 dark:text-yellow-300">Total Pages:</span>
            <div className="font-mono text-yellow-900 dark:text-yellow-100">{chartHistoryPagination.totalPages || 0}</div>
          </div>
        </div>
        <div className="mt-3 flex space-x-3">
          <button 
            onClick={() => {
              console.log('Manual fetch button clicked - Current state:', {
                chartHistory: chartHistory.length,
                loading: chartHistoryLoading,
                error: chartHistoryError,
                pagination: chartHistoryPagination,
                currentPage,
                pageSize,
                searchTerm,
                filterType,
                sortBy,
                sortOrder
              });
              fetchCharts();
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Manual Fetch
          </button>
          <button 
            onClick={() => {
              console.log('Redux State Dump:', {
                analyticsState,
                chartHistory,
                chartHistoryLoading,
                chartHistoryError,
                chartHistoryPagination
              });
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Dump State
          </button>
          <button 
            onClick={() => {
              console.log('🎯 MANUAL FETCH TEST - Calling fetchCharts directly...');
              console.log('📋 fetchCharts function:', fetchCharts);
              fetchCharts();
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Manual Fetch Test
          </button>
          <button 
            onClick={async () => {
              console.log('🧪 DIRECT API TEST - Bypassing Redux...');
              try {
                const token = authState.token;
                console.log('🔑 Auth token available:', !!token);
                
                if (!token) {
                  console.error('❌ No auth token found');
                  return;
                }
                
                console.log('🚀 Making direct fetch call...');
                const response = await fetch('/api/history/charts?page=1&limit=10', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log('📊 Response status:', response.status);
                console.log('📊 Response headers:', [...response.headers.entries()]);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ SUCCESS - Direct API call worked:', data);
                } else {
                  const errorText = await response.text();
                  console.error('❌ FAILED - Direct API call failed:', response.status, errorText);
                }
              } catch (error) {
                console.error('💥 ERROR in direct API call:', error);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Direct API Test
          </button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {chartHistoryLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading charts...</span>
          </div>
        ) : chartHistoryError ? (
          <div className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">Error loading charts</div>
            <p className="text-gray-600 dark:text-gray-400">{chartHistoryError}</p>
            <button
              onClick={fetchCharts}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : chartHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 max-w-md mx-auto">
              <div className="relative mb-6">
                <BarChart3 className="h-20 w-20 text-blue-400 mx-auto" />
                <div className="absolute -top-2 -right-2 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              {searchTerm || filterType !== 'all' ? (
                <>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    No charts match your filters
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Your chart gallery awaits
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Upload your data and create beautiful, interactive charts that tell your story. 
                    All your charts will appear here for easy access and management.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate('/dashboard/files')}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Data
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/analytics')}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Create Charts
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Charts are automatically saved to your history
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chartHistory.map(renderChartCard)}
              </div>
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Charts;


