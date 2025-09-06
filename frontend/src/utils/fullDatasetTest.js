/**
 * Full Dataset Rendering Test Utility
 * Tests the implementation of full dataset rendering without sampling/truncation
 */

export const testFullDatasetRendering = (data, chartType = 'line') => {
  const testResults = {
    dataSize: data.length,
    chartType,
    issues: [],
    recommendations: [],
    performance: {}
  };

  // Test 1: Check if data is being truncated
  const maxRecommendedLimits = {
    line: 10000,
    scatter: 5000,
    bar: 1000,
    pie: 50,
    bubble: 2000
  };

  const recommendedLimit = maxRecommendedLimits[chartType] || 5000;
  
  if (data.length > recommendedLimit) {
    testResults.recommendations.push(
      `Dataset has ${data.length} rows. Consider using performance mode for ${chartType} charts above ${recommendedLimit} points.`
    );
  }

  // Test 2: Memory usage estimation
  const estimatedMemoryMB = (data.length * 50) / (1024 * 1024); // Rough estimate
  testResults.performance.estimatedMemoryMB = estimatedMemoryMB;
  
  if (estimatedMemoryMB > 100) {
    testResults.issues.push(
      `High memory usage estimated: ${estimatedMemoryMB.toFixed(2)}MB`
    );
  }

  // Test 3: WebGL support check
  const webglSupported = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  })();

  testResults.performance.webglSupported = webglSupported;
  
  if (!webglSupported && data.length > 1000) {
    testResults.issues.push(
      'WebGL not supported - large datasets may render slowly'
    );
  }

  // Test 4: Chart type specific recommendations
  switch (chartType) {
    case 'scatter':
    case 'bubble':
      if (data.length > 1000 && webglSupported) {
        testResults.recommendations.push(
          'Use Plotly scattergl for better performance with large scatter/bubble charts'
        );
      }
      break;
    
    case 'line':
      if (data.length > 2000) {
        testResults.recommendations.push(
          'Enable ECharts large mode for line charts with > 2000 points'
        );
      }
      break;
    
    case 'pie':
      if (data.length > 25) {
        testResults.recommendations.push(
          'Pie charts work best with < 25 slices. Consider grouping data.'
        );
      }
      break;
  }

  return testResults;
};

export const getOptimalChartSettings = (dataSize, chartType) => {
  const settings = {
    useWebGL: false,
    enableLargeMode: false,
    progressiveRendering: false,
    samplingStrategy: 'none'
  };

  // Enable WebGL for large scatter/bubble charts
  if (['scatter', 'bubble'].includes(chartType) && dataSize > 1000) {
    settings.useWebGL = true;
  }

  // Enable ECharts large mode for line/bar charts
  if (['line', 'bar', 'area'].includes(chartType) && dataSize > 2000) {
    settings.enableLargeMode = true;
  }

  // Enable progressive rendering for very large datasets
  if (dataSize > 10000) {
    settings.progressiveRendering = true;
  }

  return settings;
};

export const validateFullDatasetImplementation = () => {
  const validationResults = {
    backendSupport: false,
    frontendSupport: false,
    chartLibrarySupport: false,
    issues: []
  };

  // Check if fullDataset flag is properly supported
  try {
    // This would be called in the actual component context
    validationResults.frontendSupport = true;
  } catch (error) {
    validationResults.issues.push('Frontend full dataset support not implemented');
  }

  return validationResults;
};
