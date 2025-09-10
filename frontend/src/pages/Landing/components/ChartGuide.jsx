import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Upload, 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp,
  Download,
  Settings,
  Palette,
  Share2,
  Eye,
  CheckCircle,
  ArrowRight,
  Play,
  FileDown,
  Database,
  Layers,
  Zap,
  Move3D
} from 'lucide-react';

const ChartGuide = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState('2d');

  const steps2D = [
    {
      id: 1,
      title: "Upload Your Data",
      description: "Start by uploading your Excel file or CSV data",
      icon: <Upload className="w-6 h-6" />,
      details: [
        "Click 'Upload File' button on the dashboard",
        "Select Excel (.xlsx, .xls) or CSV files",
        "Drag and drop files directly into the upload area",
        "Preview your data before proceeding",
        "Verify column headers and data types"
      ],
      tip: "Ensure your data has clear column headers for best results"
    },
    {
      id: 2,
      title: "Choose Chart Type",
      description: "Select from various 2D chart types",
      icon: <BarChart3 className="w-6 h-6" />,
      details: [
        "Bar Chart - Compare categories and values",
        "Line Chart - Show trends over time",
        "Pie Chart - Display proportions and percentages",
        "Area Chart - Visualize cumulative data",
        "Scatter Plot - Show relationships between variables"
      ],
      tip: "Choose chart type based on your data story"
    },
    {
      id: 3,
      title: "Configure Settings",
      description: "Customize your chart appearance and behavior",
      icon: <Settings className="w-6 h-6" />,
      details: [
        "Select X and Y axis columns",
        "Choose color schemes and themes",
        "Set chart title and axis labels",
        "Configure data ranges and filters",
        "Add annotations and legends"
      ],
      tip: "Use color coding to highlight important data points"
    },
    {
      id: 4,
      title: "Generate Chart",
      description: "Create your interactive visualization",
      icon: <TrendingUp className="w-6 h-6" />,
      details: [
        "Click 'Generate Chart' to create visualization",
        "Real-time rendering with interactive features",
        "Hover tooltips for detailed information",
        "Zoom and pan capabilities",
        "Responsive design for all devices"
      ],
      tip: "Charts are automatically optimized for performance"
    },
    {
      id: 5,
      title: "Export & Share",
      description: "Download and share your charts",
      icon: <Download className="w-6 h-6" />,
      details: [
        "Export as PNG, JPEG, or SVG formats",
        "Download PDF reports with embedded charts",
        "Share via direct links",
        "Embed charts in websites or presentations",
        "Save to chart history for future access"
      ],
      tip: "High-resolution exports available for print quality"
    }
  ];

  const steps3D = [
    {
      id: 1,
      title: "Prepare 3D Data",
      description: "Upload data with X, Y, and Z coordinates",
      icon: <Database className="w-6 h-6" />,
      details: [
        "Ensure your data has at least 3 numeric columns",
        "X-axis: Primary category or dimension",
        "Y-axis: Secondary category or time series",
        "Z-axis: Values or measurements",
        "Optional: Color dimension for 4D visualization"
      ],
      tip: "3D charts work best with numerical data across all dimensions"
    },
    {
      id: 2,
      title: "Select 3D Chart Type",
      description: "Choose from advanced 3D visualization options",
      icon: <Move3D className="w-6 h-6" />,
      details: [
        "3D Scatter Plot - Show relationships in 3D space",
        "3D Bar Chart - Compare values across multiple dimensions",
        "3D Surface Plot - Visualize continuous data surfaces",
        "3D Mesh Chart - Display interconnected data points",
        "Performance modes for large datasets"
      ],
      tip: "Use 3D charts to reveal hidden patterns in complex data"
    },
    {
      id: 3,
      title: "Configure 3D Settings",
      description: "Customize 3D visualization parameters",
      icon: <Layers className="w-6 h-6" />,
      details: [
        "Map data columns to X, Y, Z axes",
        "Choose color gradients and lighting",
        "Set camera angles and perspective",
        "Configure auto-rotation and animation",
        "Adjust performance optimization levels"
      ],
      tip: "Auto-rotation helps viewers understand 3D structure"
    },
    {
      id: 4,
      title: "Generate 3D Chart",
      description: "Create immersive 3D visualizations",
      icon: <Zap className="w-6 h-6" />,
      details: [
        "WebGL-powered rendering for smooth performance",
        "Interactive rotation with mouse/touch controls",
        "Zoom and pan in 3D space",
        "Enhanced tooltips with embedded controls",
        "Extreme performance mode for large datasets"
      ],
      tip: "Use performance modes for datasets with 10,000+ points"
    },
    {
      id: 5,
      title: "Export 3D Charts",
      description: "Save and share 3D visualizations",
      icon: <FileDown className="w-6 h-6" />,
      details: [
        "Export high-resolution 3D images",
        "Save interactive HTML files",
        "Download as WebGL-compatible formats",
        "Share 3D charts with rotation controls",
        "Embed in presentations and websites"
      ],
      tip: "3D exports maintain interactivity when shared as HTML"
    }
  ];

  const currentSteps = activeTab === '2d' ? steps2D : steps3D;

  const chartTypes2D = [
    { name: "Bar Chart", icon: <BarChart3 className="w-5 h-5" />, color: "bg-blue-500" },
    { name: "Line Chart", icon: <LineChart className="w-5 h-5" />, color: "bg-green-500" },
    { name: "Pie Chart", icon: <PieChart className="w-5 h-5" />, color: "bg-purple-500" },
    { name: "Area Chart", icon: <TrendingUp className="w-5 h-5" />, color: "bg-orange-500" }
  ];

  const chartTypes3D = [
    { name: "3D Scatter", icon: <Move3D className="w-5 h-5" />, color: "bg-emerald-500" },
    { name: "3D Bars", icon: <BarChart3 className="w-5 h-5" />, color: "bg-cyan-500" },
    { name: "3D Surface", icon: <Layers className="w-5 h-5" />, color: "bg-indigo-500" },
    { name: "3D Mesh", icon: <Zap className="w-5 h-5" />, color: "bg-pink-500" }
  ];

  const currentChartTypes = activeTab === '2d' ? chartTypes2D : chartTypes3D;

  return (
    <section id="chart-guide" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Complete Chart Guide
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Follow our comprehensive step-by-step guide to create stunning 2D and 3D visualizations from your data
          </p>
        </motion.div>

        {/* Chart Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('2d')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === '2d'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline-block mr-2" />
              2D Charts
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ml-2 ${
                activeTab === '3d'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Move3D className="w-5 h-5 inline-block mr-2" />
              3D Charts
            </button>
          </div>
        </motion.div>

        {/* Chart Types Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Available {activeTab === '2d' ? '2D' : '3D'} Chart Types
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {currentChartTypes.map((chart, index) => (
              <motion.div
                key={chart.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className={`${chart.color} rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white`}>
                  {chart.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{chart.name}</h4>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step-by-Step Guide */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Steps Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {activeTab === '2d' ? '2D Chart' : '3D Chart'} Process
              </h3>
              <div className="space-y-4">
                {currentSteps.map((step, index) => (
                  <motion.button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                      activeStep === index
                        ? `${activeTab === '2d' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600'}`
                        : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activeStep === index
                          ? `${activeTab === '2d' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {step.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Step {step.id}
                        </div>
                        <div className={`text-sm ${
                          activeStep === index 
                            ? `${activeTab === '2d' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Step Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${activeStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-lg ${
                    activeTab === '2d' ? 'bg-blue-600' : 'bg-emerald-600'
                  } text-white`}>
                    {currentSteps[activeStep].icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentSteps[activeStep].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {currentSteps[activeStep].description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {currentSteps[activeStep].details.map((detail, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <CheckCircle className={`w-5 h-5 mt-0.5 ${
                        activeTab === '2d' ? 'text-blue-600' : 'text-emerald-600'
                      }`} />
                      <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                    </motion.div>
                  ))}
                </div>

                <div className={`p-4 rounded-lg ${
                  activeTab === '2d' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' 
                    : 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activeTab === '2d' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">Pro Tip</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {currentSteps[activeStep].tip}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setActiveStep(Math.min(currentSteps.length - 1, activeStep + 1))}
                    disabled={activeStep === currentSteps.length - 1}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeTab === '2d' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Ready to Create Your Charts?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start with 2D Charts</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Move3D className="w-5 h-5" />
              <span>Try 3D Visualizations</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChartGuide;
