// Chart utilities for data processing and configuration
import * as echarts from 'echarts';

// Emerald color scheme
export const CHART_COLORS = {
  primary: '#059669',     // emerald-600
  secondary: '#10b981',   // emerald-500
  tertiary: '#34d399',    // emerald-400
  quaternary: '#6ee7b7',  // emerald-300
  accent: '#065f46',      // emerald-800
  palette: [
    '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
    '#d1fae5', '#047857', '#065f46', '#064e3b', '#022c22'
  ],
  gradient: {
    start: '#059669',
    end: '#34d399'
  }
};

// Common animation settings
export const ANIMATION_CONFIG = {
  duration: 1000,
  easing: 'cubicOut',
  delay: (idx) => idx * 100
};

// Chart type configurations
export const CHART_CONFIGS = {
  bar: {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  },
  line: {
    animation: true,
    animationDuration: 1200,
    animationEasing: 'elasticOut'
  },
  pie: {
    animation: true,
    animationDuration: 1500,
    animationEasing: 'bounceOut'
  },
  area: {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  }
};

// Data processing utilities
export const processDataForChart = (data, chartType, xAxis, yAxis, series) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  switch (chartType) {
    case 'bar':
    case 'line':
    case 'area':
      return processLineBarData(data, xAxis, yAxis, series);
    case 'pie':
      return processPieData(data, xAxis, yAxis);
    case 'histogram':
      return processHistogramData(data, xAxis);
    case 'bubble':
      return processBubbleData(data, xAxis, yAxis, series);
    case 'box':
      return processBoxPlotData(data, yAxis);
    case 'radar':
      return processRadarData(data, xAxis, yAxis);
    default:
      return null;
  }
};

const processLineBarData = (data, xAxis, yAxis, series) => {
  const categories = [];
  const seriesData = {};

  // Initialize series
  if (series && Array.isArray(series)) {
    series.forEach(s => {
      seriesData[s] = [];
    });
  } else {
    seriesData[yAxis] = [];
  }

  data.forEach(row => {
    const xValue = row[xAxis];
    if (xValue !== undefined && xValue !== null) {
      categories.push(String(xValue));
      
      if (series && Array.isArray(series)) {
        series.forEach(s => {
          const value = parseFloat(row[s]);
          seriesData[s].push(isNaN(value) ? 0 : value);
        });
      } else {
        const value = parseFloat(row[yAxis]);
        seriesData[yAxis].push(isNaN(value) ? 0 : value);
      }
    }
  });

  return {
    categories,
    series: Object.keys(seriesData).map((key, index) => ({
      name: key,
      data: seriesData[key],
      color: CHART_COLORS.palette[index % CHART_COLORS.palette.length]
    }))
  };
};

const processPieData = (data, xAxis, yAxis) => {
  const pieData = [];
  const aggregated = {};

  data.forEach(row => {
    const name = String(row[xAxis]);
    const value = parseFloat(row[yAxis]);
    
    if (!isNaN(value)) {
      if (aggregated[name]) {
        aggregated[name] += value;
      } else {
        aggregated[name] = value;
      }
    }
  });

  Object.keys(aggregated).forEach((key, index) => {
    pieData.push({
      name: key,
      value: aggregated[key],
      itemStyle: {
        color: CHART_COLORS.palette[index % CHART_COLORS.palette.length]
      }
    });
  });

  return pieData;
};

const processHistogramData = (data, column) => {
  const values = data
    .map(row => parseFloat(row[column]))
    .filter(val => !isNaN(val))
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const min = values[0];
  const max = values[values.length - 1];
  const bins = Math.min(20, Math.max(5, Math.sqrt(values.length)));
  const binSize = (max - min) / bins;

  const histogram = [];
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binSize;
    const binEnd = min + (i + 1) * binSize;
    const count = values.filter(val => val >= binStart && val < binEnd).length;
    
    histogram.push({
      x: binStart + binSize / 2,
      y: count,
      binStart,
      binEnd
    });
  }

  return histogram;
};

