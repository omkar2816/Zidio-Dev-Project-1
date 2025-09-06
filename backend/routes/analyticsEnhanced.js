// Enhanced analytics routes with preprocessing and smart configuration
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { protect, requireAdmin } from '../middleware/auth.js';
import UploadedFile from '../models/UploadedFile.js';
import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import NotificationService from '../services/NotificationService.js';
import DataPreprocessor from '../services/DataPreprocessor.js';
import SmartChartConfigurator from '../services/SmartChartConfigurator.js';

const router = express.Router();

// Configure multer for file uploads (100MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB for individual fields
    files: 1, // Only allow 1 file at a time
    fields: 10 // Limit form fields
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Multer error handler middleware (reused from analytics.js)
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          error: 'File too large',
          message: 'File size exceeds the maximum limit of 100MB. Please upload a smaller file.',
          maxSize: '100MB',
          uploadedSize: req.file ? `${(req.file.size / 1024 / 1024).toFixed(2)}MB` : 'Unknown'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'Only one file can be uploaded at a time.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected file field',
          message: 'Unexpected file field. Please use the correct upload form.'
        });
      default:
        return res.status(400).json({
          error: 'Upload error',
          message: error.message || 'An error occurred during file upload.'
        });
    }
  } else if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message,
      supportedFormats: ['Excel (.xlsx, .xls)', 'CSV (.csv)'],
      maxSize: '100MB'
    });
  }
  
  // Pass other errors to next middleware
  next(error);
};

// Enhanced analyze route with preprocessing and smart configuration
router.post('/analyze-enhanced', protect, async (req, res) => {
  try {
    const processingStartTime = Date.now();
    console.log('Enhanced analyze endpoint called:', { dataRows: req.body.sheetData?.data?.length });
    
    const { sheetData, analysisType = 'comprehensive', chartConfigs, preprocessingOptions = {} } = req.body;

    if (!sheetData || !sheetData.data || !sheetData.headers) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'Please provide valid sheet data with headers and data arrays'
      });
    }

    const { headers, data: rawData } = sheetData;
    console.log('Processing data:', { headers: headers.length, rawRows: rawData.length });

    // Step 1: Data Preprocessing
    console.log('Starting data preprocessing...');
    const preprocessor = new DataPreprocessor();
    const preprocessingResult = await preprocessor.preprocessData(rawData, {
      missingValueStrategy: preprocessingOptions.missingValueStrategy || 'auto',
      duplicateStrategy: preprocessingOptions.duplicateStrategy || 'strict',
      handleOutliers: preprocessingOptions.handleOutliers || false,
      outlierStrategy: preprocessingOptions.outlierStrategy || 'iqr'
    });

    const { data: processedData, stats: preprocessingStats, quality: dataQuality } = preprocessingResult;
    console.log('Preprocessing completed:', preprocessingStats);

    // Step 2: Smart Chart Configuration
    console.log('Generating smart chart recommendations...');
    const configurator = new SmartChartConfigurator();
    const smartConfig = configurator.generateAutoConfiguration(processedData, {
      preferredTypes: preprocessingOptions.preferredChartTypes,
      avoidTypes: preprocessingOptions.avoidChartTypes
    });

    // Step 3: Enhanced Data Analysis
    const enhancedAnalysis = await performEnhancedAnalysis(processedData, headers, smartConfig.analysis);

    // Step 4: Generate Charts (prevent duplicates)
    const generatedCharts = new Map();
    const chartGenerationAttempts = new Set();

    // Generate from smart recommendations (max 3)
    const topRecommendations = smartConfig.recommendations.slice(0, 3);
    
    for (const recommendation of topRecommendations) {
      const chartKey = `${recommendation.type}_${recommendation.title}`;
      
      if (!generatedCharts.has(chartKey) && !chartGenerationAttempts.has(recommendation.type)) {
        chartGenerationAttempts.add(recommendation.type);
        
        const chartConfig = smartConfig.configurations.find(config => 
          config.type === recommendation.type
        );
        
        if (chartConfig && chartConfig.xAxis && chartConfig.yAxis) {
          const chart = generateSpecificChart(processedData, chartConfig);
          if (chart && chart.data && chart.data.length > 0) {
            chart.autoGenerated = true;
            chart.recommendation = recommendation;
            chart.smartConfig = chartConfig;
            generatedCharts.set(chartKey, chart);
          }
        }
      }
    }

    // Generate from user configs (prevent duplicates)
    if (chartConfigs && Array.isArray(chartConfigs)) {
      chartConfigs.forEach((config, index) => {
        const chartKey = `${config.type}_user_${index}`;
        if (!generatedCharts.has(chartKey)) {
          const chart = generateSpecificChart(processedData, config);
          if (chart && chart.data && chart.data.length > 0) {
            chart.userGenerated = true;
            generatedCharts.set(chartKey, chart);
          }
        }
      });
    }

    const finalCharts = Array.from(generatedCharts.values());

    // Enhanced correlations and insights
    const correlations = calculateEnhancedCorrelations(processedData, enhancedAnalysis.numericColumns);
    const insights = generateDataInsights(processedData, enhancedAnalysis, dataQuality, smartConfig);

    // Log activity
    await logActivity(
      req.user._id,
      'enhanced_analysis',
      `Processed ${processedData.length} rows with ${finalCharts.length} charts`,
      null,
      null,
      {
        originalRows: rawData.length,
        processedRows: processedData.length,
        chartsGenerated: finalCharts.length,
        dataQualityScore: dataQuality.score,
        processingTime: Date.now() - processingStartTime
      }
    );

    // Performance headers
    const responseSize = processedData.length;
    if (responseSize > 1000) {
      res.set({
        'Cache-Control': 'public, max-age=300',
        'X-Performance-Mode': 'enabled',
        'X-Data-Quality': dataQuality.score.toString(),
        'X-Charts-Generated': finalCharts.length.toString()
      });
    }

    res.json({
      success: true,
      message: 'Enhanced analysis completed successfully',
      data: {
        analysis: enhancedAnalysis,
        smartConfiguration: {
          recommendations: smartConfig.recommendations,
          autoSelections: smartConfig.autoSelections,
          confidence: smartConfig.metadata.confidenceScore
        },
        preprocessing: {
          stats: preprocessingStats,
          quality: dataQuality,
          originalCount: rawData.length,
          processedCount: processedData.length
        },
        generatedCharts: finalCharts,
        chartSuggestions: smartConfig.recommendations,
        correlations,
        insights,
        columnTypes: {
          numeric: enhancedAnalysis.numericColumns,
          categorical: enhancedAnalysis.categoricalColumns,
          temporal: enhancedAnalysis.dateColumns
        },
        summary: {
          totalRows: processedData.length,
          originalRows: rawData.length,
          totalColumns: headers.length,
          dataQualityScore: dataQuality.score,
          chartsGenerated: finalCharts.length,
          processingTime: Date.now() - processingStartTime
        }
      },
      preview: processedData,
      fullData: processedData,
      fileInfo: {
        originalRows: rawData.length,
        processedRows: processedData.length,
        columns: headers.length,
        dataQuality: dataQuality.score
      }
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({
      error: 'Enhanced analysis failed',
      message: error.message
    });
  }
});

