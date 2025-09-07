import mongoose from 'mongoose';

const datasetProcessingHistorySchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    
    // Source Information
    sourceFile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'UploadedFile', 
      required: true 
    },
    sourceFileName: { type: String, required: true },
    sourceSheet: { type: String, required: true },
    
    // Processing Session Info
    sessionId: { 
      type: String, 
      required: true, 
      index: true 
    },
    sessionName: { type: String, required: true },
    
    // Original Data Info
    originalData: {
      totalRows: { type: Number, required: true },
      totalColumns: { type: Number, required: true },
      headers: [String],
      dataTypes: { type: Map, of: String }, // column -> datatype mapping
      sampleData: { type: mongoose.Schema.Types.Mixed } // first few rows for preview
    },
    
    // Processing Steps (in chronological order)
    processingSteps: [{
      stepId: { type: String, required: true },
      stepType: { 
        type: String,
        required: true,
        enum: ['upload', 'filter', 'sort', 'aggregate', 'transform', 'clean', 'sample', 'validate', 'export']
      },
      operation: { type: String, required: true }, // specific operation performed
      description: { type: String, required: true },
      
      // Step Input
      inputData: {
        rowCount: { type: Number },
        columnCount: { type: Number },
        affectedColumns: [String]
      },
      
      // Step Configuration
      parameters: { type: mongoose.Schema.Types.Mixed },
      criteria: { type: mongoose.Schema.Types.Mixed },
      settings: { type: mongoose.Schema.Types.Mixed },
      
      // Step Output
      outputData: {
        rowCount: { type: Number },
        columnCount: { type: Number },
        modifiedColumns: [String],
        newColumns: [String],
        removedColumns: [String]
      },
      
      // Step Metadata
      processingTime: { type: Number }, // milliseconds
      memoryUsage: { type: Number }, // bytes
      success: { type: Boolean, default: true },
      errors: [String],
      warnings: [String],
      
      // Performance Info
      performanceMetrics: {
        cpuTime: { type: Number },
        peakMemory: { type: Number },
        diskIO: { type: Number },
        optimizationApplied: { type: Boolean, default: false }
      },
      
      appliedAt: { type: Date, default: Date.now },
      appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    
    // Final Processed Data Info
    finalData: {
      totalRows: { type: Number },
      totalColumns: { type: Number },
      headers: [String],
      dataTypes: { type: Map, of: String },
      qualityScore: { type: Number, min: 0, max: 100 }, // data quality assessment
      completeness: { type: Number, min: 0, max: 100 }, // percentage of complete data
      accuracy: { type: Number, min: 0, max: 100 }, // estimated accuracy
      consistency: { type: Number, min: 0, max: 100 } // data consistency score
    },
    
    // Performance Summary
    performanceSummary: {
      totalProcessingTime: { type: Number }, // milliseconds
      peakMemoryUsage: { type: Number }, // bytes
      averageStepTime: { type: Number },
      optimizationCount: { type: Number, default: 0 },
      errorCount: { type: Number, default: 0 },
      warningCount: { type: Number, default: 0 }
    },
    
    // Data Quality Assessment
    qualityAssessment: {
      issues: [{
        type: { 
          type: String,
          enum: ['missing_values', 'duplicates', 'outliers', 'inconsistent_format', 'invalid_data', 'encoding_issues']
        },
        severity: { 
          type: String,
          enum: ['low', 'medium', 'high', 'critical']
        },
        description: { type: String },
        affectedRows: { type: Number },
        affectedColumns: [String],
        suggestedFix: { type: String }
      }],
      
      recommendations: [{
        category: { type: String },
        priority: { 
          type: String,
          enum: ['low', 'medium', 'high']
        },
        description: { type: String },
        estimatedImpact: { type: String }
      }]
    },
    
    // Generated Charts Reference
    generatedCharts: [{
      chartId: { type: String },
      chartType: { type: String },
      chartTitle: { type: String },
      createdAt: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true }
    }],
    
    // Session Metadata
    metadata: {
      version: { type: String, default: '1.0' },
      environment: { type: String }, // development, production
      userAgent: { type: String },
      ipAddress: { type: String },
      tags: [String],
      notes: { type: String }
    },
    
    // Status & Lifecycle
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'cancelled', 'archived'],
      default: 'processing'
    },
    
    isActive: { type: Boolean, default: true }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for optimal performance
