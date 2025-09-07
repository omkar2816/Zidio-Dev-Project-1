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
      
      // Open chart in a new window or modal
      // This could be enhanced to integrate with the main chart viewer
      console.log('Chart data:', chart);
      toast.success('Chart details loaded');
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
      bar: 'bg-blue-100 text-blue-800',
      line: 'bg-green-100 text-green-800',
      pie: 'bg-purple-100 text-purple-800',
      scatter: 'bg-yellow-100 text-yellow-800',
      area: 'bg-indigo-100 text-indigo-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.default;
  };

  const renderChartHistory = () => (
    <div className="space-y-4">
      {charts.map((chart) => (
        <div key={chart._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChartTypeColor(chart.type)}`}>
                  {chart.type}
                </span>
                {chart.isSaved && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Saved
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
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
                <div className="text-sm text-gray-500 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Source File: {chart.dataSource.file.originalName || 'Unknown'}
                </div>
              )}
            </div>

            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleViewChart(chart._id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Chart"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteChart(chart._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No charts found in your history</p>
        </div>
      )}
    </div>
  );

  const renderProcessingHistory = () => (
    <div className="space-y-4">
      {processing.map((session) => (
        <div key={session._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {session.metadata.originalFileName}
                </h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {session.processingSteps.length} steps
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
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

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Processing Steps:</h4>
            <div className="space-y-1">
              {session.processingSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500' : 
                    step.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-gray-700">{step.operation}</span>
                  <span className="text-gray-500">({step.status})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {processing.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No processing history found</p>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statistics && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{statistics.totalCharts}</p>
                <p className="text-gray-600">Total Charts</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{statistics.totalProcessingSessions}</p>
                <p className="text-gray-600">Files Processed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{statistics.chartAccessHistory.totalAccesses}</p>
                <p className="text-gray-600">Chart Views</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Types Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.chartTypeDistribution).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${getChartTypeColor(type)}`}>
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                      ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">History & Analytics</h1>
          <p className="text-gray-600">View and manage your chart history, file processing, and statistics</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
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
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters and Search */}
        {(activeTab === 'charts' || activeTab === 'processing') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {activeTab === 'charts' && (
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="lastAccessed">Sort by Last Access</option>
                {activeTab === 'charts' && <option value="accessCount">Sort by Access Count</option>}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <RotateCcw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading...</span>
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