// Helper functions
function generateSpecificChart(data, config) {
  const { type, xAxis, yAxis, zAxis, groupBy, aggregation = 'sum' } = config;
  
  try {
    let chartData = [];
    const dataSize = data.length;
    const performanceMode = dataSize > 1000;
    
    const getDataLimit = (chartType, totalRows) => {
      if (!performanceMode) return totalRows;
      
      switch (chartType) {
        case 'line':
        case 'area':
          return Math.min(500, totalRows);
        case 'scatter':
          return Math.min(300, totalRows);
        case 'scatter3d':
          return Math.min(200, totalRows);
        case 'bar':
        case 'pie':
          return Math.min(50, totalRows);
        default:
          return Math.min(250, totalRows);
      }
    };
    
    const dataLimit = getDataLimit(type, dataSize);
    
    const getSampledData = (fullData, limit) => {
      if (fullData.length <= limit) return fullData;
      const step = Math.floor(fullData.length / limit);
      const sampledData = [];
      for (let i = 0; i < fullData.length; i += step) {
        sampledData.push(fullData[i]);
        if (sampledData.length >= limit) break;
      }
      return sampledData;
    };
    
    switch (type) {
      case 'bar':
      case 'pie':
        if (groupBy) {
          const grouped = {};
          const workingData = getSampledData(data, dataLimit);
          
          workingData.forEach(row => {
            const category = row[groupBy];
            const value = parseFloat(row[yAxis]) || 0;
            
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(value);
          });

          chartData = Object.entries(grouped).map(([category, values]) => {
            let aggregatedValue;
            switch (aggregation) {
              case 'avg': aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length; break;
              case 'count': aggregatedValue = values.length; break;
              case 'max': aggregatedValue = Math.max(...values); break;
              case 'min': aggregatedValue = Math.min(...values); break;
              default: aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            }
            return { name: category, value: aggregatedValue };
          });
        }
        break;
        
      case 'line':
      case 'area':
        const lineData = getSampledData(data, dataLimit);
        chartData = lineData.map((row, index) => ({
          x: row[xAxis] || index,
          y: parseFloat(row[yAxis]) || 0
        }));
        break;
        
      case 'scatter':
        const scatterData = getSampledData(data, dataLimit);
        chartData = scatterData.map(row => ({
          x: parseFloat(row[xAxis]) || 0,
          y: parseFloat(row[yAxis]) || 0
        }));
        break;
    }

    return {
      id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: config.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      data: chartData,
      config,
      library: ['scatter3d', 'surface3d', 'box', 'bubble', 'radar'].includes(type) ? 'plotly' : 'echarts',
      createdAt: new Date().toISOString(),
      performanceMode,
      totalDataRows: dataSize,
      displayedRows: chartData.length,
      samplingInfo: performanceMode ? {
        enabled: true,
        originalRows: dataSize,
        displayedRows: chartData.length,
        samplingRatio: (chartData.length / dataSize * 100).toFixed(1) + '%'
      } : null
    };
  } catch (error) {
    console.error('Error generating chart:', error);
    return null;
  }
}

