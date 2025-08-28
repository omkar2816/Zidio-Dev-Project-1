import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/admin/login', credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Admin login failed' });
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      if (!token) {
        throw new Error('No token available');
      }
      
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to get user' });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      await axios.post(
        '/api/auth/logout',
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      return { message: 'Logout successful' };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Logout failed' });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put('/api/users/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Profile update failed' });
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'auth/updatePreferences',
  async (preferences, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put('/api/users/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Preferences update failed' });
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put('/api/users/change-password', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Password change failed' });
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isAdmin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.error = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        
        // Only set token and authenticated if not an admin request
        if (action.payload.data.token) {
          state.token = action.payload.data.token;
          state.isAuthenticated = true;
          localStorage.setItem('token', action.payload.data.token);
        }
        
        state.isAdmin = action.payload.data.user.role === 'admin' || action.payload.data.user.role === 'superadmin';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.data.user.role === 'admin';
        localStorage.setItem('token', action.payload.data.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      
      // Admin Login
      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.isAdmin = true;
        localStorage.setItem('token', action.payload.data.token);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Admin login failed';
      })
      
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data.user;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.data.user.role === 'admin';
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        localStorage.removeItem('token');
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        localStorage.removeItem('token');
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if the API call fails, ensure client-side logout
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        localStorage.removeItem('token');
      })
      
      // Update Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.data.user;
      })
      
      // Update Preferences
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.user = action.payload.data.user;
      });
  },
});

export const { clearError, setToken, logout } = authSlice.actions;
export default authSlice.reducer;
