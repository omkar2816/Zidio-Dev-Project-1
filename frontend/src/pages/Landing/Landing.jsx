import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  BarChart3, 
  Database, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  LineChart,
  Activity,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Lock,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';

import Modal from '../../components/UI/Modal';
import AuthModal from '../../components/Auth/AuthModal';
import { Hero, Features, Stats, Testimonials, CTA, Footer } from './components';
import { toggleTheme } from '../../store/slices/uiSlice';

const Landing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const openAuthModal = (mode = 'login', adminMode = false) => {
    setAuthMode(mode);
    setIsAdminLogin(adminMode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Excel Analytics
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Features
              </a>
              <a href="#stats" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Analytics
              </a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Reviews
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAuthModal('login', true)}
                className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                Admin
              </motion.button>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleThemeToggle}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAuthModal('login')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAuthModal('register')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="pt-16">
        <Hero onGetStarted={() => openAuthModal('register')} onSignIn={() => openAuthModal('login')} />
        <Features />
        <Stats />
        <Testimonials />
        <CTA onGetStarted={() => openAuthModal('register')} onSignIn={() => openAuthModal('login')} />
      </main>

      <Footer />

      {/* Authentication Modal */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        title={isAdminLogin ? 'Admin Login' : authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
      >
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialMode={authMode}
          initialAdminMode={isAdminLogin}
        />
      </Modal>
    </div>
  );
};

export default Landing;
