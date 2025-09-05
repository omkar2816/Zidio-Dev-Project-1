import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  RotateCcw,
  Table,
  Layers,
  Zap,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react';
import ChartGenerator from '../../components/Charts/ChartGenerator';
import ExcelDataTable from '../../components/Charts/ExcelDataTable';
import { parseCSV, readFileAsText } from '../../utils/csvParser';
import toast from 'react-hot-toast';

const SimpleAnalytics = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [chartConfig, setChartConfig] = useState({
    type: 'bar',
    xAxis: '',
    yAxis: '',
    title: 'Data Analysis Chart'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse uploaded file data
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const headers = rawData[0] || [];
      const dataRows = rawData.slice(1);
      
      const formattedData = dataRows.map((row, index) => {
        const rowData = { id: index };
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });
        return rowData;
      });

      const columns = [
        { key: 'select', header: '', width: 50 },
        ...headers.map(header => ({
          key: header,
          header,
          width: 150,
          sortable: true,
          filterable: true
        }))
      ];

      setTableData(formattedData);
      setTableColumns(columns);
      
      // Auto-select first few columns for charting
      if (headers.length > 0) {
        setChartConfig(prev => ({
          ...prev,
          xAxis: headers[0] || '',
          yAxis: headers[1] || '',
          title: `${headers[1] || 'Data'} by ${headers[0] || 'Category'}`
        }));
      }
    }
  }, [rawData]);

  // Generate chart data from table data
  const chartData = useMemo(() => {
    if (!tableData.length || !chartConfig.xAxis || !chartConfig.yAxis) {
      return { categories: [], series: [] };
    }

    // Group data by x-axis values
    const groupedData = {};
    tableData.forEach(row => {
      const xValue = String(row[chartConfig.xAxis]);
      const yValue = parseFloat(row[chartConfig.yAxis]) || 0;
      
      if (!groupedData[xValue]) {
        groupedData[xValue] = [];
      }
      groupedData[xValue].push(yValue);
    });

    // Calculate aggregated values (sum for now)
    const categories = Object.keys(groupedData);
    const values = categories.map(category => 
      groupedData[category].reduce((sum, val) => sum + val, 0)
    );

    // For pie charts, create data in different format
    if (chartConfig.type === 'pie') {
      return {
        name: chartConfig.yAxis,
        data: categories.map((category, index) => ({
          name: category,
          value: values[index]
        }))
      };
    }

    // For other chart types
    return {
      categories,
      series: [{
        name: chartConfig.yAxis,
        data: values
      }]
    };
  }, [tableData, chartConfig]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.name.endsWith('.csv')) {
        setIsProcessing(true);
        try {
          const text = await readFileAsText(file);
          const parsed = parseCSV(text);
          setUploadedFile(file);
          setRawData(parsed.data);
          toast.success('CSV file uploaded and parsed successfully!', { position: 'bottom-center' });
          setActiveTab('data');
        } catch (error) {
          toast.error('Error parsing CSV file: ' + error.message, { position: 'bottom-center' });
        } finally {
          setIsProcessing(false);
        }
      } else {
        toast.error('Please upload a CSV file. Excel files are not supported yet.', { position: 'bottom-center' });
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleGenerateChart = () => {
    if (!chartConfig.xAxis || !chartConfig.yAxis) {
      toast.error('Please select both X and Y axis columns', { position: 'bottom-center' });
      return;
    }

    setActiveTab('charts');
    toast.success('Chart generated successfully!', { position: 'bottom-center' });
  };

  const handleDataChange = (newData) => {
    setTableData(newData);
  };

  const availableColumns = tableColumns.slice(1).map(col => col.key); // Exclude select column

  const tabs = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'data', label: 'Data View', icon: Table },
    { key: 'charts', label: 'Charts', icon: BarChart3 },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Advanced Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload, analyze, and visualize your data with interactive charts and tables
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl">
                <Zap className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Local Processing</span>
              </div>
              {isProcessing && (
                <div className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
          <div className="flex border-b border-gray-200/60 dark:border-gray-700/60">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {/* File Upload */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    isDragActive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Upload Your CSV File
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Drop your CSV file here, or click to browse
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      CSV format only
                    </span>
                    <span className="flex items-center">
                      <Layers className="h-4 w-4 mr-1" />
                      Local processing
                    </span>
                  </div>
                </div>

                {uploadedFile && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-8 w-8 text-emerald-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-emerald-900 dark:text-emerald-100">
                            {uploadedFile.name}
                          </h4>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            {(uploadedFile.size / 1024).toFixed(1)} KB • {tableData.length} rows
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('data')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data View Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                {tableData.length > 0 ? (
                  <>
                    {/* Chart Configuration */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Chart Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Chart Type
                          </label>
                          <select
                            value={chartConfig.type}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="area">Area Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="scatter">Scatter Plot</option>
                            <option value="radar">Radar Chart</option>
                            <option value="histogram">Histogram</option>
                            <option value="box">Box Plot</option>
                            <option value="bubble">Bubble Chart</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            X-Axis
                          </label>
                          <select
                            value={chartConfig.xAxis}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="">Select X-Axis</option>
                            {availableColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Y-Axis
                          </label>
                          <select
                            value={chartConfig.yAxis}
                            onChange={(e) => setChartConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="">Select Y-Axis</option>
                            {availableColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={handleGenerateChart}
                          disabled={!chartConfig.xAxis || !chartConfig.yAxis}
                          className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Generate Chart
                        </button>
                      </div>
                    </div>

                    {/* Data Table */}
                    <ExcelDataTable
                      data={tableData}
                      columns={tableColumns}
                      onDataChange={handleDataChange}
                      enableEdit={true}
                      enableFilter={true}
                      enablePagination={true}
                      pageSize={50}
                    />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Data Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please upload a CSV file to view and analyze your data
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
              <div className="space-y-6">
                {chartData.categories?.length > 0 || chartData.data?.length > 0 ? (
                  <ChartGenerator
                    data={chartData}
                    chartType={chartConfig.type}
                    title={chartConfig.title}
                    onChartUpdate={(newType) => setChartConfig(prev => ({ ...prev, type: newType }))}
                  />
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Chart Data Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please upload data and configure your chart axes to generate visualizations
                    </p>
                    <button
                      onClick={() => setActiveTab('data')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Configure Chart
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Data Summary Cards */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Rows</p>
                        <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{tableData.length}</p>
                      </div>
                      <Table className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Columns</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{availableColumns.length}</p>
                      </div>
                      <Layers className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">File Size</p>
                        <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                          {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : '0 KB'}
                        </p>
                      </div>
                      <FileSpreadsheet className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Chart Type</p>
                        <p className="text-lg font-bold text-orange-800 dark:text-orange-200 capitalize">{chartConfig.type}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>

                {tableData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Data Overview
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Available Columns:</h4>
                        <div className="flex flex-wrap gap-2">
                          {availableColumns.map(col => (
                            <span key={col} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {chartConfig.xAxis && chartConfig.yAxis && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Current Chart Configuration:</h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Type:</span> {chartConfig.type} |{' '}
                              <span className="font-medium">X-Axis:</span> {chartConfig.xAxis} |{' '}
                              <span className="font-medium">Y-Axis:</span> {chartConfig.yAxis}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAnalytics;
