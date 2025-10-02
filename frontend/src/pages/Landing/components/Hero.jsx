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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
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
              className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Advanced Data Analytics Platform
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Transform Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                {" "}Data Insights
              </span>
              <br />
              Into Analytics
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl"
            >
              Upload, analyze, and visualize your data with powerful analytics and 3D charts. 
              Get actionable business insights with advanced data science, all in a secure, modern platform.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <TouchOptimized tapScale={0.95} hoverScale={1.05}>
                <motion.button
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group w-full sm:w-auto"
                >
                  Start Analytics Free
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Analytics Dashboard</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Interactive Chart Area */}
                <div className="h-48 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-green-50/40 dark:from-gray-700/90 dark:via-emerald-900/20 dark:to-gray-600/80 rounded-xl mb-4 relative overflow-hidden border border-emerald-100/50 dark:border-gray-600/50">
                  {/* Grid Background Pattern */}
                  <div className="absolute inset-0">
                    {/* Grid Lines */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path 
                            d="M 20 0 L 0 0 0 20" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="0.5"
                            className="text-emerald-300/30 dark:text-emerald-500/20"
                          />
                        </pattern>
                        <pattern id="majorGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                          <path 
                            d="M 60 0 L 0 0 0 60" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="0.8"
                            className="text-emerald-400/40 dark:text-emerald-400/30"
                          />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
                      <rect x="0" y="0" width="100%" height="100%" fill="url(#majorGrid)" />
                    </svg>
                    
                    {/* Chart Labels and Axis */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Y-axis labels */}
                      <div className="absolute left-2 top-4 text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono">100%</div>
                      <div className="absolute left-2 top-1/2 text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono">50%</div>
                      <div className="absolute left-2 bottom-4 text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono">0%</div>
                      
                      {/* X-axis labels */}
                      <div className="absolute bottom-1 left-8 text-xs text-teal-600/70 dark:text-teal-400/70 font-mono">Q1</div>
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-teal-600/70 dark:text-teal-400/70 font-mono">Q2</div>
                      <div className="absolute bottom-1 right-8 text-xs text-teal-600/70 dark:text-teal-400/70 font-mono">Q3</div>
                    </div>
                    
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 dark:from-gray-900/20 dark:via-transparent dark:to-gray-800/10" />
                  </div>
                  
                  {/* Animated Bar Chart */}
                  <div className="absolute inset-4 flex items-end justify-center space-x-3">
                    {[65, 45, 80, 60, 90, 75, 85].map((height, index) => (
                      <div key={index} className="relative group">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ 
                            height: `${height}%`, 
                            opacity: 1,
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ 
                            duration: 1.8, 
                            delay: 0.6 + index * 0.15,
                            ease: "easeOut"
                          }}
                          whileHover={{ 
                            scale: 1.1,
                            filter: "brightness(1.2)"
                          }}
                          className={`w-9 rounded-t-lg relative overflow-hidden shadow-lg ${
                            index % 3 === 0 ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400' :
                            index % 3 === 1 ? 'bg-gradient-to-t from-teal-600 via-teal-500 to-teal-400' : 
                            'bg-gradient-to-t from-green-600 via-green-500 to-green-400'
                          }`}
                        >
                          {/* Shimmer effect */}
                          <motion.div
                            animate={{ 
                              x: [-100, 100],
                              opacity: [0, 0.8, 0]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              delay: 1 + index * 0.2
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                          />
                          {/* Data value tooltip */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: -5 }}
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm"
                          >
                            {height}%
                          </motion.div>
                        </motion.div>
                        {/* Glow effect */}
                        <motion.div
                          animate={{ opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                          className={`absolute bottom-0 left-0 right-0 h-2 blur-sm ${
                            index % 3 === 0 ? 'bg-emerald-400/30' :
                            index % 3 === 1 ? 'bg-teal-400/30' : 'bg-green-400/30'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Enhanced Trend Line */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 180">
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#06d6a0" stopOpacity="1"/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <motion.path
                      d="M20,120 Q60,80 100,90 T180,70 T260,50"
                      stroke="url(#trendGradient)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2.5, delay: 1.5 }}
                    />
                    {/* Enhanced data points */}
                    {[
                      { x: 20, y: 120 }, { x: 60, y: 90 }, { x: 100, y: 95 },
                      { x: 140, y: 75 }, { x: 180, y: 70 }, { x: 220, y: 60 }, { x: 260, y: 50 }
                    ].map((point, index) => (
                      <motion.g key={index}>
                        <motion.circle
                          cx={point.x}
                          cy={point.y}
                          r="6"
                          fill="url(#trendGradient)"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: [0, 1.2, 1], 
                            opacity: 1 
                          }}
                          transition={{ 
                            delay: 1.8 + index * 0.15,
                            duration: 0.6 
                          }}
                          className="drop-shadow-lg"
                        />
                        <motion.circle
                          cx={point.x}
                          cy={point.y}
                          r="3"
                          fill="white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 2.0 + index * 0.15 }}
                        />
                        {/* Pulsing ring */}
                        <motion.circle
                          cx={point.x}
                          cy={point.y}
                          r="8"
                          stroke="#10b981"
                          strokeWidth="2"
                          fill="none"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.8, 0, 0.8]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            delay: 2.2 + index * 0.2
                          }}
                        />
                      </motion.g>
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
                    <div className="text-2xl font-bold text-emerald-600">
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
                    <div className="text-2xl font-bold text-teal-600">
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
                    <div className="text-2xl font-bold text-green-600">
                      {platformStats ? `${platformStats.avgProcessingTime}s` : '2.1s'}
                    </div>
                    <div className="text-xs text-gray-500">Process Time</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating Chart Elements */}
              <motion.div
                animate={{ 
                  y: [-8, 8, -8],
                  rotate: [0, 3, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -top-6 -left-6 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-emerald-300/30"
                style={{
                  boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15), 0 0 20px rgba(16, 185, 129, 0.1)'
                }}
              >
                <div className="relative">
                  <BarChart3 className="w-7 h-7 text-white drop-shadow-lg" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-1 bg-white/20 rounded-lg"
                  />
                </div>
                {/* Floating particles */}
                <motion.div
                  animate={{ y: [-2, -8, -2], opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-2 left-1/2 w-1 h-1 bg-white/60 rounded-full"
                />
                <motion.div
                  animate={{ y: [-1, -6, -1], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
                  className="absolute -top-1 right-2 w-0.5 h-0.5 bg-white/40 rounded-full"
                />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [8, -8, 8],
                  rotate: [0, -3, 0],
                  scale: [1, 1.08, 1]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute -top-6 -right-6 bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 p-4 rounded-2xl shadow-2xl backdrop-blur-sm border border-teal-300/30"
                style={{
                  boxShadow: '0 20px 40px rgba(20, 184, 166, 0.15), 0 0 20px rgba(20, 184, 166, 0.1)'
                }}
              >
                <div className="relative">
                  <TrendingUp className="w-7 h-7 text-white drop-shadow-lg" />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1], 
                      opacity: [0.3, 0.7, 0.3],
                      rotate: [0, 180, 360] 
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/30 rounded-lg"
                  />
                </div>
                {/* Data visualization dots */}
                <motion.div
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  className="absolute -top-3 -right-1 w-2 h-2 bg-cyan-300 rounded-full"
                />
                <motion.div
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 1.5 }}
                  className="absolute -bottom-1 -left-2 w-1.5 h-1.5 bg-white/70 rounded-full"
                />
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
                className="absolute -bottom-4 -right-4 bg-gradient-to-r from-emerald-400 to-teal-500 p-3 rounded-xl shadow-lg"
              >
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            
            {/* Enhanced Mini Charts */}
            <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-xl p-4 border border-gray-200/50 dark:border-gray-700/50 w-32 h-24 backdrop-blur-md"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 0 10px rgba(16, 185, 129, 0.05)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Revenue</div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                </div>
                <div className="flex items-end space-x-1.5 h-10">
                  {[40, 60, 80, 45, 70, 85].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: `${height}%`, 
                        opacity: 1,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        delay: 2.7 + index * 0.1,
                        duration: 0.8 
                      }}
                      whileHover={{ scale: 1.2, brightness: 1.2 }}
                      className="bg-gradient-to-t from-green-500 via-green-400 to-green-300 w-2.5 rounded-t-lg shadow-sm relative overflow-hidden"
                    >
                      <motion.div
                        animate={{ y: [-20, 20] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                        className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent"
                      />
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -inset-0.5 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-2xl blur-sm -z-10"
                />
              </motion.div>
            </div>
            
            <div className="absolute -left-10 top-1/4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 3.0, duration: 0.8 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-xl p-4 border border-gray-200/50 dark:border-gray-700/50 w-32 h-24 backdrop-blur-md"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 0 10px rgba(139, 92, 246, 0.05)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Growth</div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  />
                </div>
                <div className="relative h-10">
                  <svg className="w-full h-full" viewBox="0 0 120 40">
                    <defs>
                      <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="#A855F7" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#C084FC" stopOpacity="1"/>
                      </linearGradient>
                      <filter id="miniGlow">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <motion.path
                      d="M5,30 Q25,20 45,22 T85,12 T115,8"
                      stroke="url(#growthGradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      filter="url(#miniGlow)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 3.2 }}
                    />
                    {/* Data points */}
                    {[
                      { x: 5, y: 30 }, { x: 25, y: 22 }, { x: 45, y: 24 },
                      { x: 65, y: 16 }, { x: 85, y: 12 }, { x: 115, y: 8 }
                    ].map((point, index) => (
                      <motion.circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="2.5"
                        fill="url(#growthGradient)"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ delay: 3.4 + index * 0.1 }}
                      />
                    ))}
                  </svg>
                </div>
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -inset-0.5 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-2xl blur-sm -z-10"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
