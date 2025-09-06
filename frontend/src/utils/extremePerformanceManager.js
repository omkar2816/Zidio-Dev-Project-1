/**
 * Extreme Performance Mode Utilities
 * Provides comprehensive performance monitoring and optimization for large dataset chart rendering
 */

export class ExtremePerformanceManager {
  constructor() {
    this.performanceMetrics = {
      renderStart: null,
      renderEnd: null,
      dataProcessingTime: 0,
      chartRenderTime: 0,
      memoryUsage: 0,
      frameRate: 60
    };
    
    this.thresholds = {
      small: 1000,
      medium: 5000,
      large: 15000,
      massive: 50000
    };
  }

  // Detect performance level based on data size
  detectPerformanceLevel(dataSize) {
    if (dataSize >= this.thresholds.massive) return 'ultra';
    if (dataSize >= this.thresholds.large) return 'extreme';
    if (dataSize >= this.thresholds.medium) return 'optimized';
    return 'normal';
  }

  // Get rendering strategy based on data size and chart type
  getRenderingStrategy(dataSize, chartType) {
    const level = this.detectPerformanceLevel(dataSize);
    
    const strategies = {
      ultra: this.getUltraStrategy(chartType),
      extreme: this.getExtremeStrategy(chartType),
      optimized: this.getOptimizedStrategy(chartType),
      normal: this.getStandardStrategy(chartType)
    };

    return strategies[level];
  }

  getUltraStrategy(chartType) {
    return {
      name: 'progressive',
      echarts: {
        large: true,
        largeThreshold: 1000,
        progressive: 500,
        progressiveThreshold: 10000,
        useDirtyRect: true,
        useCoarsePointer: true,
        animation: false,
        sampling: chartType === 'line' ? 'lttb' : null
      },
      plotly: {
        useWebGL: true,
        scattergl: true,
        webglpointthreshold: 1000,
        plotGlPixelRatio: 1
      },
      browser: {
        requestIdleCallback: true,
        virtualScrolling: true,
        memoryManagement: true,
        progressiveRendering: true
      }
    };
  }

  getExtremeStrategy(chartType) {
    return {
      name: 'webgl',
      echarts: {
        large: true,
        largeThreshold: 2000,
        progressive: 0,
        useDirtyRect: true,
        useCoarsePointer: true,
        animation: false
      },
      plotly: {
        useWebGL: true,
        scattergl: true,
        webglpointthreshold: 2000,
        plotGlPixelRatio: 1
      },
      browser: {
        requestIdleCallback: true,
        memoryManagement: true
      }
    };
  }

  getOptimizedStrategy(chartType) {
    return {
      name: 'large',
      echarts: {
        large: true,
        largeThreshold: 3000,
        useDirtyRect: true,
        animation: chartType !== 'scatter'
      },
      plotly: {
        useWebGL: chartType === 'scatter' || chartType === 'bubble',
        webglpointthreshold: 3000
      }
    };
  }

  getStandardStrategy(chartType) {
    return {
      name: 'standard',
      echarts: {
        animation: true
      },
      plotly: {}
    };
  }

  // Monitor performance during rendering
  startPerformanceMonitoring() {
    this.performanceMetrics.renderStart = performance.now();
    
    // Monitor memory usage if available
    if (performance.memory) {
      this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  endPerformanceMonitoring() {
    this.performanceMetrics.renderEnd = performance.now();
    this.performanceMetrics.chartRenderTime = 
      this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart;
    
    return this.performanceMetrics;
  }

  // Progressive data processing for ultra-large datasets
  processDataProgressively(data, chunkSize = 1000, callback) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    let processedCount = 0;
    const processChunk = () => {
      if (processedCount < chunks.length) {
        callback(chunks[processedCount], processedCount, chunks.length);
        processedCount++;
        
        // Use requestIdleCallback for non-blocking processing
        if (window.requestIdleCallback) {
          window.requestIdleCallback(processChunk);
        } else {
          setTimeout(processChunk, 0);
        }
      }
    };

    processChunk();
  }

  // Smart pie chart grouping (no truncation)
  optimizePieData(data, xAxis, yAxis, maxSlices = 25) {
    if (data.length <= maxSlices) {
      return data.map((row, index) => ({
        name: row[xAxis],
        value: parseFloat(row[yAxis]) || 0,
        originalIndex: index
      }));
    }

    // Sort by value and group smaller items
    const sortedData = data
      .map((row, index) => ({
        name: row[xAxis],
        value: parseFloat(row[yAxis]) || 0,
        originalIndex: index
      }))
      .sort((a, b) => b.value - a.value);

    const topItems = sortedData.slice(0, maxSlices - 1);
    const otherItems = sortedData.slice(maxSlices - 1);
    const othersValue = otherItems.reduce((sum, item) => sum + item.value, 0);

    const result = [...topItems];
    if (othersValue > 0) {
      result.push({
        name: `Others (${otherItems.length} items)`,
        value: othersValue,
        isGrouped: true,
        groupedItems: otherItems
      });
    }

    return result;
  }

  // Memory management utilities
  cleanupMemory() {
    // Force garbage collection if available (dev tools)
    if (window.gc) {
      window.gc();
    }
    
    // Clear any large temporary objects
    this.tempData = null;
  }

  // Performance recommendations
  getPerformanceRecommendations(dataSize, chartType) {
    const level = this.detectPerformanceLevel(dataSize);
    const recommendations = [];

    if (level === 'ultra') {
      recommendations.push({
        type: 'critical',
        message: `Ultra-large dataset (${dataSize.toLocaleString()} rows). Progressive rendering enabled.`,
        actions: ['Progressive rendering', 'WebGL acceleration', 'Memory optimization']
      });
    } else if (level === 'extreme') {
      recommendations.push({
        type: 'warning',
        message: `Large dataset (${dataSize.toLocaleString()} rows). WebGL acceleration enabled.`,
        actions: ['WebGL rendering', 'Large mode', 'Animation disabled']
      });
    } else if (level === 'optimized') {
      recommendations.push({
        type: 'info',
        message: `Medium dataset (${dataSize.toLocaleString()} rows). Large mode enabled.`,
        actions: ['Large mode', 'Optimized rendering']
      });
    }

    // Chart-specific recommendations
    if (chartType === 'pie' && dataSize > 50) {
      recommendations.push({
        type: 'info',
        message: 'Large pie chart optimized by grouping smaller slices.',
        actions: ['Smart grouping', 'No data truncation']
      });
    }

    return recommendations;
  }
}

// Export singleton instance
export const extremePerformanceManager = new ExtremePerformanceManager();

// Utility functions
export const getOptimalChartConfig = (dataSize, chartType) => {
  return extremePerformanceManager.getRenderingStrategy(dataSize, chartType);
};

export const monitorChartPerformance = (renderFunction) => {
  extremePerformanceManager.startPerformanceMonitoring();
  
  const result = renderFunction();
  
  const metrics = extremePerformanceManager.endPerformanceMonitoring();
  
  console.log(`Chart rendered in ${metrics.chartRenderTime.toFixed(2)}ms`, metrics);
  
  return result;
};

export const isWebGLSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
};
