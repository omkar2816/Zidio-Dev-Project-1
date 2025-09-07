import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart3, Activity, Upload, Download, FileText, Eye, Trash2, LogIn, LogOut, Users } from 'lucide-react';
import { fetchChartHistory, fetchUploadedFiles, fetchRecentActivities } from '../../store/slices/analyticsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, isAdmin, isSuperAdmin } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const { recentFiles, chartHistory, recentActivities } = useSelector((state) => state.analytics);

  // Ref for the scrollable recent activity container
  const recentActivityRef = useRef(null);

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

      {/* Chart Placeholder */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg mr-2"></div>
            Data Overview
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setSelectedRange('7d')}
              aria-pressed={selectedRange === '7d'}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 backdrop-blur-sm ${
                selectedRange === '7d'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70 border border-white/30 dark:border-gray-600/30'
              }`}
            >
              Last 7 days
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange('30d')}
              aria-pressed={selectedRange === '30d'}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 backdrop-blur-sm ${
                selectedRange === '30d'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70 border border-white/30 dark:border-gray-600/30'
              }`}
            >
              Last 30 days
            </button>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
          <div className="text-center relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Upload your first Excel file to see charts here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Showing: {selectedRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </p>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
