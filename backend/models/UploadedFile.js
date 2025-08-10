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
    // Store parsed Excel data for quick access
    parsedData: {
      sheets: { type: Map, of: mongoose.Schema.Types.Mixed },
      sheetNames: [String],
      totalSheets: { type: Number, default: 0 }
    },
    // Track recent activities
    lastAccessed: { type: Date, default: Date.now },
    accessCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

uploadedFileSchema.index({ user: 1, uploadedAt: -1 });
uploadedFileSchema.index({ user: 1, lastAccessed: -1 });
uploadedFileSchema.index({ user: 1, isActive: 1 });

// Method to update access tracking
uploadedFileSchema.methods.updateAccess = function() {
  this.lastAccessed = new Date();
  this.accessCount += 1;
  return this.save();
};

// Method to get file data as buffer
uploadedFileSchema.methods.getFileBuffer = function() {
  return this.fileData;
};

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);
export default UploadedFile;


