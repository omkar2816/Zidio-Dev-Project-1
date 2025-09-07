import mongoose from 'mongoose';

const uploadedFileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    size: { type: Number, required: true },
    // Store actual file data in MongoDB
    fileData: { type: Buffer, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    
    // Enhanced parsed data with more metadata
    parsedData: {
      sheets: { type: Map, of: mongoose.Schema.Types.Mixed },
      sheetNames: [String],
      totalSheets: { type: Number, default: 0 },
      datasetWarnings: [mongoose.Schema.Types.Mixed],
      // Enhanced metadata
      totalRows: { type: Number, default: 0 },
      totalColumns: { type: Number, default: 0 },
      dataQuality: {
        completeness: { type: Number, min: 0, max: 100 },
        consistency: { type: Number, min: 0, max: 100 },
        accuracy: { type: Number, min: 0, max: 100 }
      },
      columnTypes: { type: Map, of: String }, // column name -> data type
      sampleData: { type: mongoose.Schema.Types.Mixed } // First few rows for preview
    },
    
    // Enhanced tracking
    accessTracking: {
      lastAccessed: { type: Date, default: Date.now },
      accessCount: { type: Number, default: 0 },
      chartCount: { type: Number, default: 0 }, // Number of charts created from this file
      downloadCount: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 }
    },
    
    // Processing history reference
    processingHistory: [{
      sessionId: { type: String },
      processedAt: { type: Date, default: Date.now },
      operations: [String],
      resultingCharts: { type: Number, default: 0 }
    }],
    
    // File metadata
    metadata: {
      tags: [String],
      description: { type: String },
      category: { type: String },
      isPublic: { type: Boolean, default: false },
      isFavorite: { type: Boolean, default: false }
    },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

uploadedFileSchema.index({ user: 1, uploadedAt: -1 });
uploadedFileSchema.index({ user: 1, 'accessTracking.lastAccessed': -1 });
uploadedFileSchema.index({ user: 1, isActive: 1 });
uploadedFileSchema.index({ user: 1, 'metadata.isFavorite': 1 });
uploadedFileSchema.index({ user: 1, 'metadata.tags': 1 });

// Enhanced methods
uploadedFileSchema.methods.updateAccess = function() {
  this.accessTracking.lastAccessed = new Date();
  this.accessTracking.accessCount += 1;
  return this.save();
};

uploadedFileSchema.methods.incrementChartCount = function() {
  this.accessTracking.chartCount += 1;
  return this.save();
};

uploadedFileSchema.methods.addProcessingSession = function(sessionId, operations) {
  this.processingHistory.push({
    sessionId,
    operations,
    processedAt: new Date(),
    resultingCharts: 0
  });
  return this.save();
};

uploadedFileSchema.methods.updateProcessingSession = function(sessionId, chartCount) {
  const session = this.processingHistory.find(s => s.sessionId === sessionId);
  if (session) {
    session.resultingCharts = chartCount;
    return this.save();
  }
  return Promise.resolve(this);
};

uploadedFileSchema.methods.toggleFavorite = function() {
  this.metadata.isFavorite = !this.metadata.isFavorite;
  return this.save();
};

// Method to get file data as buffer
uploadedFileSchema.methods.getFileBuffer = function() {
  return this.fileData;
};

// Enhanced static methods
uploadedFileSchema.statics.findUserFiles = function(userId, options = {}) {
  const query = { user: userId, isActive: true };
  
  if (options.isFavorite) query['metadata.isFavorite'] = true;
  if (options.category) query['metadata.category'] = options.category;
  if (options.tags && options.tags.length > 0) {
    query['metadata.tags'] = { $in: options.tags };
  }
  
  return this.find(query)
    .select(options.excludeFileData ? '-fileData' : '')
    .sort(options.sort || { 'accessTracking.lastAccessed': -1 })
    .limit(options.limit || 50);
};

uploadedFileSchema.statics.getUserFileStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalAccess: { $sum: '$accessTracking.accessCount' },
        totalCharts: { $sum: '$accessTracking.chartCount' },
        avgFileSize: { $avg: '$size' },
        favorites: { $sum: { $cond: ['$metadata.isFavorite', 1, 0] } },
        categories: { $addToSet: '$metadata.category' }
      }
    }
  ]);
};

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);
export default UploadedFile;


