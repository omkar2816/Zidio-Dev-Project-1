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
  async (data, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post('/api/analytics/analyze', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Analysis failed' });
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

const initialState = {
  uploadedFile: null,
  recentFiles: [],
  currentSheet: null,
  sheetData: null,
  analytics: null,
  chartData: {
    barCharts: [],
    lineCharts: [],
    pieCharts: [],
    charts3D: []
  },
  chartHistory: [],
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
        state.analytics = action.payload.data.analytics;
        state.chartData = {
          ...state.chartData,
          ...action.payload.data.chartData
        };
        state.summary = action.payload.data.summary;
        // Append to chart history (metadata only)
        const timestamp = Date.now();
        const newCharts = [];
        if (action.payload.data.chartData?.barCharts?.length) {
          newCharts.push(
            ...action.payload.data.chartData.barCharts.map((c, idx) => ({
              type: 'bar',
              title: c.title,
              createdAt: timestamp,
              id: `bar-${timestamp}-${idx}`,
            }))
          );
        }
        if (action.payload.data.chartData?.lineCharts?.length) {
          newCharts.push(
            ...action.payload.data.chartData.lineCharts.map((c, idx) => ({
              type: 'line',
              title: c.title,
              createdAt: timestamp,
              id: `line-${timestamp}-${idx}`,
            }))
          );
        }
        if (action.payload.data.chartData?.pieCharts?.length) {
          newCharts.push(
            ...action.payload.data.chartData.pieCharts.map((c, idx) => ({
              type: 'pie',
              title: c.title,
              createdAt: timestamp,
              id: `pie-${timestamp}-${idx}`,
            }))
          );
        }
        state.chartHistory = [...newCharts, ...state.chartHistory].slice(0, 50);
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
      
      // Export Data
      .addCase(exportData.fulfilled, (state, action) => {
        // Handle export success (usually triggers download)
        state.isLoading = false;
      })
      .addCase(exportData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Export failed';
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
