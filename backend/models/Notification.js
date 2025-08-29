import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'admin_request_submitted',
      'admin_request_approved', 
      'admin_request_rejected', 
      'admin_request_pending',
      'admin_privileges_granted',
      'admin_privileges_revoked',
      'new_user_registration',
      'file_upload',
      'file_upload_activity',
      'data_analysis_completed',
      'user_activity_alert',
      'system_milestone',
      'bulk_operation_completed',
      'login_alert',
      'security_alert',
      'system_update',
      'system_maintenance',
      'user_deletion',
      // User-specific notifications
      'welcome',
      'welcome_user',
      'file_processed',
      'analysis_ready',
      'profile_updated',
      'account_updated',
      'password_changed',
      'login_success',
      'suspicious_activity',
      'quota_warning',
      'feature_announcement',
      // Admin-specific notifications
      'new_user_assigned',
      'user_support_request',
      'user_activity_summary',
      'performance_report',
      'backup_completed',
      // Tab-specific notifications
      'dashboard_update',
      'analytics_report_ready',
      'charts_template_added',
      'files_processing_complete',
      'admin_user_action_required',
      'admin_request_action_required',
      'system_alert_tab',
      'user_management_alert',
      'analytics_data_ready',
      'chart_generation_complete'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  actionUrl: {
    type: String,
    default: null
  },
  navigationUrl: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: [
      'admin', 
      'system', 
      'user', 
      'security', 
      'analytics', 
      'account', 
      'user_management', 
      'file_management', 
      'support',
      // Tab-specific categories
      'dashboard_tab',
      'analytics_tab',
      'charts_tab',
      'files_tab',
      'admin_users_tab',
      'admin_requests_tab',
      'profile_tab'
    ],
    default: 'system'
  },
  targetRoles: {
    type: [String],
    enum: ['user', 'admin', 'superadmin'],
    default: ['superadmin']
  },
  isPersonal: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
