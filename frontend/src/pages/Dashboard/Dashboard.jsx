import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart3, Activity, Upload, Download } from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
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
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
    },
  };

  const [selectedRange, setSelectedRange] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
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

      {/* Stats Grid removed (no dummy data) */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  aria-label={action.title}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg ${colorStyles[action.color].bg} flex-shrink-0`}>
                      <action.icon className={`h-5 w-5 ${colorStyles[action.color].text} flex-shrink-0`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              {recentFiles && recentFiles.length > 0 ? (
                recentFiles.slice(0, 5).map((f) => (
                  <div key={f.uploadedAt} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900 dark:text-gray-100 truncate max-w-[50vw] sm:max-w-[40vw]">{f.name}</span>
                    </div>
                    <span className="text-xs flex-shrink-0 ml-2">{new Date(f.uploadedAt).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div>No recent uploads.</div>
              )}

              {chartHistory && chartHistory.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">Recent Charts</p>
                  {chartHistory.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <BarChart3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100 truncate max-w-[50vw] sm:max-w-[40vw]">{c.title}</span>
                      </div>
                      <span className="text-xs flex-shrink-0 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Data Overview
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setSelectedRange('7d')}
              aria-pressed={selectedRange === '7d'}
              className={`px-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
                selectedRange === '7d'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Last 7 days
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange('30d')}
              aria-pressed={selectedRange === '30d'}
              className={`px-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
                selectedRange === '30d'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Last 30 days
            </button>
          </div>
        </div>
        <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Upload your first Excel file to see charts here
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Showing: {selectedRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
