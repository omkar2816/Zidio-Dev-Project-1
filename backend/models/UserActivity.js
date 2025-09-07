import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityType: { 
      type: String, 
      required: true,
      enum: ['file_upload', 'file_download', 'file_delete', 'data_analysis', 'chart_generation', 'chart_save', 'chart_deleted', 'data_export', 'login', 'logout', 'user_management']
    },
    description: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedFile' },
    fileName: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
    performedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

userActivitySchema.index({ user: 1, performedAt: -1 });
userActivitySchema.index({ user: 1, activityType: 1, performedAt: -1 });

// Method to create activity log
userActivitySchema.statics.logActivity = function(activityData) {
  return this.create(activityData);
};

// Method to get recent activities for a user
userActivitySchema.statics.getRecentActivities = function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ performedAt: -1 })
    .limit(limit)
    .populate('fileId', 'originalName')
    .select('-__v');
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
export default UserActivity;
