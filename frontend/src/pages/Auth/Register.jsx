import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle, UserPlus, BarChart3 } from 'lucide-react';
import { registerUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      toast.success('Registration successful! Welcome to Excel Analytics.', { position: 'bottom-center' });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Registration failed. Please try again.', { position: 'bottom-center' });
    }
  }, [error]);

  const onSubmit = async (data) => {
    try {
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      };

      await dispatch(registerUser(userData)).unwrap();
      reset();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

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
      <div className="relative z-10 w-full max-w-lg space-y-6">
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
              Join Excel Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              🚀 Create your account and start analyzing data today
            </p>
          </div>
        </div>

        {/* Registration Form Container - Header Card Style */}
        <div className="relative">
          {/* Main form card with header-style backdrop and borders */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      First Name
                    </div>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      className={`block w-full pl-12 pr-4 py-3 border rounded-2xl text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                        errors.firstName
                          ? 'border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                          : 'border-gray-200/60 dark:border-gray-600/60 bg-white/60 dark:bg-gray-700/60 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 hover:border-gray-300/70 dark:hover:border-gray-500/70'
                      }`}
                      placeholder="First name"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                      Last Name
                    </div>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      className={`block w-full pl-12 pr-4 py-3 border rounded-2xl text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                        errors.lastName
                          ? 'border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                          : 'border-gray-200/60 dark:border-gray-600/60 bg-white/60 dark:bg-gray-700/60 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 hover:border-gray-300/70 dark:hover:border-gray-500/70'
                      }`}
                      placeholder="Last name"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

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
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator - Header Card Style */}
                {password && (
                  <div className="mt-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Password strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength === 4 ? 'text-green-600 dark:text-green-400' :
                        passwordStrength === 3 ? 'text-blue-600 dark:text-blue-400' :
                        passwordStrength === 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {passwordStrength === 4 ? 'Strong' : passwordStrength === 3 ? 'Good' : passwordStrength === 2 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                    <div className="flex space-x-1 mb-2">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            index < passwordStrength
                              ? passwordStrength === 4 ? 'bg-green-500' :
                                passwordStrength === 3 ? 'bg-blue-500' :
                                passwordStrength === 2 ? 'bg-yellow-500' : 'bg-red-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <CheckCircle className={`h-3 w-3 mr-1 ${password.length >= 8 ? 'opacity-100' : 'opacity-50'}`} />
                        8+ characters
                      </div>
                      <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <CheckCircle className={`h-3 w-3 mr-1 ${/[A-Z]/.test(password) ? 'opacity-100' : 'opacity-50'}`} />
                        Uppercase
                      </div>
                      <div className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <CheckCircle className={`h-3 w-3 mr-1 ${/[0-9]/.test(password) ? 'opacity-100' : 'opacity-50'}`} />
                        Number
                      </div>
                      <div className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <CheckCircle className={`h-3 w-3 mr-1 ${/[^A-Za-z0-9]/.test(password) ? 'opacity-100' : 'opacity-50'}`} />
                        Special char
                      </div>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <div className="flex items-center mt-2 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.password.message}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field - Header Input Style */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                    Confirm Password
                  </div>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-gray-500 transition-colors" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`block w-full pl-12 pr-12 py-3 border rounded-2xl text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                      errors.confirmPassword
                        ? 'border-red-300 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                        : 'border-gray-200/60 dark:border-gray-600/60 bg-white/60 dark:bg-gray-700/60 text-gray-900 dark:text-white focus:border-gray-500 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-500/30 dark:focus:ring-gray-400/30 hover:border-gray-300/70 dark:hover:border-gray-500/70'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-2 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.confirmPassword.message}</p>
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
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      <span>Create My Account</span>
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
                    Already have an account?
                  </span>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-blue-200/30 dark:border-blue-700/20">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  🎯 Ready to access your dashboard?
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Sign In
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

export default Register;
