import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, adminLogin, registerUser, logoutUser } from './authSlice';
import axios from 'axios';

// Async thunks
export const uploadExcelFile = createAsyncThunk(
  'analytics/uploadFile',
  async (file, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/analytics/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'File upload failed' });
    }
  }
);

export const fetchUploadedFiles = createAsyncThunk(
  'analytics/fetchUploadedFiles',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get('/api/analytics/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch files' });
    }
  }
);

export const deleteUploadedFile = createAsyncThunk(
  'analytics/deleteUploadedFile',
  async (fileId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`/api/analytics/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { fileId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete file' });
    }
  }
);

export const analyzeData = createAsyncThunk(
  'analytics/analyzeData',
  async ({ fileId, analysisType = 'comprehensive' }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!fileId) {
        throw new Error('File ID is required');
      }
      
      // First, fetch the file data
      const fileResponse = await axios.get(`/api/analytics/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fileData = fileResponse.data.data;
      
      // Check if we have sheet data
      if (!fileData.sheets || Object.keys(fileData.sheets).length === 0) {
        throw new Error('No sheet data found in file');
      }
      
      // Get the first sheet (sheets is an object with sheetName as keys)
      const firstSheetName = fileData.sheetNames[0];
      const firstSheet = fileData.sheets[firstSheetName];
      
      if (!firstSheet.data || firstSheet.data.length === 0) {
        throw new Error('No data found in the first sheet');
      }
      
      // Prepare the data in the format expected by the analyze endpoint
      const sheetData = {
        headers: firstSheet.headers,
        data: firstSheet.data
      };
      
      // Now send to analyze endpoint
      const response = await axios.post('/api/analytics/analyze', {
        sheetData,
        analysisType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        ...response.data,
        fileInfo: {
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          sheetNames: fileData.sheetNames,
          sheetName: firstSheetName
        },
        preview: firstSheet.data, // Pass all data instead of just 10 rows
        fullData: firstSheet.data, // Also provide as fullData
        statistics: {
          totalRows: firstSheet.totalRows,
          totalColumns: firstSheet.totalColumns,
          numericColumns: firstSheet.headers?.filter(header => {
            return firstSheet.data.some(row => {
              const value = row[header];
              return !isNaN(parseFloat(value)) && value !== '' && value !== null;
            });
          }).length || 0
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message || 'Analysis failed' });
    }
  }
);

export const generate3DCharts = createAsyncThunk(
  'analytics/generate3DCharts',
  async (data, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post('/api/analytics/3d-charts', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: '3D chart generation failed' });
    }
  }
);

export const save3DChartToHistory = createAsyncThunk(
  'analytics/save3DChartToHistory',
  async ({ chart, fileId = null, chart3DConfig }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post('/api/analytics/save-3d-chart', {
        chart,
        fileId,
        chart3DConfig
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to save 3D chart to history' });
    }
  }
);

export const exportData = createAsyncThunk(
  'analytics/exportData',
  async (exportData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post('/api/analytics/export', exportData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Export failed' });
    }
  }
);

// Chart History thunks
export const fetchChartHistory = createAsyncThunk(
  'analytics/fetchChartHistory',
  async ({ page = 1, limit = 20, search = '', type = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(type !== 'all' && { type }),
        sortBy,
        sortOrder
      });

      const response = await axios.get(`/api/history/charts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch chart history' });
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'analytics/fetchRecentActivities',
  async ({ limit = 10 } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`/api/history/recent-activity?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch recent activities' });
    }
  }
);