const processBubbleData = (data, xAxis, yAxis, sizeAxis) => {
  return data
    .map(row => {
      const x = parseFloat(row[xAxis]);
      const y = parseFloat(row[yAxis]);
      const size = parseFloat(row[sizeAxis]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(size)) {
        return [x, y, size];
      }
      return null;
    })
    .filter(point => point !== null);
};

const processBoxPlotData = (data, column) => {
  const values = data
    .map(row => parseFloat(row[column]))
    .filter(val => !isNaN(val))
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const q1 = values[Math.floor(values.length * 0.25)];
  const median = values[Math.floor(values.length * 0.5)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const min = values[0];
  const max = values[values.length - 1];

  return {
    min,
    q1,
    median,
    q3,
    max,
    outliers: [] // Could be enhanced to detect outliers
  };
};

const processRadarData = (data, seriesColumn, valueColumns) => {
  if (!Array.isArray(valueColumns)) {
    valueColumns = [valueColumns];
  }
  
  const indicators = valueColumns.map(col => ({
    name: col,
    max: Math.max(...data.map(row => parseFloat(row[col]) || 0))
  }));

  if (seriesColumn) {
    const groupedData = {};
    data.forEach(row => {
      const group = row[seriesColumn];
      if (!groupedData[group]) {
        groupedData[group] = [];
      }
      groupedData[group].push(row);
    });
    
    const radarData = Object.keys(groupedData).map(group => ({
      name: group,
      value: valueColumns.map(col => {
        const values = groupedData[group].map(row => parseFloat(row[col]) || 0);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      })
    }));
    
    return { indicators, data: radarData };
  } else {
    // Single series radar
    const avgValues = valueColumns.map(col => {
      const values = data.map(row => parseFloat(row[col]) || 0);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return {
      indicators,
      data: [{
        name: 'Data',
        value: avgValues
      }]
    };
  }
};

// Chart export utilities
export const exportChart = async (chartRef, filename, format) => {
  if (!chartRef.current) return;

  try {
    switch (format) {
      case 'png':
      case 'jpg':
        return exportAsImage(chartRef, filename, format);
      case 'svg':
        return exportAsSVG(chartRef, filename);
      case 'pdf':
        return exportAsPDF(chartRef, filename);
      default:
        throw new Error('Unsupported format');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

const exportAsImage = async (chartRef, filename, format) => {
  const { default: html2canvas } = await import('html2canvas');
  
  const canvas = await html2canvas(chartRef.current, {
    backgroundColor: null,
    scale: 2 // Higher quality
  });
  
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`);
  link.click();
};

const exportAsSVG = (chartRef, filename) => {
  // ECharts has built-in SVG export
  const echartsInstance = echarts.getInstanceByDom(chartRef.current);
  if (echartsInstance) {
    const svgStr = echartsInstance.renderToSVGString();
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }
};

const exportAsPDF = async (chartRef, filename) => {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');
  
  const canvas = await html2canvas(chartRef.current, {
    backgroundColor: '#ffffff',
    scale: 2
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  
  let position = 0;
  
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  pdf.save(`${filename}.pdf`);
};

// Performance optimization for large datasets
export const optimizeDataForLargeDataset = (data, maxPoints = 1000) => {
  if (data.length <= maxPoints) {
    return data;
  }
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

// Chart responsiveness utilities
export const getResponsiveOptions = (containerWidth, containerHeight) => {
  return {
    grid: {
      left: containerWidth < 600 ? '15%' : '10%',
      right: containerWidth < 600 ? '15%' : '10%',
      top: containerHeight < 400 ? '20%' : '15%',
      bottom: containerHeight < 400 ? '20%' : '15%'
    },
    legend: {
      orient: containerWidth < 600 ? 'horizontal' : 'vertical',
      bottom: containerWidth < 600 ? 0 : 'auto',
      right: containerWidth < 600 ? 'auto' : 0
    }
  };
};
