import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Database, 
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react';

const Hero = ({ onGetStarted, onSignIn }) => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Advanced Excel Analytics Platform
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Excel Data
              </span>
              <br />
              Into Insights
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl"
            >
              Upload, analyze, and visualize your Excel files with powerful 2D & 3D charts. 
              Get actionable insights with advanced analytics, all in a secure, modern platform.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSignIn}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 flex items-center justify-center group"
              >
                <Play className="mr-2 w-5 h-5" />
                Sign In
              </motion.button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center lg:justify-start mt-8 space-x-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Files Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Chart Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Dashboard */}
              <motion.div
                animate={floatingAnimation}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Chart Area */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-blue-500" />
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">142</div>
                    <div className="text-xs text-gray-500">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">5.2s</div>
                    <div className="text-xs text-gray-500">Process Time</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [-5, 5, -5],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -top-4 -left-4 bg-blue-500 p-3 rounded-xl shadow-lg"
              >
                <Database className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [5, -5, 5],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute -top-4 -right-4 bg-purple-500 p-3 rounded-xl shadow-lg"
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [-3, 3, -3],
                  rotate: [0, 3, 0]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute -bottom-4 -left-4 bg-green-500 p-3 rounded-xl shadow-lg"
              >
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
