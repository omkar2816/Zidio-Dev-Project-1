import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { uploadExcelFile, fetchUploadedFiles, deleteUploadedFile, analyzeData } from '../../store/slices/analyticsSlice';
import AdvancedChartDashboard from '../../components/Charts/AdvancedChartDashboard';
import VirtualTable from '../../components/UI/VirtualTable';
import PerformanceMonitor from '../../components/UI/PerformanceMonitor';
import axios from '../../config/axios';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Plus, 
  Grid3X3, 
  BarChart3, 
  Eye, 
  TrendingUp,
  PieChart,
  FileText,
  X,
  Download,
  Edit3,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { recentFiles, isLoading, error } = useSelector((state) => state.analytics);
  const [activeTab, setActiveTab] = useState('upload');
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzingFileId, setAnalyzingFileId] = useState(null);
  const [editableData, setEditableData] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [showAllRows, setShowAllRows] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [viewingChart, setViewingChart] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    dispatch(fetchUploadedFiles());
  }, [dispatch]);

  // Handle URL parameters for chart viewing
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewChartId = searchParams.get('viewChart');
    const chartType = searchParams.get('chartType');
    
    if (viewChartId) {
      loadChartFromHistory(viewChartId, chartType);
    }
  }, [location.search]);

  const loadChartFromHistory = async (chartId, chartType) => {
    try {
      const response = await axios.get(`/api/history/charts/${chartId}`);
      const chart = response.data.data;
      
      console.log('📊 Loading chart from history:', chart);
      
      // Set the chart data and switch to charts tab
      setViewingChart(chart);
      setActiveTab('charts');
      
      // If it's a 3D chart, prepare the data for 3D rendering
      if (chartType === '3d' || chart.chartType?.includes('3d')) {
        // Switch to the analysis tab first to show the 3D chart properly
        if (chart.chartData && Array.isArray(chart.chartData)) {
          setAnalysisData({
            data: chart.chartData,
            headers: chart.configuration?.dataColumns || Object.keys(chart.chartData[0] || {}),
            fileInfo: {
              name: chart.sourceFileName || 'Chart from History',
              size: 0,
              rows: chart.chartData.length
            }
          });
        }
      }
      
      toast.success(`Loaded ${chart.chartType} chart: ${chart.chartTitle}`);
    } catch (error) {
      console.error('Error loading chart from history:', error);
      toast.error('Failed to load chart from history');
    }
  };

  // Keyboard shortcuts for table interaction
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab === 'analysis' && editableData.length > 0) {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          exportEditedData();
        } else if (e.ctrlKey && e.key === 'n') {
          e.preventDefault();
          addNewRow();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, editableData]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Client-side validation
      const maxSize = 100 * 1024 * 1024; // 100MB
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls  
        'text/csv' // .csv
      ];
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];

      // Check file size
      if (file.size > maxSize) {
        toast.error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of 100MB. Please upload a smaller file.`, {
          duration: 8000
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Check file type
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast.error('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.', {
          duration: 6000
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        toast.error('The selected file is empty. Please choose a file with data.');
        event.target.value = ''; // Clear the input
        return;
      }

      // Show upload progress
      toast.loading(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      
      const result = await dispatch(uploadExcelFile(file)).unwrap();
      toast.dismiss();
      
      // Show success message
      toast.success(`File "${file.name}" uploaded successfully!`, {
        duration: 4000
      });
      
      // Show dataset warnings if present
      if (result.data && result.data.datasetWarnings) {
        result.data.datasetWarnings.forEach(warning => {
          const toastType = warning.severity === 'high' ? 'error' : 'warn';
          toast[toastType](warning.message, {
            duration: warning.severity === 'high' ? 10000 : 6000,
            position: 'top-center'
          });
        });
      }
        
      // Refresh the files list
      dispatch(fetchUploadedFiles());
      
      // Switch to recent files tab to show the uploaded file
      setActiveTab('recent');
      
      // Clear the input for next upload
      event.target.value = '';
    } catch (error) {
      toast.dismiss();
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Upload failed: ';
      
      if (error.error === 'File too large') {
        errorMessage = `File too large: ${error.message}`;
      } else if (error.error === 'Invalid file type') {
        errorMessage = `Invalid file type: ${error.message}`;
      } else if (error.error === 'File parsing failed') {
        errorMessage = `File parsing failed: ${error.message}`;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      toast.error(errorMessage, {
        duration: 8000
      });
      
      console.error('Upload failed:', error);
      
      // Clear the input on error
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await dispatch(deleteUploadedFile(fileId)).unwrap();
      toast.success('File deleted successfully!');
      dispatch(fetchUploadedFiles()); // Refresh the list
    } catch (error) {
      toast.error('Delete failed: ' + (error.message || 'Unknown error'));
      console.error('Delete failed:', error);
    }
  };

  const handleAnalyzeFile = async (file) => {
    try {
      const startTime = Date.now(); // Track request start time
      console.log('Analyzing file:', file); // Debug log
      
      if (!file || !file.id) {
        toast.error('Invalid file selected');
      return;
    }

      setAnalyzingFileId(file.id);
      toast.loading('Analyzing file...');
      
      // Call the analysis API
      const analysisResult = await dispatch(analyzeData({ 
        fileId: file.id,
        analysisType: 'comprehensive' 
      })).unwrap();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Store performance data
      setPerformanceData({
        responseTime,
        dataSize: analysisResult.data?.summary?.totalRows || 0,
        performanceMode: analysisResult.data?.performance?.optimized || false,
        processingTime: analysisResult.data?.performance?.processingTime || responseTime
      });
      
      const analysisResultData = {
        ...analysisResult,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: file.uploadedAt
      };
      
      setAnalysisData(analysisResultData);
      
      // Initialize editable data
      if (analysisResult.preview && analysisResult.preview.length > 0) {
        setEditableData([...analysisResult.preview]);
      } else if (analysisResult.fullData && analysisResult.fullData.length > 0) {
        setEditableData([...analysisResult.fullData]);
      }
      
      toast.dismiss();
      toast.success('Analysis completed successfully!');
      
      // Switch to analysis tab
      setActiveTab('analysis');
      
    } catch (error) {
      toast.dismiss();
      toast.error('Analysis failed: ' + (error.message || 'Unknown error'));
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzingFileId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cell editing functions
  const handleCellClick = (rowIndex, columnKey) => {
    setEditingCell({ rowIndex, columnKey });
  };

  const handleCellChange = (rowIndex, columnKey, newValue) => {
    const updatedData = [...editableData];
    updatedData[rowIndex][columnKey] = newValue;
    setEditableData(updatedData);
  };

  const handleCellSave = () => {
    setEditingCell(null);
    toast.success('Cell updated successfully!');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const exportEditedData = () => {
    const dataStr = JSON.stringify(editableData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'edited_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const addNewRow = () => {
    if (editableData.length > 0) {
      const newRow = {};
      Object.keys(editableData[0]).forEach(key => {
        newRow[key] = '';
      });
      setEditableData([...editableData, newRow]);
      toast.success('New row added!');
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl p-8 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Upload, analyze, and visualize your Excel data with advanced charts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Files</span>
          </div>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recent'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Grid3X3 className="w-5 h-5" />
                <span>Recent Files</span>
                {recentFiles && recentFiles.length > 0 && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs px-2 py-1 rounded-full">
                    {recentFiles.length}
                  </span>
                )}
              </div>
            </button>
            {analysisData && (
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analysis'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Analysis Results</span>
            </div>
              </button>
          )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8 w-full max-w-full overflow-x-hidden">
          {activeTab === 'upload' && (
            <div className="space-y-8 w-full max-w-full overflow-x-hidden">
              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 w-full max-w-full overflow-hidden">
                <div className="text-center w-full max-w-full">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Upload Excel or CSV File
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Choose a file to analyze and create interactive charts with advanced performance optimization
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                      <Upload className="w-5 h-5 mr-2" />
                      Choose File
                    </div>
                  </label>
                  
                  {/* Enhanced file info with better styling */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Excel (.xlsx, .xls)
                      </div>
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        CSV (.csv)
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Maximum file size:</span> 100MB
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Files are processed with automatic performance optimization for large datasets
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Upload Stats */}
              {recentFiles && recentFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Total Files</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{recentFiles.length}</p>
      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Ready to Analyze</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{recentFiles.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Grid3X3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Size</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatFileSize(recentFiles.reduce((total, file) => total + (file.size || 0), 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recent' && (
              <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Files</h3>
                {recentFiles && recentFiles.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {recentFiles.length} file{recentFiles.length !== 1 ? 's' : ''} uploaded
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading files...</p>
                </div>
              ) : recentFiles && recentFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl p-6 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 transition-all duration-200 group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                          <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                          {formatDate(file.uploadedAt)}
                        </span>
              </div>

                      {/* File Name - Made more prominent */}
                      <div className="mb-3">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1 leading-tight">
                          {file.name || 'Unnamed File'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Excel File • {formatFileSize(file.size)}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-4">
                <button
                          onClick={() => handleAnalyzeFile(file)}
                          disabled={analyzingFileId === file.id}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 text-sm flex items-center justify-center font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                          {analyzingFileId === file.id ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                              Analyzing...
                            </>
                  ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Analyze
                            </>
                  )}
                </button>
                <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <Grid3X3 className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No files uploaded yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Upload your first Excel file to get started with analytics</p>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                </button>
              </div>
              )}
            </div>
          )}

          {/* Analysis Results Tab */}
          {activeTab === 'analysis' && analysisData && (
            <div className="w-full max-w-full overflow-x-hidden space-y-6">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl p-6 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                    Analysis Results
                  </h3>
                  <button
                    onClick={() => setActiveTab('files')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Interactive Chart Dashboard - Moved to Top */}
                <div className="mb-8 w-full max-w-full overflow-x-hidden">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Interactive Charts & Visualization
                  </h4>
                  <div className="w-full max-w-full overflow-x-hidden">
                    <AdvancedChartDashboard 
                      data={editableData} 
                      className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm w-full max-w-full overflow-x-hidden"
                    />
                  </div>
                </div>

                {/* Performance Summary */}
                {analysisData && analysisData.statistics && (
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                        Dataset Performance Summary
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {analysisData.statistics.totalRows?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Rows</div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {analysisData.statistics.totalColumns?.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Columns</div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className={`text-2xl font-bold ${
                                analysisData.statistics.totalRows > 1000 
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {analysisData.statistics.totalRows > 1000 ? 'Large' : 'Normal'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Dataset Size</div>
                            </div>
                            {analysisData.statistics.totalRows > 1000 && (
                              <div className="ml-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                  Performance Mode Enabled
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {analysisData.statistics.totalRows > 1000 && (
                        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-medium text-orange-900 dark:text-orange-200 mb-1">
                                Performance Mode Active
                              </h5>
                              <p className="text-sm text-orange-700 dark:text-orange-300">
                                Large dataset detected ({analysisData.statistics.totalRows.toLocaleString()} rows). 
                                Charts automatically use intelligent sampling to maintain optimal performance. 
                                Data distribution and patterns are preserved using systematic sampling techniques.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Performance Monitor */}
                {performanceData && (
                  <div className="mb-6">
                    <PerformanceMonitor
                      responseTime={performanceData.responseTime}
                      dataSize={performanceData.dataSize}
                      performanceMode={performanceData.performanceMode}
                    />
                  </div>
                )}

                {/* Enhanced Data Table */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Interactive Data Table
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({editableData.length} rows • Editable • Ctrl+S to export, Ctrl+N to add row)
                      </span>
                    </h4>
                    <div className="flex items-center space-x-2">
              <button
                        onClick={() => setShowAllRows(!showAllRows)}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                        {showAllRows ? 'Show Less' : `Show All (${editableData.length})`}
              </button>
              <button
                        onClick={addNewRow}
                        className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Row
                      </button>
                      <button
                        onClick={exportEditedData}
                        className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center"
              >
                        <Download className="w-3 h-3 mr-1" />
                        Export
              </button>
            </div>
          </div>
                  
                  {/* Use VirtualTable for large datasets when showing all rows */}
                  {showAllRows && editableData.length > 1000 ? (
                    <VirtualTable
                      data={editableData}
                      onDataChange={setEditableData}
                      editingCell={editingCell}
                      onCellClick={handleCellClick}
                      onCellChange={handleCellChange}
                      onCellSave={handleCellSave}
                      onCellCancel={handleCellCancel}
                    />
                  ) : (
                    <div 
                      ref={tableRef}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden enhanced-table-scroll"
                      style={{ 
                        maxHeight: showAllRows ? '80vh' : '400px',
                        overflowY: 'auto',
                        overflowX: 'auto'
                      }}
                      onWheel={(e) => {
                        // Enable mouse wheel scrolling
                        e.stopPropagation();
                      }}
                    >
                      {editableData && editableData.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                                #
                              </th>
                              {Object.keys(editableData[0]).map((header) => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-32">
                                  {header}
                                </th>
                              ))}
                              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {(showAllRows ? editableData : editableData.slice(0, 20)).map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                                <td className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {rowIndex + 1}
                                </td>
                                {Object.entries(row).map(([columnKey, value], cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 relative group">
                                    {editingCell?.rowIndex === rowIndex && editingCell?.columnKey === columnKey ? (
                                      <div className="flex items-center space-x-1">
                                        <input
                                          type="text"
                                          defaultValue={String(value)}
                                          className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleCellChange(rowIndex, columnKey, e.target.value);
                                              handleCellSave();
                                            } else if (e.key === 'Escape') {
                                              handleCellCancel();
                                            }
                                          }}
                                          onBlur={(e) => {
                                            handleCellChange(rowIndex, columnKey, e.target.value);
                                            handleCellSave();
                                          }}
                                          autoFocus
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors min-h-6 flex items-center"
                                        onClick={() => handleCellClick(rowIndex, columnKey)}
                                        title="Click to edit"
                                      >
                                        {String(value)}
                                        <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
          </div>
        )}
                                  </td>
                                ))}
                                <td className="px-2 py-2">
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        const newData = editableData.filter((_, i) => i !== rowIndex);
                                        setEditableData(newData);
                                        toast.success('Row deleted');
                                      }}
                                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete row"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-gray-500 dark:text-gray-400">No data available</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!showAllRows && editableData.length > 20 && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing 20 of {editableData.length} rows. 
                        <button 
                          onClick={() => setShowAllRows(true)}
                          className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Show all rows {editableData.length > 1000 ? '(Virtual Scrolling)' : ''}
                        </button>
                </p>
              </div>
                  )}
          </div>

                {/* Statistics */}
                {analysisData.statistics && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Data Statistics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Rows</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {analysisData.statistics.totalRows || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Columns</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {analysisData.statistics.totalColumns || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Numeric Columns</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {analysisData.statistics.numericColumns || 0}
              </p>
            </div>
          </div>
        </div>
      )}
              </div>
            </div>
          )}
        </div>
                </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50/70 dark:bg-red-900/20 backdrop-blur-xl border border-red-200/50 dark:border-red-800/50 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-sm">!</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