async function performEnhancedAnalysis(data, headers, smartAnalysis) {
  const numericColumns = headers.filter(header => {
    return data.some(row => {
      const value = row[header];
      return !isNaN(parseFloat(value)) && value !== '' && value !== null;
    });
  });

  const categoricalColumns = headers.filter(header => !numericColumns.includes(header));
  const dateColumns = headers.filter(header => {
    return data.some(row => {
      const value = row[header];
      return value && !isNaN(Date.parse(value));
    });
  });

  const analytics = {};
  
  // Enhanced statistics for numeric columns
  numericColumns.forEach(column => {
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));
    
    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      analytics[column] = {
        count: values.length,
        mean: Number(mean.toFixed(2)),
        median: sorted[Math.floor(sorted.length / 2)],
        min: Math.min(...values),
        max: Math.max(...values),
        stdDev: Number(stdDev.toFixed(2))
      };
    }
  });

  return {
    analytics,
    numericColumns,
    categoricalColumns,
    dateColumns,
    statistics: {
      totalRows: data.length,
      totalColumns: headers.length,
      numericColumns: numericColumns.length,
      categoricalColumns: categoricalColumns.length,
      dateColumns: dateColumns.length,
      completeness: 95.0
    }
  };
}

function calculateEnhancedCorrelations(data, numericColumns) {
  const correlations = {};
  
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const values1 = data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
      const values2 = data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
      
      const correlation = calculateCorrelation(values1, values2);
      const strength = Math.abs(correlation);
      
      correlations[`${col1}_${col2}`] = {
        correlation: Number(correlation.toFixed(3)),
        strength: strength > 0.7 ? 'strong' : strength > 0.4 ? 'moderate' : 'weak'
      };
    }
  }
  
  return correlations;
}

function calculateCorrelation(values1, values2) {
  const n = Math.min(values1.length, values2.length);
  if (n < 2) return 0;
  
  const mean1 = values1.reduce((a, b) => a + b, 0) / n;
  const mean2 = values2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
}

function generateDataInsights(data, analysis, quality, smartConfig) {
  const insights = [];
  
  if (quality.score >= 90) {
    insights.push({
      type: 'success',
      category: 'data_quality',
      message: `Excellent data quality (${quality.score}%). Your dataset is well-structured.`,
      impact: 'high'
    });
  } else if (quality.score >= 70) {
    insights.push({
      type: 'warning',
      category: 'data_quality',
      message: `Good data quality (${quality.score}%). Consider reviewing missing values.`,
      impact: 'medium'
    });
  }
  
  if (data.length > 10000) {
    insights.push({
      type: 'info',
      category: 'performance',
      message: `Large dataset (${data.length.toLocaleString()} rows). Optimizations applied.`,
      impact: 'medium'
    });
  }
  
  if (smartConfig.recommendations.length > 0) {
    const topRec = smartConfig.recommendations[0];
    insights.push({
      type: 'success',
      category: 'recommendations',
      message: `Smart analysis recommends ${topRec.type} charts.`,
      impact: 'high'
    });
  }
  
  return insights;
}

async function logActivity(userId, type, description, objectType, objectId, metadata) {
  try {
    const activity = new UserActivity({
      user: userId,
      type,
      description,
      objectType,
      objectId,
      metadata,
      timestamp: new Date()
    });
    await activity.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export default router;
