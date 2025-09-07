import React, { useState, useEffect, useRef } from 'react';
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
  Download,
  Activity,
  Users,
  Calendar,
  Layers,
  Zap,
  Star,
  MoreVertical,
  Grid,
  List,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchChartHistory, deleteChartFromHistory } from '../../store/slices/analyticsSlice';

const ChartHistoryRedesigned = () => {
  console.log('🏗️ ChartHistoryRedesigned component rendering...');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const { chartHistory, loading, error } = useSelector((state) => state.analytics);
  
  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCharts, setSelectedCharts] = useState(new Set());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [statsData, setStatsData] = useState({
    totalCharts: 0,
    recentCharts: 0,
    chartTypes: {},
    activityLevel: 'low'
  });

  // Refs for real-time animations
  const newChartRef = useRef(new Set());
  const containerRef = useRef(null);

  // Real-time update indicator
  const [realtimeStatus, setRealtimeStatus] = useState('connected');

  // Check authentication
  useEffect(() => {
    console.log('🔍 Auth check - user:', authState.user?.email, 'token exists:', !!authState.token);
    if (!authState.user || !authState.token) {
      console.log('❌ No authentication - redirecting to login');
      navigate('/auth');
      return;
    }
    
    fetchHistory();
  }, [authState.user, authState.token, navigate]);

  // Enhanced real-time auto-refresh with dynamic intervals
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const getRefreshInterval = () => {
      // More frequent updates during active periods
      const now = new Date();
      const hour = now.getHours();
      
      // Business hours (9 AM - 6 PM): 5 seconds
      // Evening (6 PM - 10 PM): 10 seconds  
      // Night/Early morning: 30 seconds
      if (hour >= 9 && hour <= 18) return 5000;
      if (hour >= 18 && hour <= 22) return 10000;
      return 30000;
    };

    const interval = setInterval(() => {
      if (authState.user && authState.token && !loading) {
        console.log('🔄 Real-time auto-refresh triggered...');
        fetchHistory(true);
        setLastUpdateTime(new Date());
      }
    }, getRefreshInterval());

    return () => clearInterval(interval);
  }, [authState.user, authState.token, loading, isRealTimeEnabled]);

  // Enhanced event listeners for real-time updates with animations
  useEffect(() => {
    const handleChartSaved = (event) => {
      console.log('📊 Chart saved event received - triggering real-time update', event.detail);
      
      // Add visual indicator for new chart
      if (event.detail?.chartId) {
        newChartRef.current.add(event.detail.chartId);
      }
      
      // Immediate refresh with animation
      setTimeout(() => {
        fetchHistory(true);
        setRealtimeStatus('updating');
        
        setTimeout(() => setRealtimeStatus('connected'), 1000);
      }, 500);
      
      // Show real-time notification
      toast.success('📊 New chart added to history!', {
        icon: '✨',
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
        }
      });
    };

    const handleStorageChange = (event) => {
      if (event.key === 'chartSaved') {
        console.log('📊 Chart saved in another tab - syncing history');
        fetchHistory(true);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && authState.user && authState.token) {
        console.log('📊 Tab became visible - refreshing history');
        fetchHistory(true);
        setRealtimeStatus('syncing');
        setTimeout(() => setRealtimeStatus('connected'), 800);
      }
    };

    // Multiple event listeners for comprehensive real-time updates
    window.addEventListener('chartSaved', handleChartSaved);
    window.addEventListener('analyticsChartSaved', handleChartSaved);
    window.addEventListener('customChartSaved', handleChartSaved);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('chartSaved', handleChartSaved);
      window.removeEventListener('analyticsChartSaved', handleChartSaved);
      window.removeEventListener('customChartSaved', handleChartSaved);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [authState.user, authState.token]);

  // Update stats when chart history changes
  useEffect(() => {
    if (chartHistory?.charts) {
      const charts = chartHistory.charts;
      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      
      const recentCharts = charts.filter(chart => 
        new Date(chart.createdAt) > oneDayAgo
      ).length;
      
      const chartTypes = charts.reduce((acc, chart) => {
        const type = chart.chartType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      const activityLevel = recentCharts > 10 ? 'high' : recentCharts > 5 ? 'medium' : 'low';
      
      setStatsData({
        totalCharts: charts.length,
        recentCharts,
        chartTypes,
        activityLevel
      });
    }
  }, [chartHistory]);

  // Re-fetch when search/filter parameters change
  useEffect(() => {
    if (authState.user && authState.token) {
      const delayedFetch = setTimeout(() => {
        fetchHistory();
      }, 300);
      return () => clearTimeout(delayedFetch);
    }
  }, [searchTerm, filterType, sortBy, sortOrder, currentPage]);

  const fetchHistory = async (forceRefresh = false) => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: filterType,
        sortBy,
        sortOrder
      };
      
      if (forceRefresh) {
        params._t = Date.now();
        setRealtimeStatus('updating');
      }
      
      await dispatch(fetchChartHistory(params)).unwrap();
      
      if (forceRefresh) {
        setTimeout(() => setRealtimeStatus('connected'), 800);
      }
      
    } catch (error) {
      console.error('❌ Error fetching chart history:', error);
      setRealtimeStatus('error');
      
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
    setRealtimeStatus('updating');
    
    try {
      await fetchHistory(true);
      toast.success('Chart history refreshed', {
        icon: '🔄',
        style: { background: '#3b82f6', color: 'white' }
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh chart history');
      setRealtimeStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
    toast.success(
      isRealTimeEnabled ? 'Real-time updates disabled' : 'Real-time updates enabled',
      { icon: isRealTimeEnabled ? '⏸️' : '▶️' }
    );
  };

  const handleViewChart = (chart) => {
    // Same implementation as before but with enhanced visual feedback
    console.log('👁️ Viewing chart:', chart);
    
    try {
      if (!chart.configuration || !chart.configuration.categories || !chart.configuration.values) {
        toast.error('Chart data not available for viewing');
        return;
      }

      const chartWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!chartWindow) {
        toast.error('Please allow popups for this site to view charts');
        return;
      }
      
      // Enhanced chart viewer with modern design
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chart: ${chart.chartTitle || 'Untitled Chart'}</title>
          <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
          <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #334155; line-height: 1.6; padding: 20px;
            }
            .container {
              max-width: 1200px; margin: 0 auto; background: white;
              border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white; padding: 24px; text-align: center;
            }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .header p { opacity: 0.9; font-size: 16px; }
            .chart-container { padding: 40px; min-height: 600px; }
            #chartDisplay { width: 100%; height: 500px; }
            .chart-info { 
              display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px; padding: 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;
            }
            .info-item { 
              background: white; padding: 16px; rounded: 8px; 
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .info-label { font-weight: 600; color: #64748b; font-size: 14px; }
            .info-value { font-weight: 700; color: #1e293b; font-size: 18px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${chart.chartTitle || 'Untitled Chart'}</h1>
              <p>Interactive Chart Viewer • ${chart.chartType?.toUpperCase() || 'CHART'}</p>
            </div>
            <div class="chart-container">
              <div id="chartDisplay"></div>
            </div>
            <div class="chart-info">
              <div class="info-item">
                <div class="info-label">Chart Type</div>
                <div class="info-value">${chart.chartType?.toUpperCase() || 'UNKNOWN'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data Points</div>
                <div class="info-value">${chart.configuration.values?.length || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Created</div>
                <div class="info-value">${new Date(chart.createdAt).toLocaleDateString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Source</div>
                <div class="info-value">${chart.sourceFileName || 'Direct Input'}</div>
              </div>
            </div>
          </div>
          
          <script>
            const chartData = {
              labels: ${JSON.stringify(chart.configuration.categories || [])},
              values: ${JSON.stringify(chart.configuration.values || [])},
              title: '${chart.chartTitle || 'Data'}',
              type: '${chart.chartType || 'bar'}'
            };
            
            const chart = echarts.init(document.getElementById('chartDisplay'));
            
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
            
            const option = {
              title: { text: chartData.title, left: 'center', textStyle: { fontSize: 20, fontWeight: 'bold' } },
              tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: 'white' } },
              grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
              xAxis: { type: 'category', data: chartData.labels, axisLine: { lineStyle: { color: '#64748b' } } },
              yAxis: { type: 'value', axisLine: { lineStyle: { color: '#64748b' } } },
              series: [{
                name: chartData.title,
                type: chartData.type === 'line' ? 'line' : 'bar',
                data: chartData.values,
                itemStyle: { color: function(params) { return colors[params.dataIndex % colors.length]; } },
                emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
              }]
            };
            
            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
          </script>
        </body>
        </html>
      `;
      
      chartWindow.document.write(htmlContent);
      chartWindow.document.close();
      
      toast.success('Chart opened in new window', { icon: '👁️' });
    } catch (error) {
      console.error('View chart error:', error);
      toast.error('Failed to open chart viewer');
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!window.confirm('Are you sure you want to delete this chart from history?')) {
      return;
    }

    try {
      await dispatch(deleteChartFromHistory(chartId)).unwrap();
      toast.success('Chart deleted from history', { icon: '🗑️' });
      fetchHistory(true);
    } catch (error) {
      toast.error('Failed to delete chart');
    }
  };

  const getChartIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar': return <BarChart3 className="w-5 h-5" />;
      case 'line': return <LineChart className="w-5 h-5" />;
      case 'pie':
      case 'doughnut': return <PieChart className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getChartTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'line': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pie': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'doughnut': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getRealtimeStatusColor = () => {
    switch (realtimeStatus) {
      case 'connected': return 'bg-green-500';
      case 'updating': return 'bg-blue-500 animate-pulse';
      case 'syncing': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Loading state
  if (loading && !chartHistory?.charts?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your chart history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={containerRef}>
          
          {/* Modern Header with Real-time Status */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                      Chart History
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`w-3 h-3 rounded-full ${getRealtimeStatusColor()}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Real-time updates {isRealTimeEnabled ? 'enabled' : 'disabled'}
                      </span>
                      <span className="text-xs text-gray-500">
                        • Last updated {formatDate(lastUpdateTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleRealTime}
                  className={`inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${
                    isRealTimeEnabled 
                      ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Zap className={`w-4 h-4 mr-2 ${isRealTimeEnabled ? 'text-green-600' : 'text-gray-600'}`} />
                  Real-time
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button
                  onClick={() => navigate('/analytics')}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Chart
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Charts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.totalCharts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent (24h)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.recentCharts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chart Types</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(statsData.chartTypes).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  statsData.activityLevel === 'high' ? 'bg-red-100 dark:bg-red-900/50' :
                  statsData.activityLevel === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/50' :
                  'bg-gray-100 dark:bg-gray-900/50'
                }`}>
                  <Activity className={`w-6 h-6 ${
                    statsData.activityLevel === 'high' ? 'text-red-600 dark:text-red-400' :
                    statsData.activityLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{statsData.activityLevel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Charts
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or source..."
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Chart Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chart Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                >
                  <option value="all">All Types</option>
                  <option value="bar">Bar Charts</option>
                  <option value="line">Line Charts</option>
                  <option value="pie">Pie Charts</option>
                  <option value="doughnut">Doughnut Charts</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="chartTitle-asc">Title A-Z</option>
                  <option value="chartTitle-desc">Title Z-A</option>
                  <option value="chartType-asc">Type A-Z</option>
                </select>
              </div>

              {/* View Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  View Mode
                </label>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8 backdrop-blur-sm">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Charts</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts Display */}
          {!loading && chartHistory?.charts && chartHistory.charts.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {chartHistory.charts.map((chart) => {
                    const isNew = newChartRef.current.has(chart.chartId);
                    return (
                      <div
                        key={chart._id || chart.chartId}
                        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                          isNew ? 'ring-2 ring-emerald-400 animate-pulse' : ''
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg">
                                {getChartIcon(chart.chartType)}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                                  {chart.chartTitle || 'Untitled Chart'}
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChartTypeColor(chart.chartType)}`}>
                                  {chart.chartType?.toUpperCase() || 'UNKNOWN'}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Created</span>
                              <span className="text-gray-900 dark:text-white font-medium">{formatDate(chart.createdAt)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Data Points</span>
                              <span className="text-gray-900 dark:text-white font-medium">{chart.configuration?.values?.length || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Source</span>
                              <span className="text-gray-900 dark:text-white font-medium truncate max-w-32" title={chart.sourceFileName}>
                                {chart.sourceFileName || 'Direct Input'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => handleViewChart(chart)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteChart(chart._id)}
                              className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden mb-8">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chart</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Points</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700">
                        {chartHistory.charts.map((chart) => {
                          const isNew = newChartRef.current.has(chart.chartId);
                          return (
                            <tr 
                              key={chart._id || chart.chartId} 
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 ${
                                isNew ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                              }`}
                            >
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
                                  {chart.sourceFileName || 'Direct Input'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatDate(chart.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {chart.configuration?.values?.length || 0}
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
                                    onClick={() => handleDeleteChart(chart._id)}
                                    className="inline-flex items-center p-2 border border-red-300 dark:border-red-600 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                    title="Delete Chart"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {chartHistory?.total > itemsPerPage && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 sm:px-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, chartHistory.total)} of {chartHistory.total} results
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {Math.ceil(chartHistory.total / itemsPerPage)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(chartHistory.total / itemsPerPage), currentPage + 1))}
                        disabled={currentPage >= Math.ceil(chartHistory.total / itemsPerPage)}
                        className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-12">
                <BarChart3 className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No charts found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first chart'
                  }
                </p>
                <button
                  onClick={() => navigate('/analytics')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium shadow-lg transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Chart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartHistoryRedesigned;
