import mongoose from 'mongoose';

const chartHistorySchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    
    // Chart Identification
    chartId: { 
      type: String, 
      required: true, 
      index: true 
    },
    chartTitle: { 
      type: String, 
      required: true 
    },
    chartType: { 
      type: String, 
      required: true,
      enum: ['bar', 'line', 'pie', 'scatter', 'area', 'column', 'doughnut', 'bubble', 'radar', 'funnel', 'treemap', 'heatmap']
    },
    
    // Source Data Reference
    sourceFile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'UploadedFile', 
      required: false // Allow null for generated charts
    },
    sourceFileName: { 
      type: String, 
      required: true 
    },
    sourceSheet: { 
      type: String, 
      required: false,
      default: 'Generated'
    },
    
    // Chart Configuration
    configuration: {
      xAxis: { type: String, required: false, default: 'Auto' },
      yAxis: { type: String, required: false, default: 'Auto' },
      series: { type: mongoose.Schema.Types.Mixed },
      colorScheme: { 
        type: String, 
        default: 'default',
        enum: ['default', 'blue', 'green', 'emerald', 'purple', 'orange', 'red', 'teal', 'pink', 'indigo', 'gray', 'cyan', 'yellow', 'lime', 'rose', 'violet', 'amber', 'sky']
      },
      showAnimation: { type: Boolean, default: true },
      customSettings: { type: mongoose.Schema.Types.Mixed },
      dataColumns: [String],
      categories: [String],
      values: [String]
    },
    
    // Chart Data Storage
    chartData: { 
      type: mongoose.Schema.Types.Mixed,
      required: false 
    },
    
    // Data Information
    dataInfo: {
      totalRows: { type: Number, required: false, default: 0 },
      displayedRows: { type: Number, required: false, default: 0 },
      isFiltered: { type: Boolean, default: false },
      filterCriteria: { type: mongoose.Schema.Types.Mixed },
      originalDataRows: { type: Number }
    },
    
    // Performance & Processing Info
    performanceInfo: {
      performanceMode: { type: Boolean, default: false },
      extremePerformanceMode: { type: Boolean, default: false },
      performanceLevel: { 
        type: String, 
        enum: ['normal', 'optimized', 'extreme', 'ultra'],
        default: 'normal'
      },
      renderingStrategy: { type: String },
      processingTime: { type: Number }, // in milliseconds
      optimizations: { type: mongoose.Schema.Types.Mixed }
    },
    
    // Preprocessing Steps
    preprocessingSteps: [{
      stepType: { 
        type: String,
        enum: ['filter', 'sort', 'aggregate', 'transform', 'clean', 'sample']
      },
      description: { type: String },
      parameters: { type: mongoose.Schema.Types.Mixed },
      appliedAt: { type: Date, default: Date.now },
      affectedRows: { type: Number }
    }],
    
    // Chart Metadata
    metadata: {
      version: { type: String, default: '1.0' },
      tags: [String],
      description: { type: String },
      category: { type: String },
      isPublic: { type: Boolean, default: false },
      isFavorite: { type: Boolean, default: false }
    },
    
    // Access & Usage Tracking
    accessTracking: {
      viewCount: { type: Number, default: 0 },
      lastViewed: { type: Date, default: Date.now },
      exportCount: { type: Number, default: 0 },
      lastExported: { type: Date },
      sharedCount: { type: Number, default: 0 },
      duplicateCount: { type: Number, default: 0 }
    },
    
    // Status & Lifecycle
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted', 'draft'],
      default: 'active'
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
chartHistorySchema.index({ user: 1, createdAt: -1 });
chartHistorySchema.index({ user: 1, chartType: 1 });
chartHistorySchema.index({ user: 1, sourceFile: 1 });
chartHistorySchema.index({ user: 1, status: 1, isActive: 1 });
chartHistorySchema.index({ user: 1, 'metadata.isFavorite': 1 });
chartHistorySchema.index({ user: 1, 'accessTracking.lastViewed': -1 });
chartHistorySchema.index({ chartId: 1, user: 1 }, { unique: true });

// Virtual for chart age
chartHistorySchema.virtual('chartAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for performance score
chartHistorySchema.virtual('performanceScore').get(function() {
  let score = 100;
  if (this.performanceInfo.performanceMode) score -= 20;
  if (this.performanceInfo.extremePerformanceMode) score -= 40;
  if (this.dataInfo.totalRows > 10000) score -= 10;
  if (this.dataInfo.totalRows > 50000) score -= 20;
  return Math.max(score, 0);
});

// Methods
chartHistorySchema.methods.updateAccess = function() {
  this.accessTracking.viewCount += 1;
  this.accessTracking.lastViewed = new Date();
  return this.save();
};

chartHistorySchema.methods.markAsExported = function() {
  this.accessTracking.exportCount += 1;
  this.accessTracking.lastExported = new Date();
  return this.save();
};

chartHistorySchema.methods.toggleFavorite = function() {
  this.metadata.isFavorite = !this.metadata.isFavorite;
  return this.save();
};

chartHistorySchema.methods.addPreprocessingStep = function(step) {
  this.preprocessingSteps.push({
    stepType: step.type,
    description: step.description,
    parameters: step.parameters,
    affectedRows: step.affectedRows
  });
  return this.save();
};

chartHistorySchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

chartHistorySchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.isActive = false;
  return this.save();
};

// Static methods
chartHistorySchema.statics.findByUser = function(userId, options = {}) {
  const query = { 
    user: userId, 
    isActive: true,
    status: { $ne: 'deleted' }
  };
  
  if (options.chartType) query.chartType = options.chartType;
  if (options.isFavorite) query['metadata.isFavorite'] = true;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('sourceFile', 'originalName size uploadedAt')
    .sort(options.sort || { 'accessTracking.lastViewed': -1 });
};

chartHistorySchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalCharts: { $sum: 1 },
        chartTypes: { $addToSet: '$chartType' },
        totalViews: { $sum: '$accessTracking.viewCount' },
        totalExports: { $sum: '$accessTracking.exportCount' },
        favorites: { $sum: { $cond: ['$metadata.isFavorite', 1, 0] } },
        avgDataRows: { $avg: '$dataInfo.totalRows' },
        performanceCharts: { $sum: { $cond: ['$performanceInfo.performanceMode', 1, 0] } }
      }
    }
  ]);
};

const ChartHistory = mongoose.model('ChartHistory', chartHistorySchema);
export default ChartHistory;
