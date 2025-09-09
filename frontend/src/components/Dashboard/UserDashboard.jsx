import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  BarChart3, 
  Activity, 
  Upload, 
  Download, 
  TrendingUp, 
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  PieChart,
  BarChart,
  LineChart,
  Eye,
  Clock,
  Target
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../../config/axios';

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: '30',
    activityType: 'all'
  });
  const [selectedChart, setSelectedChart] = useState('overview');

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

  // Fetch dashboard data
  const fetchDashboardData = async (showToast = true) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const response = await axios.get('/api/analytics/user-dashboard-stats', {
        params: filters
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
        if (showToast) {
          toast.success('Dashboard refreshed successfully');
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchDashboardData(false);
  }, [filters]);

  // Activity type options
  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'file_upload', label: 'File Uploads' },
    { value: 'chart_generation', label: 'Chart Generation' },
    { value: 'data_analysis', label: 'Data Analysis' },
    { value: 'file_download', label: 'Downloads' },
    { value: 'data_export', label: 'Data Exports' }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' }
  ];

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
    if (!dashboardData?.charts?.activityBreakdown) return {};

    const data = dashboardData.charts.activityBreakdown.map((item, index) => ({
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
        text: 'Activity Distribution', 
        left: 'center',
        textStyle: {
          fontSize: 18,
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
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12,
          color: theme === 'dark' ? '#9ca3af' : '#4b5563'
        },
        itemGap: 15
      },
      series: [{
        name: 'Activities',
        type: 'pie',
        radius: ['20%', '70%'],
        center: ['65%', '50%'],
        roseType: 'area',
        data,
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937'
          },
          scale: true,
          scaleSize: 5
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
    if (!dashboardData?.charts?.dailyActivityTrend) return {};

    return {
      title: { 
        text: 'Daily Activity Trends', 
        left: 'center',
        textStyle: {
          fontSize: 18,
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
          crossStyle: {
            color: theme === 'dark' ? '#6b7280' : '#9ca3af'
          }
        }
      },
      xAxis: {
        type: 'category',
        data: dashboardData.charts.dailyActivityTrend.map(item => item.formattedDate),
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: { 
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: { 
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Daily Activities',
        data: dashboardData.charts.dailyActivityTrend.map(item => item.count),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { 
          color: currentColors.primary,
          width: 4
        },
        itemStyle: {
          color: currentColors.primary,
          borderWidth: 3,
          borderColor: '#fff'
        },
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
        animationDelay: function (idx) {
          return idx * 50;
        }
      }],
      grid: { 
        top: 70, 
        bottom: 60, 
        left: 60, 
        right: 40,
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)'
      },
      animation: true,
      animationDuration: 1200,
      animationEasing: 'elasticOut'
    };
  };

  const getComparisonChart = () => {
    if (!dashboardData?.charts) return {};

    return {
      title: { 
        text: 'File Uploads vs Chart Generation', 
        left: 'center',
        textStyle: {
          fontSize: 18,
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
          crossStyle: {
            color: theme === 'dark' ? '#6b7280' : '#9ca3af'
          }
        }
      },
      legend: {
        data: ['File Uploads', 'Chart Generation'],
        top: 35,
        textStyle: { 
          color: theme === 'dark' ? '#9ca3af' : '#4b5563',
          fontSize: 12
        }
      },
      xAxis: {
        type: 'category',
        data: dashboardData.charts.dailyActivityTrend.map(item => item.formattedDate),
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: { 
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#e5e7eb'
          }
        },
        axisLabel: { 
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: theme === 'dark' ? '#374151' : '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'File Uploads',
          type: 'bar',
          data: dashboardData.charts.fileUploadTrend.map(item => item.count),
          itemStyle: { 
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#1d4ed8' }
              ]
            }
          },
          barWidth: '35%',
          animationDelay: function (idx) {
            return idx * 100;
          }
        },
        {
          name: 'Chart Generation',
          type: 'bar',
          data: dashboardData.charts.chartGenerationTrend.map(item => item.count),
          itemStyle: { 
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' }
              ]
            }
          },
          barWidth: '35%',
          animationDelay: function (idx) {
            return idx * 100 + 50;
          }
        }
      ],
      grid: { 
        top: 80, 
        bottom: 60, 
        left: 60, 
        right: 40,
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)'
      },
      animation: true,
      animationDuration: 800,
      animationEasing: 'elasticOut'
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name || user?.email}! Here's your activity overview.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {activityTypes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Files</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {dashboardData.summary.totalFiles}
                </p>
              </div>
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Total Charts</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {dashboardData.summary.totalCharts}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Activities</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {dashboardData.summary.totalActivities}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Daily Average</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {dashboardData.summary.averageActivitiesPerDay}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Chart Selection and Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedChart('overview')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedChart === 'overview'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Activity Breakdown
          </button>
          <button
            onClick={() => setSelectedChart('trend')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedChart === 'trend'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <LineChart className="w-4 h-4 mr-2" />
            Daily Trend
          </button>
          <button
            onClick={() => setSelectedChart('comparison')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedChart === 'comparison'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <BarChart className="w-4 h-4 mr-2" />
            Comparison
          </button>
        </div>

        {/* Chart Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedChart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-96"
          >
            {selectedChart === 'overview' && dashboardData && (
              <ReactECharts
                option={getActivityBreakdownChart()}
                style={{ height: '100%', width: '100%' }}
                theme={theme === 'dark' ? 'dark' : undefined}
                opts={{ renderer: 'svg' }}
              />
            )}
            {selectedChart === 'trend' && dashboardData && (
              <ReactECharts
                option={getDailyActivityChart()}
                style={{ height: '100%', width: '100%' }}
                theme={theme === 'dark' ? 'dark' : undefined}
                opts={{ renderer: 'svg' }}
              />
            )}
            {selectedChart === 'comparison' && dashboardData && (
              <ReactECharts
                option={getComparisonChart()}
                style={{ height: '100%', width: '100%' }}
                theme={theme === 'dark' ? 'dark' : undefined}
                opts={{ renderer: 'svg' }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Recent Activities */}
      {dashboardData?.recentActivities && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-emerald-600" />
            Recent Activities
          </h3>
          
          <div className="space-y-3">
            {dashboardData.recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-shrink-0 mr-3">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.performedAt).toLocaleString()}
                  </p>
                </div>
                {activity.fileName && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                    {activity.fileName}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get activity icons
const getActivityIcon = (activityType) => {
  const iconMap = {
    file_upload: <Upload className="w-5 h-5 text-blue-500" />,
    chart_generation: <BarChart3 className="w-5 h-5 text-purple-500" />,
    chart_save: <BarChart3 className="w-5 h-5 text-green-500" />,
    data_analysis: <Activity className="w-5 h-5 text-orange-500" />,
    file_download: <Download className="w-5 h-5 text-blue-500" />,
    file_delete: <FileText className="w-5 h-5 text-red-500" />,
    data_export: <Download className="w-5 h-5 text-green-500" />
  };
  
  return iconMap[activityType] || <Activity className="w-5 h-5 text-gray-500" />;
};

export default UserDashboard;
