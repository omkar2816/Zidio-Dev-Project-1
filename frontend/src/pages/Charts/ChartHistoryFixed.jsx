import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Clock, 
  Search, 
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  TrendingUp,
  PieChart,
  LineChart,
  Plus,
  Upload,
  AlertCircle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchChartHistory, deleteChartFromHistory } from '../../store/slices/analyticsSlice';

const ChartHistoryFixed = () => {
  console.log('ChartHistoryFixed component rendering...');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  // Use Redux state for chart history with correct state names
  const { 
    chartHistory, 
    chartHistoryLoading: loading, 
    chartHistoryError: error,
    chartHistoryPagination
  } = useSelector((state) => state.analytics);
  
  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check authentication
  useEffect(() => {
    console.log('Auth check - user:', authState.user?.email, 'token exists:', !!authState.token);
    if (!authState.user || !authState.token) {
      console.log('No authentication - redirecting to login');
      navigate('/auth');
      return;
    }
    
    // Fetch chart history when component mounts
    fetchHistory();
  }, [authState.user, authState.token, navigate]);

  // Auto-refresh chart history every 15 seconds for better real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (authState.user && authState.token && !loading) {
        console.log('Auto-refreshing chart history...');
        fetchHistory(true); // Force refresh to bypass cache
      }
    }, 10000); // Reduced to 10 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [authState.user, authState.token, loading]);

  // Enhanced event listeners for real-time updates
  useEffect(() => {
    const handleChartSaved = (event) => {
      console.log('Chart saved event received - refreshing history', event.detail);
      // Small delay to ensure backend has processed the save
      setTimeout(() => {
        fetchHistory(true); // Force refresh
      }, 500);
    };

    const handleStorageChange = (event) => {
      if (event.key === 'chartSaved') {
        console.log('Chart saved in another tab - refreshing history');
        setTimeout(() => {
          fetchHistory(true); // Force refresh
        }, 500);
      }
    };

    // Listen for various chart-related events
    const handleChartUpdated = () => {
      console.log('Chart updated event - refreshing history');
      setTimeout(() => {
        fetchHistory(true); // Force refresh
      }, 500);
    };

    // Force refresh on window visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && authState.user && authState.token) {
        console.log('Window became visible - refreshing chart history');
        fetchHistory(true); // Force refresh
      }
    };

    // Enhanced chart save event listeners
    const handleAnalyticsChartSaved = (event) => {
      console.log('Analytics chart saved - refreshing chart history', event.detail);
      setTimeout(() => {
        fetchHistory(true);
      }, 1000); // Longer delay for analytics charts
    };

    // Add multiple event listeners for comprehensive updates
    window.addEventListener('chartSaved', handleChartSaved);
    window.addEventListener('chartUpdated', handleChartUpdated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('analyticsChartSaved', handleAnalyticsChartSaved);
    
    // Also listen for focus events to refresh when user returns to tab
    const handleFocus = () => {
      if (authState.user && authState.token) {
        console.log('Tab focused - refreshing chart history');
        fetchHistory(true); // Force refresh
      }
    };
    
    window.addEventListener('focus', handleFocus);

    // Listen for custom events from analytics dashboard
    const handleCustomChartSave = () => {
      console.log('Custom chart save event - refreshing history');
      setTimeout(() => {
        fetchHistory(true);
      }, 800);
    };

    window.addEventListener('customChartSaved', handleCustomChartSave);

    return () => {
      window.removeEventListener('chartSaved', handleChartSaved);
      window.removeEventListener('chartUpdated', handleChartUpdated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('analyticsChartSaved', handleAnalyticsChartSaved);
      window.removeEventListener('customChartSaved', handleCustomChartSave);
    };
  }, [authState.user, authState.token]);

  // Re-fetch when search/filter parameters change
  useEffect(() => {
    if (authState.user && authState.token) {
      const delayedFetch = setTimeout(() => {
        fetchHistory();
      }, 300); // Debounce to avoid too many requests

      return () => clearTimeout(delayedFetch);
    }
  }, [searchTerm, filterType, sortBy, sortOrder, currentPage]);

  // Listen for changes in the Redux analytics store for real-time updates
  useEffect(() => {
    const handleStoreChange = () => {
      if (authState.user && authState.token) {
        console.log('Redux store updated - checking for chart history refresh');
        // Small delay to ensure the store is fully updated
        setTimeout(() => {
          fetchHistory(true);
        }, 500);
      }
    };

    // Monitor chartHistory changes in Redux
    const unsubscribe = () => {
      if (chartHistory?.total !== undefined) {
        handleStoreChange();
      }
    };

    return unsubscribe;
  }, [chartHistory?.total, authState.user, authState.token]);

  const fetchHistory = async (forceRefresh = false) => {
    try {
      console.log('Fetching chart history with params:', {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: filterType,
        sortBy,
        sortOrder,
        forceRefresh
      });
      
      // Add cache-busting parameter for forced refreshes
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: filterType,
        sortBy,
        sortOrder
      };
      
      if (forceRefresh) {
        params._t = Date.now(); // Cache buster
      }
      
      await dispatch(fetchChartHistory(params)).unwrap();
      
      console.log('Chart history fetch successful');
    } catch (error) {
      console.error('Error fetching chart history:', error);
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        toast.error('Session expired. Please login again.');
        navigate('/auth');
      } else {
        toast.error('Failed to load chart history');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchHistory(true); // Force refresh
      toast.success('Chart history refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh chart history');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (chart) => {
    console.log('Downloading chart:', chart.chartTitle);
    try {
      // Create downloadable content
      const chartData = {
        title: chart.chartTitle,
        type: chart.chartType,
        data: {
          categories: chart.configuration?.categories || [],
          values: chart.configuration?.values || []
        },
        metadata: {
          created: chart.createdAt,
          source: chart.sourceFileName,
          dataPoints: chart.configuration?.values?.length || 0
        }
      };

      const dataStr = JSON.stringify(chartData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(chart.chartTitle || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Chart data downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chart');
    }
  };

  const handleViewChart = (chart) => {
    console.log('CHART VIEWING DEBUG - Full chart object:', chart);
    
    try {
      // Enhanced debugging for chart data analysis
      console.log('CHART DATA ANALYSIS:');
      console.log('- chart.chartData:', chart.chartData);
      console.log('- chart.data:', chart.data);
      console.log('- chart.configuration:', chart.configuration);
      
      // Check for chart data in multiple possible locations
      let chartData = chart.chartData || chart.data;
      const configuration = chart.configuration || {};
      const categories = configuration.categories || [];
      const values = configuration.values || [];
      
      console.log('EXTRACTED DATA:');
      console.log('- chartData type:', typeof chartData);
      console.log('- chartData isArray:', Array.isArray(chartData));
      console.log('- chartData length:', Array.isArray(chartData) ? chartData.length : 'N/A');
      console.log('- categories:', categories);
      console.log('- values:', values);
      
      // Convert chartData object to array if it has numeric keys
      if (chartData && typeof chartData === 'object' && !Array.isArray(chartData)) {
        const keys = Object.keys(chartData);
        console.log('Object detected with keys:', keys.slice(0, 10));
        if (keys.length > 0 && keys.every(key => !isNaN(key))) {
          // Sort keys numerically to ensure correct order
          const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
          // Convert object with numeric keys to array in correct order
          chartData = sortedKeys.map(key => chartData[key]);
          console.log('Converted object to array with sorted keys:', sortedKeys.slice(0, 5));
          console.log('Converted data sample:', chartData.slice(0, 2));
        }
      }
      
      // PRIORITY FIX: Use configuration data if available and reliable
      let processedData = chartData;
      
      // If we have configuration with categories and values, prefer that for consistent display
      if (categories.length > 0 && values.length > 0 && categories.length === values.length) {
        console.log('USING CONFIGURATION DATA for reliable chart display');
        processedData = categories.map((category, index) => ({
          category: category,
          value: values[index] || 0
        }));
        console.log('Reconstructed data from configuration:', processedData);
      } else if (!processedData && categories.length > 0 && values.length > 0) {
        // Fallback reconstruction if no chartData but config exists
        processedData = categories.map((category, index) => ({
          category: category,
          value: values[index] || 0
        }));
        console.log('Fallback: Reconstructed from partial configuration');
      }
      
      console.log('FINAL PROCESSED DATA for viewing:', {
        originalChartData: chart.chartData,
        originalDataType: typeof chart.chartData,
        convertedChartData: chartData,
        categories: categories,
        values: values,
        processedData: processedData,
        dataSource: categories.length > 0 && values.length > 0 ? 'configuration' : 'chartData'
      });
      
      if (!processedData || (Array.isArray(processedData) && processedData.length === 0)) {
        console.error('No valid chart data available for viewing');
        toast.error('Chart data not available for viewing');
        return;
      }

      // Create a comprehensive HTML page with Apache ECharts and Plotly
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chart: ${chart.chartTitle || 'Untitled Chart'}</title>
          <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
          <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              background: #f8fafc;
              color: #334155;
              line-height: 1.6;
            }
            
            .container {
              max-width: 1100px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white;
              padding: 20px;
              text-align: center;
            }
            
            .header h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .header p {
              opacity: 0.9;
              font-size: 14px;
            }
            
            .chart-tabs {
              display: flex;
              background: #f1f5f9;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .tab {
              flex: 1;
              padding: 15px 20px;
              background: none;
              border: none;
              cursor: pointer;
              font-weight: 500;
              color: #64748b;
              transition: all 0.2s;
              position: relative;
            }
            
            .tab.active {
              color: #3b82f6;
              background: white;
            }
            
            .tab.active::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: #3b82f6;
            }
            
            .tab:hover {
              background: #e2e8f0;
            }
            
            .tab.active:hover {
              background: white;
            }
            
            .chart-info {
              padding: 20px;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 12px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            
            .info-label {
              font-weight: 500;
              color: #64748b;
            }
            
            .info-value {
              font-weight: 600;
              color: #1e293b;
            }
            
            .chart-container {
              padding: 20px;
              min-height: 500px;
              background: white;
            }
            
            .chart-wrapper {
              display: none;
              width: 100%;
              height: 500px;
            }
            
            .chart-wrapper.active {
              display: block;
            }
            
            #echartsContainer, #plotlyContainer {
              width: 100%;
              height: 100%;
            }
            
            .actions {
              padding: 20px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              display: flex;
              gap: 10px;
              justify-content: center;
            }
            
            .download-btn {
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
            }
            
            .download-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            
            .error {
              text-align: center;
              padding: 60px 20px;
              color: #ef4444;
            }
            
            .error h3 {
              font-size: 18px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${chart.chartTitle || 'Untitled Chart'}</h1>
              <p>Interactive Chart Viewer with Apache ECharts & Plotly</p>
            </div>
            
            <div class="chart-tabs">
              <button class="tab active" onclick="showChart('echarts')">Apache ECharts</button>
              <button class="tab" onclick="showChart('plotly')">Plotly</button>
            </div>
            
            <div class="chart-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${chart.chartType?.toUpperCase() || 'UNKNOWN'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Source:</span>
                  <span class="info-value">${chart.sourceFileName || 'Unknown File'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created:</span>
                  <span class="info-value">${new Date(chart.createdAt).toLocaleString()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data Points:</span>
                  <span class="info-value">${Math.max(categories.length, values.length, Array.isArray(processedData) ? processedData.length : 0)}</span>
                </div>
              </div>
            </div>
            
            <div class="chart-container">
              <div id="echartsWrapper" class="chart-wrapper active">
                <div id="echartsContainer"></div>
              </div>
              <div id="plotlyWrapper" class="chart-wrapper">
                <div id="plotlyContainer"></div>
              </div>
            </div>
            
            <div class="actions">
              <button class="download-btn" onclick="downloadChart()">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 6.293V.5A.5.5 0 0 1 8 0z"/>
                  <path d="M3 14.5A1.5 1.5 0 0 0 4.5 16h7a1.5 1.5 0 0 0 1.5-1.5v-7a.5.5 0 0 0-1 0v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 0-1 0v7z"/>
                </svg>
                Download Chart
              </button>
            </div>
          </div>
          
          <script>
            let echartsInstance = null;
            let plotlyInstance = null;
            let currentChart = 'echarts';
            
            // Chart data - Enhanced extraction with priority handling
            let chartDataForJS = {
              labels: [],
              values: [],
              title: '${chart.chartTitle || 'Data'}',
              type: '${chart.chartType || 'bar'}'
            };

            // Process the chart data based on its structure and available configuration
            const savedChartData = ${JSON.stringify(processedData)};
            const configCategories = ${JSON.stringify(categories)};
            const configValues = ${JSON.stringify(values)};
            
            console.log('Chart viewer received data:');
            console.log('- savedChartData type:', typeof savedChartData, 'isArray:', Array.isArray(savedChartData));
            console.log('- savedChartData length:', Array.isArray(savedChartData) ? savedChartData.length : 'N/A');
            console.log('- savedChartData sample:', savedChartData?.slice ? savedChartData.slice(0, 2) : savedChartData);
            console.log('- configCategories:', configCategories);
            console.log('- configValues:', configValues);
            
            // PRIORITY 1: Use configuration data if available and complete
            if (configCategories.length > 0 && configValues.length > 0 && configCategories.length === configValues.length) {
              console.log('PRIORITY 1: Using configuration data for chart display');
              chartDataForJS.labels = configCategories.map(cat => String(cat || ''));
              chartDataForJS.values = configValues.map(val => parseFloat(val) || 0);
              console.log('Configuration-based extraction successful');
              console.log('- Labels:', chartDataForJS.labels);
              console.log('- Values:', chartDataForJS.values);
            }
            // PRIORITY 2: Extract from processed chart data
            else if (Array.isArray(savedChartData) && savedChartData.length > 0) {
              console.log('PRIORITY 2: Extracting from chart data array');
              
              if (typeof savedChartData[0] === 'object' && savedChartData[0] !== null) {
                // Check if this is configuration-reconstructed data (has 'category' and 'value' keys)
                if (savedChartData[0].hasOwnProperty('category') && savedChartData[0].hasOwnProperty('value')) {
                  console.log('Detected configuration-reconstructed data format');
                  chartDataForJS.labels = savedChartData.map(item => String(item.category || ''));
                  chartDataForJS.values = savedChartData.map(item => parseFloat(item.value) || 0);
                } else {
                  // Object array format like [{Month: 'Jan 2018', Sales: 911}, {Month: 'Feb 2018', Sales: 797}]
                  const keys = Object.keys(savedChartData[0]);
                  console.log('Detected object array format with keys:', keys);
                  
                  // Enhanced key detection for better chart rendering
                  const labelKey = keys.find(k => 
                    k.toLowerCase().includes('month') || 
                    k.toLowerCase().includes('date') ||
                    k.toLowerCase().includes('time') ||
                    k.toLowerCase().includes('category') || 
                    k.toLowerCase().includes('label') ||
                    k.toLowerCase().includes('name') ||
                    k.toLowerCase().includes('x')
                  ) || keys[0];
                  
                  const valueKey = keys.find(k => 
                    k.toLowerCase().includes('sales') ||
                    k.toLowerCase().includes('revenue') ||
                    k.toLowerCase().includes('profit') ||
                    k.toLowerCase().includes('amount') ||
                    k.toLowerCase().includes('count') ||
                    k.toLowerCase().includes('value') ||
                    k.toLowerCase().includes('y') ||
                    (k !== labelKey && typeof savedChartData[0][k] === 'number')
                  ) || keys[1] || keys[0];
                  
                  chartDataForJS.labels = savedChartData.map(item => String(item[labelKey] || ''));
                  chartDataForJS.values = savedChartData.map(item => parseFloat(item[valueKey]) || 0);
                  
                  console.log('Object array extraction - Label key:', labelKey, 'Value key:', valueKey);
                }
              } else {
                // Simple array format
                console.log('Detected simple array format');
                chartDataForJS.labels = savedChartData.map((_, index) => 'Item ' + (index + 1));
                chartDataForJS.values = savedChartData.map(item => parseFloat(item) || 0);
              }
              
              console.log('Chart data extraction completed');
              console.log('- Extracted', chartDataForJS.labels.length, 'labels and', chartDataForJS.values.length, 'values');
            }
            // FALLBACK: If no data extracted, show error
            else {
              console.error('No valid chart data could be extracted');
              console.error('- savedChartData:', savedChartData);
              console.error('- configCategories:', configCategories);
              console.error('- configValues:', configValues);
              
              // Create minimal fallback data to prevent blank chart
              chartDataForJS.labels = ['No Data'];
              chartDataForJS.values = [0];
              chartDataForJS.title = 'No Data Available';
            }
            
            // Final validation and logging
            console.log('FINAL CHART DATA FOR RENDERING:');
            console.log('- Title:', chartDataForJS.title);
            console.log('- Type:', chartDataForJS.type);
            console.log('- Labels count:', chartDataForJS.labels.length);
            console.log('- Values count:', chartDataForJS.values.length);
            console.log('- Labels:', chartDataForJS.labels);
            console.log('- Values:', chartDataForJS.values);
            
            // Ensure data consistency
            if (chartDataForJS.labels.length !== chartDataForJS.values.length) {
              console.warn('Labels and values length mismatch, truncating to shorter length');
              const minLength = Math.min(chartDataForJS.labels.length, chartDataForJS.values.length);
              chartDataForJS.labels = chartDataForJS.labels.slice(0, minLength);
              chartDataForJS.values = chartDataForJS.values.slice(0, minLength);
            }
            
            console.log('Final processed chart data:', chartDataForJS);
            
            function showChart(chartType) {
              // Update tabs
              document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
              event.target.classList.add('active');
              
              // Update chart containers
              document.querySelectorAll('.chart-wrapper').forEach(wrapper => wrapper.classList.remove('active'));
              document.getElementById(chartType + 'Wrapper').classList.add('active');
              
              currentChart = chartType;
              
              // Initialize chart if not already done
              if (chartType === 'echarts' && !echartsInstance) {
                createEChartsChart();
              } else if (chartType === 'plotly' && !plotlyInstance) {
                createPlotlyChart();
              }
              
              // Resize charts
              setTimeout(() => {
                if (chartType === 'echarts' && echartsInstance) {
                  echartsInstance.resize();
                } else if (chartType === 'plotly' && plotlyInstance) {
                  Plotly.Plots.resize('plotlyContainer');
                }
              }, 100);
            }
            
            function createEChartsChart() {
              try {
                const container = document.getElementById('echartsContainer');
                echartsInstance = echarts.init(container);
                
                // Color palette
                const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];
                
                let option = {};
                
                if (chartDataForJS.type === 'pie' || chartDataForJS.type === 'doughnut') {
                  // Pie chart configuration
                  option = {
                    title: {
                      text: chartDataForJS.title,
                      left: 'center',
                      textStyle: { fontSize: 16, fontWeight: 'bold' }
                    },
                    tooltip: {
                      trigger: 'item',
                      formatter: '{a} <br/>{b}: {c} ({d}%)'
                    },
                    legend: {
                      orient: 'vertical',
                      left: 'left'
                    },
                    series: [{
                      name: chartDataForJS.title,
                      type: 'pie',
                      radius: chartDataForJS.type === 'doughnut' ? ['40%', '70%'] : '60%',
                      center: ['50%', '60%'],
                      data: chartDataForJS.labels.map((label, index) => ({
                        value: chartDataForJS.values[index],
                        name: label,
                        itemStyle: { color: colors[index % colors.length] }
                      })),
                      emphasis: {
                        itemStyle: {
                          shadowBlur: 10,
                          shadowOffsetX: 0,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                      }
                    }]
                  };
                } else {
                  // Bar/Line chart configuration
                  option = {
                    title: {
                      text: chartDataForJS.title,
                      left: 'center',
                      textStyle: { fontSize: 16, fontWeight: 'bold' }
                    },
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: { type: 'shadow' }
                    },
                    grid: {
                      left: '3%',
                      right: '4%',
                      bottom: '3%',
                      containLabel: true
                    },
                    xAxis: {
                      type: 'category',
                      data: chartDataForJS.labels,
                      axisLabel: { rotate: 45 }
                    },
                    yAxis: {
                      type: 'value'
                    },
                    series: [{
                      name: chartDataForJS.title,
                      type: chartDataForJS.type === 'line' ? 'line' : 'bar',
                      data: chartDataForJS.values,
                      itemStyle: {
                        color: function(params) {
                          return colors[params.dataIndex % colors.length];
                        }
                      },
                      emphasis: {
                        itemStyle: {
                          shadowBlur: 10,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                      }
                    }]
                  };
                  
                  if (chartDataForJS.type === 'line') {
                    option.series[0].smooth = true;
                    option.series[0].lineStyle = { width: 3 };
                    option.series[0].symbolSize = 8;
                  }
                }
                
                echartsInstance.setOption(option);
                console.log('ECharts chart created successfully');
                
              } catch (error) {
                console.error('Error creating ECharts chart:', error);
                document.getElementById('echartsContainer').innerHTML = 
                  '<div class="error"><h3>Error Loading ECharts</h3><p>' + error.message + '</p></div>';
              }
            }
            
            function createPlotlyChart() {
              try {
                const container = document.getElementById('plotlyContainer');
                
                let data = [];
                let layout = {
                  title: {
                    text: chartDataForJS.title,
                    font: { size: 16 }
                  },
                  margin: { t: 60, l: 50, r: 50, b: 50 },
                  font: { family: 'Arial, sans-serif' },
                  plot_bgcolor: 'white',
                  paper_bgcolor: 'white'
                };
                
                // Color palette
                const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];
                
                if (chartDataForJS.type === 'pie' || chartDataForJS.type === 'doughnut') {
                  // Pie chart
                  data = [{
                    values: chartDataForJS.values,
                    labels: chartDataForJS.labels,
                    type: 'pie',
                    hole: chartDataForJS.type === 'doughnut' ? 0.4 : 0,
                    marker: {
                      colors: colors.slice(0, chartDataForJS.labels.length)
                    },
                    textinfo: 'label+percent',
                    textposition: 'auto',
                    hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percent: %{percent}<extra></extra>'
                  }];
                } else if (chartDataForJS.type === 'line') {
                  // Line chart
                  data = [{
                    x: chartDataForJS.labels,
                    y: chartDataForJS.values,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: chartDataForJS.title,
                    line: {
                      color: colors[0],
                      width: 3,
                      shape: 'spline'
                    },
                    marker: {
                      color: colors[0],
                      size: 8
                    }
                  }];
                  
                  layout.xaxis = { title: 'Categories' };
                  layout.yaxis = { title: 'Values' };
                } else {
                  // Bar chart
                  data = [{
                    x: chartDataForJS.labels,
                    y: chartDataForJS.values,
                    type: 'bar',
                    name: chartDataForJS.title,
                    marker: {
                      color: chartDataForJS.values.map((_, index) => colors[index % colors.length])
                    }
                  }];
                  
                  layout.xaxis = { title: 'Categories' };
                  layout.yaxis = { title: 'Values' };
                }
                
                const config = {
                  responsive: true,
                  displayModeBar: true,
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                  displaylogo: false
                };
                
                Plotly.newPlot(container, data, layout, config);
                plotlyInstance = true;
                console.log('Plotly chart created successfully');
                
              } catch (error) {
                console.error('Error creating Plotly chart:', error);
                document.getElementById('plotlyContainer').innerHTML = 
                  '<div class="error"><h3>Error Loading Plotly</h3><p>' + error.message + '</p></div>';
              }
            }
            
            function downloadChart() {
              try {
                if (currentChart === 'echarts' && echartsInstance) {
                  // Download ECharts as PNG
                  const url = echartsInstance.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: '#ffffff'
                  });
                  
                  const link = document.createElement('a');
                  link.download = '${(chart.chartTitle || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_echarts.png';
                  link.href = url;
                  link.click();
                  
                } else if (currentChart === 'plotly') {
                  // Download Plotly as PNG
                  Plotly.downloadImage('plotlyContainer', {
                    format: 'png',
                    width: 1200,
                    height: 800,
                    filename: '${(chart.chartTitle || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plotly'
                  });
                }
                
                console.log('Chart downloaded successfully');
              } catch (error) {
                console.error('Download error:', error);
                alert('Failed to download chart: ' + error.message);
              }
            }
            
            // Initialize charts when page loads
            window.addEventListener('load', function() {
              try {
                console.log('Chart viewer initializing...');
                console.log('Chart data validation:', {
                  hasLabels: chartDataForJS.labels.length > 0,
                  hasValues: chartDataForJS.values.length > 0,
                  labelCount: chartDataForJS.labels.length,
                  valueCount: chartDataForJS.values.length,
                  chartType: chartDataForJS.type
                });
                
                if (!chartDataForJS.labels.length || !chartDataForJS.values.length) {
                  console.log('No valid chart data available');
                  document.querySelector('.chart-container').innerHTML = 
                    '<div class="error"><h3>No Chart Data Available</h3><p>This chart does not contain viewable data.</p><p>Debug info: Labels: ' + chartDataForJS.labels.length + ', Values: ' + chartDataForJS.values.length + '</p></div>';
                  return;
                }
                
                console.log('Chart data is valid, initializing ECharts...');
                setTimeout(() => {
                  createEChartsChart();
                  // Plotly will be created when tab is clicked
                }, 100);
              } catch (error) {
                console.error('Error during chart initialization:', error);
                document.querySelector('.chart-container').innerHTML = 
                  '<div class="error"><h3>Chart Initialization Error</h3><p>' + error.message + '</p></div>';
              }
            });
            
            // Handle window resize
            window.addEventListener('resize', function() {
              setTimeout(() => {
                if (echartsInstance) {
                  echartsInstance.resize();
                }
                if (plotlyInstance && currentChart === 'plotly') {
                  Plotly.Plots.resize('plotlyContainer');
                }
              }, 100);
            });
            
            // Handle errors
            window.addEventListener('error', function(e) {
              console.error('Window error:', e.error);
            });
          </script>
        </body>
        </html>
      `;
      
      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Open the chart in a new window using the Blob URL
      const chartWindow = window.open(blobUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!chartWindow) {
        toast.error('Please allow popups for this site to view charts');
        URL.revokeObjectURL(blobUrl); // Clean up the blob URL
        return;
      }
      
      // Set a title for the window (after a brief delay to ensure it's loaded)
      setTimeout(() => {
        try {
          chartWindow.document.title = `Chart: ${chart.chartTitle || 'Untitled Chart'}`;
        } catch (e) {
          console.log('Could not set window title:', e.message);
        }
      }, 1000);
      
      // Clean up the blob URL after the window loads
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 2000);
      
      toast.success('Chart opened in new window with ECharts & Plotly');
    } catch (error) {
      console.error('Error viewing chart:', error);
      toast.error('Failed to open chart view: ' + error.message);
    }
  };

  const handleDelete = async (chartId, chartTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${chartTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Deleting chart:', chartId);
      await dispatch(deleteChartFromHistory(chartId)).unwrap();
      toast.success('Chart deleted successfully');
      
      // Refresh the list after successful deletion
      await fetchHistory();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete chart');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // fetchHistory will be called automatically via useEffect
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    // fetchHistory will be called automatically via useEffect
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getChartIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'line':
        return <LineChart className="w-4 h-4" />;
      case 'pie':
      case 'doughnut':
        return <PieChart className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getChartTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'bar':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'line':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
      case 'pie':
      case 'doughnut':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      default:
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800/30 dark:text-secondary-300';
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil((chartHistory?.total || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, chartHistory?.total || 0);

  if (loading && !chartHistory?.charts?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
        
        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Chart History</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we fetch your charts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  Chart History
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  View and manage your saved charts with advanced analytics
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => navigate('/charts')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Chart
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:items-end sm:space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Charts
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title or source file..."
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chart Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="doughnut">Doughnut Chart</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="chartTitle-asc">Title A-Z</option>
                  <option value="chartTitle-desc">Title Z-A</option>
                  <option value="chartType-asc">Type A-Z</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-500" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800 dark:text-error-200">Error Loading Charts</h3>
                  <p className="text-sm text-error-700 dark:text-error-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts List */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {loading && (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">Loading charts...</p>
                </div>
              </div>
            )}

            {!loading && (!chartHistory?.charts || chartHistory.charts.length === 0) && (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl mb-4">
                    <BarChart3 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Charts Found</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    {searchTerm || filterType !== 'all'
                      ? 'No charts match your current filters. Try adjusting your search criteria.'
                      : 'You haven\'t created any charts yet. Start by creating your first chart!'}
                  </p>
                  <button
                    onClick={() => navigate('/charts')}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Chart
                  </button>
                </div>
              </div>
            )}

            {!loading && chartHistory?.charts && chartHistory.charts.length > 0 && (
              <>
                {/* Charts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Chart
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Data Points
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700">
                      {chartHistory.charts.map((chart) => (
                        <tr key={chart._id || chart.chartId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg mr-3">
                                {getChartIcon(chart.chartType)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {chart.chartTitle || 'Untitled Chart'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {chart.chartId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChartTypeColor(chart.chartType)}`}>
                              {chart.chartType?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {chart.sourceFileName || 'Unknown File'}
                            </div>
                            {chart.sourceSheet && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Sheet: {chart.sourceSheet}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(chart.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {chart.configuration?.values?.length || chart.dataInfo?.totalRows || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewChart(chart)}
                                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                                title="View Chart"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(chart)}
                                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                                title="Download Chart Data"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(chart.chartId, chart.chartTitle)}
                                className="inline-flex items-center p-2 border border-error-300 dark:border-error-600 rounded-lg shadow-sm text-sm font-medium text-error-700 dark:text-error-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-error-50 dark:hover:bg-error-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 transition-all duration-200"
                                title="Delete Chart"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <span>
                          Showing {startIndex} to {endIndex} of {chartHistory?.total || 0} results
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            const isActive = page === currentPage;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${
                                  isActive
                                    ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                                    : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartHistoryFixed;
