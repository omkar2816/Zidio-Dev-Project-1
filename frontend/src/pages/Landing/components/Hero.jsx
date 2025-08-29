import React, { useState, useEffect } from 'react';
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
import { useLenisContext } from '../../../components/LenisProvider';
import TouchOptimized from '../../../components/TouchOptimized';

const Hero = ({ onGetStarted, onSignIn }) => {
  const navigate = useNavigate();
  const { scrollBy } = useLenisContext();
  const [platformStats, setPlatformStats] = useState(null);

  // Fetch platform statistics
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const response = await fetch('/api/analytics/platform-stats');
        const data = await response.json();
        setPlatformStats(data);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
        // Fallback stats
        setPlatformStats({
          filesProcessed: 15420,
          activeUsers: 3280,
          avgProcessingTime: "1.8",
          uptime: "99.9"
        });
      }
    };

    fetchPlatformStats();
  }, []);

  const handleLearnMore = () => {
    scrollBy(window.innerHeight, { 
      duration: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });
  };

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
              <TouchOptimized tapScale={0.95} hoverScale={1.05}>
                <motion.button
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group w-full sm:w-auto"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </TouchOptimized>

              <TouchOptimized tapScale={0.95} hoverScale={1.05}>
                <motion.button
                  onClick={onSignIn}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 flex items-center justify-center group w-full sm:w-auto"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Sign In
                </motion.button>
              </TouchOptimized>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center lg:justify-start mt-8 space-x-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {platformStats ? `${platformStats.filesProcessed?.toLocaleString()}+` : '15K+'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Files Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Chart Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {platformStats ? `${platformStats.uptime}%` : '99.9%'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Analytics Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Analytics Dashboard */}
              <motion.div
                animate={floatingAnimation}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real-time Analytics</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Interactive Chart Area */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 relative overflow-hidden">
                  {/* Animated Bar Chart */}
                  <div className="absolute inset-4 flex items-end justify-center space-x-2">
                    {[65, 45, 80, 60, 90, 75, 85].map((height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ 
                          duration: 1.5, 
                          delay: 0.6 + index * 0.1,
                          ease: "easeOut"
                        }}
                        className={`w-8 rounded-t-sm ${
                          index % 3 === 0 ? 'bg-blue-500' :
                          index % 3 === 1 ? 'bg-purple-500' : 'bg-green-500'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Animated Trend Line */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 180">
                    <motion.path
                      d="M20,120 Q60,80 100,90 T180,70 T260,50"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1.2 }}
                    />
                    {/* Animated data points */}
                    {[
                      { x: 20, y: 120 }, { x: 60, y: 90 }, { x: 100, y: 95 },
                      { x: 140, y: 75 }, { x: 180, y: 70 }, { x: 220, y: 60 }, { x: 260, y: 50 }
                    ].map((point, index) => (
                      <motion.circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#F59E0B"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.4 + index * 0.1 }}
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Analytics Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                  >
                    <div className="text-2xl font-bold text-blue-600">
                      {platformStats ? `${Math.floor(platformStats.totalAnalyses / 1000).toFixed(1)}K` : '1.2K'}
                    </div>
                    <div className="text-xs text-gray-500">Data Points</div>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.0 }}
                  >
                    <div className="text-2xl font-bold text-green-600">
                      {platformStats ? `${platformStats.uptime}%` : '98.7%'}
                    </div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 }}
                  >
                    <div className="text-2xl font-bold text-purple-600">
                      {platformStats ? `${platformStats.avgProcessingTime}s` : '2.1s'}
                    </div>
                    <div className="text-xs text-gray-500">Process Time</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating Chart Elements */}
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
                className="absolute -top-4 -left-4 bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg"
              >
                <BarChart3 className="w-6 h-6 text-white" />
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
                className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg"
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
                className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl shadow-lg"
              >
                <Database className="w-6 h-6 text-white" />
              </motion.div>
              
              {/* Additional Analytics Element */}
              <motion.div
                animate={{ 
                  y: [2, -2, 2],
                  rotate: [0, -2, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className="absolute -bottom-4 -right-4 bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg"
              >
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            
            {/* Additional Mini Charts */}
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 w-24 h-20"
              >
                <div className="text-xs text-gray-500 mb-1">Revenue</div>
                <div className="flex items-end space-x-1 h-8">
                  {[40, 60, 80, 45, 70].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 2.7 + index * 0.1 }}
                      className="bg-gradient-to-t from-green-400 to-green-500 w-2 rounded-t-sm"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
            
            <div className="absolute -left-8 top-1/4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.0, duration: 0.8 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 w-24 h-20"
              >
                <div className="text-xs text-gray-500 mb-1">Growth</div>
                <div className="relative h-8">
                  <svg className="w-full h-full" viewBox="0 0 80 32">
                    <motion.path
                      d="M5,25 Q20,15 35,18 T70,8"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 3.2, duration: 1.5 }}
                    />
                  </svg>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
