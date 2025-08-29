import axios from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

// Set base URL for all requests - this should match your backend port
axios.defaults.baseURL = 'http://localhost:5000';

// Enable credentials to be included in requests
axios.defaults.withCredentials = true;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      store.dispatch(logout());
      // Redirect to login page
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axios;
