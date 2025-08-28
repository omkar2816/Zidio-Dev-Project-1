import UserActivity from '../models/UserActivity.js';

/**
 * Utility function to log user activities
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - User ID
 * @param {string} params.activityType - Type of activity (login, file_upload, chart_generation, etc.)
 * @param {string} params.description - Human-readable description
 * @param {Object} params.metadata - Additional metadata (optional)
 * @param {Object} params.req - Express request object (optional)
 */
export const logUserActivity = async ({ userId, activityType, description, metadata = {}, req = null }) => {
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
    console.error('Failed to log user activity:', error);
  }
};

/**
 * Activity types enum for consistency
 */
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTRATION: 'registration',
  FILE_UPLOAD: 'file_upload',
  CHART_GENERATION: 'chart_generation',
  DASHBOARD_VIEW: 'dashboard_view',
  PROFILE_UPDATE: 'profile_update',
  DATA_EXPORT: 'data_export',
  FILE_DELETE: 'file_delete',
  DATA_ANALYSIS: 'data_analysis'
};

export default { logUserActivity, ACTIVITY_TYPES };
