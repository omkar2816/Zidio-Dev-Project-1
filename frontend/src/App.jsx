import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { setTheme } from './store/slices/uiSlice';
import { getCurrentUser } from './store/slices/authSlice';

// Components
import Layout from './components/Layout/Layout';
import LenisProvider from './components/LenisProvider';
import ScrollToTop from './components/ScrollToTop';
import ScrollProgress from './components/ScrollProgress';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import Files from './pages/Files/Files';
import Charts from './pages/Charts/Charts';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  store.dispatch(setTheme(savedTheme));
};

function App() {
  useEffect(() => {
    initializeTheme();
    
    // Clear session on page reload to force re-authentication
    const handleBeforeUnload = () => {
      localStorage.removeItem('token');
      store.dispatch({ type: 'auth/logout/fulfilled' });
    };

    // Clear session on load (covers page refresh)
    localStorage.removeItem('token');
    store.dispatch({ type: 'auth/logout/fulfilled' });

    // Also clear on browser close/tab close
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <Provider store={store}>
      <HelmetProvider>
        <LenisProvider>
          <ScrollProgress />
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Routes>
                {/* Landing Page - Always accessible */}
                <Route path="/" element={<Landing />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                </Route>
                <Route path="/analytics" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Analytics />} />
                </Route>
                <Route path="/settings" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Settings />} />
                </Route>
                <Route path="/files" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Files />} />
                </Route>
                <Route path="/charts" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Charts />} />
                </Route>
                <Route path="/profile" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Profile />} />
                </Route>
                <Route path="/admin" element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
                  <Route index element={<Admin />} />
                </Route>
                
                {/* Legacy routes for backward compatibility */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              {/* Toast Notifications */}
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-color)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#FFFFFF',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#FFFFFF',
                    },
                  },
                }}
              />
              
              {/* Scroll to Top Button */}
              <ScrollToTop />
            </div>
          </Router>
        </LenisProvider>
      </HelmetProvider>
    </Provider>
  );
}

export default App;
