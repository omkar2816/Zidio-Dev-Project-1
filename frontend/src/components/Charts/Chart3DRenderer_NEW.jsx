import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Settings, 
  Download, 
  Palette,
  Play,
  Pause,
  Eye,
  Move3D,
  Layers,
  Maximize2,
  Edit3,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Chart3DRenderer = ({ 
  data = [], 
  type = 'scatter3d', 
  title = '3D Chart',
  xAxis = 'x',
  yAxis = 'y',
  zAxis = 'z',
  colorScheme = 'emerald',
  onColorSchemeChange = null,
  className = '',
  showControls = true,
  autoRotate = false,
  onEdit = null,
  onDuplicate = null,
  onRemove = null,
  // New extreme performance mode props
  extremePerformanceMode = false,
  performanceLevel = 'normal',
  dataSize = null,
  optimizations = null
}) => {
  const plotRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({
    eye: { x: 1.5, y: 1.5, z: 1.5 },
    center: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 0, z: 1 }
  });

  // Theme detection for dynamic canvas colors
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Detect initial theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  // Performance optimization based on data size
  const getPerformanceOptimizations = () => {
    const dataLength = data.length;
    
    if (extremePerformanceMode || performanceLevel === 'extreme' || performanceLevel === 'ultra') {
      return {
        useWebGL: true,
        enableLargeDataOptimization: true,
        maxPointsBeforeSampling: 50000,
        samplingFactor: dataLength > 50000 ? 0.5 : 1,
        renderMode: 'webgl',
        animationDuration: 200,
        useScatterGL: type === 'scatter3d'
      };
    } else if (performanceLevel === 'optimized' || dataLength > 5000) {
      return {
        useWebGL: true,
        enableLargeDataOptimization: true,
        maxPointsBeforeSampling: 10000,
        samplingFactor: dataLength > 10000 ? 0.7 : 1,
        renderMode: 'webgl',
        animationDuration: 500,
        useScatterGL: type === 'scatter3d'
      };
    }
    
    return {
      useWebGL: false,
      enableLargeDataOptimization: false,
      maxPointsBeforeSampling: Infinity,
      samplingFactor: 1,
      renderMode: 'svg',
      animationDuration: 750,
      useScatterGL: false
    };
  };

  const performanceOpts = getPerformanceOptimizations();

  // Enhanced emerald color palette with vibrant colors
  const colorPalettes = {
    emerald: {
      primary: '#059669',
      gradient: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'],
      surface: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669'],
      accent: '#f59e0b'
    },
    ocean: {
      primary: '#0284c7',
      gradient: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'],
      surface: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
      accent: '#f97316'
    },
    sunset: {
      primary: '#dc2626',
      gradient: ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5'],
      surface: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626'],
      accent: '#eab308'
    },
    cosmic: {
      primary: '#7c3aed',
      gradient: ['#4c1d95', '#5b21b6', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
      surface: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed'],
      accent: '#10b981'
    }
  };

  const currentPalette = colorPalettes[colorScheme] || colorPalettes.emerald;

  // Process data for better visualization
  const processedData = data.map((item, index) => ({
    x: item[xAxis] || index,
    y: item[yAxis] || Math.random() * 100,
    z: item[zAxis] || Math.random() * 100,
    label: `${xAxis}: ${item[xAxis]}, ${yAxis}: ${item[yAxis]}, ${zAxis}: ${item[zAxis]}`,
    index
  }));

  // Apply performance sampling if needed
  const finalData = performanceOpts.samplingFactor < 1 
    ? processedData.filter((_, index) => index % Math.ceil(1 / performanceOpts.samplingFactor) === 0)
    : processedData;

  // Get plot data based on chart type
  const getPlotData = () => {
    switch (type) {
      case 'scatter3d':
        return [{
          x: finalData.map(d => d.x),
          y: finalData.map(d => d.y),
          z: finalData.map(d => d.z),
          type: performanceOpts.useScatterGL ? 'scattergl' : 'scatter3d',
          mode: 'markers',
          marker: {
            size: 6,
            color: finalData.map(d => d.z),
            colorscale: currentPalette.gradient.map((color, i) => [i / (currentPalette.gradient.length - 1), color]),
            opacity: 0.8,
            line: {
              color: currentPalette.primary,
              width: 1
            }
          },
          text: finalData.map(d => d.label),
          hovertemplate: '%{text}<extra></extra>',
          name: title
        }];

      case 'surface3d':
        // Create surface data from scatter points
        const gridSize = Math.ceil(Math.sqrt(finalData.length));
        const zGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        
        finalData.forEach((point, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          if (row < gridSize && col < gridSize) {
            zGrid[row][col] = point.z;
          }
        });

        return [{
          z: zGrid,
          type: 'surface',
          colorscale: currentPalette.gradient.map((color, i) => [i / (currentPalette.gradient.length - 1), color]),
          opacity: 0.9,
          lighting: {
            ambient: 0.4,
            diffuse: 0.6,
            fresnel: 0.2,
            specular: 1.0,
            roughness: 0.2
          },
          name: title
        }];

      case 'mesh3d':
        return [{
          x: finalData.map(d => d.x),
          y: finalData.map(d => d.y),
          z: finalData.map(d => d.z),
          type: 'mesh3d',
          alphahull: 5,
          opacity: 0.7,
          color: currentPalette.primary,
          lighting: {
            ambient: 0.3,
            diffuse: 0.8,
            fresnel: 0.1,
            specular: 1.0,
            roughness: 0.1
          },
          name: title
        }];

      case 'bar3d':
        return [{
          x: finalData.map(d => d.x),
          y: finalData.map(d => d.y),
          z: finalData.map(d => d.z),
          type: 'scatter3d',
          mode: 'markers',
          marker: {
            size: finalData.map(d => Math.max(8, Math.abs(d.z) * 2 + 5)),
            color: finalData.map(d => d.z),
            colorscale: currentPalette.gradient.map((color, i) => [i / (currentPalette.gradient.length - 1), color]),
            symbol: 'square',
            opacity: 0.8,
            line: {
              color: currentPalette.primary,
              width: 1
            }
          },
          text: finalData.map(d => `${d.label}<br>Value: ${d.z}`),
          hovertemplate: '%{text}<extra></extra>',
          name: title
        }];

      default:
        return getPlotData(); // Default to scatter3d
    }
  };

  // Enhanced layout with theme-aware styling and responsive design
  const getLayout = () => {
    const theme = {
      light: {
        background: 'rgba(255, 255, 255, 0.95)',
        paper: 'rgba(255, 255, 255, 0)',
        text: '#1f2937',
        secondary: '#374151',
        grid: '#e5e7eb',
        line: '#d1d5db',
        tick: '#6b7280',
        annotation: '#9ca3af'
      },
      dark: {
        background: 'rgba(17, 24, 39, 0.95)',
        paper: 'rgba(17, 24, 39, 0)',
        text: '#f9fafb',
        secondary: '#e5e7eb',
        grid: '#374151',
        line: '#4b5563',
        tick: '#9ca3af',
        annotation: '#6b7280'
      }
    };
    
    const currentTheme = isDarkMode ? theme.dark : theme.light;
    
    return {
      title: {
        text: title,
        font: { 
          family: 'Inter, system-ui, sans-serif',
          size: 18, 
          color: currentTheme.text,
          weight: 600
        },
        x: 0.5,
        y: 0.95
      },
      scene: {
        camera: {
          eye: camera.eye,
          center: camera.center,
          up: camera.up
        },
        xaxis: {
          title: { 
            text: xAxis, 
            font: { color: currentTheme.secondary, size: 14 } 
          },
          showgrid: true,
          gridcolor: currentTheme.grid,
          showline: true,
          linecolor: currentTheme.line,
          tickfont: { color: currentTheme.tick, size: 11 }
        },
        yaxis: {
          title: { 
            text: yAxis, 
            font: { color: currentTheme.secondary, size: 14 } 
          },
          showgrid: true,
          gridcolor: currentTheme.grid,
          showline: true,
          linecolor: currentTheme.line,
          tickfont: { color: currentTheme.tick, size: 11 }
        },
        zaxis: {
          title: { 
            text: zAxis, 
            font: { color: currentTheme.secondary, size: 14 } 
          },
          showgrid: true,
          gridcolor: currentTheme.grid,
          showline: true,
          linecolor: currentTheme.line,
          tickfont: { color: currentTheme.tick, size: 11 }
        },
        bgcolor: currentTheme.background,
        aspectmode: 'cube'
      },
      paper_bgcolor: currentTheme.paper,
      plot_bgcolor: currentTheme.paper,
      margin: { l: 0, r: 0, t: 40, b: 0 },
      showlegend: true,
      legend: {
        x: 1.02,
        y: 0.5,
        font: { color: currentTheme.secondary, size: 12 }
      },
      autosize: true,
      // Responsive dimensions
      width: undefined, // Let it be responsive
      height: undefined, // Let it be responsive
      annotations: [{
        text: `Interactive 3D ${type.replace('3d', '').replace('3D', '')} visualization${extremePerformanceMode ? ' (Extreme Performance Mode)' : ''}`,
        showarrow: false,
        xref: "paper", yref: "paper",
        x: 0.5, y: -0.1,
        xanchor: 'center', yanchor: 'top',
        font: { color: currentTheme.annotation, size: 10 }
      }]
    };
  };

  // Enhanced config with performance optimizations
  const getConfig = () => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToAdd: [
      {
        name: 'Auto Rotate',
        icon: {
          width: 857.1,
          height: 1000,
          path: 'M857.1 428.6c0-204.8-166.7-371.4-371.4-371.4S114.3 223.8 114.3 428.6 281 800 485.7 800c105.7 0 201.9-44.8 269.7-116.2l-53.9-53.9C651.8 675.2 572.4 708.6 485.7 708.6c-154.3 0-279.8-125.5-279.8-280s125.5-280 279.8-280 279.8 125.5 279.8 280H642.9l120 120 120-120H765.7z'
        },
        click: () => setIsAutoRotating(!isAutoRotating)
      }
    ],
    modeBarButtonsToRemove: ['lasso3d', 'select3d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `3d_chart_${Date.now()}`,
      height: 600, // Reduced for better responsiveness
      width: 900,  // Reduced for better responsiveness
      scale: 2
    },
    responsive: true,
    scrollZoom: true,
    // Performance optimizations
    plotGlPixelRatio: performanceOpts.renderMode === 'webgl' ? 1 : 2,
    useResizeHandler: true,
    autosizable: true,
    // WebGL optimizations for extreme performance mode
    ...(performanceOpts.useWebGL && {
      webglpointthreshold: 1000,
      // Enable hardware acceleration
      useWebGL: true
    })
  });

  const resetView = () => {
    setCamera({
      eye: { x: 1.5, y: 1.5, z: 1.5 },
      center: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 0, z: 1 }
    });
    setZoom(1);
    setRotation({ x: 0, y: 0, z: 0 });
    toast.success('View reset to default');
  };

  const downloadChart = async () => {
    try {
      if (plotRef.current) {
        await plotRef.current.downloadImage({
          format: 'png',
          width: 900,
          height: 600,
          filename: `3d_chart_${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`
        });
        toast.success('Chart downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chart');
    }
  };

  const plotData = getPlotData();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
            <Move3D className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                3D {type.replace('3d', '').toUpperCase()}
              </span>
              {extremePerformanceMode && (
                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full font-medium text-xs">
                  🚀 EXTREME PERFORMANCE
                </span>
              )}
              {performanceLevel && performanceLevel !== 'normal' && !extremePerformanceMode && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium text-xs">
                  ⚡ {performanceLevel.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        {showControls && (
          <div className="flex items-center space-x-2">
            {/* Auto Rotate Button */}
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-2 rounded-lg transition-all ${
                isAutoRotating 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={isAutoRotating ? 'Stop auto rotation' : 'Start auto rotation'}
            >
              {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Reset View */}
            <button
              onClick={resetView}
              className="p-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={downloadChart}
              className="p-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Download chart"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Chart Actions */}
            {(onEdit || onDuplicate || onRemove) && (
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    title="Edit chart"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={onRemove}
                    className="p-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    title="Remove chart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3D Chart */}
      <div className="p-4 max-w-full overflow-hidden">
        <div 
          className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 max-w-full overflow-hidden" 
          style={{ height: extremePerformanceMode ? '600px' : '500px', minHeight: '400px' }}
        >
          {plotData.length > 0 ? (
            <Plot
              ref={plotRef}
              data={plotData}
              layout={getLayout()}
              config={getConfig()}
              style={{ width: '100%', height: '100%', maxWidth: '100%' }}
              useResizeHandler={true}
              onInitialized={() => setIsLoading(false)}
              onUpdate={() => setIsLoading(false)}
              className="plotly-3d-chart max-w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Box className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No 3D data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">Rendering 3D chart...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chart3DRenderer;
