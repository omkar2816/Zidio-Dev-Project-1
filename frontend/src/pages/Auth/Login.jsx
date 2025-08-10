import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
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
      const message = typeof error === 'string' ? error : (error.message || 'Login failed. Please try again.');
      toast.error(message, { position: 'bottom-center' });
    }
  }, [error]);

  const onSubmit = async (data) => {
    try {
      const credentials = {
        email: data.email,
        password: data.password,
      };

      if (isAdminLogin) {
        await dispatch(adminLogin(credentials)).unwrap();
      } else {
        await dispatch(loginUser(credentials)).unwrap();
      }

      reset();
    } catch (error) {
      console.error('Login error:', error);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isAdminLogin ? 'Admin Login' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isAdminLogin 
              ? 'Access the admin panel to manage users and system settings'
              : 'Sign in to your account to continue'
            }
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg text-sm transition-colors duration-200 ${
                    errors.email
                      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg text-sm transition-colors duration-200 ${
                    errors.password
                      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isAdminLogin ? 'Signing in as Admin...' : 'Signing in...'}
                </div>
              ) : (
                <span>{isAdminLogin ? 'Sign in as Admin' : 'Sign in'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleLoginMode}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            >
              {isAdminLogin ? 'Sign in as User' : 'Sign in as Admin'}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {isAdminLogin ? 'Admin Access Only' : 'New to Excel Analytics?'}
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="mt-6 text-center">
            {!isAdminLogin && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Sign up
                </Link>
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 Excel Analytics Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

