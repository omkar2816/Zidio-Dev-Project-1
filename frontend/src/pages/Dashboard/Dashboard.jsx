import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart3, Activity, Upload, Download } from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, isSuperAdmin } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const { recentFiles, chartHistory } = useSelector((state) => state.analytics);

  // Removed dummy stats and activity data

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
  };

  const [selectedRange, setSelectedRange] = useState('7d');

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="xl:col-span-2">
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

        {/* Recent Activity */}
        <div className="xl:col-span-1">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg mr-2"></div>
              Recent Activity
            </h2>
            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              {recentFiles && recentFiles.length > 0 ? (
                recentFiles.slice(0, 5).map((f) => (
                  <div key={f.uploadedAt} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-200">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 truncate font-medium">{f.name}</span>
                    </div>
                    <span className="text-xs flex-shrink-0 ml-2 hidden sm:inline text-gray-500 dark:text-gray-400">{new Date(f.uploadedAt).toLocaleString()}</span>
                    <span className="text-xs flex-shrink-0 ml-2 sm:hidden text-gray-500 dark:text-gray-400">{new Date(f.uploadedAt).toLocaleDateString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No recent uploads.</p>
                </div>
              )}

              {chartHistory && chartHistory.length > 0 && (
                <div className="pt-4 border-t border-white/20 dark:border-gray-700/30">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded mr-2"></div>
                    Recent Charts
                  </p>
                  {chartHistory.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-200 mb-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        </div>
                        <span className="text-gray-900 dark:text-gray-100 truncate max-w-[50vw] sm:max-w-[40vw] font-medium">{c.title}</span>
                      </div>
                      <span className="text-xs flex-shrink-0 ml-2 text-gray-500 dark:text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
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
