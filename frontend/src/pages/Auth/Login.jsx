import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowRight, Shield, BarChart3, LogIn, Rocket } from 'lucide-react';
import { loginUser, adminLogin } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated, isAdmin } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);

  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // If user navigates to /admin/login, default to admin login mode
    if (location.pathname === '/admin/login') {
      setIsAdminLogin(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      // Clear any potential cross-account artifacts already handled in analytics slice via extraReducers
      const from = location.state?.from?.pathname || (isAdmin ? '/admin' : '/dashboard');
      navigate(from, { replace: true });
      toast.success(`Welcome back! Redirecting to ${isAdmin ? 'admin panel' : 'dashboard'}` , { position: 'bottom-center' });
    }
  }, [isAuthenticated, isAdmin, navigate, location]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Authentication failed. Please try again.', { position: 'bottom-center' });
    }
  }, [error]);

  const onSubmit = async (data) => {
    try {
      const credentials = {
        email: data.email,
        password: data.password,
      };

      if (isAdminLogin) {
        const result = await dispatch(adminLogin(credentials)).unwrap();
        console.log('Admin login successful:', result);
      } else {
        const result = await dispatch(loginUser(credentials)).unwrap();
        console.log('User login successful:', result);
      }

      reset();
    } catch (error) {
      console.error('Login error details:', {
        error,
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      // Show more specific error message
      const errorMessage = error.message || error.error || 'Login failed. Please try again.';
      toast.error(errorMessage, { position: 'bottom-center' });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleLoginMode = () => {
    setIsAdminLogin(!isAdminLogin);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl p-4 relative overflow-hidden">
      {/* Subtle background effects matching header style */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/40 dark:from-gray-800/30 dark:via-blue-900/20 dark:to-purple-900/25 pointer-events-none"></div>
      
      {/* Minimal floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400/20 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute bottom-1/4 left-3/4 w-1 h-1 bg-gray-400/20 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '3s' }}></div>
      </div>

      {/* Main Container - Header Design Inspired */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header Section - Matching Header Logo Style */}
        <div className="text-center space-y-4">
          {/* Logo matching header gradient style */}
          <div className="relative mx-auto h-16 w-16 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>

          {/* Title with header-style typography */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Excel Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isAdminLogin ? '🛡️ Admin Portal Access' : '📊 Sign in to your account'}
            </p>
          </div>
        </div>

        {/* Login Form Container - Header Card Style */}
        <div className="relative">
          {/* Main form card with header-style backdrop and borders */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 p-8">
            {/* Mode Toggle Section */}
            <div className="mb-6">
              <div className="flex items-center justify-center p-1 bg-gray-100/60 dark:bg-gray-700/60 rounded-2xl">
                <button
                  type="button"
                  onClick={toggleLoginMode}
                  className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    !isAdminLogin
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/60 dark:border-gray-600/60'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  User Login
                </button>
                <button
                  type="button"
                  onClick={toggleLoginMode}
                  className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isAdminLogin
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/60 dark:border-gray-600/60'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Login
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field - Header Input Style */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Email Address
                  </div>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`block w-full pl-12 pr-4 py-3 border rounded-2xl text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                      errors.email
                        ? 'border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                        : 'border-gray-200/60 dark:border-gray-600/60 bg-white/60 dark:bg-gray-700/60 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-gray-300/70 dark:hover:border-gray-500/70'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center mt-2 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.email.message}</p>
                  </div>
                )}
              </div>

              {/* Password Field - Header Input Style */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                    Password
                  </div>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`block w-full pl-12 pr-12 py-3 border rounded-2xl text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                      errors.password
                        ? 'border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                        : 'border-gray-200/60 dark:border-gray-600/60 bg-white/60 dark:bg-gray-700/60 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 hover:border-gray-300/70 dark:hover:border-gray-500/70'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center mt-2 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.password.message}</p>
                  </div>
                )}
              </div>

              {/* Submit Button - Header Button Style */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="group relative w-full flex justify-center py-3 px-6 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:to-purple-400/20 rounded-2xl transition-all duration-300"></div>
                <div className="relative flex items-center">
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      <span>{isAdminLogin ? 'Admin Sign In' : 'Sign In'}</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Footer Links - Header Style */}
            <div className="mt-6 space-y-4">
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200/60 dark:border-gray-700/60" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-1 bg-white/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                    New to Excel Analytics?
                  </span>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-200/30 dark:border-blue-700/20">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-center gap-1">
                  <Rocket className="w-4 h-4" /> Ready to start your analytics journey?
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full border border-gray-200/30 dark:border-gray-700/30">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-2 animate-pulse"></div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              © 2025 Excel Analytics Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
