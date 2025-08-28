import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import {
  getAdminOverview,
  getActivityTrends,
  getActivityDistribution,
  getTopUsers,
  getRecentActivities
} from '../../store/slices/analyticsSlice';

const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const {
    adminOverview,
    activityTrends,
    activityDistribution,
    topUsers,
    recentActivities,
    adminLoading,
    adminError
  } = useSelector((state) => state.analytics);

  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    // Fetch all admin analytics data
    dispatch(getAdminOverview());
    dispatch(getActivityTrends());
    dispatch(getActivityDistribution());
    dispatch(getTopUsers());
    dispatch(getRecentActivities(25));

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(getAdminOverview());
      dispatch(getActivityTrends());
      dispatch(getActivityDistribution());
      dispatch(getTopUsers());
      dispatch(getRecentActivities(25));
    }, 5 * 60 * 1000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch]);

  // Activity Trends Chart Options
  const activityTrendsOptions = {
    title: {
      text: 'User Activity Trends (Last 30 Days)',
      left: 'center',
      textStyle: {
        color: '#374151',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    xAxis: {
      type: 'category',
      data: activityTrends.length > 0 ? activityTrends.map(item => new Date(item.date).toLocaleDateString()) : [],
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Activities'
    },
    series: [
      {
        name: 'Daily Activities',
        type: 'line',
        smooth: true,
        data: activityTrends.length > 0 ? activityTrends.map(item => item.count) : [],
        lineStyle: {
          color: '#3B82F6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
            ]
          }
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    }
  };

  // Activity Distribution Chart Options
  const activityDistributionOptions = {
    title: {
      text: 'Activity Distribution',
      left: 'center',
      textStyle: {
        color: '#374151',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Activity Type',
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '45%'],
        data: activityDistribution.length > 0 ? activityDistribution.map(item => ({
          value: item.count,
          name: item._id.replace('_', ' ').toUpperCase()
        })) : [{ value: 1, name: 'No Data' }],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c} ({d}%)'
        }
      }
    ]
  };

  // Top Users Chart Options
  const topUsersOptions = {
    title: {
      text: 'Most Active Users',
      left: 'center',
      textStyle: {
        color: '#374151',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value',
      name: 'Activities'
    },
    yAxis: {
      type: 'category',
      data: topUsers.length > 0 ? topUsers.map(user => user.userName || 'Unknown User') : ['No Data'],
      axisLabel: {
        interval: 0
      }
    },
    series: [
      {
        name: 'Activity Count',
        type: 'bar',
        data: topUsers.length > 0 ? topUsers.map(user => user.activityCount) : [0],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#8B5CF6' },
              { offset: 1, color: '#A78BFA' }
            ]
          }
        }
      }
    ],
    grid: {
      left: '25%',
      right: '4%',
      top: '15%',
      bottom: '3%',
      containLabel: true
    }
  };

  const formatActivityType = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (adminLoading && !adminOverview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (adminError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-medium">Error loading analytics</h3>
          <p className="text-sm mt-1">{adminError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {adminOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{adminOverview.totalUsers}</h3>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{adminOverview.activeUsers}</h3>
                <p className="text-sm text-gray-600">Active Users (7 days)</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{adminOverview.chartGenerations}</h3>
                <p className="text-sm text-gray-600">Charts Generated (30 days)</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{adminOverview.fileUploads}</h3>
                <p className="text-sm text-gray-600">Files Uploaded (30 days)</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{adminOverview.activitiesToday}</h3>
                <p className="text-sm text-gray-600">Activities Today</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{adminOverview.totalActivities}</h3>
                <p className="text-sm text-gray-600">Total Activities (30 days)</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <ReactECharts
            option={activityTrendsOptions}
            style={{ height: '400px' }}
          />
        </motion.div>

        {/* Activity Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <ReactECharts
            option={activityDistributionOptions}
            style={{ height: '400px' }}
          />
        </motion.div>
      </div>

      {/* Top Users Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <ReactECharts
          option={topUsersOptions}
          style={{ height: '400px' }}
        />
      </motion.div>

      {/* Recent Activities Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivities.slice(0, 10).map((activity, index) => (
                <tr key={activity._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.user?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {formatActivityType(activity.activityType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {activity.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;
