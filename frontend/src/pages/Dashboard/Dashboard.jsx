import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Activity, 
  Upload, 
  Download, 
  FileText, 
  Eye, 
  Trash2, 
  LogIn, 
  LogOut, 
  Users,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Clock,
  Target
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../../config/axios';
import { fetchChartHistory, fetchUploadedFiles, fetchRecentActivities } from '../../store/slices/analyticsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, isAdmin, isSuperAdmin } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const { recentFiles, chartHistory, recentActivities } = useSelector((state) => state.analytics);

  // Ref for the scrollable recent activity container
  const recentActivityRef = useRef(null);

  // User Activity Analytics State
  const [userActivityData, setUserActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState('overview');
  const [filters, setFilters] = useState({
    dateRange: '30',
    activityType: 'all'
  });

  // Theme-aware color schemes (matching Admin Dashboard)
  const colorSchemes = {
    light: {
      primary: '#10B981', // Emerald Green (matching admin)
      secondary: '#3B82F6', // Sky Blue (matching admin)
      accent: '#F59E0B', // Amber/Orange (matching admin)
      danger: '#EF4444', // Rose Red (matching admin)
      success: '#10b981', // Emerald (matching admin)
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      // Admin Dashboard specified color palette
      gradient: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#64748B'],
      // Modern trend colors from admin
      trendColors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
    },
    dark: {
      primary: '#10b981',
      secondary: '#38bdf8',
      accent: '#fbbf24',
      danger: '#f87171',
      success: '#34d399',
      background: '#1f2937',
      surface: '#111827',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      // Same colors for dark mode consistency
      gradient: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#64748B'],
      trendColors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
    }
  };

  const currentColors = colorSchemes[theme] || colorSchemes.light;

  const quickActions = [
    {
      title: 'Upload Excel File',
      description: 'Upload and analyze your data',
      icon: Upload,
      color: 'blue',
      href: '/analytics'
    },
    {
      title: 'Create Charts',
      description: 'Generate beautiful visualizations',
      icon: BarChart3,
      color: 'green',
      href: '/charts'
    },
    {
      title: 'View Analytics',
      description: 'Explore your data insights',
      icon: Activity,
      color: 'purple',
      href: '/analytics'
    },
    {
      title: 'Export Data',
      description: 'Download your processed data',
      icon: Download,
      color: 'orange',
      href: '/analytics'
    }
  ];

  const colorStyles = {
    blue: {
      bg: 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
      text: 'text-green-600 dark:text-green-400',
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20',
      text: 'text-orange-600 dark:text-orange-400',
    },
    red: {
      bg: 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20',
      text: 'text-red-600 dark:text-red-400',
    },
    gray: {
      bg: 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20',
      text: 'text-gray-600 dark:text-gray-400',
    },
  };

  // Helper function to get activity icon and color
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'file_upload':
        return { icon: Upload, color: 'blue' };
      case 'chart_generation':
        return { icon: BarChart3, color: 'purple' };
      case 'chart_save':
        return { icon: BarChart3, color: 'green' };
      case 'data_analysis':
        return { icon: Activity, color: 'orange' };
      case 'file_download':
        return { icon: Download, color: 'blue' };
      case 'file_delete':
        return { icon: Trash2, color: 'red' };
      case 'data_export':
        return { icon: Download, color: 'green' };
      case 'login':
        return { icon: LogIn, color: 'green' };
      case 'logout':
        return { icon: LogOut, color: 'orange' };
      case 'user_management':
        return { icon: Users, color: 'purple' };
      default:
        return { icon: Activity, color: 'gray' };
    }
  };

  const [selectedRange, setSelectedRange] = useState('7d');

  // Fetch dashboard data when component mounts
  useEffect(() => {
    if (user) {
      // Fetch recent files
      dispatch(fetchUploadedFiles()).catch(console.error);
      
      // Fetch recent chart history
      dispatch(fetchChartHistory({ 
        page: 1, 
        limit: 10, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      })).catch(console.error);

      // Fetch recent activities
      dispatch(fetchRecentActivities({ limit: 10 })).catch(console.error);
    }
  }, [dispatch, user]);

  // Add mouse wheel event handling for recent activity section
  useEffect(() => {
    const recentActivityContainer = recentActivityRef.current;
    
    if (!recentActivityContainer) return;

    const handleWheel = (e) => {
      // Check if the scroll is happening within the recent activity container
      if (recentActivityContainer.contains(e.target)) {
        e.preventDefault();
        
        // Calculate scroll amount (adjust multiplier for scroll speed)
        const scrollAmount = e.deltaY * 0.5;
        
        // Apply smooth scrolling
        recentActivityContainer.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    // Add event listener to the container
    recentActivityContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup event listener on component unmount
    return () => {
      if (recentActivityContainer) {
        recentActivityContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Fetch user activity data
  const fetchUserActivityData = async (showToast = true) => {
    try {
      if (showToast) setActivityLoading(true);

      const response = await axios.get('/api/analytics/user-dashboard-stats', {
        params: filters
      });

      if (response.data.success) {
        setUserActivityData(response.data.data);
        if (showToast) {
          toast.success('Activity data refreshed');
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch activity data');
      }
    } catch (error) {
      console.error('Error fetching user activity data:', error);
      toast.error('Failed to load activity data');
    } finally {
      setActivityLoading(false);
    }
  };

  // Load user activity data when filters change
  useEffect(() => {
    if (user) {
      fetchUserActivityData(false);
    }
  }, [filters, user]);

  // Helper function to adjust color brightness (from Admin Dashboard)
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Chart configurations (matching Admin Dashboard styling)
  const getActivityBreakdownChart = () => {
    if (!userActivityData?.charts?.activityBreakdown) return {};

    const data = userActivityData.charts.activityBreakdown.map((item, index) => ({
      value: item.count,
      name: item.label,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: currentColors.gradient[index % currentColors.gradient.length] },
            { offset: 1, color: adjustBrightness(currentColors.gradient[index % currentColors.gradient.length], -0.2) }
          ]
        },
        borderRadius: 4,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 6,
        shadowOffsetY: 3
      }
    }));

    return {
      title: { 
        text: 'My Activity Overview', 
        left: 'center',
        top: '10',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: theme === 'dark' ? '#f9fafb' : '#1f2937'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: theme === 'dark' ? '#f9fafb' : '#374151' },
        formatter: '{a} <br/>{b}: <strong>{c}</strong> ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        bottom: '10',
        textStyle: {
          fontSize: 12,
          color: theme === 'dark' ? '#9ca3af' : '#4b5563'
        },
        itemGap: 20,
        itemWidth: 12,
        itemHeight: 12
      },
      series: [{
        name: 'Activities',
        type: 'pie',
        radius: ['30%', '85%'],
        center: ['50%', '60%'],
        roseType: 'area',
        data,
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937'
          },
          scale: true,
          scaleSize: 10
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200;
        }
      }]
    };
  };

  const getDailyActivityChart = () => {
    if (!userActivityData?.charts?.dailyActivityTrend) return {};

    return {
      title: { 
        text: 'Daily Activity Trend', 
        left: 'center',
        top: '10',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: theme === 'dark' ? '#f9fafb' : '#1f2937'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: theme === 'dark' ? '#f9fafb' : '#374151' },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: theme === 'dark' ? '#6b7280' : '#9ca3af' }
        }
      },
      xAxis: {
        type: 'category',
        data: userActivityData.charts.dailyActivityTrend.map(item => item.formattedDate),
        axisLine: { lineStyle: { color: theme === 'dark' ? '#374151' : '#e5e7eb' } },
        axisLabel: { color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: theme === 'dark' ? '#374151' : '#e5e7eb' } },
        axisLabel: { color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 10 },
        splitLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Daily Activities',
        data: userActivityData.charts.dailyActivityTrend.map(item => item.count),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: currentColors.primary, width: 3 },
        itemStyle: { color: currentColors.primary, borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: currentColors.primary + '40' },
              { offset: 1, color: currentColors.primary + '10' }
            ]
          }
        },
        animationDelay: function (idx) { return idx * 30; }
      }],
      grid: { 
        top: 60, bottom: 50, left: 50, right: 30,
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)'
      },
      animation: true,
      animationDuration: 1000,
      animationEasing: 'elasticOut'
    };
  };

  // Activity type options
  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'file_upload', label: 'File Uploads' },
    { value: 'chart_generation', label: 'Chart Generation' },
    { value: 'data_analysis', label: 'Data Analysis' },
    { value: 'file_download', label: 'Downloads' }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      {!isAdmin && !isSuperAdmin && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user?.firstName || 'User'}!
                </h1>
                <p className="text-blue-100 mt-1">
                  Ready to analyze some data today?
                </p>
              </div>
              <div className="hidden md:block">
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Current Time</p>
                  <p className="text-xl font-semibold">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      )}

      {/* Stats Grid removed (no dummy data) */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Quick Actions - Takes 2 columns on XL screens, full width on smaller */}
        <div className="lg:col-span-1 xl:col-span-2">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-2"></div>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  aria-label={action.title}
                  className="group relative overflow-hidden p-4 bg-white/50 dark:bg-gray-900/50 border border-white/30 dark:border-gray-700/30 rounded-xl hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 backdrop-blur-sm hover:shadow-lg hover:scale-105"
                >
                  <div className="relative z-10 flex items-center space-x-3 min-w-0">
                    <div className={`p-3 rounded-xl ${colorStyles[action.color].bg} flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`h-5 w-5 ${colorStyles[action.color].text} flex-shrink-0`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity - Fixed height with scrollable content */}
        <div className="lg:col-span-1 xl:col-span-1">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl h-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg mr-2"></div>
              Recent Activity
            </h2>
            {/* Scrollable container with fixed height */}
            <div ref={recentActivityRef} className="h-80 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-4">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.slice(0, 15).map((activity) => {
                    const { icon: Icon, color } = getActivityIcon(activity.activityType);
                    const colorStyle = colorStyles[color] || colorStyles.gray;
                    
                    return (
                      <div key={activity._id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-200">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className={`p-2 ${colorStyle.bg} rounded-lg flex-shrink-0`}>
                            <Icon className={`h-4 w-4 ${colorStyle.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-900 dark:text-gray-100 truncate font-medium block text-sm">
                              {activity.description}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.activityType.replace('_', ' ')} • {new Date(activity.performedAt || activity.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activities.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Activity Section (Previously Data Overview) */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-2"></div>
            My Activity
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 backdrop-blur-sm"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Activity Type Filter */}
            <select
              value={filters.activityType}
              onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 backdrop-blur-sm"
            >
              {activityTypes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchUserActivityData(true)}
              disabled={activityLoading}
              className="flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${activityLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Activity Content */}
        {activityLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : userActivityData ? (
          <div className="space-y-6">
            {/* Activity Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-xs font-medium">Total Files</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {userActivityData.summary.totalFiles}
                    </p>
                  </div>
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700/50 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-xs font-medium">Total Charts</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {userActivityData.summary.totalCharts}
                    </p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-xs font-medium">Activities</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {userActivityData.summary.totalActivities}
                    </p>
                  </div>
                  <Activity className="w-6 h-6 text-purple-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700/50 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 text-xs font-medium">Daily Avg</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {userActivityData.summary.averageActivitiesPerDay}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
              </motion.div>
            </div>

            {/* Chart Selection and Display */}
            <div className="bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
              {/* Chart Type Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedChart('overview')}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedChart === 'overview'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'
                  }`}
                >
                  <PieChart className="w-3 h-3 mr-1" />
                  Activity Overview
                </button>
                <button
                  onClick={() => setSelectedChart('trend')}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedChart === 'trend'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70'
                  }`}
                >
                  <LineChart className="w-3 h-3 mr-1" />
                  Daily Trends
                </button>
              </div>

              {/* Chart Display */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedChart}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-[480px] relative overflow-hidden rounded-lg"
                >
                  {selectedChart === 'overview' && (
                    <ReactECharts
                      option={getActivityBreakdownChart()}
                      style={{ height: '100%', width: '100%' }}
                      theme={theme === 'dark' ? 'dark' : undefined}
                      opts={{ renderer: 'svg' }}
                    />
                  )}
                  {selectedChart === 'trend' && (
                    <ReactECharts
                      option={getDailyActivityChart()}
                      style={{ height: '100%', width: '100%' }}
                      theme={theme === 'dark' ? 'dark' : undefined}
                      opts={{ renderer: 'svg' }}
                    />
                  )}
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full translate-y-12 -translate-x-12 pointer-events-none"></div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Start using the platform to see your activity analytics
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Upload files and create charts to track your progress
              </p>
            </div>
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full translate-y-12 -translate-x-12"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
