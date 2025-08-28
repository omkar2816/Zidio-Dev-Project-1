const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'file_upload', 'chart_generation', 'dashboard_view', 'profile_update', 'data_export']
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
});

// Index for faster queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ activityType: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
