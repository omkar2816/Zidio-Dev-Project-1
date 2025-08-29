import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  // Get all superadmin users
  static async getSuperAdmins() {
    return await User.find({ role: 'superadmin' }).select('_id');
  }

  // Create notification for all superadmins
  static async notifySuperAdmins(notificationData) {
    try {
      const superAdmins = await this.getSuperAdmins();
      if (superAdmins.length === 0) return [];

      const notifications = superAdmins.map(admin => ({
        recipient: admin._id,
        ...notificationData
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating superadmin notifications:', error);
      return [];
    }
  }

  // New user registration notification
  static async notifyNewUserRegistration(newUser) {
    return await this.notifySuperAdmins({
      type: 'new_user_registration',
      title: 'New User Registration',
      message: `${newUser.firstName} ${newUser.lastName} has registered on the platform`,
      actionUrl: '/admin',
      priority: 'medium',
      category: 'admin',
      data: {
        userId: newUser._id,
        userEmail: newUser.email,
        userRole: newUser.role
      }
    });
  }

  // Admin request notification
  static async notifyAdminRequest(user) {
    return await this.notifySuperAdmins({
      type: 'admin_request_pending',
      title: 'New Admin Request',
      message: `${user.firstName} ${user.lastName} has requested admin privileges`,
      actionUrl: '/admin',
      priority: 'high',
      category: 'admin',
      data: {
        userId: user._id,
        userEmail: user.email,
        requestedAt: new Date()
      }
    });
  }

  // File upload activity notification (for bulk uploads or important files)
  static async notifyFileUploadActivity(user, file) {
    if (!file.originalName.includes('important') && Math.random() > 0.3) {
      return; // Only notify for 30% of uploads to avoid spam
    }

    return await this.notifySuperAdmins({
      type: 'file_upload_activity',
      title: 'File Upload Activity',
      message: `${user.firstName} ${user.lastName} uploaded ${file.originalName}`,
      actionUrl: '/analytics',
      priority: 'low',
      category: 'user',
      data: {
        userId: user._id,
        fileId: file._id,
        fileName: file.originalName,
        fileSize: file.size
      }
    });
  }

  // Data analysis completion notification
  static async notifyDataAnalysisCompleted(user, analysisData) {
    return await this.notifySuperAdmins({
      type: 'data_analysis_completed',
      title: 'Data Analysis Completed',
      message: `${user.firstName} ${user.lastName} completed analysis on ${analysisData.fileName || 'dataset'}`,
      actionUrl: '/analytics',
      priority: 'low',
      category: 'user',
      data: {
        userId: user._id,
        analysisType: analysisData.analysisType,
        fileName: analysisData.fileName,
        recordsProcessed: analysisData.recordsProcessed
      }
    });
  }

  // System milestone notification
  static async notifyPlatformMilestone(milestone) {
    return await this.notifySuperAdmins({
      type: 'platform_milestone',
      title: 'Platform Milestone Reached',
      message: `Platform has reached ${milestone.description}`,
      actionUrl: '/analytics',
      priority: 'medium',
      category: 'system',
      data: {
        milestone: milestone.type,
        value: milestone.value,
        timestamp: new Date()
      }
    });
  }

  // User login alert (for monitoring)
  static async notifyUserLoginAlert(user, loginInfo) {
    // Only notify for suspicious logins or admin users
    if (user.role !== 'admin' && !loginInfo.suspicious) {
      return;
    }

    return await this.notifySuperAdmins({
      type: 'user_login_alert',
      title: user.role === 'admin' ? 'Admin Login' : 'Suspicious Login',
      message: `${user.firstName} ${user.lastName} logged in from ${loginInfo.location || 'unknown location'}`,
      actionUrl: '/admin',
      priority: loginInfo.suspicious ? 'urgent' : 'low',
      category: 'security',
      data: {
        userId: user._id,
        ipAddress: loginInfo.ipAddress,
        userAgent: loginInfo.userAgent,
        location: loginInfo.location,
        suspicious: loginInfo.suspicious
      }
    });
  }

  // Bulk operation notification
  static async notifyBulkOperation(operationType, details) {
    return await this.notifySuperAdmins({
      type: 'bulk_operation_completed',
      title: 'Bulk Operation Completed',
      message: `${operationType} operation completed: ${details.summary}`,
      actionUrl: '/admin',
      priority: 'medium',
      category: 'system',
      data: {
        operationType,
        affectedRecords: details.affectedRecords,
        duration: details.duration,
        summary: details.summary
      }
    });
  }

  // Generic notification method
  static async createNotification(recipientId, notificationData) {
    try {
      return await Notification.create({
        recipient: recipientId,
        ...notificationData
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  // Get notifications for user
  static async getUserNotifications(userId, options = {}) {
    const {
      limit = 50,
      skip = 0,
      unreadOnly = false,
      category = null
    } = options;

    const query = { recipient: userId };
    if (unreadOnly) query.isRead = false;
    if (category) query.category = category;

    try {
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });

      return { notifications, unreadCount };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  // Clean old notifications (keep last 100 per user)
  static async cleanOldNotifications() {
    try {
      const users = await User.find().select('_id');
      
      for (const user of users) {
        const notifications = await Notification.find({ recipient: user._id })
          .sort({ createdAt: -1 })
          .skip(100);
        
        if (notifications.length > 0) {
          const idsToDelete = notifications.map(n => n._id);
          await Notification.deleteMany({ _id: { $in: idsToDelete } });
        }
      }
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
    }
  }
}

export default NotificationService;