datasetProcessingHistorySchema.index({ user: 1, createdAt: -1 });
datasetProcessingHistorySchema.index({ user: 1, sourceFile: 1 });
datasetProcessingHistorySchema.index({ user: 1, status: 1 });
datasetProcessingHistorySchema.index({ sessionId: 1, user: 1 });
datasetProcessingHistorySchema.index({ user: 1, 'metadata.tags': 1 });

// Virtual for processing efficiency
datasetProcessingHistorySchema.virtual('processingEfficiency').get(function() {
  if (!this.performanceSummary.totalProcessingTime || !this.finalData.totalRows) return 0;
  return Math.round((this.finalData.totalRows / this.performanceSummary.totalProcessingTime) * 1000);
});

// Virtual for data reduction ratio
datasetProcessingHistorySchema.virtual('dataReductionRatio').get(function() {
  if (!this.originalData.totalRows || !this.finalData.totalRows) return 0;
  return Math.round(((this.originalData.totalRows - this.finalData.totalRows) / this.originalData.totalRows) * 100);
});

// Virtual for overall quality score
datasetProcessingHistorySchema.virtual('overallQualityScore').get(function() {
  const { qualityScore = 0, completeness = 0, accuracy = 0, consistency = 0 } = this.finalData;
  return Math.round((qualityScore + completeness + accuracy + consistency) / 4);
});

// Methods
datasetProcessingHistorySchema.methods.addProcessingStep = function(stepData) {
  const step = {
    stepId: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...stepData,
    appliedAt: new Date(),
    appliedBy: this.user
  };
  
  this.processingSteps.push(step);
  this.updatePerformanceSummary();
  return this.save();
};

datasetProcessingHistorySchema.methods.updatePerformanceSummary = function() {
  const steps = this.processingSteps;
  
  this.performanceSummary = {
    totalProcessingTime: steps.reduce((sum, step) => sum + (step.processingTime || 0), 0),
    peakMemoryUsage: Math.max(...steps.map(step => step.memoryUsage || 0)),
    averageStepTime: steps.length > 0 ? steps.reduce((sum, step) => sum + (step.processingTime || 0), 0) / steps.length : 0,
    optimizationCount: steps.filter(step => step.performanceMetrics?.optimizationApplied).length,
    errorCount: steps.filter(step => !step.success).length,
    warningCount: steps.reduce((sum, step) => sum + (step.warnings?.length || 0), 0)
  };
};

datasetProcessingHistorySchema.methods.addChart = function(chartInfo) {
  this.generatedCharts.push({
    chartId: chartInfo.chartId,
    chartType: chartInfo.chartType,
    chartTitle: chartInfo.chartTitle,
    createdAt: new Date()
  });
  return this.save();
};

datasetProcessingHistorySchema.methods.completeProcessing = function(finalDataInfo) {
  this.status = 'completed';
  this.finalData = { ...this.finalData, ...finalDataInfo };
  this.updatePerformanceSummary();
  return this.save();
};

datasetProcessingHistorySchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.addProcessingStep({
    stepType: 'error',
    operation: 'processing_failed',
    description: `Processing failed: ${error.message}`,
    success: false,
    errors: [error.message]
  });
  return this.save();
};

// Static methods
datasetProcessingHistorySchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId, isActive: true };
  
  if (options.status) query.status = options.status;
  if (options.sourceFile) query.sourceFile = options.sourceFile;
  
  return this.find(query)
    .populate('sourceFile', 'originalName size uploadedAt')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50);
};

datasetProcessingHistorySchema.statics.getUserProcessingStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        failedSessions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        totalProcessingTime: { $sum: '$performanceSummary.totalProcessingTime' },
        avgQualityScore: { $avg: '$finalData.qualityScore' },
        totalRowsProcessed: { $sum: '$originalData.totalRows' },
        totalChartsGenerated: { $sum: { $size: '$generatedCharts' } }
      }
    }
  ]);
};

const DatasetProcessingHistory = mongoose.model('DatasetProcessingHistory', datasetProcessingHistorySchema);
export default DatasetProcessingHistory;
