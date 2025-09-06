// Smart Chart Recommendations Based on Data Patterns
// Enhanced recommendations system for optimal chart selection

import { BarChart3, LineChart, PieChart, TrendingUp, ScatterChart, Activity } from 'lucide-react';

export const analyzeDataPatterns = (data, headers) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { recommendations: [], confidence: 0 };
  }

  const patterns = {
    categorical: [],
    numerical: [],
    temporal: [],
    mixed: []
  };

  // Analyze each column
  headers.forEach(header => {
    const columnData = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
    const sampleSize = Math.min(100, columnData.length);
    const sample = columnData.slice(0, sampleSize);

    const analysis = analyzeColumn(sample, header);
    patterns[analysis.type].push({
      name: header,
      ...analysis
    });
  });

  // Generate smart recommendations
  const recommendations = generateSmartRecommendations(patterns, data.length);
  
  return {
    patterns,
    recommendations: recommendations.slice(0, 8), // Top 8 recommendations
    confidence: calculateOverallConfidence(recommendations)
  };
};

const analyzeColumn = (columnData, columnName) => {
  const nonEmptyData = columnData.filter(val => val !== '' && val !== null);
  const uniqueValues = [...new Set(nonEmptyData)];
  const uniqueRatio = uniqueValues.length / nonEmptyData.length;

  // Check if temporal
  const temporalPatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // M/D/YY or MM/DD/YYYY
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/, // Month names
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/, // Day names
    /^\d{4}$/, // Year
    /^Q[1-4]/, // Quarters
  ];

  const isTemporal = temporalPatterns.some(pattern => 
    nonEmptyData.some(val => pattern.test(String(val)))
  ) || columnName.toLowerCase().includes('date') || 
      columnName.toLowerCase().includes('time') ||
      columnName.toLowerCase().includes('month') ||
      columnName.toLowerCase().includes('year');

  // Check if numerical
  const numericCount = nonEmptyData.filter(val => !isNaN(parseFloat(val))).length;
  const numericRatio = numericCount / nonEmptyData.length;

  // Determine data type and characteristics
  if (isTemporal) {
    return {
      type: 'temporal',
      uniqueValues: uniqueValues.length,
      uniqueRatio,
      confidence: 0.9,
      characteristics: ['time-series', 'sequential']
    };
  } else if (numericRatio > 0.8) {
    const numericValues = nonEmptyData.map(val => parseFloat(val)).filter(val => !isNaN(val));
    const range = Math.max(...numericValues) - Math.min(...numericValues);
    const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
    
    return {
      type: 'numerical',
      uniqueValues: uniqueValues.length,
      uniqueRatio,
      range,
      mean,
      variance,
      confidence: 0.85,
      characteristics: uniqueRatio > 0.8 ? ['continuous'] : ['discrete']
    };
  } else if (uniqueRatio < 0.1 || uniqueValues.length < 20) {
    return {
      type: 'categorical',
      uniqueValues: uniqueValues.length,
      uniqueRatio,
      confidence: 0.8,
      characteristics: uniqueValues.length <= 5 ? ['low-cardinality'] : ['medium-cardinality']
    };
  } else {
    return {
      type: 'mixed',
      uniqueValues: uniqueValues.length,
      uniqueRatio,
      confidence: 0.6,
      characteristics: ['text', 'heterogeneous']
    };
  }
};