export const saveChartToHistory = createAsyncThunk(
  'analytics/saveChartToHistory',
  async ({ chart, fileId = null, chart3DConfig = null }, { rejectWithValue, getState }) => {
    try {
      console.log('📊 SAVE CHART TO HISTORY - Starting save process:', {
        chartId: chart?.id,
        chartTitle: chart?.title,
        chartType: chart?.type,
        fileId,
        chartDataLength: chart?.data?.length,
        chartKeys: chart ? Object.keys(chart) : [],
        is3DChart: chart3DConfig?.is3D || chart?.type?.includes('3d') || false
      });

      // Detect if this is a 3D chart
      const is3DChart = chart3DConfig?.is3D || 
                        chart?.type?.includes('3d') || 
                        chart?.type === 'bar3d' ||
                        chart?.type === 'scatter3d' ||
                        chart?.type === 'surface3d' ||
                        chart?.type === 'mesh3d' ||
                        chart?.type === 'line3d' ||
                        chart?.type === 'pie3d' ||
                        chart?.type === 'area3d' ||
                        chart?.type === 'column3d';

      // If it's a 3D chart, use the 3D-specific save function
      if (is3DChart) {
        console.log('🎲 Detected 3D chart - routing to save3DChartToHistory');
        const enhanced3DConfig = {
          is3D: true,
          ...chart3DConfig,
          chartType: chart?.type
        };
        
        // Call the 3D-specific endpoint directly
        const token = getState().auth.token;
        const response = await axios.post('/api/analytics/save-3d-chart', {
          chart,
          fileId,
          chart3DConfig: enhanced3DConfig
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ 3D Chart save API response:', response.data);
        return { chart, response: response.data, is3D: true };
      }

      const state = getState();
      const token = state.auth.token;
      
      console.log('🔍 Auth state check:', {
        hasAuthState: !!state.auth,
        hasToken: !!token,
        tokenLength: token ? token.length : 0
      });
      
      if (!token) {
        console.error('❌ No authentication token available for chart save');
        throw new Error('Authentication required');
      }

      console.log('🚀 Making API call to /api/analytics/save-chart');
      console.log('📦 Payload being sent:', { chart, fileId });
      
      const response = await axios.post('/api/analytics/save-chart', {
        chart,
        fileId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Chart save API response:', response.data);
      return { chart, response: response.data };
    } catch (error) {
      console.error('💥 Chart save error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('🔐 Authentication failed - user needs to log in again');
        return rejectWithValue({ 
          message: 'Authentication failed. Please log in again.', 
          code: 'AUTH_FAILED',
          status: 401 
        });
      }

      if (error.response?.status === 403) {
        console.error('🚫 Access forbidden - insufficient permissions');
        return rejectWithValue({ 
          message: 'Access denied. Insufficient permissions.', 
          code: 'ACCESS_DENIED',
          status: 403 
        });
      }

      if (error.code === 'NETWORK_ERROR' || !error.response) {
        console.error('🌐 Network error - server may be unreachable');
        return rejectWithValue({ 
          message: 'Network error. Please check your connection and try again.', 
          code: 'NETWORK_ERROR' 
        });
      }

      return rejectWithValue(error.response?.data || { message: 'Failed to save chart' });
    }
  }
);

export const deleteChartFromHistory = createAsyncThunk(
  'analytics/deleteChartFromHistory',
  async (chartId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`/api/history/charts/${chartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { chartId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete chart' });
    }
  }
);

const initialState = {
  uploadedFile: null,
  recentFiles: [],
  recentActivities: [],
  currentSheet: null,
  sheetData: null,
  analytics: null,
  chartData: {
    barCharts: [],
    lineCharts: [],
    pieCharts: [],
    charts3D: []
  },
  chartHistory: {
    charts: [],
    pagination: {},
    total: 0
  },
  chartHistoryPagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  },
  chartHistoryLoading: false,
  chartHistoryError: null,
  isLoading: false,
  error: null,
  summary: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    removeRecentFile: (state, action) => {
      const uploadedAtToRemove = action.payload;
      state.recentFiles = state.recentFiles.filter(
        (f) => f.uploadedAt !== uploadedAtToRemove
      );
    },
    setCurrentSheet: (state, action) => {
      state.currentSheet = action.payload;
      if (state.uploadedFile && state.uploadedFile.sheets) {
        state.sheetData = state.uploadedFile.sheets[action.payload];
      }
    },
    clearAnalytics: (state) => {
      state.analytics = null;
      state.chartData = {
        barCharts: [],
        lineCharts: [],
        pieCharts: [],
        charts3D: []
      };
      state.summary = null;
    },
    clearUploadedFile: (state) => {
      state.uploadedFile = null;
      state.currentSheet = null;
      state.sheetData = null;
      state.analytics = null;
      state.chartData = {
        barCharts: [],
        lineCharts: [],
        pieCharts: [],
        charts3D: []
      };
      state.summary = null;
    },
    updateChartPreferences: (state, action) => {
      const { chartType, chartId, preferences } = action.payload;
      const chart = state.chartData[chartType]?.find(c => c.id === chartId);
      if (chart) {
        chart.preferences = { ...chart.preferences, ...preferences };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Reset analytics state on auth changes to avoid cross-account leakage
      .addCase(loginUser.fulfilled, (state) => {
        state.uploadedFile = null;
        state.recentFiles = [];
        state.currentSheet = null;
        state.sheetData = null;
        state.analytics = null;
        state.chartData = { barCharts: [], lineCharts: [], pieCharts: [], charts3D: [] };
        state.chartHistory = [];
        state.summary = null;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state) => {
        state.uploadedFile = null;
        state.recentFiles = [];
        state.currentSheet = null;
        state.sheetData = null;
        state.analytics = null;
        state.chartData = { barCharts: [], lineCharts: [], pieCharts: [], charts3D: [] };
        state.chartHistory = [];
        state.summary = null;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.uploadedFile = null;
        state.recentFiles = [];
        state.currentSheet = null;
        state.sheetData = null;
        state.analytics = null;
        state.chartData = { barCharts: [], lineCharts: [], pieCharts: [], charts3D: [] };
        state.chartHistory = [];
        state.summary = null;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.uploadedFile = null;
        state.recentFiles = [];
        state.currentSheet = null;
        state.sheetData = null;
        state.analytics = null;
        state.chartData = { barCharts: [], lineCharts: [], pieCharts: [], charts3D: [] };
        state.chartHistory = [];
        state.summary = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.uploadedFile = null;
        state.recentFiles = [];
        state.currentSheet = null;
        state.sheetData = null;
        state.analytics = null;
        state.chartData = { barCharts: [], lineCharts: [], pieCharts: [], charts3D: [] };
        state.chartHistory = [];
        state.summary = null;
        state.error = null;
      })
      // Upload File
      .addCase(uploadExcelFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadExcelFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.uploadedFile = action.payload.data;
        state.currentSheet = action.payload.data.sheetNames[0];
        state.sheetData = action.payload.data.sheets[action.payload.data.sheetNames[0]];
        // Track recent files
        const newRecent = {
          id: action.payload.data.fileId,
          name: action.payload.data.fileName,
          size: action.payload.data.fileSize,
          uploadedAt: Date.now(),
        };
        state.recentFiles = [newRecent, ...state.recentFiles].slice(0, 10);
        state.analytics = null;
        state.chartData = {
          barCharts: [],
          lineCharts: [],
          pieCharts: [],
          charts3D: []
        };
        state.summary = null;
      })
      // Fetch uploaded files
      .addCase(fetchUploadedFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUploadedFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        const files = action.payload.data || [];
        
        // Store original files data for Analytics component
        state.uploadedFiles = files;
        
        // Normalize to recentFiles shape for Files page
        state.recentFiles = files.map(f => ({
          id: f._id,
          name: f.originalName,
          size: f.size,
          uploadedAt: new Date(f.uploadedAt).getTime(),
        }));
      })
      .addCase(fetchUploadedFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch files';
      })

      // Delete uploaded file
      .addCase(deleteUploadedFile.fulfilled, (state, action) => {
        const { fileId } = action.payload;
        state.recentFiles = state.recentFiles.filter(f => f.id !== fileId);
      })
      .addCase(deleteUploadedFile.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to delete file';
      })
      .addCase(uploadExcelFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'File upload failed';
      })
      
      // Analyze Data
      .addCase(analyzeData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(analyzeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload.analysis; // Fixed: use analysis instead of data.analytics
        state.chartData = {
          ...state.chartData,
          ...(action.payload.chartData || {})
        };
        state.summary = action.payload.analysis?.summary || action.payload.summary;
        // Append to chart history (metadata only)
        const timestamp = Date.now();
        const newCharts = [];
        if (action.payload.chartData?.barCharts?.length) {
          newCharts.push(
            ...action.payload.chartData.barCharts.map((c, idx) => ({
              type: 'bar',
              title: c.title,
              createdAt: timestamp,
              id: `bar-${timestamp}-${idx}`,
            }))
          );
        }
        if (action.payload.chartData?.lineCharts?.length) {
          newCharts.push(
            ...action.payload.chartData.lineCharts.map((c, idx) => ({
              type: 'line',
              title: c.title,
              createdAt: timestamp,
              id: `line-${timestamp}-${idx}`,
            }))
          );
        }
        if (action.payload.chartData?.pieCharts?.length) {
          newCharts.push(
            ...action.payload.chartData.pieCharts.map((c, idx) => ({
              type: 'pie',
              title: c.title,
              createdAt: timestamp,
              id: `pie-${timestamp}-${idx}`,
            }))
          );
        }
        if (newCharts.length > 0) {
        state.chartHistory = [...newCharts, ...state.chartHistory].slice(0, 50);
        }
      })
      .addCase(analyzeData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Analysis failed';
      })
      
      // Generate 3D Charts
      .addCase(generate3DCharts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generate3DCharts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chartData.charts3D = action.payload.data.charts3D;
        const timestamp = Date.now();
        if (action.payload.data.charts3D?.length) {
          state.chartHistory = [
            ...action.payload.data.charts3D.map((c, idx) => ({
              type: c.type,
              title: c.title,
              createdAt: timestamp,
              id: `${c.type}-${timestamp}-${idx}`,
            })),
            ...state.chartHistory,
          ].slice(0, 50);
        }
      })
      .addCase(generate3DCharts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || '3D chart generation failed';
      })

      // Save 3D Chart to History
      .addCase(save3DChartToHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(save3DChartToHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add saved 3D chart to chart history if it's not already there
        const chartExists = state.chartHistory.some(chart => chart.chartId === action.payload.chartId);
        if (!chartExists && action.payload.chartData) {
          // Create a full chart history entry matching the expected structure
          const savedChart = {
            _id: action.payload.historyId,
            chartId: action.payload.chartId,
            chartTitle: action.payload.chartData.title || action.payload.chartData.chartTitle || 'Untitled 3D Chart',
            chartType: action.payload.chartData.type || action.payload.chartData.chartType || 'scatter3d',
            chartData: action.payload.chartData.data || action.payload.chartData.chartData,
            sourceFileName: action.payload.chartData.sourceFileName || '3D Generated Chart',
            configuration: {
              is3D: true,
              xAxis: action.payload.chart3DConfig?.xAxis,
              yAxis: action.payload.chart3DConfig?.yAxis,
              zAxis: action.payload.chart3DConfig?.zAxis,
              colorScheme: action.payload.chartData.colorScheme || 'emerald',
              chart3DConfig: action.payload.chart3DConfig
            },
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            isActive: true,
            status: 'active'
          };
          state.chartHistory = [savedChart, ...state.chartHistory];
        }
      })
      .addCase(save3DChartToHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to save 3D chart to history';
      })
      
      // Export Data
      .addCase(exportData.fulfilled, (state, action) => {
        // Handle export success (usually triggers download)
        state.isLoading = false;
      })
      .addCase(exportData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Export failed';
      })
      
      // Chart History
      .addCase(fetchChartHistory.pending, (state) => {
        state.chartHistoryLoading = true;
        state.chartHistoryError = null;
      })
      .addCase(fetchChartHistory.fulfilled, (state, action) => {
        state.chartHistoryLoading = false;
        console.log('📊 Redux: Chart history fetched successfully:', action.payload);
        
        // Handle the backend response structure: { success: true, data: { charts, pagination } }
        const responseData = action.payload.data || action.payload;
        const charts = responseData.charts || [];
        const pagination = responseData.pagination || {};
        
        // Store as an object to match component expectations
        state.chartHistory = {
          charts: charts,
          pagination: pagination,
          total: pagination.total || 0
        };
        
        state.chartHistoryPagination = {
          page: pagination.page || 1,
          pages: pagination.pages || 1,
          total: pagination.total || 0,
          limit: pagination.limit || 20
        };
      })
      .addCase(fetchChartHistory.rejected, (state, action) => {
        state.chartHistoryLoading = false;
        state.chartHistoryError = action.payload?.message || 'Failed to fetch chart history';
      })

      // Recent Activities
      .addCase(fetchRecentActivities.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentActivities = action.payload?.data || [];
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch recent activities';
      })
      
      // Save Chart to History
      .addCase(saveChartToHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveChartToHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('📊 Redux: Chart saved successfully, triggering refresh...');
        // Note: We'll trigger a fetchChartHistory refresh from the component
        // This ensures the chart list is always up-to-date after saving
      })
      .addCase(saveChartToHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to save chart';
      })
      
      // Delete Chart from History
      .addCase(deleteChartFromHistory.fulfilled, (state, action) => {
        console.log('🗑️ Redux: Chart deleted successfully:', action.payload.chartId);
        // Remove the chart from the local state - fix the state structure
        state.chartHistory.charts = state.chartHistory.charts.filter(chart => 
          chart.chartId !== action.payload.chartId && chart._id !== action.payload.chartId
        );
        // Update pagination counts
        if (state.chartHistory.total > 0) {
          state.chartHistory.total -= 1;
        }
        if (state.chartHistoryPagination.totalCount > 0) {
          state.chartHistoryPagination.totalCount -= 1;
        }
      })
      .addCase(deleteChartFromHistory.rejected, (state, action) => {
        state.chartHistoryError = action.payload?.message || 'Failed to delete chart';
      });
  },
});

export const { 
  clearError, 
  setCurrentSheet, 
  clearAnalytics, 
  clearUploadedFile,
  updateChartPreferences,
  removeRecentFile
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
