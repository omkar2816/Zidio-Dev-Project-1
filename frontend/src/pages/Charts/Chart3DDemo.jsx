import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart3DRenderer from '../../components/Charts/Chart3DRenderer';
import { 
  Box, 
  Layers, 
  Cpu, 
  Zap,
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
  Download,
  Settings,
  Eye,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Chart3DDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('scatter3d');
  const [isLoading, setIsLoading] = useState(true);
  const [colorScheme, setColorScheme] = useState('emerald');

  // Sample data sets for different 3D chart types
  const generateSampleData = (type, count = 50) => {
    const data = [];
    
    switch (type) {
      case 'scatter3d':
        for (let i = 0; i < count; i++) {
          data.push({
            x: Math.random() * 20 - 10,
            y: Math.random() * 20 - 10,
            z: Math.random() * 20 - 10,
            value: Math.random() * 100,
            label: `Data Point ${i + 1}`
          });
        }
        break;

      case 'surface3d':
        for (let i = -5; i <= 5; i += 0.5) {
          for (let j = -5; j <= 5; j += 0.5) {
            data.push({
              x: i,
              y: j,
              z: Math.sin(Math.sqrt(i * i + j * j)) * 5,
              value: Math.sin(Math.sqrt(i * i + j * j)) * 5,
              label: `Surface (${i.toFixed(1)}, ${j.toFixed(1)})`
            });
          }
        }
        break;

      case 'mesh3d':
        for (let i = 0; i < count; i++) {
          const theta = (i / count) * Math.PI * 4;
          const phi = (i / count) * Math.PI * 2;
          data.push({
            x: Math.cos(theta) * Math.sin(phi) * 5,
            y: Math.sin(theta) * Math.sin(phi) * 5,
            z: Math.cos(phi) * 5,
            value: Math.sin(theta * 2) * Math.cos(phi * 2) * 10,
            label: `Mesh Point ${i + 1}`
          });
        }
        break;

      case 'bar3d':
        const categories = ['Tech', 'Finance', 'Healthcare', 'Education', 'Retail'];
        const regions = ['North', 'South', 'East', 'West'];
        categories.forEach((cat, i) => {
          regions.forEach((region, j) => {
            data.push({
              x: i,
              y: j,
              z: Math.random() * 100 + 20,
              value: Math.random() * 100 + 20,
              label: `${cat} - ${region}`,
              category: cat,
              region: region
            });
          });
        });
        break;

      default:
        return generateSampleData('scatter3d', count);
    }
    
    return data;
  };

  const demoConfigs = {
    scatter3d: {
      title: '3D Scatter Plot',
      description: 'Interactive 3D scatter visualization with customizable points and smooth animations',
      icon: Box,
      data: generateSampleData('scatter3d', 75),
      type: 'scatter3d',
      xAxis: 'x',
      yAxis: 'y',
      zAxis: 'z'
    },
    surface3d: {
      title: '3D Surface Plot',
      description: 'Beautiful 3D surface with mathematical functions and gradient coloring',
      icon: Layers,
      data: generateSampleData('surface3d'),
      type: 'surface3d',
      xAxis: 'x',
      yAxis: 'y',
      zAxis: 'z'
    },
    mesh3d: {
      title: '3D Mesh Visualization',
      description: 'Advanced 3D mesh with alpha hull and dynamic lighting effects',
      icon: Cpu,
      data: generateSampleData('mesh3d', 100),
      type: 'mesh3d',
      xAxis: 'x',
      yAxis: 'y',
      zAxis: 'z'
    },
    bar3d: {
      title: '3D Bar Chart',
      description: 'Multi-dimensional bar chart with categorical data visualization',
      icon: BarChart3,
      data: generateSampleData('bar3d'),
      type: 'bar3d',
      xAxis: 'x',
      yAxis: 'y',
      zAxis: 'z'
    }
  };

  useEffect(() => {
    // Simulate loading time for demo effect
    const timer = setTimeout(() => {
      setIsLoading(false);
      toast.success('3D Chart Demo loaded successfully!');
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedDemo]);

  const currentDemo = demoConfigs[selectedDemo];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  to="/charts"
                  className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-lg"
                    >
                      <Box className="w-6 h-6 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      3D Chart Showcase
                    </h1>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-full"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </motion.div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Experience next-generation 3D data visualization with smooth animations and interactive controls
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">WebGL Accelerated</span>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700"
                >
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Interactive View</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Demo Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(demoConfigs).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedDemo === key;
                
                return (
                  <motion.button
                    key={key}
                    onClick={() => {
                      setSelectedDemo(key);
                      setIsLoading(true);
                    }}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-300 dark:border-emerald-600 shadow-lg'
                        : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-md'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className={`font-semibold ${
                        isSelected 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {config.title}
                      </h3>
                    </div>
                    <p className={`text-sm text-left ${
                      isSelected 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {config.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Color Scheme Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Color Themes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred color palette</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {['emerald', 'ocean', 'sunset', 'cosmic'].map(scheme => (
                    <motion.button
                      key={scheme}
                      onClick={() => setColorScheme(scheme)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        colorScheme === scheme
                          ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-sm font-medium capitalize">{scheme}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3D Chart Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <Chart3DRenderer
              data={currentDemo.data}
              type={currentDemo.type}
              title={currentDemo.title}
              xAxis={currentDemo.xAxis}
              yAxis={currentDemo.yAxis}
              zAxis={currentDemo.zAxis}
              colorScheme={colorScheme}
              onColorSchemeChange={setColorScheme}
              showControls={true}
              autoRotate={false}
            />
          </motion.div>

          {/* Features Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Play,
                title: 'Auto Rotation',
                description: 'Smooth automatic rotation with customizable speed and direction controls'
              },
              {
                icon: Settings,
                title: 'Interactive Controls',
                description: 'Full camera control with zoom, pan, and rotation for detailed exploration'
              },
              {
                icon: Download,
                title: 'Export Ready',
                description: 'High-quality PNG export with customizable dimensions and resolutions'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Technical Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/10 dark:to-blue-900/10 rounded-xl border border-emerald-200 dark:border-emerald-700 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Powered by Advanced Technology
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rendering Engine</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• WebGL-accelerated graphics</li>
                  <li>• Hardware-optimized performance</li>
                  <li>• Smooth 60fps animations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Interactive Features</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Multi-touch gesture support</li>
                  <li>• Real-time camera controls</li>
                  <li>• Dynamic lighting effects</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Chart3DDemo;
