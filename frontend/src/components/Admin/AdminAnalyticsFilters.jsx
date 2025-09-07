import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ReactECharts from 'echarts-for-react';
import { 
  Calendar, 
  Filter, 
  Download, 
  Users, 
  Activity,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';
import axios from 'axios';

const AdminAnalyticsFilters = ({ 
  onFiltersChange, 
  currentFilters, 
  isSuperAdmin 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: currentFilters?.dateRange || '30',
    activityType: currentFilters?.activityType || 'all',
    userRole: currentFilters?.userRole || 'all',
    chartType: currentFilters?.chartType || 'all',
    ...currentFilters
  });

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'file_upload', label: 'File Uploads' },
    { value: 'chart_generation', label: 'Chart Generation' },
    { value: 'chart_save', label: 'Chart Save' },
    { value: 'data_analysis', label: 'Data Analysis' },
    { value: 'data_export', label: 'Data Export' },
    { value: 'login', label: 'Login' },
    { value: 'user_management', label: 'User Management' }
  ];

  const userRoles = [
    { value: 'all', label: 'All Users' },
    { value: 'user', label: 'Regular Users' },
    { value: 'admin', label: 'Admins' },
    ...(isSuperAdmin ? [{ value: 'superadmin', label: 'Super Admins' }] : [])
  ];

  const chartTypes = [
    { value: 'all', label: 'All Chart Types' },
    { value: 'bar', label: 'Bar Charts' },
    { value: 'line', label: 'Line Charts' },
    { value: 'pie', label: 'Pie Charts' },
    { value: 'scatter', label: 'Scatter Plots' },
    { value: 'area', label: 'Area Charts' },
    { value: 'scatter3d', label: '3D Charts' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: '30',
      activityType: 'all',
      userRole: 'all',
      chartType: 'all'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '30');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Activity className="w-4 h-4 inline mr-1" />
              Activity Type
            </label>
            <select
              value={filters.activityType}
              onChange={(e) => handleFilterChange('activityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* User Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              User Role
            </label>
            <select
              value={filters.userRole}
              onChange={(e) => handleFilterChange('userRole', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {userRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Chart Type
            </label>
            <select
              value={filters.chartType}
              onChange={(e) => handleFilterChange('chartType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {chartTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsFilters;
