import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { save3DChartToHistory } from '../../store/slices/analyticsSlice';
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
  Trash2,
  Save,
  Search,
  Target,
  Waves,
  Mountain,
  Link,
  Globe,
  BarChart3,
  Lightbulb,
  RotateCw,
  HardDrive,
  Rocket,
  Zap,
  Flame,
  Gem
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
  optimizations = null,
  // Chart saving props
  onSave = null,
  enableSave = true
}) => {
  const dispatch = useDispatch();
  const plotRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({
    eye: type === 'bar3d' 
      ? { x: 2.0, y: 2.0, z: 1.8 } // Better angle for viewing 3D bars
      : { x: 1.5, y: 1.5, z: 1.5 },
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

  // Enhanced performance optimization based on data size with progressive loading
  const getPerformanceOptimizations = () => {
    const dataLength = data.length;
    
    console.log(`Chart3D Performance: Optimizing for ${dataLength} data points`);
    
    // Ultra performance for massive datasets (100k+)
    if (dataLength > 100000 || extremePerformanceMode || performanceLevel === 'ultra') {
      console.log('Using ULTRA performance mode');
      return {
        useWebGL: true,
        enableLargeDataOptimization: true,
        maxPointsBeforeSampling: 25000,
        samplingFactor: 0.25, // Show only 25% of data
        renderMode: 'webgl',
        animationDuration: 100,
        useScatterGL: true,
        enableProgressiveLoading: true,
        chunkSize: 5000,
        loadDelay: 50,
        enableDataAggregation: true,
        aggregationThreshold: 50000,
        enableLOD: true, // Level of Detail
        maxRenderPoints: 25000
      };
    }
    // Extreme performance for very large datasets (50k-100k)
    else if (dataLength > 50000 || performanceLevel === 'extreme') {
      console.log('Using EXTREME performance mode');
      return {
        useWebGL: true,
        enableLargeDataOptimization: true,
        maxPointsBeforeSampling: 35000,
        samplingFactor: 0.4, // Show 40% of data
        renderMode: 'webgl',
        animationDuration: 150,
        useScatterGL: type === 'scatter3d',
        enableProgressiveLoading: true,
        chunkSize: 7500,
        loadDelay: 100,
        enableDataAggregation: true,
        aggregationThreshold: 35000,
        enableLOD: true,
        maxRenderPoints: 35000
      };
    }
    // High performance for large datasets (10k-50k)
    else if (dataLength > 10000 || performanceLevel === 'optimized') {
      console.log('Using HIGH performance mode');
      return {
        useWebGL: true,
        enableLargeDataOptimization: true,
        maxPointsBeforeSampling: 15000,
        samplingFactor: dataLength > 25000 ? 0.6 : 0.8,
        renderMode: 'webgl',
        animationDuration: 300,
        useScatterGL: type === 'scatter3d',
        enableProgressiveLoading: dataLength > 20000,
        chunkSize: 5000,
        loadDelay: 150,
        enableDataAggregation: dataLength > 20000,
        aggregationThreshold: 20000,
        enableLOD: false,
        maxRenderPoints: 15000
      };
    }
    // Standard performance for medium datasets (5k-10k)
    else if (dataLength > 5000) {
      console.log('Using STANDARD performance mode');
      return {
        useWebGL: dataLength > 7500,
        enableLargeDataOptimization: true,
        maxPointsBeforeSampling: 10000,
        samplingFactor: 1,
        renderMode: dataLength > 7500 ? 'webgl' : 'svg',
        animationDuration: 500,
        useScatterGL: false,
        enableProgressiveLoading: false,
        chunkSize: 0,
        loadDelay: 0,
        enableDataAggregation: false,
        aggregationThreshold: Infinity,
        enableLOD: false,
        maxRenderPoints: 10000
      };
    }
    
    // Default performance for small datasets (<5k)
    console.log('Using DEFAULT performance mode');
    return {
      useWebGL: false,
      enableLargeDataOptimization: false,
      maxPointsBeforeSampling: Infinity,
      samplingFactor: 1,
      renderMode: 'svg',
      animationDuration: 750,
      useScatterGL: false,
      enableProgressiveLoading: false,
      chunkSize: 0,
      loadDelay: 0,
      enableDataAggregation: false,
      aggregationThreshold: Infinity,
      enableLOD: false,
      maxRenderPoints: Infinity
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

  // Smart data aggregation for large datasets
  const aggregateData = (rawData, threshold) => {
    if (rawData.length <= threshold) return rawData;
    
    console.log(`Aggregating ${rawData.length} points to improve performance`);
    
    // Group similar data points and create aggregated points
    const aggregated = [];
    const gridSize = Math.ceil(Math.sqrt(threshold)); // Create a grid for aggregation
    const xRange = { min: Infinity, max: -Infinity };
    const yRange = { min: Infinity, max: -Infinity };
    const zRange = { min: Infinity, max: -Infinity };
    
    // Find data ranges
    rawData.forEach(item => {
      const x = Number(item[xAxis]) || 0;
      const y = Number(item[yAxis]) || 0;
      const z = Number(item[zAxis]) || 0;
      xRange.min = Math.min(xRange.min, x);
      xRange.max = Math.max(xRange.max, x);
      yRange.min = Math.min(yRange.min, y);
      yRange.max = Math.max(yRange.max, y);
      zRange.min = Math.min(zRange.min, z);
      zRange.max = Math.max(zRange.max, z);
    });
    
    const xStep = (xRange.max - xRange.min) / gridSize;
    const yStep = (yRange.max - yRange.min) / gridSize;
    const zStep = (zRange.max - zRange.min) / gridSize;
    
    // Create grid buckets
    const buckets = new Map();
    
    rawData.forEach(item => {
      const x = Number(item[xAxis]) || 0;
      const y = Number(item[yAxis]) || 0;
      const z = Number(item[zAxis]) || 0;
      
      const xBucket = Math.floor((x - xRange.min) / xStep);
      const yBucket = Math.floor((y - yRange.min) / yStep);
      const zBucket = Math.floor((z - zRange.min) / zStep);
      const key = `${xBucket},${yBucket},${zBucket}`;
      
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(item);
    });
    
    // Create aggregated points from buckets
    buckets.forEach(bucketItems => {
      if (bucketItems.length === 0) return;
      
      // Calculate average values for the bucket
      const avgX = bucketItems.reduce((sum, item) => sum + (Number(item[xAxis]) || 0), 0) / bucketItems.length;
      const avgY = bucketItems.reduce((sum, item) => sum + (Number(item[yAxis]) || 0), 0) / bucketItems.length;
      const avgZ = bucketItems.reduce((sum, item) => sum + (Number(item[zAxis]) || 0), 0) / bucketItems.length;
      
      aggregated.push({
        [xAxis]: avgX,
        [yAxis]: avgY,
        [zAxis]: avgZ,
        _aggregated: true,
        _count: bucketItems.length,
        _originalItems: bucketItems.slice(0, 3) // Keep sample of original items
      });
    });
    
    console.log(`Aggregated to ${aggregated.length} points (${((1 - aggregated.length / rawData.length) * 100).toFixed(1)}% reduction)`);
    return aggregated;
  };

  // Smart sampling for performance
  const sampleData = (data, factor) => {
    if (factor >= 1) return data;
    
    const targetSize = Math.floor(data.length * factor);
    console.log(`Sampling ${data.length} points down to ${targetSize} points`);
    
    // Use systematic sampling to maintain data distribution
    const step = data.length / targetSize;
    const sampled = [];
    
    for (let i = 0; i < targetSize; i++) {
      const index = Math.floor(i * step);
      if (index < data.length) {
        sampled.push(data[index]);
      }
    }
    
    console.log(`Sampled to ${sampled.length} points`);
    return sampled;
  };

  // Process data with performance optimizations
  let workingData = data;
  
  // Apply aggregation if enabled
  if (performanceOpts.enableDataAggregation && data.length > performanceOpts.aggregationThreshold) {
    workingData = aggregateData(data, performanceOpts.maxRenderPoints);
  }
  
  // Apply sampling if needed
  if (performanceOpts.samplingFactor < 1) {
    workingData = sampleData(workingData, performanceOpts.samplingFactor);
  }

  // Process data for better visualization
  const processedData = workingData.map((item, index) => {
    let xValue, yValue, zValue;
    
    // For bar3d charts, handle categorical data by converting to indices
    if (type === 'bar3d') {
      // Get unique categorical values for x and y axes
      const uniqueX = [...new Set(data.map(d => d[xAxis]))];
      const uniqueY = [...new Set(data.map(d => d[yAxis]))];
      
      // Convert categorical values to numeric indices
      xValue = typeof item[xAxis] === 'string' 
        ? uniqueX.indexOf(item[xAxis]) 
        : (item[xAxis] || index);
      yValue = typeof item[yAxis] === 'string' 
        ? uniqueY.indexOf(item[yAxis]) 
        : (item[yAxis] || Math.random() * 100);
      zValue = Number(item[zAxis]) || Math.random() * 100;
    } else {
      // For other chart types, use original logic
      xValue = item[xAxis] || index;
      yValue = item[yAxis] || Math.random() * 100;
      zValue = item[zAxis] || Math.random() * 100;
    }
    
    return {
      x: xValue,
      y: yValue,
      z: zValue,
      originalX: item[xAxis], // Keep original values for display
      originalY: item[yAxis],
      originalZ: item[zAxis],
      label: `${xAxis}: ${item[xAxis]}, ${yAxis}: ${item[yAxis]}, ${zAxis}: ${item[zAxis]}`,
      index
    };
  });

  // Final data is already optimized through aggregation and sampling above
  const finalData = processedData;

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
            size: 8,
            color: finalData.map(d => d.z),
            colorscale: currentPalette.gradient.map((color, i) => [i / (currentPalette.gradient.length - 1), color]),
            opacity: 0.85,
            line: {
              color: isDarkMode ? currentPalette.gradient[2] : currentPalette.primary,
              width: 1.5
            },
            // Enhanced lighting for better visibility
            lighting: {
              ambient: isDarkMode ? 0.5 : 0.4,
              diffuse: 0.7,
              fresnel: 0.2,
              specular: 1.0,
              roughness: 0.2
            }
          },
          text: finalData.map(d => d.label),
          hovertemplate: `<div style="background-color: ${isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; border: 1px solid ${currentPalette.primary}; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); font-family: Inter, system-ui, sans-serif; max-width: 300px;">
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                3D Scatter Point
              </div>
              <div style="display: grid; gap: 4px; font-size: 12px;">
                %{text}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}; font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                3D coordinates in space
              </div>
            </div>
          </div><extra></extra>`,
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
          opacity: isDarkMode ? 0.85 : 0.9,
          lighting: {
            ambient: isDarkMode ? 0.5 : 0.4,
            diffuse: 0.7,
            fresnel: 0.2,
            specular: 1.0,
            roughness: isDarkMode ? 0.15 : 0.2
          },
          contours: {
            z: {
              show: true,
              usecolormap: true,
              highlightcolor: isDarkMode ? "#ffffff" : "#000000",
              project: {z: true}
            }
          },
          hovertemplate: `<div style="background-color: ${isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; border: 1px solid ${currentPalette.primary}; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); font-family: Inter, system-ui, sans-serif; max-width: 300px;">
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                3D Surface Point
              </div>
              <div style="display: grid; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">Position:</span>
                  <span style="font-weight: 600;">(%{x}, %{y})</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">Height:</span>
                  <span style="font-weight: 600; color: ${currentPalette.primary};">%{z}</span>
                </div>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}; font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                Continuous surface visualization
              </div>
            </div>
          </div><extra></extra>`,
          name: title
        }];

      case 'mesh3d':
        return [{
          x: finalData.map(d => d.x),
          y: finalData.map(d => d.y),
          z: finalData.map(d => d.z),
          type: 'mesh3d',
          alphahull: 5,
          opacity: isDarkMode ? 0.75 : 0.7,
          color: isDarkMode ? currentPalette.gradient[3] : currentPalette.primary,
          lighting: {
            ambient: isDarkMode ? 0.4 : 0.3,
            diffuse: 0.8,
            fresnel: 0.1,
            specular: 1.0,
            roughness: isDarkMode ? 0.05 : 0.1
          },
          hovertemplate: `<div style="background-color: ${isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; border: 1px solid ${currentPalette.primary}; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); font-family: Inter, system-ui, sans-serif; max-width: 300px;">
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                3D Mesh Point
              </div>
              <div style="display: grid; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${xAxis}:</span>
                  <span style="font-weight: 600;">%{x}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${yAxis}:</span>
                  <span style="font-weight: 600;">%{y}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${zAxis}:</span>
                  <span style="font-weight: 600; color: ${currentPalette.primary};">%{z}</span>
                </div>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}; font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                Interconnected 3D mesh structure
              </div>
            </div>
          </div><extra></extra>`,
          name: title
        }];

      case 'bar3d':
        // Create proper 3D bar chart using mesh3d traces for each bar
        const barWidth = 0.4;
        const barDepth = 0.4;
        
        // Create individual 3D bars using mesh3d
        const barTraces = finalData.map((point, index) => {
          const x = Number(point.x) || 0;
          const y = Number(point.y) || 0;
          const z = Number(point.z) || 0;
          
          // Create a 3D rectangular bar from base to height
          const barBase = 0; // Start from z=0
          const barHeight = Math.abs(z);
          
          // Define the 8 vertices of a rectangular prism (3D bar)
          const vertices = {
            x: [
              x - barWidth/2, x + barWidth/2, x + barWidth/2, x - barWidth/2, // bottom face
              x - barWidth/2, x + barWidth/2, x + barWidth/2, x - barWidth/2  // top face
            ],
            y: [
              y - barDepth/2, y - barDepth/2, y + barDepth/2, y + barDepth/2, // bottom face
              y - barDepth/2, y - barDepth/2, y + barDepth/2, y + barDepth/2  // top face
            ],
            z: [
              barBase, barBase, barBase, barBase, // bottom face
              z, z, z, z  // top face (actual height)
            ]
          };
          
          // Define the 12 triangular faces (2 triangles per face, 6 faces)
          const faces = [
            [0, 1, 2], [0, 2, 3], // bottom face
            [4, 7, 6], [4, 6, 5], // top face
            [0, 4, 5], [0, 5, 1], // front face
            [2, 6, 7], [2, 7, 3], // back face
            [1, 5, 6], [1, 6, 2], // right face
            [0, 3, 7], [0, 7, 4]  // left face
          ];
          
          // Calculate color based on z value
          const normalizedZ = Math.abs(z) / Math.max(...finalData.map(d => Math.abs(d.z)));
          const colorIndex = Math.floor(normalizedZ * (currentPalette.gradient.length - 1));
          const barColor = currentPalette.gradient[colorIndex] || currentPalette.primary;
          
          return {
            type: 'mesh3d',
            x: vertices.x,
            y: vertices.y,
            z: vertices.z,
            i: faces.map(f => f[0]),
            j: faces.map(f => f[1]),
            k: faces.map(f => f[2]),
            color: barColor,
            opacity: 0.8,
            lighting: {
              ambient: isDarkMode ? 0.4 : 0.3,
              diffuse: 0.8,
              fresnel: 0.1,
              specular: 1.0,
              roughness: 0.1
            },
            hovertemplate: `<div style="background-color: ${isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'}; border: 1px solid ${currentPalette.primary}; border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); font-family: Inter, system-ui, sans-serif; max-width: 300px;">
              <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
                <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                  3D Bar Chart
                </div>
                <div style="display: grid; gap: 4px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${xAxis}:</span>
                    <span style="font-weight: 600;">${point.originalX || point.x}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${yAxis}:</span>
                    <span style="font-weight: 600;">${point.originalY || point.y}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${zAxis}:</span>
                    <span style="font-weight: 600; color: ${currentPalette.primary};">${typeof z === 'number' ? z.toLocaleString() : z}</span>
                  </div>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}; font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                  Click and drag to rotate • Scroll to zoom
                </div>
              </div>
            </div><extra></extra>`,
            name: `Bar ${index + 1}`,
            showlegend: false, // Don't show legend for individual bars
            // Add custom data for hover
            customdata: [[point.x, point.y, z]],
            text: `${xAxis}: ${point.originalX || point.x}, ${yAxis}: ${point.originalY || point.y}, ${zAxis}: ${point.originalZ || z}`
          };
        });
        
        // Add a summary trace for legend
        const summaryTrace = {
          type: 'scatter3d',
          x: [finalData[0]?.x || 0],
          y: [finalData[0]?.y || 0], 
          z: [finalData[0]?.z || 0],
          mode: 'markers',
          marker: {
            size: 0.1,
            color: currentPalette.primary,
            opacity: 0
          },
          name: title,
          showlegend: true,
          hoverinfo: 'skip'
        };
        
        return [...barTraces, summaryTrace];

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
          tickfont: { color: currentTheme.tick, size: 11 },
          // Better spacing for bar charts
          ...(type === 'bar3d' && {
            type: 'category',
            categoryorder: 'trace'
          })
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
          tickfont: { color: currentTheme.tick, size: 11 },
          // Better spacing for bar charts
          ...(type === 'bar3d' && {
            type: 'category',
            categoryorder: 'trace'
          })
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
          tickfont: { color: currentTheme.tick, size: 11 },
          // Start z-axis from 0 for bar charts
          ...(type === 'bar3d' && {
            range: [0, Math.max(...finalData.map(d => Math.abs(d.z))) * 1.1]
          })
        },
        bgcolor: currentTheme.background,
        aspectmode: type === 'bar3d' ? 'manual' : 'cube',
        // Enhanced camera position for better 3D viewing, optimized for bar charts
        aspectratio: type === 'bar3d' 
          ? { x: 1, y: 1, z: 1.2 } // Taller for bars
          : { x: 1, y: 1, z: 0.8 }
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
      // Enhanced responsive dimensions for better viewing
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

  // Enhanced tooltip configuration system for 3D charts
  const get3DTooltipConfig = () => {
    // Common tooltip styling that matches the existing system
    const tooltipStyle = {
      backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: currentPalette.primary,
      borderWidth: 1,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontSize: '12px',
      fontFamily: 'Inter, system-ui, sans-serif',
      maxWidth: '300px'
    };

    // Custom tooltip formatter for 3D data
    const formatTooltipContent = (point, chartType) => {
      const baseInfo = {
        xLabel: xAxis,
        yLabel: yAxis,
        zLabel: zAxis,
        xValue: point.originalX || point.x,
        yValue: point.originalY || point.y,
        zValue: point.originalZ || point.z
      };

      switch (chartType) {
        case 'bar3d':
          return `
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                3D Bar Chart
              </div>
              <div style="display: grid; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.xLabel}:</span>
                  <span style="font-weight: 600;">${baseInfo.xValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.yLabel}:</span>
                  <span style="font-weight: 600;">${baseInfo.yValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.zLabel}:</span>
                  <span style="font-weight: 600; color: ${currentPalette.primary};">${typeof baseInfo.zValue === 'number' ? baseInfo.zValue.toLocaleString() : baseInfo.zValue}</span>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <button 
                    onclick="window.chart3DControls.toggleAutoRotate()" 
                    style="
                      background: ${isAutoRotating ? currentPalette.primary : (isDarkMode ? '#374151' : '#f3f4f6')}; 
                      color: ${isAutoRotating ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#374151')}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.opacity='0.8'"
                    onmouseout="this.style.opacity='1'"
                  >
                    ${isAutoRotating ? '⏸️ Stop' : '▶️ Autoplay'}
                  </button>
                  <button 
                    onclick="window.chart3DControls.resetView()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.opacity='0.8'"
                    onmouseout="this.style.opacity='1'"
                  >
                    Reset
                  </button>
                  ${enableSave ? `
                    <button 
                      onclick="window.chart3DControls.saveChart()" 
                      style="
                        background: ${isDarkMode ? '#059669' : '#10b981'}; 
                        color: #ffffff; 
                        border: none; 
                        border-radius: 6px; 
                        padding: 6px 12px; 
                        font-size: 11px; 
                        cursor: pointer; 
                        font-weight: 500;
                        transition: all 0.2s ease;
                      "
                      onmouseover="this.style.opacity='0.8'"
                      onmouseout="this.style.opacity='1'"
                    >
                      Save
                    </button>
                  ` : ''}
                  <button 
                    onclick="window.chart3DControls.downloadChart()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.opacity='0.8'"
                    onmouseout="this.style.opacity='1'"
                  >
                    📥 Download
                  </button>
                </div>
                <div style="font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                  💡 Click and drag to rotate • Scroll to zoom
                </div>
              </div>
            </div>
          `;
        case 'scatter3d':
          return `
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                🔍 3D Scatter Point
              </div>
              <div style="display: grid; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.xLabel}:</span>
                  <span style="font-weight: 600;">${baseInfo.xValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.yLabel}:</span>
                  <span style="font-weight: 600;">${baseInfo.yValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.zLabel}:</span>
                  <span style="font-weight: 600; color: ${currentPalette.primary};">${typeof baseInfo.zValue === 'number' ? baseInfo.zValue.toLocaleString() : baseInfo.zValue}</span>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <button 
                    onclick="window.chart3DControls.toggleAutoRotate()" 
                    style="
                      background: ${isAutoRotating ? currentPalette.primary : (isDarkMode ? '#374151' : '#f3f4f6')}; 
                      color: ${isAutoRotating ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#374151')}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    ${isAutoRotating ? '⏸️ Stop' : '▶️ Autoplay'}
                  </button>
                  <button 
                    onclick="window.chart3DControls.resetView()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    🔄 Reset
                  </button>
                  ${enableSave ? `
                    <button onclick="window.chart3DControls.saveChart()" 
                      style="background: ${isDarkMode ? '#059669' : '#10b981'}; color: #ffffff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 500;">
                      💾 Save
                    </button>
                  ` : ''}
                  <button 
                    onclick="window.chart3DControls.downloadChart()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    📥 Download
                  </button>
                </div>
                <div style="font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                  🎯 3D coordinates in space
                </div>
              </div>
            </div>
          `;
        case 'surface3d':
          return `
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                🌊 3D Surface Point
              </div>
              <div style="display: grid; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">Position:</span>
                  <span style="font-weight: 600;">(${baseInfo.xValue}, ${baseInfo.yValue})</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">Height:</span>
                  <span style="font-weight: 600; color: ${currentPalette.primary};">${typeof baseInfo.zValue === 'number' ? baseInfo.zValue.toLocaleString() : baseInfo.zValue}</span>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <button 
                    onclick="window.chart3DControls.toggleAutoRotate()" 
                    style="
                      background: ${isAutoRotating ? currentPalette.primary : (isDarkMode ? '#374151' : '#f3f4f6')}; 
                      color: ${isAutoRotating ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#374151')}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    ${isAutoRotating ? '⏸️ Stop' : '▶️ Autoplay'}
                  </button>
                  <button 
                    onclick="window.chart3DControls.resetView()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    🔄 Reset
                  </button>
                  ${enableSave ? `
                    <button onclick="window.chart3DControls.saveChart()" 
                      style="background: ${isDarkMode ? '#059669' : '#10b981'}; color: #ffffff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 500;">
                      💾 Save
                    </button>
                  ` : ''}
                  <button 
                    onclick="window.chart3DControls.downloadChart()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    📥 Download
                  </button>
                </div>
                <div style="font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                  🏔️ Continuous surface visualization
                </div>
              </div>
            </div>
          `;
        case 'mesh3d':
          return `
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                🔗 3D Mesh Point
              </div>
              <div style="display: grid; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.xLabel}:</span>
                  <span style="font-weight: 600;">${baseInfo.xValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.yLabel}:</span>
                  <span style="font-weight: 600;">${baseInfo.yValue}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: ${isDarkMode ? '#d1d5db' : '#6b7280'};">${baseInfo.zLabel}:</span>
                  <span style="font-weight: 600; color: ${currentPalette.primary};">${typeof baseInfo.zValue === 'number' ? baseInfo.zValue.toLocaleString() : baseInfo.zValue}</span>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <button 
                    onclick="window.chart3DControls.toggleAutoRotate()" 
                    style="
                      background: ${isAutoRotating ? currentPalette.primary : (isDarkMode ? '#374151' : '#f3f4f6')}; 
                      color: ${isAutoRotating ? '#ffffff' : (isDarkMode ? '#d1d5db' : '#374151')}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    ${isAutoRotating ? '⏸️ Stop' : '▶️ Autoplay'}
                  </button>
                  <button 
                    onclick="window.chart3DControls.resetView()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    🔄 Reset
                  </button>
                  ${enableSave ? `
                    <button onclick="window.chart3DControls.saveChart()" 
                      style="background: ${isDarkMode ? '#059669' : '#10b981'}; color: #ffffff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 500;">
                      💾 Save
                    </button>
                  ` : ''}
                  <button 
                    onclick="window.chart3DControls.downloadChart()" 
                    style="
                      background: ${isDarkMode ? '#374151' : '#f3f4f6'}; 
                      color: ${isDarkMode ? '#d1d5db' : '#374151'}; 
                      border: none; 
                      border-radius: 6px; 
                      padding: 6px 12px; 
                      font-size: 11px; 
                      cursor: pointer; 
                      font-weight: 500;
                    "
                  >
                    📥 Download
                  </button>
                </div>
                <div style="font-size: 10px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">
                  🌐 Interconnected 3D mesh structure
                </div>
              </div>
            </div>
          `;
        default:
          return `
            <div style="color: ${isDarkMode ? '#f9fafb' : '#374151'};">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${currentPalette.primary};">
                🎲 3D Data Point
              </div>
              <div style="display: grid; gap: 4px;">
                <div>${baseInfo.xLabel}: ${baseInfo.xValue}</div>
                <div>${baseInfo.yLabel}: ${baseInfo.yValue}</div>
                <div>${baseInfo.zLabel}: ${baseInfo.zValue}</div>
              </div>
            </div>
          `;
      }
    };

    return { tooltipStyle, formatTooltipContent };
  };

  const { tooltipStyle, formatTooltipContent } = get3DTooltipConfig();

  // Enhanced config with performance optimizations and integrated tooltip system
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
    modeBarButtonsToRemove: [
      'lasso3d', 
      'select3d', 
      'hoverCompareCartesian', 
      'hoverClosestCartesian',
      'toggleSpikelines',
      'resetCameraDefault3d',
      'resetCameraLastSave3d'
    ],
    toImageButtonOptions: {
      format: 'png',
      filename: `3d_chart_${Date.now()}`,
      height: performanceOpts.useWebGL ? 1200 : 800,
      width: performanceOpts.useWebGL ? 1600 : 1000,
      scale: performanceOpts.useWebGL ? 1.5 : 2
    },
    responsive: true,
    scrollZoom: !performanceOpts.enableLargeDataOptimization, // Disable for large datasets
    doubleClick: performanceOpts.enableLargeDataOptimization ? false : 'reset+autosize',
    // Enhanced performance optimizations based on data size
    plotGlPixelRatio: performanceOpts.renderMode === 'webgl' ? 1 : 2,
    useResizeHandler: true,
    autosizable: true,
    // Advanced WebGL optimizations for large datasets
    ...(performanceOpts.useWebGL && {
      webglpointthreshold: performanceOpts.enableLargeDataOptimization ? 500 : 1000,
      useWebGL: true,
      // Reduce quality for better performance on large datasets
      webglquality: performanceOpts.enableLargeDataOptimization ? 'low' : 'medium',
      webgldepthtest: !performanceOpts.enableLargeDataOptimization, // Disable depth testing for performance
    }),
    // Memory management for large datasets
    ...(performanceOpts.enableLargeDataOptimization && {
      editable: false,
      staticPlot: false,
      showTips: false,
      // Reduce animation quality
      transition: {
        duration: performanceOpts.animationDuration,
        easing: 'linear'
      },
      // Optimize for large datasets
      queueLength: 1,
      // Reduce hover sensitivity for performance
      hovermode: data.length > 50000 ? false : 'closest',
    }),
    // Progressive loading configuration
    ...(performanceOpts.enableProgressiveLoading && {
      frameMargins: 0,
      showAxisDragHandles: false,
      showAxisRangeEntryBoxes: false,
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
          width: 1400, // Increased for better quality to match larger canvas
          height: 1000,  // Increased for better quality to match larger canvas
          filename: `3d_chart_${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`
        });
        toast.success('Chart downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chart');
    }
  };

  const saveChartToHistory = async () => {
    try {
      console.log('🔥 Starting 3D chart save process...');
      console.log('📊 Chart data:', { 
        title, 
        type, 
        originalDataLength: data?.length, 
        processedDataLength: finalData?.length,
        performanceMode: performanceOpts.renderMode,
        xAxis, 
        yAxis, 
        zAxis 
      });
      
      if (onSave) {
        // Use custom save function if provided
        const chartData = {
          id: `3d_chart_${Date.now()}`,
          title,
          type,
          data: data, // Use original data instead of finalData
          colorScheme,
          dataInfo: {
            originalDataPoints: data?.length || 0,
            processedDataPoints: finalData?.length || 0,
            performanceOptimizations: performanceOpts,
            dataReduction: data?.length ? ((data.length - (finalData?.length || 0)) / data.length * 100).toFixed(1) + '%' : '0%'
          },
          chart3DConfig: {
            is3D: true,
            xAxis,
            yAxis,
            zAxis,
            camera: camera,
            extremePerformanceMode,
            performanceLevel,
            renderMode: performanceOpts.renderMode,
            useWebGL: performanceOpts.useWebGL
          }
        };
        await onSave(chartData);
        toast.success('3D Chart saved to history!');
      } else {
        // Use Redux store to save 3D chart
        const chartData = {
          id: `3d_chart_${Date.now()}`,
          title,
          type,
          data: data, // Use original data instead of finalData
          colorScheme,
          dataInfo: {
            originalDataPoints: data?.length || 0,
            processedDataPoints: finalData?.length || 0,
            performanceOptimizations: performanceOpts,
            dataReduction: data?.length ? ((data.length - (finalData?.length || 0)) / data.length * 100).toFixed(1) + '%' : '0%'
          }
        };
        
        const chart3DConfig = {
          is3D: true,
          xAxis,
          yAxis,
          zAxis,
          camera: camera,
          extremePerformanceMode,
          performanceLevel,
          renderMode: performanceOpts.renderMode,
          useWebGL: performanceOpts.useWebGL,
          aggregationUsed: performanceOpts.enableDataAggregation && data?.length > performanceOpts.aggregationThreshold,
          samplingUsed: performanceOpts.samplingFactor < 1
        };

        console.log('📤 Sending enhanced 3D chart data to Redux:', { chartData, chart3DConfig });

        const result = await dispatch(save3DChartToHistory({
          chart: chartData,
          fileId: null,
          chart3DConfig
        })).unwrap();

        console.log('✅ Redux save result:', result);
        
        // Show detailed success message
        const reductionInfo = chartData.dataInfo.dataReduction !== '0%' ? 
          ` (${chartData.dataInfo.dataReduction} size reduction applied)` : '';
        toast.success(`3D Chart saved to history!${reductionInfo}`);
      }
    } catch (error) {
      console.error('💥 Save chart error:', error);
      toast.error(`Failed to save chart to history: ${error.message || 'Unknown error'}`);
    }
  };

  // Set up global controls for tooltip buttons
  useEffect(() => {
    // Create global control functions accessible from tooltip
    window.chart3DControls = {
      toggleAutoRotate: () => setIsAutoRotating(!isAutoRotating),
      resetView: resetView,
      saveChart: enableSave ? saveChartToHistory : () => {},
      downloadChart: downloadChart
    };

    // Cleanup function
    return () => {
      if (window.chart3DControls) {
        delete window.chart3DControls;
      }
    };
  }, [isAutoRotating, enableSave]);

  const plotData = getPlotData();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg w-full overflow-hidden ${className}`}>
      {/* 3D Chart */}
      <div className="p-8 w-full overflow-hidden">
        <div 
          className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg p-8 w-full overflow-hidden shadow-inner" 
          style={{ 
            height: extremePerformanceMode ? '900px' : '800px', 
            minHeight: '700px',
            width: '100%'
          }}
        >
          {plotData.length > 0 ? (
            <Plot
              ref={plotRef}
              data={plotData}
              layout={getLayout()}
              config={getConfig()}
              style={{ width: '100%', height: '100%', minWidth: '100%' }}
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
        
        {/* Performance Info Display for Large Datasets */}
        {(data?.length > 5000 || performanceOpts.enableLargeDataOptimization) && (
          <div className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-500">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  📊 <strong>{data?.length?.toLocaleString() || 0}</strong> total points
                </span>
                {finalData?.length !== data?.length && (
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Zap className="w-3 h-3" /> <strong>{finalData?.length?.toLocaleString() || 0}</strong> rendered 
                    ({((finalData?.length / data?.length) * 100).toFixed(1)}%)
                  </span>
                )}
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Rocket className="w-3 h-3" /> {performanceOpts.renderMode.toUpperCase()} mode
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {performanceOpts.enableDataAggregation && (
                  <span className="inline-flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Aggregated
                  </span>
                )} 
                {performanceOpts.samplingFactor < 1 && (
                  <span className="inline-flex items-center gap-1">
                    <Target className="w-3 h-3" /> Sampled
                  </span>
                )}
                {performanceOpts.useWebGL && (
                  <span className="inline-flex items-center gap-1">
                    <Zap className="w-3 h-3" /> WebGL
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rendering 3D chart...
                {performanceOpts.enableLargeDataOptimization && (
                  <span className="block text-xs mt-1">
                    Optimizing for {data?.length?.toLocaleString()} data points
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chart3DRenderer;
