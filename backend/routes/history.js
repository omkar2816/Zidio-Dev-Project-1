import express from 'express';
import { protect } from '../middleware/auth.js';
import ChartHistory from '../models/ChartHistory.js';
import DatasetProcessingHistory from '../models/DatasetProcessingHistory.js';
import UploadedFile from '../models/UploadedFile.js';
import UserActivity from '../models/UserActivity.js';

const router = express.Router();

// Helper function to log activity
const logActivity = async (userId, activityType, description, metadata = {}, req) => {
  try {
    await UserActivity.logActivity({
      user: userId,
      activityType,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// ==============================================
// CHART HISTORY ROUTES
// ==============================================

// Save/Update chart in history
router.post('/charts', protect, async (req, res) => {
  try {
    const {
      chartId,
      chartTitle,
      chartType,
      sourceFileId,
      sourceFileName,
      sourceSheet,
      configuration,
      dataInfo,
      performanceInfo,
      preprocessingSteps = [],
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!chartId || !chartTitle || !chartType || !sourceFileId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'chartId, chartTitle, chartType, and sourceFileId are required'
      });
    }

    // Check if chart already exists (update vs create)
    let chartHistory = await ChartHistory.findOne({ 
      chartId, 
      user: req.user._id 
    });

    if (chartHistory) {
      // Update existing chart
      chartHistory.chartTitle = chartTitle;
      chartHistory.chartType = chartType;
      chartHistory.configuration = { ...chartHistory.configuration, ...configuration };
      chartHistory.dataInfo = { ...chartHistory.dataInfo, ...dataInfo };
      chartHistory.performanceInfo = { ...chartHistory.performanceInfo, ...performanceInfo };
      chartHistory.metadata = { ...chartHistory.metadata, ...metadata };
      
      // Add preprocessing steps if provided
      if (preprocessingSteps.length > 0) {
        chartHistory.preprocessingSteps.push(...preprocessingSteps);
      }
      
      await chartHistory.save();
      
      await logActivity(
        req.user._id,
        'chart_updated',
        `Updated chart: ${chartTitle}`,
        { chartId, chartType },
        req
      );
      
    } else {
      // Create new chart history
      chartHistory = await ChartHistory.create({
        user: req.user._id,
        chartId,
        chartTitle,
        chartType,
        sourceFile: sourceFileId,
        sourceFileName,
        sourceSheet,
        configuration,
        dataInfo,
        performanceInfo,
        preprocessingSteps,
        metadata
      });

      // Update source file chart count
      await UploadedFile.findByIdAndUpdate(sourceFileId, {
        $inc: { 'accessTracking.chartCount': 1 }
      });

      await logActivity(
        req.user._id,
        'chart_created',
        `Created chart: ${chartTitle}`,
        { chartId, chartType, sourceFileId },
        req
      );
    }

    res.json({
      success: true,
      message: chartHistory.isNew ? 'Chart created successfully' : 'Chart updated successfully',
      data: chartHistory
    });

  } catch (error) {
    console.error('Save chart history error:', error);
    res.status(500).json({
      error: 'Failed to save chart',
      message: 'Internal server error'
    });
  }
});

// Get user's chart history with filtering and pagination
router.get('/charts', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      chartType,
      isFavorite,
      status = 'active',
      search,
      sortBy = 'lastViewed',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      chartType,
      isFavorite: isFavorite === 'true',
      status
    };

    // Build query
    const query = { 
      user: req.user._id, 
      isActive: true,
      status: { $ne: 'deleted' },
      // Exclude test events
      chartTitle: { $not: { $regex: '^test', $options: 'i' } },
      chartId: { $not: { $regex: '^test-', $options: 'i' } },
      sourceFileName: { $not: { $regex: 'test', $options: 'i' } }
    };

    if (chartType) query.chartType = chartType;
    if (isFavorite === 'true') query['metadata.isFavorite'] = true;
    if (status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { chartTitle: { $regex: search, $options: 'i' } },
        { sourceFileName: { $regex: search, $options: 'i' } },
        { 'metadata.description': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortKey = sortBy === 'lastViewed' ? 'accessTracking.lastViewed' : 
                   sortBy === 'created' ? 'createdAt' : 
                   sortBy === 'title' ? 'chartTitle' : 'createdAt';
    
    const sort = { [sortKey]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with pagination
    const charts = await ChartHistory.find(query)
      .populate('sourceFile', 'originalName size uploadedAt')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await ChartHistory.countDocuments(query);

    res.json({
      success: true,
      data: {
        charts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get chart history error:', error);
    res.status(500).json({
      error: 'Failed to fetch chart history',
      message: 'Internal server error'
    });
  }
});

// Get specific chart details
router.get('/charts/:chartId', protect, async (req, res) => {
  try {
    const chart = await ChartHistory.findOne({
      chartId: req.params.chartId,
      user: req.user._id,
      isActive: true
    }).populate('sourceFile', 'originalName size uploadedAt parsedData');

    if (!chart) {
      return res.status(404).json({
        error: 'Chart not found',
        message: 'Chart not found or access denied'
      });
    }

    // Update access tracking
    await chart.updateAccess();

    res.json({
      success: true,
      data: chart
    });

  } catch (error) {
    console.error('Get chart details error:', error);
    res.status(500).json({
      error: 'Failed to fetch chart details',
      message: 'Internal server error'
    });
  }
});

// Toggle chart favorite status
router.patch('/charts/:chartId/favorite', protect, async (req, res) => {
  try {
    const chart = await ChartHistory.findOne({
      chartId: req.params.chartId,
      user: req.user._id,
      isActive: true
    });

    if (!chart) {
      return res.status(404).json({
        error: 'Chart not found',
        message: 'Chart not found or access denied'
      });
    }

    await chart.toggleFavorite();

    await logActivity(
      req.user._id,
      'chart_favorite_toggled',
      `${chart.metadata.isFavorite ? 'Added to' : 'Removed from'} favorites: ${chart.chartTitle}`,
      { chartId: chart.chartId },
      req
    );

    res.json({
      success: true,
      message: `Chart ${chart.metadata.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { isFavorite: chart.metadata.isFavorite }
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      error: 'Failed to toggle favorite',
      message: 'Internal server error'
    });
  }
});

// Archive chart
router.patch('/charts/:chartId/archive', protect, async (req, res) => {
  try {
    const chart = await ChartHistory.findOne({
      chartId: req.params.chartId,
      user: req.user._id,
      isActive: true
    });

    if (!chart) {
      return res.status(404).json({
        error: 'Chart not found',
        message: 'Chart not found or access denied'
      });
    }

    await chart.archive();

    await logActivity(
      req.user._id,
      'chart_archived',
      `Archived chart: ${chart.chartTitle}`,
      { chartId: chart.chartId },
      req
    );

    res.json({
      success: true,
      message: 'Chart archived successfully'
    });

  } catch (error) {
    console.error('Archive chart error:', error);
    res.status(500).json({
      error: 'Failed to archive chart',
      message: 'Internal server error'
    });
  }
});

// Delete chart
router.delete('/charts/:chartId', protect, async (req, res) => {
  try {
    const chart = await ChartHistory.findOne({
      chartId: req.params.chartId,
      user: req.user._id,
      isActive: true
    });

    if (!chart) {
      return res.status(404).json({
        error: 'Chart not found',
        message: 'Chart not found or access denied'
      });
    }

    await chart.softDelete();

    await logActivity(
      req.user._id,
      'chart_deleted',
      `Deleted chart: ${chart.chartTitle}`,
      { chartId: chart.chartId },
      req
    );

    res.json({
      success: true,
      message: 'Chart deleted successfully'
    });

  } catch (error) {
    console.error('Delete chart error:', error);
    res.status(500).json({
      error: 'Failed to delete chart',
      message: 'Internal server error'
    });
  }
});

// ==============================================
// DATASET PROCESSING HISTORY ROUTES
// ==============================================

// Create new processing session
router.post('/processing-sessions', protect, async (req, res) => {
  try {
    const {
      sourceFileId,
      sourceFileName,
      sourceSheet,
      sessionName,
      originalData
    } = req.body;

    if (!sourceFileId || !sourceFileName || !sourceSheet || !sessionName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'sourceFileId, sourceFileName, sourceSheet, and sessionName are required'
      });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const processingHistory = await DatasetProcessingHistory.create({
      user: req.user._id,
      sourceFile: sourceFileId,
      sourceFileName,
      sourceSheet,
      sessionId,
      sessionName,
      originalData,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    // Add initial upload step
    await processingHistory.addProcessingStep({
      stepType: 'upload',
      operation: 'file_upload',
      description: `Uploaded file: ${sourceFileName}`,
      inputData: { rowCount: 0, columnCount: 0 },
      outputData: originalData,
      processingTime: 0,
      success: true
    });

    // Update source file with processing session
    await UploadedFile.findByIdAndUpdate(sourceFileId, {
      $push: {
        processingHistory: {
          sessionId,
          processedAt: new Date(),
          operations: ['upload'],
          resultingCharts: 0
        }
      }
    });

    await logActivity(
      req.user._id,
      'processing_session_created',
      `Created processing session: ${sessionName}`,
      { sessionId, sourceFileId },
      req
    );

    res.json({
      success: true,
      message: 'Processing session created successfully',
      data: { sessionId, processingHistory }
    });

  } catch (error) {
    console.error('Create processing session error:', error);
    res.status(500).json({
      error: 'Failed to create processing session',
      message: 'Internal server error'
    });
  }
});

// Add processing step to session
router.post('/processing-sessions/:sessionId/steps', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stepData = req.body;

    const processingHistory = await DatasetProcessingHistory.findOne({
      sessionId,
      user: req.user._id,
      isActive: true
    });

    if (!processingHistory) {
      return res.status(404).json({
        error: 'Processing session not found',
        message: 'Processing session not found or access denied'
      });
    }

    await processingHistory.addProcessingStep(stepData);

    res.json({
      success: true,
      message: 'Processing step added successfully',
      data: processingHistory.processingSteps[processingHistory.processingSteps.length - 1]
    });

  } catch (error) {
    console.error('Add processing step error:', error);
    res.status(500).json({
      error: 'Failed to add processing step',
      message: 'Internal server error'
    });
  }
});

// Get user's processing history
router.get('/processing-sessions', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sourceFile,
      search
    } = req.query;

    const query = { user: req.user._id, isActive: true };
    if (status) query.status = status;
    if (sourceFile) query.sourceFile = sourceFile;
    if (search) {
      query.$or = [
        { sessionName: { $regex: search, $options: 'i' } },
        { sourceFileName: { $regex: search, $options: 'i' } }
      ];
    }

    const sessions = await DatasetProcessingHistory.find(query)
      .populate('sourceFile', 'originalName size uploadedAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await DatasetProcessingHistory.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get processing history error:', error);
    res.status(500).json({
      error: 'Failed to fetch processing history',
      message: 'Internal server error'
    });
  }
});

// ==============================================
// STATISTICS & ANALYTICS ROUTES
// ==============================================

// Get user's comprehensive statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const [chartStats, processingStats, fileStats] = await Promise.all([
      ChartHistory.getUserStats(req.user._id),
      DatasetProcessingHistory.getUserProcessingStats(req.user._id),
      UploadedFile.getUserFileStats(req.user._id)
    ]);

    const stats = {
      charts: chartStats[0] || {},
      processing: processingStats[0] || {},
      files: fileStats[0] || {},
      summary: {
        totalActivity: (chartStats[0]?.totalCharts || 0) + (processingStats[0]?.totalSessions || 0),
        dataEfficiency: processingStats[0]?.avgQualityScore || 0,
        storageUsed: fileStats[0]?.totalSize || 0
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'Internal server error'
    });
  }
});

// Get recent activity
router.get('/recent-activity', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentActivity = await UserActivity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: recentActivity
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: 'Internal server error'
    });
  }
});

export default router;
