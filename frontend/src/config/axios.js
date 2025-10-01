import axios from 'axios';

// Set base URL for all requests
// In development, use Vite proxy. In production, use full backend URL
axios.defaults.baseURL = import.meta.env.DEV ? '' : 'http://localhost:5000';

// Enable credentials to be included in requests (needed for auth)
axios.defaults.withCredentials = true;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
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
      sessionStorage.removeItem('token');
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
