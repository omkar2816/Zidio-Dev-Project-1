import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../../config/axios';
import { 
  Clock, 
  BarChart3, 
  FileText, 
  Filter,
  Search,
  Eye,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const History = () => {
  const [charts, setCharts] = useState([]);
  const [processing, setProcessing] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('charts');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, [activeTab, searchTerm, filterType, sortBy, sortOrder, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'charts') {
        await fetchCharts();
      } else if (activeTab === 'processing') {
        await fetchProcessing();
      } else if (activeTab === 'statistics') {
        await fetchStatistics();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async () => {
    const params = {
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      type: filterType !== 'all' ? filterType : undefined,
      sortBy,
      sortOrder
    };

    const response = await axios.get('/api/history/charts', { params });
    setCharts(response.data.data);
    setTotalPages(response.data.pagination.totalPages);
  };

  const fetchProcessing = async () => {
    const params = {
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      sortBy,
      sortOrder
    };

    const response = await axios.get('/api/history/processing', { params });
    setProcessing(response.data.data);
    setTotalPages(response.data.pagination.totalPages);
  };

  const fetchStatistics = async () => {
    const response = await axios.get('/api/history/statistics');
    setStatistics(response.data.data);
  };

  const handleDeleteChart = async (chartId) => {
    if (!window.confirm('Are you sure you want to delete this chart from history?')) {
      return;
    }

    try {
      await axios.delete(`/api/history/charts/${chartId}`);
      toast.success('Chart deleted from history');
      fetchCharts();
    } catch (error) {
      console.error('Error deleting chart:', error);
      toast.error('Failed to delete chart');
    }
  };

  const handleViewChart = async (chartId) => {
    try {
      const response = await axios.get(`/api/history/charts/${chartId}`);
      const chart = response.data.data;
      
      // Check if this is a 3D chart
      const is3DChart = chart.chartType?.includes('3d') || 
                       chart.chartType === 'scatter3d' || 
                       chart.chartType === 'surface3d' || 
                       chart.chartType === 'mesh3d' ||
                       chart.configuration?.chart3DConfig?.is3D;

      if (is3DChart) {
        // For 3D charts, open in a new window/tab with Analytics page and auto-load 3D chart
        const analyticsUrl = `/analytics?viewChart=${chartId}&chartType=3d`;
        window.open(analyticsUrl, '_blank');
        toast.success('Opening 3D chart in new tab');
      } else {
        // For 2D charts, open in Analytics page
        const analyticsUrl = `/analytics?viewChart=${chartId}`;
        window.open(analyticsUrl, '_blank');
        toast.success('Opening chart in new tab');
      }
      
      console.log('Chart data:', chart);
    } catch (error) {
      console.error('Error viewing chart:', error);
      toast.error('Failed to load chart details');
    }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getChartTypeColor = (type) => {
    const colors = {
      bar: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
      line: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
      pie: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      scatter: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
      area: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
      default: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    };
    return colors[type] || colors.default;
  };

  const renderChartHistory = () => (
    <div className="space-y-4">
      {charts.map((chart) => (
        <div key={chart._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-glow-emerald transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{chart.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChartTypeColor(chart.type)}`}>
                  {chart.type}
                </span>
                {chart.isSaved && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                    Saved
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(chart.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Data Points:</span> {chart.performanceMetrics.dataPoints}
                </div>
                <div>
                  <span className="font-medium">Access Count:</span> {chart.accessHistory.length}
                </div>
                <div>
                  <span className="font-medium">Last Accessed:</span> {formatDate(chart.lastAccessed)}
                </div>
              </div>

              {chart.dataSource.file && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Source File: {chart.dataSource.file.originalName || 'Unknown'}
                </div>
              )}
            </div>

            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleViewChart(chart._id)}
                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                title="View Chart"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteChart(chart._id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Chart"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {charts.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No charts found in your history</p>
        </div>
      )}
    </div>
  );

  const renderProcessingHistory = () => (
    <div className="space-y-4">
      {processing.map((session) => (
        <div key={session._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-glow-emerald transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {session.metadata.originalFileName}
                </h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200">
                  {session.processingSteps.length} steps
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div>
                  <span className="font-medium">Date:</span> {formatDate(session.createdAt)}
                </div>
                <div>
                  <span className="font-medium">File Size:</span> {formatFileSize(session.metadata.fileSize)}
                </div>
                <div>
                  <span className="font-medium">Rows:</span> {session.metadata.rowCount}
                </div>
                <div>
                  <span className="font-medium">Quality:</span> {(session.qualityAssessment.completeness * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Processing Steps:</h4>
            <div className="space-y-1">
              {session.processingSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500' : 
                    step.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-gray-700 dark:text-gray-300">{step.operation}</span>
                  <span className="text-gray-500 dark:text-gray-400">({step.status})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {processing.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No processing history found</p>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statistics && (
        <>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-glow-emerald transition-all duration-300">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalCharts}</p>
                <p className="text-gray-600 dark:text-gray-400">Total Charts</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-glow-emerald transition-all duration-300">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.totalProcessingSessions}</p>
                <p className="text-gray-600 dark:text-gray-400">Files Processed</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-glow-emerald transition-all duration-300">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.chartAccessHistory.totalAccesses}</p>
                <p className="text-gray-600 dark:text-gray-400">Chart Views</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-soft border border-gray-200/50 dark:border-gray-700/50 p-6 md:col-span-2 lg:col-span-3 hover:shadow-glow-emerald transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Chart Types Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.chartTypeDistribution).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${getChartTypeColor(type)}`}>
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 sm:px-6 rounded-b-xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              Previous
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                      : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                History & Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">View and manage your chart history, file processing, and statistics</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-1 p-2">
              {[
                { id: 'charts', name: 'Chart History', icon: BarChart3 },
                { id: 'processing', name: 'Processing History', icon: FileText },
                { id: 'statistics', name: 'Statistics', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center space-x-2 py-3 px-6 font-medium text-sm rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters and Search */}
        {(activeTab === 'charts' || activeTab === 'processing') && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {activeTab === 'charts' && (
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Chart Types</option>
                  <option value="bar">Bar Charts</option>
                  <option value="line">Line Charts</option>
                  <option value="pie">Pie Charts</option>
                  <option value="scatter">Scatter Plots</option>
                  <option value="area">Area Charts</option>
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="lastAccessed">Sort by Last Access</option>
                {activeTab === 'charts' && <option value="accessCount">Sort by Access Count</option>}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RotateCcw className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : (
          <>
            {activeTab === 'charts' && renderChartHistory()}
            {activeTab === 'processing' && renderProcessingHistory()}
            {activeTab === 'statistics' && renderStatistics()}
          </>
        )}

        {/* Pagination */}
        {(activeTab === 'charts' || activeTab === 'processing') && totalPages > 1 && renderPagination()}
      </div>
    </div>
  );
};

export default History;
