import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const ChartHistoryDebug = () => {
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  
  const authState = useSelector((state) => state.auth);
  const analyticsState = useSelector((state) => state.analytics);

  const testAPI = async () => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      console.log('🧪 Testing chart history API...');
      console.log('🔍 Auth token:', authState.token ? 'Present' : 'Missing');
      console.log('🔍 User:', authState.user?.email);
      
      const response = await axios.get('/api/history/charts?page=1&limit=20', {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      console.log('✅ API Response:', response.data);
      setApiData(response.data);
      
      // Update debug info
      setDebugInfo({
        apiSuccess: true,
        totalCharts: response.data.data?.charts?.length || 0,
        pagination: response.data.data?.pagination,
        sampleChart: response.data.data?.charts?.[0]
      });
      
    } catch (error) {
      console.error('❌ API Error:', error);
      setApiError(error.response?.data || error.message);
      setDebugInfo({
        apiSuccess: false,
        error: error.response?.data || error.message
      });
    } finally {
      setApiLoading(false);
    }
  };

  const testSaveChart = async () => {
    try {
      console.log('🧪 Testing chart save API...');
      
      const testChart = {
        id: `debug-chart-${Date.now()}`,
        title: 'Debug Test Chart',
        type: 'bar',
        data: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          { x: 'C', y: 30 }
        ],
        dataColumns: ['x', 'y'],
        categories: ['A', 'B', 'C'],
        values: [10, 20, 30],
        colorScheme: 'emerald'
      };
      
      const response = await axios.post('/api/analytics/save-chart', {
        chart: testChart,
        fileId: null
      }, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      console.log('✅ Chart save response:', response.data);
      
      // Refresh the chart history
      setTimeout(() => {
        testAPI();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Chart save error:', error);
    }
  };

  useEffect(() => {
    if (authState.token) {
      testAPI();
    }
  }, [authState.token]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Chart History Debug Panel</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Authentication Status</h3>
        <p>User: {authState.user?.email || 'Not logged in'}</p>
        <p>Token: {authState.token ? '✅ Present' : '❌ Missing'}</p>
      </div>

      {/* Redux State */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Redux Analytics State</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({
            chartHistory: analyticsState.chartHistory,
            chartHistoryLoading: analyticsState.chartHistoryLoading,
            chartHistoryError: analyticsState.chartHistoryError,
            chartHistoryPagination: analyticsState.chartHistoryPagination
          }, null, 2)}
        </pre>
      </div>

      {/* API Test Controls */}
      <div className="mb-6">
        <button 
          onClick={testAPI}
          disabled={apiLoading || !authState.token}
          className="mr-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {apiLoading ? 'Testing API...' : 'Test Chart History API'}
        </button>
        
        <button 
          onClick={testSaveChart}
          disabled={!authState.token}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          Test Save Chart
        </button>
      </div>

      {/* API Response */}
      {apiError && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-red-700">API Error</h3>
          <pre className="text-xs text-red-600 overflow-auto">
            {JSON.stringify(apiError, null, 2)}
          </pre>
        </div>
      )}

      {apiData && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-green-700">API Response</h3>
          <pre className="text-xs text-green-600 overflow-auto max-h-96">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}

      {/* Debug Info */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Summary</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ChartHistoryDebug;
