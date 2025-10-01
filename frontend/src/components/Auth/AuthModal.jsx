import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import { loginUser, registerUser, adminLogin, clearError } from '../../store/slices/authSlice';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', initialAdminMode = false }) => {
  const [mode, setMode] = useState(initialMode);
  const [selectedRole, setSelectedRole] = useState('user'); // user, admin, admin-request
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const password = watch('password');

  React.useEffect(() => {
    if (isOpen) {
      dispatch(clearError());
      reset();
      setMode(initialMode);
      setSelectedRole(initialAdminMode ? 'admin' : 'user');
    }
  }, [isOpen, initialMode, initialAdminMode, dispatch, reset]);

  const onSubmit = async (data) => {
    try {
      let result;
      if (mode === 'login') {
        if (selectedRole === 'admin') {
          // Use admin login for both admin and superadmin
          result = await dispatch(adminLogin({
            email: data.email,
            password: data.password
          })).unwrap();
          
          toast.success('Admin login successful!');
          onClose();
          navigate('/admin');
        } else {
          // Regular user login
          result = await dispatch(loginUser({
            email: data.email,
            password: data.password
          })).unwrap();
          
          toast.success('Login successful!');
          onClose();
          navigate('/dashboard');
        }
      } else {
        // Registration
        if (selectedRole === 'admin-request') {
          // Request admin access
          result = await dispatch(registerUser({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            isAdmin: true
          })).unwrap();
          
          toast.success('Admin request submitted! You will be notified once reviewed.');
          onClose();
        } else {
          // Regular user registration
          result = await dispatch(registerUser({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            isAdmin: false
          })).unwrap();
          
          toast.success('Registration successful!');
          onClose();
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.message || `${mode} failed`);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setSelectedRole('user');
    reset();
    dispatch(clearError());
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('login')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'login'
              ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <LogIn className="w-4 h-4 inline mr-2" />
          Sign In
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('register')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'register'
              ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Sign Up
        </motion.button>
      </div>

      {/* Role Selection */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {mode === 'login' ? 'Login as:' : 'Register as:'}
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="user">User</option>
          {mode === 'login' && <option value="admin">Admin / Super Admin</option>}
          {mode === 'register' && <option value="admin-request">Request Admin Access</option>}
        </select>
      </motion.div>

      {/* Admin Registration Notice */}
      {mode === 'register' && selectedRole === 'admin-request' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3"
        >
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            <strong>Note:</strong> This requests regular admin access (user management only). 
            Super Admin approval is required. Only one Super Admin exists in the system.
          </p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Admin Credentials Hint */}
        {mode === 'login' && selectedRole === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                  <strong>Super Admin Credentials:</strong><br />
                  Email: superadmin@excel-analytics.local<br />
                  Password: SuperAdmin123!
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  reset({
                    email: 'superadmin@excel-analytics.local',
                    password: 'SuperAdmin123!'
                  });
                }}
                className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                Auto-fill
              </motion.button>
            </div>
          </motion.div>
        )}
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={inputVariants} whileFocus="focus" whileTap="blur">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                {...register('firstName', { 
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' }
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </motion.div>

            <motion.div variants={inputVariants} whileFocus="focus" whileTap="blur">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                {...register('lastName', { 
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </motion.div>
          </div>
        )}

        <motion.div variants={inputVariants} whileFocus="focus" whileTap="blur">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="john@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </motion.div>

        <motion.div variants={inputVariants} whileFocus="focus" whileTap="blur">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
                pattern: mode === 'register' ? {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                  message: 'Password must contain uppercase, lowercase, and number'
                } : undefined
              })}
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </motion.div>

        {mode === 'register' && (
          <motion.div variants={inputVariants} whileFocus="focus" whileTap="blur">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </motion.div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
            </div>
          ) : (
            mode === 'login' ? 'Sign In' : 'Create Account'
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={switchMode}
            className="ml-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
        
        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              onClose();
              // You can add forgot password logic here
              console.log('Forgot password clicked');
            }}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 mt-2 block mx-auto transition-colors"
          >
            Forgot your password?
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