const generateSmartRecommendations = (patterns, dataSize) => {
  const recommendations = [];

  // Time series recommendations
  if (patterns.temporal.length > 0 && patterns.numerical.length > 0) {
    patterns.temporal.forEach(temporal => {
      patterns.numerical.slice(0, 3).forEach(numerical => {
        recommendations.push({
          type: 'line',
          title: `${numerical.name} Trend Over ${temporal.name}`,
          description: `Track how ${numerical.name} changes over time`,
          xAxis: temporal.name,
          yAxis: numerical.name,
          confidence: 0.95,
          priority: 'high',
          icon: TrendingUp,
          reasoning: 'Time series data detected - perfect for trend analysis',
          suitability: 'excellent'
        });
      });
    });
  }

  // Categorical vs Numerical (Bar Charts)
  if (patterns.categorical.length > 0 && patterns.numerical.length > 0) {
    patterns.categorical.slice(0, 2).forEach(categorical => {
      patterns.numerical.slice(0, 2).forEach(numerical => {
        const confidence = categorical.uniqueValues <= 10 ? 0.9 : 0.7;
        recommendations.push({
          type: 'bar',
          title: `${numerical.name} by ${categorical.name}`,
          description: `Compare ${numerical.name} across different ${categorical.name} categories`,
          xAxis: categorical.name,
          yAxis: numerical.name,
          groupBy: categorical.name,
          confidence,
          priority: categorical.uniqueValues <= 10 ? 'high' : 'medium',
          icon: BarChart3,
          reasoning: `${categorical.uniqueValues} categories found - ideal for comparison`,
          suitability: categorical.uniqueValues <= 10 ? 'excellent' : 'good'
        });
      });
    });
  }

  // Distribution analysis (Pie Charts)
  patterns.categorical.forEach(categorical => {
    if (categorical.uniqueValues <= 8 && categorical.uniqueValues >= 2) {
      recommendations.push({
        type: 'pie',
        title: `${categorical.name} Distribution`,
        description: `Show the proportion of each ${categorical.name} category`,
        labelField: categorical.name,
        valueField: 'count',
        groupBy: categorical.name,
        confidence: 0.85,
        priority: 'medium',
        icon: PieChart,
        reasoning: `${categorical.uniqueValues} categories - perfect for distribution view`,
        suitability: 'excellent'
      });
    }
  });

  // Correlation analysis (Scatter Plots)
  if (patterns.numerical.length >= 2) {
    for (let i = 0; i < Math.min(3, patterns.numerical.length); i++) {
      for (let j = i + 1; j < Math.min(3, patterns.numerical.length); j++) {
        const xCol = patterns.numerical[i];
        const yCol = patterns.numerical[j];
        recommendations.push({
          type: 'scatter',
          title: `${xCol.name} vs ${yCol.name} Correlation`,
          description: `Explore the relationship between ${xCol.name} and ${yCol.name}`,
          xAxis: xCol.name,
          yAxis: yCol.name,
          confidence: 0.8,
          priority: 'medium',
          icon: ScatterChart,
          reasoning: 'Two numerical variables - ideal for correlation analysis',
          suitability: 'good'
        });
      }
    }
  }

  // Performance-optimized recommendations for large datasets
  if (dataSize > 5000) {
    recommendations.forEach(rec => {
      if (rec.type === 'scatter' || rec.type === 'line') {
        rec.performanceNote = 'Auto-sampling will be applied for optimal performance';
        rec.confidence *= 0.95; // Slightly reduce confidence for very large datasets
      }
    });
  }

  // Multi-dimensional analysis for datasets with many columns
  if (patterns.numerical.length >= 3) {
    const topNumerical = patterns.numerical.slice(0, 3);
    recommendations.push({
      type: 'bubble',
      title: `Multi-dimensional Analysis`,
      description: `Explore relationships between ${topNumerical.map(col => col.name).join(', ')}`,
      xAxis: topNumerical[0].name,
      yAxis: topNumerical[1].name,
      sizeBy: topNumerical[2].name,
      confidence: 0.75,
      priority: 'low',
      icon: Activity,
      reasoning: 'Multiple numerical variables - suitable for multi-dimensional analysis',
      suitability: 'good'
    });
  }

  // Sort by confidence and priority
  return recommendations.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
  });
};

const calculateOverallConfidence = (recommendations) => {
  if (recommendations.length === 0) return 0;
  const totalConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0);
  return Math.round((totalConfidence / recommendations.length) * 100);
};

// Error handling and user-friendly notifications
export const validateDataForCharting = (data, config) => {
  const errors = [];
  const warnings = [];

  if (!data || data.length === 0) {
    errors.push({
      type: 'no_data',
      message: 'No data available for chart creation',
      suggestion: 'Please upload a valid dataset first'
    });
    return { valid: false, errors, warnings };
  }

  if (data.length < 2) {
    warnings.push({
      type: 'insufficient_data',
      message: 'Very small dataset detected',
      suggestion: 'Charts work better with more data points'
    });
  }

  if (config.xAxis && !data[0].hasOwnProperty(config.xAxis)) {
    errors.push({
      type: 'missing_column',
      message: `Column '${config.xAxis}' not found in data`,
      suggestion: 'Please select a valid column for X-axis'
    });
  }

  if (config.yAxis && !data[0].hasOwnProperty(config.yAxis)) {
    errors.push({
      type: 'missing_column',
      message: `Column '${config.yAxis}' not found in data`,
      suggestion: 'Please select a valid column for Y-axis'
    });
  }

  // Check for unsupported data types
  if (config.xAxis || config.yAxis) {
    const columns = [config.xAxis, config.yAxis].filter(Boolean);
    columns.forEach(column => {
      const sampleValues = data.slice(0, 10).map(row => row[column]);
      const allNull = sampleValues.every(val => val === null || val === undefined || val === '');
      
      if (allNull) {
        warnings.push({
          type: 'empty_column',
          message: `Column '${column}' appears to be empty`,
          suggestion: 'Consider using a different column or cleaning your data'
        });
      }
    });
  }

  return { 
    valid: errors.length === 0, 
    errors, 
    warnings,
    dataSize: data.length,
    performanceMode: data.length > 1000
  };
};

export default {
  analyzeDataPatterns,
  validateDataForCharting
};
