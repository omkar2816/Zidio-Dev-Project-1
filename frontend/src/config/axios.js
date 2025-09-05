import axios from 'axios';

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
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login only if we're not already on a public page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register') && 
          window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
