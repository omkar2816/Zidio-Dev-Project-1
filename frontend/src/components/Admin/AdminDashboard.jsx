import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ReactECharts from 'echarts-for-react';
import { 
  Users, 
  FileText, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Download,
  Upload,
  ChevronRight,
  Filter,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminAnalyticsFilters from './AdminAnalyticsFilters';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('user_activity');
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: '30',
    activityType: 'all',
    userRole: 'all',
    chartType: 'all'
  });

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    fetchDashboardData();
  }, [filters.dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        timeRange: filters.dateRange,
        ...(filters.activityType !== 'all' && { activityType: filters.activityType }),
        ...(filters.userRole !== 'all' && { userRole: filters.userRole })
      });
      
      const response = await axios.get(`/api/analytics/dashboard-analytics?${queryParams}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setTimeRange(newFilters.dateRange);
    fetchDashboardData();
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  // Chart configurations
  const getActivityTrendChart = () => {
    if (!dashboardData?.chartData?.userActivityTrend) return {};

    const data = dashboardData.chartData.userActivityTrend;
    const dates = [...new Set(data.map(item => item._id.date))].sort();
    const activityTypes = [...new Set(data.map(item => item._id.activityType))];

    // Emerald-focused modern color palette
    const modernColors = [
      '#10b981', '#14b8a6', '#06b6d4', '#f59e0b', 
      '#059669', '#0891b2', '#34d399', '#22d3ee'
    ];

    const series = activityTypes.map((type, index) => ({
      name: type.replace('_', ' ').toUpperCase(),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: modernColors[index % modernColors.length]
      },
      itemStyle: {
        color: modernColors[index % modernColors.length],
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        opacity: 0.1,
        color: modernColors[index % modernColors.length]
      },
      data: dates.map(date => {
        const item = data.find(d => d._id.date === date && d._id.activityType === type);
        return item ? item.count : 0;
      })
    }));

    return {
      title: { 
        text: 'User Activity Trends', 
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#ffffff'
        },
        subtextStyle: {
          color: '#6b7280'
        }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        },
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#9ca3af'
          }
        }
      },
      legend: { 
        top: 35,
        textStyle: {
          fontSize: 12,
          color: '#4b5563'
        }
      },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        }
      },
      yAxis: { 
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series,
      grid: { 
        top: 80, 
        bottom: 60, 
        left: 60, 
        right: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  };

  const getFileUploadChart = () => {
    if (!dashboardData?.chartData?.fileUploadTrend) return {};

    const data = dashboardData.chartData.fileUploadTrend;
    const dates = data.map(item => item._id);
    const counts = data.map(item => item.count);

    return {
      title: { 
        text: 'File Upload Trends', 
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#ffffffff'
        }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        },
        formatter: function(params) {
          return `${params[0].name}<br/>Files Uploaded: <strong>${params[0].value}</strong>`;
        }
      },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          rotate: 45
        }
      },
      yAxis: { 
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Files Uploaded',
        type: 'bar',
        data: counts,
        itemStyle: { 
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' }
            ]
          },
          borderRadius: [4, 4, 0, 0],
          shadowColor: 'rgba(16, 185, 129, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 5
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#10b981' }
              ]
            }
          }
        },
        barWidth: '60%',
        animationDelay: function (idx) {
          return idx * 100;
        }
      }],
      grid: { 
        top: 70, 
        bottom: 80, 
        left: 60, 
        right: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      animation: true,
      animationDuration: 800,
      animationEasing: 'elasticOut'
    };
  };

  const getActivityDistributionChart = () => {
    if (!dashboardData?.chartData?.activityDistribution) return {};

    // Emerald-focused color palette
    const specifiedColors = [
      '#10B981', // Emerald Green
      '#14B8A6', // Teal
      '#06B6D4', // Cyan
      '#F59E0B', // Amber/Orange
      '#EF4444', // Rose Red
      '#059669', // Emerald 600
      '#64748B'  // Slate Gray
    ];

    const data = dashboardData.chartData.activityDistribution.map((item, index) => ({
      value: item.count,
      name: item._id.replace('_', ' ').toUpperCase(),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: specifiedColors[index % specifiedColors.length] },
            { offset: 1, color: adjustBrightness(specifiedColors[index % specifiedColors.length], -0.2) }
          ]
        },
        borderRadius: 4,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 6,
        shadowOffsetY: 3
      }
    }));

    // Helper function to adjust color brightness
    function adjustBrightness(hex, percent) {
      const num = parseInt(hex.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent * 100);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    return {
      title: { 
        text: 'Activity Distribution', 
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#ffffffff'
        }
      },
      tooltip: { 
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        },
        formatter: '{a} <br/>{b}: <strong>{c}</strong> ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12,
          color: '#4b5563'
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
            color: '#1f2937'
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

  const getUserRoleChart = () => {
    if (!dashboardData?.chartData?.userRoleDistribution) return {};

    // Define emerald-focused colors for different roles
    const roleColors = {
      'SUPERADMIN': '#EF4444', // Rose Red
      'ADMIN': '#14B8A6',      // Teal (emerald family)
      'USER': '#10B981',       // Emerald Green
      'GUEST': '#64748B',      // Slate Gray
      'MODERATOR': '#F59E0B'   // Amber/Orange
    };

    const data = dashboardData.chartData.userRoleDistribution.map(item => ({
      value: item.count,
      name: item._id.toUpperCase(),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: roleColors[item._id.toUpperCase()] || '#14B8A6' },
            { offset: 1, color: adjustBrightness(roleColors[item._id.toUpperCase()] || '#14B8A6', -0.2) }
          ]
        },
        borderRadius: 4,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 6,
        shadowOffsetY: 3
      }
    }));

    // Helper function to adjust color brightness
    function adjustBrightness(hex, percent) {
      const num = parseInt(hex.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent * 100);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    return {
      title: { 
        text: 'User Role Distribution', 
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: { 
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12
        }
      },
      series: [{
        name: 'User Roles',
        type: 'pie',
        radius: ['45%', '75%'], // Doughnut shape with bigger inner radius
        center: ['60%', '50%'], // Move center to right to accommodate legend
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          },
          scale: true,
          scaleSize: 3
        },
        labelLine: {
          show: false
        },
        data,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200;
        }
      }]
    };
  };

  const getChartGenerationChart = () => {
    if (!dashboardData?.chartData?.chartGenerationTrend) return {};

    const data = dashboardData.chartData.chartGenerationTrend;
    const dates = data.map(item => item._id);
    const counts = data.map(item => item.count);

    return {
      title: { 
        text: 'Chart Generation Trends', 
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#ffffff'
        }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        },
        formatter: function(params) {
          return `${params[0].name}<br/>Charts Generated: <strong>${params[0].value}</strong>`;
        }
      },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        }
      },
      yAxis: { 
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Charts Generated',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 4,
          color: '#10b981'
        },
        itemStyle: {
          color: '#10b981',
          borderWidth: 3,
          borderColor: '#fff'
        },
        areaStyle: {
          color: 'rgba(16, 185, 129, 0.2)'
        },
        data: counts,
        animationDelay: function (idx) {
          return idx * 50;
        }
      }],
      grid: { 
        top: 70, 
        bottom: 60, 
        left: 60, 
        right: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      animation: true,
      animationDuration: 1200,
      animationEasing: 'cubicOut'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border rounded-2xl">
      <div className="space-y-8 p-6 backdrop-blur-sm border border-emerald-200 dark:border-emerald-700 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
              {isSuperAdmin 
                ? 'Complete system overview with admin and user analytics' 
                : 'User activity analytics and system monitoring'
              }
            </p>
          </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => handleFiltersChange({ ...filters, dateRange: e.target.value })}
            className="px-4 py-2 border border-emerald-300 dark:border-emerald-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdminAnalyticsFilters 
        onFiltersChange={handleFiltersChange}
        currentFilters={filters}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dashboardData?.metrics?.topActiveUsers?.length || 0}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <p className="text-xs text-green-600 dark:text-green-400">
                  Active in last {filters.dateRange} days
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">File Uploads</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dashboardData?.chartData?.fileUploadTrend?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <p className="text-xs text-green-600 dark:text-green-400">
                  Last {filters.dateRange} days
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Charts Generated</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dashboardData?.chartData?.chartGenerationTrend?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
              <div className="flex items-center mt-1">
                <BarChart3 className="w-4 h-4 text-emerald-500 mr-1" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Last {filters.dateRange} days
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-teal-100 dark:bg-teal-900/20">
              <BarChart3 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dashboardData?.metrics?.systemHealth?.uptime?.toFixed(1) || 99.5}%
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Uptime
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Activity Metrics (Super Admin Only) */}
      {isSuperAdmin && dashboardData?.metrics?.adminActivityStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Admin Activity Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {dashboardData.metrics.adminActivityStats.userCreation}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users Created</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {dashboardData.metrics.adminActivityStats.userDeletion}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users Deleted</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {dashboardData.metrics.adminActivityStats.roleUpdates}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Role Updates</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* File Upload Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95">
          <ReactECharts 
            option={getFileUploadChart()} 
            style={{ height: '400px' }}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : undefined}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* Activity Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95">
          <ReactECharts 
            option={getActivityDistributionChart()} 
            style={{ height: '400px' }}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : undefined}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* Chart Generation Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95">
          <ReactECharts 
            option={getChartGenerationChart()} 
            style={{ height: '400px' }}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : undefined}
            opts={{ renderer: 'svg' }}
          />
        </div>

        {/* User Role Distribution (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95">
            <ReactECharts 
              option={getUserRoleChart()} 
              style={{ height: '400px' }}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : undefined}
              opts={{ renderer: 'svg' }}
            />
          </div>
        )}

        {/* User Activity Trends - Now in prominent position */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-95 lg:col-span-2">
          <ReactECharts 
            option={getActivityTrendChart()} 
            style={{ height: '400px' }}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : undefined}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      {/* Top Active Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Active Users (Last {filters.dateRange} days)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Activities</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Activity Types</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.metrics?.topActiveUsers?.map((user, index) => (
                <tr key={user._id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300' :
                      user.role === 'superadmin' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    }`}>
                      {user.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {user.activityCount}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.activityTypes?.slice(0, 3).map((type, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                      {user.activityTypes?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          +{user.activityTypes.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.lastActivity).toLocaleDateString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No user activity data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
