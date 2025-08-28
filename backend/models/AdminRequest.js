import mongoose from 'mongoose';

const adminRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    maxlength: [500, 'Request message cannot exceed 500 characters'],
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNote: {
    type: String,
    maxlength: [200, 'Review note cannot exceed 200 characters'],
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
adminRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
adminRequestSchema.index({ status: 1, createdAt: -1 });

const AdminRequest = mongoose.model('AdminRequest', adminRequestSchema);

export default AdminRequest;
