import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileSpreadsheet, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Download,
  Trash2,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { uploadExcelFile, analyzeData, generate3DCharts, exportData } from '../../store/slices/analyticsSlice';
import toast from 'react-hot-toast';

const Analytics = () => {
  const dispatch = useDispatch();
  const { uploadedFile, currentSheet, sheetData, analytics, chartData, isLoading } = useSelector((state) => state.analytics);
  const { theme } = useSelector((state) => state.ui);

  const [selectedSheet, setSelectedSheet] = useState(null);
  const [analysisType, setAnalysisType] = useState('basic');
  const [chartType, setChartType] = useState('bar');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv')) {
        dispatch(uploadExcelFile(file));
        toast.success('File uploaded successfully!');
      } else {
        toast.error('Please upload a valid Excel or CSV file.');
      }
    }
  }, [dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!uploadedFile || !selectedSheet) {
      toast.error('Please upload a file and select a sheet first.');
      return;
    }

    try {
      await dispatch(analyzeData({ sheetName: selectedSheet, analysisType })).unwrap();
      toast.success('Analysis completed successfully!');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    }
  };

  // Chart generation module disabled for now
  const handleGenerate3DCharts = async () => {
    toast.error('3D chart generation is currently disabled.');
  };

  const handleExport = async (format) => {
    if (!analytics) {
      toast.error('No data to export. Please analyze data first.');
      return;
    }

    try {
      await dispatch(exportData({ format, data: analytics })).unwrap();
      toast.success(`Data exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error('Export failed. Please try again.');
    }
  };

  const clearData = () => {
    dispatch({ type: 'analytics/clearAnalytics' });
    dispatch({ type: 'analytics/clearUploadedFile' });
    setSelectedSheet(null);
    toast.success('Data cleared successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Excel Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload, analyze, and visualize your Excel data
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={clearData}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Data
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Excel File
        </h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drag and drop your Excel file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports .xlsx, .xls, and .csv files
              </p>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Selection and Analysis */}
      {uploadedFile && sheetData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Sheet Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Sheet
            </h3>
            <div className="space-y-2">
              {Object.keys(sheetData).map((sheetName) => (
                <button
                  key={sheetName}
                  onClick={() => setSelectedSheet(sheetName)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                    selectedSheet === sheetName
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{sheetName}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {sheetData[sheetName].length} rows
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Analysis Options
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Analysis Type
                </label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="basic">Basic Statistics</option>
                  <option value="categorical">Categorical Analysis</option>
                  <option value="correlation">Correlation Analysis</option>
                  <option value="trend">Trend Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedSheet || isLoading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Analyze Data
                </button>
                
                <button
                  onClick={handleGenerate3DCharts}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg cursor-not-allowed flex items-center justify-center"
                  title="3D Charts (Coming Soon)"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Data
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handleExport('json')}
                disabled={!analytics}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </button>
              
              <button
                onClick={() => handleExport('csv')}
                disabled={!analytics}
                className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analytics && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Analysis Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {analytics.summary && Object.entries(analytics.summary).map(([key, value]) => (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </p>
              </div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Charts will be displayed here
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3D Charts Section */}
      {false && chartData.charts3D && chartData.charts3D.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            3D Visualizations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartData.charts3D.map((chart, index) => (
              <div key={index} className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    3D {chart.type} Chart
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
